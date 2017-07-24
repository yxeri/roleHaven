/*
 Copyright 2015 Aleksandar Jankovic

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

'use strict';

const dbUser = require('../db/connectors/user');
const dbRoom = require('../db/connectors/room');
const dbChatHistory = require('./../db/connectors/chatHistory');
const dbWallet = require('../db/connectors/wallet');
const appConfig = require('../config/defaults/config').app;
const dbConfig = require('../config/defaults/config').databasePopulation;
const errorCreator = require('../objects/error/errorCreator');
const dbTransaction = require('../db/connectors/transaction');
const dbInvitation = require('../db/connectors/invitationList');
const mailer = require('./mailer');
const dbCalibrationMission = require('../db/connectors/calibrationMission');
const textTools = require('../utils/textTools');
const dbDocFile = require('../db/connectors/docFile');
const dbTeam = require('../db/connectors/team');
const objectValidator = require('../utils/objectValidator');
const messenger = require('./messenger');
const dbDevice = require('../db/connectors/device');
const authenticator = require('../helpers/authenticator');
const dbLanternHack = require('../db/connectors/lanternhack');

/**
 * Does string contain valid characters?
 * @param {string} text String to check
 * @returns {boolean} Does string contain valid characters?
 */
function isTextAllowed(text) {
  return /^[\w\d\såäöÅÄÖ-]+$/.test(text);
}

/*
 * Sort messages based on timestamp
 */
const messageSort = (a, b) => {
  if (a.time < b.time) {
    return -1;
  } else if (a.time > b.time) {
    return 1;
  }

  return 0;
};

/**
 * Get broadcasts
 * @param {string} params.token jwt
 * @param {Function} params.callback Callback
 */
function getBroadcasts({ token, callback }) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.GetBroadcasts.name,
    callback: ({ error }) => {
      if (error) {
        callback({ error });

        return;
      }

      dbChatHistory.getHistories({
        rooms: [dbConfig.rooms.bcast.roomName],
        callback: ({ error: historyError, data: historyData }) => {
          if (historyError) {
            callback({ error: historyError });

            return;
          }

          callback({ data: { messages: historyData.histories[0].messages } });
        },
      });
    },
  });
}

/**
 * Gets getHistory (messages) from one or more rooms
 * @param {string[]} params.rooms The rooms to retrieve the getHistory from
 * @param {Object} params.io socket io. Will be used if socket is not set
 * @param {Object} [params.socket] Socket io
 * @param {Function} params.callback Callback
 */
function getHistory({ token, callback, socket, io, rooms }) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.GetHistory.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      } else if (!objectValidator.isValidData({ rooms }, { rooms: true })) {
        callback({ error: new errorCreator.InvalidData({ expected: '{ rooms }' }) });

        return;
      }

      const user = data.user;
      let allUserRooms = [];

      if (socket) {
        allUserRooms = allUserRooms.concat(Object.keys(socket.rooms));
      } else if (io.sockets.sockets[user.socketId]) {
        allUserRooms = allUserRooms.concat(Object.keys(io.sockets.sockets[user.socketId].rooms));
      } else {
        allUserRooms = allUserRooms.concat(user.rooms);
      }

      const roomsToGet = rooms.map((roomName) => {
        if (roomName === 'team') {
          return user.team + appConfig.teamAppend;
        }

        return roomName;
      }).filter((roomName) => {
        return allUserRooms.indexOf(roomName) > -1;
      });

      if (roomsToGet.length === 0) {
        callback({ error: new errorCreator.NotAllowed({ name: 'not following rooms' }) });

        return;
      }

      dbChatHistory.getHistories({
        rooms: roomsToGet,
        callback: ({ error: historyError, data: historyData }) => {
          if (historyError) {
            callback({ error: historyError });

            return;
          }

          const histories = historyData.histories.map((history) => {
            history.messages.map((message) => {
              if (history.anonymous) {
                const anonMessage = message;

                anonMessage.time = new Date();
                anonMessage.time.setHours(0);
                anonMessage.time.setMinutes(0);
                anonMessage.time.setSeconds(0);
                anonMessage.userName = dbConfig.anonymousUserName;

                return anonMessage;
              }

              return message;
            }).sort(messageSort);

            return history;
          });

          callback({
            data: {
              histories,
              timeZoneOffset: new Date().getTimezoneOffset(),
            },
          });
        },
      });
    },
  });
}

/**
 * Create team, whisper or other types of rooms that do not follow the normal room rules
 * @param {Object} params.user User creating the room
 * @param {Object} params.room Room to create
 * @param {Function} params.callback Callback
 */
function createSpecialRoom({ user, room, callback }) {
  dbRoom.createRoom({
    room,
    callback: ({ error: roomError, data: roomData }) => {
      if (roomError) {
        callback({ error: roomError });

        return;
      }

      dbUser.addRoomToUser({
        userName: user.userName,
        roomName: roomData.room.roomName,
        callback: ({ error: addError }) => {
          if (addError) {
            callback({ error: addError });

            return;
          }

          callback({ data: roomData });
        },
      });
    },
  });
}

/**
 * Creates a new chat room and adds the user who created it to it
 * @param {Object} params.room New room
 * @param {Object} params.user User who is creating the new room
 * @param {Object} [params.socket] Socket io
 * @param {Object} params.io Socket.io. Used if socket isn't set
 * @param {Function} params.callback callback
 */
function createRoom({ room, token, socket, io, callback }) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.CreateRoom.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      } else if (!objectValidator.isValidData({ room }, { room: { roomName: true } })) {
        callback({ error: new errorCreator.InvalidData({ expected: '{ room: { roomName } }' }) });

        return;
      } else if (room.roomName.length > appConfig.roomNameMaxLength || !textTools.isAlphaNumeric(room.roomName)) {
        callback({ error: new errorCreator.InvalidCharacters({ expected: 'a-z 0-9 length: 10' }) });

        return;
      } else if (room.roomName.indexOf(appConfig.whisperAppend) > -1
        || room.roomName.indexOf(appConfig.teamAppend) > -1
        || room.roomName.indexOf(appConfig.scheduleAppend) > -1
        || room.roomName.indexOf(appConfig.teamAppend) > -1) {
        callback({ error: new errorCreator.InvalidCharacters({ expected: 'not protected words' }) });

        return;
      }

      const user = data.user;
      const newRoom = room;
      newRoom.roomName = room.roomName.toLowerCase();
      newRoom.owner = user.userName;

      dbRoom.createRoom({
        room: newRoom,
        callback: ({ error: roomError, data: roomData }) => {
          if (roomError) {
            callback({ error: roomError });

            return;
          }

          const createdRoom = roomData.room;

          dbUser.addRoomToUser({
            userName: user.userName,
            roomName: newRoom.roomName,
            callback: ({ error: addError }) => {
              if (addError) {
                callback({ error: addError });

                return;
              }

              const dataToEmit = {
                room: { roomName: newRoom.roomName },
                isProtected: typeof newRoom.password !== 'undefined' && newRoom.password !== '',
              };

              if (socket) {
                socket.broadcast.emit('room', { data: dataToEmit });
              } else if (io) {
                io.emit('room', { data: dataToEmit });
              }

              callback({ data: { room: createdRoom } });
            },
          });
        },
      });
    },
  });
}

/**
 * Joins the user's socket to all sent rooms and added standard rooms
 * @param {string[]} params.rooms Rooms for the user to join
 * @param {Object} params.socket socket.io socket
 * @param {string} [params.device] DeviceID of the user
 */
function joinRooms({ rooms, socket, deviceId }) {
  const allRooms = rooms;

  if (deviceId) {
    allRooms.push(deviceId + appConfig.deviceAppend);
  }

  allRooms.forEach(room => socket.join(room));
}

/**
 * Create and add alias to user
 * @param {Object} [params.user] User that will get a new alias. Will default to current user
 * @param {string} params.alias Alias to add
 * @param {Function} params.callback Callback
 */
function createAlias({ token, alias, callback, user = {} }) {
  const newAlias = alias.toLowerCase();

  authenticator.isUserAllowed({
    token,
    matchUserNameTo: user.userName,
    commandName: dbConfig.apiCommands.CreateAlias.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      } else if (newAlias.length > appConfig.userNameMaxLength) {
        callback({ error: new errorCreator.InvalidCharacters({ name: `User name length: ${appConfig.userNameMaxLength}` }) });

        return;
      } else if (!isTextAllowed(newAlias)) {
        callback({ error: new errorCreator.InvalidCharacters({ name: 'alias name', expected: 'a-z 0-9' }) });

        return;
      }

      const userToUpdate = user || data.user;

      dbUser.createAlias({
        userName: userToUpdate.userName,
        alias: newAlias,
        callback: ({ error: aliasError }) => {
          if (aliasError) {
            callback({ error: aliasError });

            return;
          }

          createSpecialRoom({
            user: userToUpdate,
            room: {
              owner: userToUpdate.userName,
              roomName: newAlias + appConfig.whisperAppend,
              accessLevel: dbConfig.AccessLevels.SUPERUSER,
              visibility: dbConfig.AccessLevels.SUPERUSER,
              isWhisper: true,
            },
            callback: (roomData) => {
              if (roomData.error) {
                callback({ error: roomData.error });

                return;
              }

              callback({ data: { alias: newAlias } });
            },
          });
        },
      });
    },
  });
}

/**
 * Get all user/team transactions
 * @param {string} params.owner Name of the user or team
 * @param {Function} params.callback Callback
 */
function getTransactions({ owner, token, callback }) {
  authenticator.isUserAllowed({
    token,
    matchUserNameTo: owner,
    commandName: dbConfig.apiCommands.GetTransaction.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const walletOwner = owner || data.user.userName;

      dbTransaction.getAllTransactions({
        owner: walletOwner,
        callback: (transactionsData) => {
          if (transactionsData.error) {
            callback({ err: transactionsData.error });

            return;
          }

          const { transactions } = transactionsData.data;
          const dataToSend = {};

          if (transactions.length > 0) {
            dataToSend.toTransactions = transactions.filter(transaction => transaction.to === walletOwner);
            dataToSend.fromTransactions = transactions.filter(transaction => transaction.from === walletOwner);
          } else {
            dataToSend.toTransactions = [];
            dataToSend.fromTransactions = [];
          }

          callback({ data: dataToSend });
        },
      });
    },
  });
}

/**
 *
 * @param {Object} params.transaction New transaction
 * @param {Object} params.io Socket.io io
 * @param {boolean} params.emitToSender Should event be emitted to sender?
 * @param {boolean} params.fromTeam Is the transaction made by a team?
 * @param {Function} params.callback Callback
 */
function createTransaction({ transaction, io, emitToSender, fromTeam, token, callback }) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.CreateTransaction.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      } else if (fromTeam && !data.user.team) {
        callback({ error: new errorCreator.DoesNotExist({ name: 'not part of team' }) });

        return;
      } else if (data.user.userName === transaction.to) {
        callback({ error: new errorCreator.InvalidData({ name: 'transfer to self' }) });

        return;
      } else if (transaction.amount <= 0) {
        callback({ error: new errorCreator.InvalidData({ name: 'amount is 0 or less' }) });

        return;
      }

      const user = data.user;
      const newTransaction = transaction;
      newTransaction.amount = Math.abs(newTransaction.amount);
      newTransaction.time = new Date();
      newTransaction.from = fromTeam ? user.team + appConfig.teamAppend : user.userName;

      dbWallet.getWallet({
        owner: newTransaction.from,
        callback: (walletData) => {
          if (walletData.error) {
            callback({ error: walletData.error });

            return;
          } else if (walletData.data.wallet.amount - newTransaction.amount <= 0) {
            callback({ error: new errorCreator.NotAllowed({ name: 'transfer too much' }) });

            return;
          }

          dbTransaction.createTransaction({
            transaction: newTransaction,
            callback: (transactionData) => {
              if (transactionData.error) {
                callback({ error: transactionData.error });

                return;
              }

              const createdTransaction = transactionData.data.transaction;

              dbWallet.decreaseAmount({
                owner: createdTransaction.from,
                amount: createdTransaction.amount,
                callback: (decreasedWalletData) => {
                  if (decreasedWalletData.error) {
                    callback({ error: decreasedWalletData.error });

                    return;
                  }

                  dbWallet.increaseAmount({
                    owner: createdTransaction.to,
                    amount: createdTransaction.amount,
                    callback: (increasedWalletData) => {
                      if (increasedWalletData.error) {
                        callback({ error: increasedWalletData.error });

                        return;
                      }

                      const { wallet: increasedWallet } = increasedWalletData.data;
                      const { wallet: decreasedWallet } = decreasedWalletData.data;

                      callback({ data: { transaction, wallet: decreasedWallet } });

                      if (!fromTeam) {
                        if (createdTransaction.to.indexOf(appConfig.teamAppend) > -1) {
                          io.to(createdTransaction.to).emit('transaction', {
                            data: {
                              transaction: createdTransaction,
                              wallet: increasedWallet,
                            },
                          });

                          if (emitToSender) {
                            dbUser.getUserByAlias({
                              alias: user.userName,
                              callback: (senderData) => {
                                if (senderData.error) {
                                  callback({ error: senderData.error });

                                  return;
                                }

                                const { user: sender } = senderData.data;

                                if (sender.socketId) {
                                  io.to(sender.socketId).emit('transaction', {
                                    data: {
                                      transaction: createdTransaction,
                                      wallet: decreasedWallet,
                                    },
                                  });
                                }
                              },
                            });
                          }
                        } else {
                          dbUser.getUserByAlias({
                            alias: createdTransaction.to,
                            callback: (aliasData) => {
                              if (aliasData.error) {
                                callback({ error: aliasData.error });

                                return;
                              }

                              const { user: receiver } = aliasData.data;

                              if (receiver.socketId !== '') {
                                io.to(receiver.socketId).emit('transaction', {
                                  data: {
                                    transaction: createdTransaction,
                                    wallet: increasedWallet,
                                  },
                                });
                              }

                              if (emitToSender) {
                                dbUser.getUserByAlias({
                                  alias: user.userName,
                                  callback: (senderData) => {
                                    if (senderData.error) {
                                      callback({ error: senderData.error });

                                      return;
                                    }

                                    const { user: sender } = senderData.data;

                                    if (sender.socketId) {
                                      io.to(sender.socketId).emit('transaction', {
                                        data: {
                                          transaction: createdTransaction,
                                          wallet: decreasedWallet,
                                        },
                                      });
                                    }
                                  },
                                });
                              }
                            },
                          });
                        }
                      } else {
                        io.to(createdTransaction.to).emit('transaction', {
                          data: {
                            transaction: createdTransaction,
                            wallet: increasedWallet,
                          },
                        });
                        io.to(createdTransaction.from).emit('transaction', {
                          data: {
                            transaction: createdTransaction,
                            wallet: decreasedWallet,
                          },
                        });
                      }
                    },
                  });
                },
              });
            },
          });
        },
      });
    },
  });
}

/**
 * Authenticate user to room
 * @param {Objecr} params.user User to authenticate with
 * @param {Object} params.room Room to auth agaisnt
 * @param {Object} params.callback Callback
 */
function authUserToRoom({ user, room, callback }) {
  if (!objectValidator.isValidData({ room }, { room: { roomName: true } })) {
    callback({ error: new errorCreator.InvalidData({ expected: '{ room: { roomName } }' }) });

    return;
  }

  dbRoom.authUserToRoom({
    user,
    roomName: room.roomName,
    password: room.password,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      callback({ data });
    },
  });
}

/**
 * Follow a new room on the user
 * @param {Object} params.room Room to follow
 * @param {Object} params.room.roomName Name of the room
 * @param {Object} [params.room.password] Password to the room
 * @param {Object} [params.user] User trying to follow a room. Will default to current user
 * @param {Function} params.callback Callback
 * @param {Object} [params.socket] Socket.io socket
 * @param {Object} params.io Socket.io. Used if sockket is not set
 */
function followRoom({ token, socket, io, room, user, callback }) {
  authenticator.isUserAllowed({
    token,
    matchUserNameTo: user.userName,
    commandName: dbConfig.apiCommands.FollowRoom.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      } else if (!objectValidator.isValidData({ room }, { room: { roomName: true } })) {
        callback({ error: new errorCreator.InvalidData({ expected: '{ room: { roomName } }' }) });

        return;
      }

      const roomCallback = ({ error: userError, data: userData }) => {
        if (userError) {
          callback({ error: userError });

          return;
        }

        const userFollowing = userData.user;
        const roomToFollow = room;
        roomToFollow.roomName = roomToFollow.roomName.toLowerCase();

        authUserToRoom({
          room: roomToFollow,
          user: userFollowing,
          callback: ({ error: authError, data: authData }) => {
            if (authError) {
              callback({ error: authError });

              return;
            }

            dbUser.addRoomToUser({
              userName: userFollowing.userName,
              roomName: roomToFollow.roomName,
              callback: (addedData) => {
                if (addedData.error) {
                  callback({ error: addedData.error });

                  return;
                }

                const roomName = authData.room.roomName;
                const dataToSend = {
                  roomName,
                  userName: userFollowing.userName,
                  isFollowing: true,
                };

                if (socket) {
                  socket.broadcast.to(roomName).emit('roomFollower', { data: dataToSend });
                  socket.join(roomName);
                } else {
                  io.to(user.socketId).emit('follow', { data: { room: authData.room } });
                  io.to(roomName).emit('roomFollower', { data: dataToSend });
                }

                callback({ data: { room: authData.room } });
              },
            });
          },
        });
      };

      if (user && user.userName !== data.user.userName) {
        dbUser.getUser({
          userName: user.userName,
          callback: roomCallback,
        });
      } else {
        roomCallback({ data: { user: data.user } });
      }
    },
  });
}

/**
 * Update user's team
 * @param {string} params.userName Name of the user
 * @param {string} params.teamName Name of the team
 * @param {string} params.shortTeamName Short name of the team
 * @param {Function} [params.callback] Callback
 */
function updateUserTeam({ userName, teamName, shortTeamName, callback = () => {} }) {
  dbUser.updateUserTeam({
    userName,
    team: teamName,
    shortTeam: shortTeamName,
    callback: (userData) => {
      if (userData.error) {
        callback({ error: userData.error });

        return;
      }

      callback({ data: { user: userData.data.user } });
    },
  });
}

/**
 * Leave all rooms (except -device and public) on the socket
 * @param {Object} socket Socket.io socket
 */
function leaveSocketRooms({ socket }) {
  Object.keys(socket.rooms).forEach((roomName) => {
    if (roomName.indexOf(appConfig.deviceAppend) < 0 && roomName !== dbConfig.rooms.public.roomName) {
      socket.leave(roomName);
    }
  });
}

/**
 * Add user to team
 * @param {Object} team Team
 * @param {Object} user User
 * @param {Object} io Socket io
 * @param {Object} socket Socket io
 * @param {Function} callback Callback
 */
function addUserToTeam({ team, user, io, socket, callback }) {
  updateUserTeam({
    socket,
    userName: user.userName,
    teamName: team.teamName,
    shortTeamName: team.shortName,
    callback: ({ error }) => {
      if (error) {
        callback({ error });

        return;
      }

      const room = {
        roomName: team.teamName + appConfig.teamAppend,
      };

      dbUser.addRoomToUser({
        userName: user.userName,
        roomName: room.roomName,
        callback: ({ error: userError, data: userData }) => {
          if (userError) {
            callback({ error: userError });

            return;
          }

          const roomName = room.roomName;
          const dataToSend = {
            roomName,
            userName: userData.user.userName,
            isFollowing: true,
          };

          if (socket) {
            socket.broadcast.to(roomName).emit('roomFollower', { data: dataToSend });
            socket.join(roomName);
          } else {
            io.to(user.socketId).emit('follow', { data: { room } });
            io.to(roomName).emit('roomFollower', { data: dataToSend });
          }

          callback({
            data: {
              team: {
                teamName: team.teamName,
                shortName: team.shortName,
              },
            },
          });
        },
      });
    },
  });
}

/**
 * Check if room is protected
 * @param {string} roomName Room name to check
 * @param {string} socketId Socket id
 * @param {Object} user User
 * @returns {boolean} Is the room protected?
 */
function isRequiredRoom({ roomName, socketId, user }) {
  const sentRoomName = roomName.toLowerCase();
  const isAliasWhisperRoom = user.aliases ? user.aliases.map(alias => alias + appConfig.whisperAppend).indexOf(sentRoomName) > -1 : false;
  const isRequired = dbConfig.requiredRooms.indexOf(sentRoomName) > -1;
  const isSocketRoom = socketId && sentRoomName === socketId;
  const isWhisperRoom = sentRoomName === user.userName + appConfig.whisperAppend;

  return isAliasWhisperRoom || isRequired || isSocketRoom || isWhisperRoom;
}

/**
 * Create a user and all other objects needed for it
 * @param {Object} params.user User to create
 * @param {Function} params.callback Callback
 */
function createUser({ token, user, callback }) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.CreateUser.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      } else if (!objectValidator.isValidData({ user }, { user: { userName: true, registerDevice: true, password: true, mail: true } })) {
        callback({ error: new errorCreator.InvalidData({ expected: '{ user: { userName, registerDevice, password, mail } }' }) });

        return;
      } else if (!textTools.isAllowedFull(user.userName.toLowerCase())) {
        callback({ error: new errorCreator.InvalidCharacters({ name: `User name: ${user.userName}` }) });

        return;
      } else if (user.userName.length > appConfig.userNameMaxLength || user.password.length > appConfig.passwordMaxLength || user.registerDevice.length > appConfig.deviceIdLength) {
        callback({ error: new errorCreator.InvalidCharacters({ name: `User name length: ${appConfig.userNameMaxLength} Password length: ${appConfig.userNameMaxLength} Device length: ${appConfig.deviceIdLength}` }) });

        return;
      } else if ((user.visibility || user.accessLevel) && dbConfig.apiCommands.ChangeUserLevels.accessLevel > data.user.accessLevel) {
        callback({ error: new errorCreator.NotAllowed({ name: 'set access or visibility level' }) });

        return;
      }

      const { userName = user.userName.toLowerCase(), fullName, password, registerDevice, mail, banned, verified, accessLevel, visibility } = user;

      const newUser = {
        userName,
        password,
        registerDevice,
        mail,
        banned,
        verified,
        accessLevel,
        visibility,
        registeredAt: new Date(),
        fullName: fullName || userName,
        rooms: [
          dbConfig.rooms.public.roomName,
          dbConfig.rooms.bcast.roomName,
          dbConfig.rooms.important.roomName,
          dbConfig.rooms.user.roomName,
          dbConfig.rooms.news.roomName,
          dbConfig.rooms.schedule.roomName,
        ],
      };

      dbUser.createUser({
        user: newUser,
        callback: (userData) => {
          if (userData.error) {
            callback({ error: userData.error });

            return;
          }

          const createdUser = userData.data.user;

          createSpecialRoom({
            room: {
              owner: createdUser.userName,
              roomName: createdUser.userName + appConfig.whisperAppend,
              visibility: dbConfig.AccessLevels.SUPERUSER,
              accessLevel: dbConfig.AccessLevels.SUPERUSER,
              isWhisper: true,
            },
            user: createdUser,
            callback: ({ error: roomError }) => {
              if (roomError) {
                callback({ error: roomError });

                return;
              }

              const wallet = {
                accessLevel: createdUser.accessLevel,
                owner: createdUser.userName,
              };

              dbWallet.createWallet({
                wallet,
                callback: ({ error: walletError, data: walletData }) => {
                  if (walletError) {
                    callback({ error: walletError });

                    return;
                  }

                  dbInvitation.createInvitationList({
                    userName: createdUser.userName,
                    callback: ({ error: listError }) => {
                      if (listError) {
                        callback({ error: listError });

                        return;
                      }

                      mailer.sendVerification({
                        address: createdUser.mail,
                        userName: createdUser.userName,
                        callback: ({ error: mailError }) => {
                          if (mailError) {
                            callback({ error: mailError });

                            return;
                          }

                          callback({
                            data: {
                              user: createdUser,
                              wallet: walletData.wallet,
                            },
                          });
                        },
                      });
                    },
                  });
                },
              });
            },
          });
        },
      });
    },
  });
}

/**
 * Get active calibration mission for user. Creates a new one if there is none for the user
 * @param {string} [params.userName] Owner of the mission. Will default to current user
 * @param {Function} params.callback Callback
 */
function getActiveCalibrationMission({ token, callback, userName }) {
  authenticator.isUserAllowed({
    token,
    matchUserNameTo: userName,
    commandName: dbConfig.apiCommands.GetCalibrationMission.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const owner = userName || data.user.userName;

      dbCalibrationMission.getActiveMission({
        owner,
        silentOnDoesNotExist: true,
        callback: ({ error: activeErr, data: missionData }) => {
          if (activeErr) {
            callback({ error: activeErr });

            return;
          }

          /**
           * Return active mission, if it exists, or continue with creating a new one
           */
          if (missionData.mission) {
            callback({ data: missionData });

            return;
          }

          dbCalibrationMission.getInactiveMissions({
            owner,
            callback: ({ error: inactiveErr, data: inactiveData }) => {
              if (inactiveErr) {
                callback({ error: inactiveErr });

                return;
              }

              const { missions: inactiveMissions } = inactiveData;
              const stationIds = [1, 2, 3, 4]; // TODO This is just for testing purposes. Remove when organisers have their backend ready

              if (inactiveMissions && inactiveMissions.length > 0) {
                const previousStationId = inactiveMissions[inactiveMissions.length - 1].stationId;

                stationIds.splice(stationIds.indexOf(previousStationId), 1);
              }

              const newStationId = stationIds[Math.floor(Math.random() * (stationIds.length))];
              const newCode = Math.floor(Math.random() * (((99999999 - 10000000) + 1) + 10000000));
              const missionToCreate = {
                owner,
                stationId: newStationId,
                code: newCode,
              };

              dbCalibrationMission.createMission({
                mission: missionToCreate,
                callback: ({ error: createError, data: createData }) => {
                  if (createError) {
                    callback({ error: createError });

                    return;
                  }

                  callback({ data: { mission: createData.mission, isNew: true } });
                },
              });
            },
          });
        },
      });
    },
  });
}

/**
 * Complete active calibration mission and create transaction to user
 * @param {Object} params.mission Mission to complete
 * @param {Object} params.io Socket io
 * @param {Function} params.callback Callback
 */
function completeActiveCalibrationMission({ token, owner, io, callback }) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.CompleteCalibrationMission.name,
    callback: ({ error }) => {
      if (error) {
        callback({ error });

        return;
      }

      dbCalibrationMission.setMissionCompleted({
        io,
        owner,
        callback: ({ error: missionError, data: missionData }) => {
          if (missionError) {
            callback({ error: missionError });

            return;
          }

          const completedMission = missionData.mission;

          const transaction = {
            to: completedMission.owner,
            from: 'SYSTEM',
            amount: 50,
            time: new Date(),
            note: `CALIBRATION OF STATION ${completedMission.stationId}`,
          };

          dbTransaction.createTransaction({
            transaction,
            callback: (createTransactionData) => {
              if (createTransactionData.error) {
                callback({ error: createTransactionData.error });

                return;
              }

              const createdTransaction = createTransactionData.data.transaction;

              dbWallet.increaseAmount({
                owner: completedMission.owner,
                amount: createdTransaction.amount,
                callback: ({ error: walletError, data: walletData }) => {
                  if (walletError) {
                    callback({ error: walletError });

                    return;
                  }

                  const updatedWallet = walletData.wallet;

                  dbUser.getUserByAlias({
                    alias: createdTransaction.to,
                    callback: ({ error: aliasError, data: aliasData }) => {
                      if (aliasError) {
                        callback({ error: aliasError });

                        return;
                      }

                      const { user } = aliasData;

                      if (user.socketId && user.socketId !== '') {
                        io.to(user.socketId).emit('transaction', { data: { transaction, wallet: updatedWallet } });
                        io.to(user.socketId).emit('terminal', { data: { mission: { missionType: 'calibrationMission', completed: true } } });
                      }

                      callback({
                        data: {
                          mission: completedMission,
                          transaction: createdTransaction,
                        },
                      });
                    },
                  });
                },
              });
            },
          });
        },
      });
    },
  });
}

/**
 * Create a docFile
 * @param {Object} params.user User creating doc file
 * @param {Object} params.docFile DocFile to create
 * @param {Function} params.callback Callback
 */
function createDocFile({ token, io, docFile, callback }) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.CreateDocFile.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      } else if (!textTools.isAlphaNumeric(docFile.docFileId)) {
        callback({ error: new errorCreator.InvalidCharacters({ expected: `alphanumeric ${docFile.docFileId}` }) });

        return;
      } else if (docFile.text.join('').length > appConfig.docFileMaxLength || docFile.text.join('') === '') {
        callback({ error: new errorCreator.InvalidCharacters({ expected: `Text length: ${appConfig.docFileMaxLength}.` }) });

        return;
      } else if (docFile.title.length > appConfig.docFileTitleMaxLength || docFile.title === '') {
        callback({ error: new errorCreator.InvalidCharacters({ expected: `Title length: ${appConfig.docFileTitleMaxLength}` }) });

        return;
      } else if (docFile.docFileId.length > appConfig.docFileIdMaxLength || docFile.docFileId === '') {
        callback({ error: new errorCreator.InvalidCharacters({ expected: `Id length: ${appConfig.docFileIdMaxLength}` }) });

        return;
      }

      const newDocFile = docFile;
      newDocFile.creator = data.user.userName;
      newDocFile.docFileId = newDocFile.docFileId.toLowerCase();

      dbDocFile.createDocFile({
        docFile: newDocFile,
        callback: (createData) => {
          if (createData.error) {
            callback({ error: createData.error });

            return;
          }

          io.emit('docFile', { docFile: createData.data.docFile });
          callback({ data: { docFile: createData.data.docFile } });
        },
      });
    },
  });
}

/**
 * Update existing docFile
 * @param {Object} params.docFile Doc file changes
 * @param {Object} [params.socket] Socket io
 * @param {Object} params.io Socket io. Will be used if socket is undefined
 * @param {Object} params.user User that is updating docFile
 * @param {Function} params.callback Callback
 */
function updateDocFile({ docFile, socket, io, user, callback }) {
  if (docFile.text && docFile.text.join('').length > appConfig.docFileMaxLength) {
    callback({ error: new errorCreator.InvalidCharacters({ expected: `Text length: ${appConfig.docFileMaxLength}.` }) });

    return;
  } else if (docFile.title && docFile.title.length > appConfig.docFileTitleMaxLength) {
    callback({ error: new errorCreator.InvalidCharacters({ expected: `Title length: ${appConfig.docFileTitleMaxLength}` }) });

    return;
  }

  const { docFileId = docFile.docFileId.toLowerCase(), title, text, visibility, isPublic } = docFile;

  dbDocFile.getDocFile({
    docFileId,
    accessLevel: user.accessLevel,
    callback: ({ error: getError, data }) => {
      if (getError) {
        callback({ error: getError });

        return;
      } else if (data.docFile.creator !== user.userName) {
        callback({ error: new errorCreator.NotAllowed({ name: `${user.userName} updating doc owned by other user` }) });

        return;
      }

      dbDocFile.updateDocFile({
        docFileId,
        title,
        text,
        visibility,
        isPublic,
        callback: ({ error: updateError, data: updateData }) => {
          if (updateError) {
            callback({ error: updateError });

            return;
          }

          if (socket) {
            socket.broadcast.emit('docFile', { data: updateData });
          } else {
            io.emit('docFile', { data: updateData });
          }

          callback({ data: updateData });
        },
      });
    },
  });
}

/**
 * Decrease wallet amount
 * @param {string} params.owner Name of the owner of the wallet
 * @param {number} params.amount The amount to decrease wallet amount with
 * @param {Function} params.callback Callback
 */
function decreaseWalletAmount({ owner, amount, token, callback }) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.DecreaseWalletAmount.name,
    callback: ({ error }) => {
      if (error) {
        callback({ error });

        return;
      } else if (amount <= 0) {
        callback({ error: new errorCreator.InvalidData({ name: 'amount is 0' }) });

        return;
      }

      dbWallet.getWallet({
        owner,
        callback: ({ error: walletError, data: walletData }) => {
          if (walletError) {
            callback({ error: walletError });

            return;
          } else if (walletData.wallet.amount < amount) {
            callback({ error: new errorCreator.InvalidData({ name: 'wallet amount' }) });

            return;
          }

          dbWallet.decreaseAmount({
            amount,
            owner,
            callback: ({ error: decreasedError, data: decreasedData }) => {
              if (decreasedError) {
                callback({ error: decreasedError });

                return;
              }

              callback({ data: decreasedData });
            },
          });
        },
      });
    },
  });
}

/**
 * Increase wallet amount
 * @param {string} params.owner Name of the owner of the wallet
 * @param {number} params.amount The amount to increase wallet amount with
 * @param {Function} params.callback Callback
 */
function increaseWalletAmount({ owner, amount, token, callback }) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.IncreaseWalletAmount.name,
    callback: ({ error }) => {
      if (error) {
        callback({ error });

        return;
      } else if (amount <= 0) {
        callback({ error: new errorCreator.InvalidData({ name: 'amount is 0' }) });

        return;
      }

      dbWallet.getWallet({
        owner,
        callback: ({ error: walletError }) => {
          if (walletError) {
            callback({ error: walletError });

            return;
          }

          dbWallet.increaseAmount({
            amount,
            owner,
            callback: ({ error: decreasedError, data: decreasedData }) => {
              if (decreasedError) {
                callback({ error: decreasedError });

                return;
              }

              callback({ data: decreasedData });
            },
          });
        },
      });
    },
  });
}

/**
 * Create team
 * @param {Object} params.team Team to create
 * @param {Object} [params.socket] Socket io
 * @param {Object} params.io Socket io. Will be used if socket is not set
 * @param {string} params.token jwt
 * @param {Function} params.callback Callback
 */
function createTeam({ team, socket, io, callback, token }) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.CreateTeam.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      } else if (data.user.team) {
        callback({ error: new errorCreator.AlreadyExists({ name: 'already in team' }) });

        return;
      } else if (team.teamName.toLowerCase() === 'team') {
        callback({ error: new errorCreator.InvalidData({ expected: 'team name !== team' }) });

        return;
      } else if (team.teamName.length > appConfig.teamNameMaxLength || team.shortName.length > appConfig.shortTeamMaxLength) {
        callback({ error: new errorCreator.InvalidData({ name: `Team name length: ${appConfig.teamNameMaxLength} Short name length: ${appConfig.shortTeamMaxLength}` }) });

        return;
      }

      const user = data.user;
      const newTeam = team;
      newTeam.owner = user.userName;
      newTeam.teamName = newTeam.teamName.toLowerCase();
      newTeam.verified = false;

      dbTeam.createTeam({
        team: newTeam,
        callback: ({ error: teamError, data: teamData }) => {
          if (teamError) {
            callback({ error: teamError });

            return;
          }

          const createdTeam = teamData.team;
          const wallet = {
            owner: createdTeam.teamName + appConfig.teamAppend,
            team: createdTeam.teamName,
          };

          dbWallet.createWallet({
            wallet,
            callback: ({ error: walletError, data: walletData }) => {
              if (walletError) {
                callback({ error: walletError });

                return;
              }

              createSpecialRoom({
                user,
                room: {
                  owner: dbConfig.systemUserName,
                  roomName: createdTeam.teamName + appConfig.teamAppend,
                  accessLevel: dbConfig.AccessLevels.SUPERUSER,
                  visibility: dbConfig.AccessLevels.SUPERUSER,
                },
                callback: ({ error: roomError, data: roomData }) => {
                  if (roomError) {
                    callback({ error: roomError });

                    return;
                  }

                  const dataToEmit = {
                    team: {
                      teamName: newTeam.teamName,
                      shortName: newTeam.shortName,
                    },
                  };

                  if (appConfig.teamVerify) {
                    if (socket) {
                      socket.broadcast.emit('team', { data: dataToEmit });
                    } else {
                      io.emit('team', { data: dataToEmit });
                    }

                    callback({
                      data: {
                        requiresVerify: appConfig.teamVerify,
                        team: createdTeam,
                        wallet: walletData.wallet,
                        room: roomData.room,
                      },
                    });
                  } else {
                    addUserToTeam({
                      socket,
                      io,
                      user,
                      team: createdTeam,
                      callback: ({ error: userError }) => {
                        if (userError) {
                          callback({ error: userError });

                          return;
                        }

                        if (socket) {
                          socket.broadcast.emit('team', { data: dataToEmit });
                        } else {
                          io.emit('team', { data: dataToEmit });
                        }

                        callback({
                          data: {
                            team: createdTeam,
                            wallet: walletData.wallet,
                            room: roomData.room,
                          },
                        });
                      },
                    });
                  }
                },
              });
            },
          });
        },
      });
    },
  });
}

/**
 * Invite user to team
 * @param {string} params.to Name of the user to invite
 * @param {Object} [params.socket] Socket io
 * @param {Object} [params.io] Socket io. Will be used if socket is not set
 * @param {Function} params.callback Callback
 */
function inviteToTeam({ to, socket, io, callback, token }) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.InviteToTeam.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const user = data.user;

      const invitation = {
        itemName: user.team,
        time: new Date(),
        invitationType: 'team',
        sender: user.userName,
      };

      dbTeam.getTeam({
        teamName: user.team,
        callback: ({ error: teamError }) => {
          if (teamError) {
            callback({ error: teamError });

            return;
          }

          dbUser.getUserByAlias({
            alias: to,
            callback: ({ error: userError, data: userData }) => {
              if (userError) {
                callback({ error: userError });

                return;
              }

              dbInvitation.addInvitationToList({
                invitation,
                userName: userData.user.userName,
                callback: ({ error: inviteError, data: invitationData }) => {
                  if (inviteError) {
                    callback({ error: inviteError });

                    return;
                  }

                  const newInvitation = invitationData.list.invitations[invitationData.list.invitations.length - 1];
                  const dataToSend = {
                    invitation: newInvitation,
                    to: invitationData.list.userName,
                  };
                  const emitRoomName = `${to}${appConfig.whisperAppend}`;

                  if (socket) {
                    socket.to(emitRoomName).emit('invitation', { data: dataToSend });
                  } else {
                    io.to(emitRoomName).emit('invitation', { data: dataToSend });
                  }

                  callback({ data: dataToSend });
                },
              });
            },
          });
        },
      });
    },
  });
}

/**
 * Make user follow whisper room
 * @param {Object} params.user User following whisper room
 * @param {string} params.whisperTo Message receiver name
 * @param {Object} params.sender User data sent from client
 * @param {Object} params.room Whisper room
 * @param {Object} [params.socket] Socket.io socket
 * @param {Object} params.io Socket.io. Used if socket is not set
 * @param {Function} params.callback Callback
 */
function followWhisperRoom({ user, whisperTo, sender, room, socket, io, callback }) {
  if (!objectValidator.isValidData({ user, room, whisperTo, sender }, { user: { userName: true }, room: { roomName: true }, whisperTo: true, sender: { userName: true } })) {
    callback({ error: new errorCreator.InvalidData({ expected: '{ user: { userName: true }, room: { roomName: true }, whisperTo: true, sender: { userName: true } }' }) });

    return;
  } else if (user.aliases.indexOf(sender.userName) === -1 && user.userName !== sender.userName) {
    callback({ error: new errorCreator.NotAllowed({ name: 'alias not in user' }) });

    return;
  }

  dbUser.addWhisperRoomToUser({
    userName: sender.userName,
    roomName: room.roomName,
    callback: ({ error: whisperError }) => {
      if (whisperError) {
        callback({ error: whisperError });

        return;
      }

      const whisperToRoomName = `${whisperTo}-whisper-${sender.userName}`;

      dbUser.addWhisperRoomToUser({
        userName: whisperTo,
        roomName: whisperToRoomName,
        callback: (whisperData) => {
          if (whisperData.error) {
            callback({ error: whisperData.error });

            return;
          }

          const emitTo = `${whisperTo}${appConfig.whisperAppend}`;
          const dataToEmit = {
            whisperTo: sender.userName,
            data: whisperToRoomName,
            room: { roomName: whisperToRoomName },
            whisper: true,
          };

          if (socket) {
            socket.to(emitTo).emit('follow', { data: dataToEmit });
          } else {
            io.to(emitTo).emit('follow', { data: dataToEmit });
          }

          callback({ data: { room } });
        },
      });
    },
  });
}

/**
 * Unfollow room
 * @param {Object} [params.user] User that is unfollowing a room. Defaults to current user
 * @param {boolean} params.isWhisperRoom Is it a whisper room?
 * @param {Object} params.room Room to unfollow
 * @param {Function} params.callback Callback
 * @param {Object} [params.socket] Socket io socket
 * @param {Object} params.io Socket io. Will be used if socket is not set
 */
function unfollowRoom({ token, socket, io, isWhisperRoom, room, callback, user = {} }) {
  authenticator.isUserAllowed({
    token,
    matchUserNameTo: user.userName,
    commandName: dbConfig.apiCommands.UnfollowRoom.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      } else if (!objectValidator.isValidData({ room }, { room: { roomName: true } })) {
        callback({ error: new errorCreator.InvalidData({ expected: '{ room: { roomName } }' }) });

        return;
      } else if (isRequiredRoom({ roomName: room.roomName, socketId: socket ? socket.id : '', user })) {
        callback({ error: new errorCreator.NotAllowed({ name: 'unfollow protected room' }) });

        return;
      }

      const userUnfollowing = user || data.user;

      const roomToUnfollow = room;
      roomToUnfollow.roomName = roomToUnfollow.roomName.toLowerCase();

      dbUser.removeRoomFromUser({
        isWhisperRoom,
        userName: userUnfollowing.userName,
        roomName: roomToUnfollow.roomName,
        callback: ({ error: removeError }) => {
          if (removeError) {
            callback({ error: removeError });

            return;
          }

          const dataToEmit = {
            room: roomToUnfollow,
            userName: userUnfollowing.userName,
            isFollowing: false,
          };

          if (!isWhisperRoom) {
            if (socket) {
              socket.broadcast.to(roomToUnfollow.roomName).emit('roomFollower', { data: dataToEmit });
            } else {
              io.to(roomToUnfollow.roomName).emit('roomFollower', { data: dataToEmit });
            }
          }

          if (socket) {
            socket.leave(roomToUnfollow.roomName);
          } else {
            const allSocketIds = Object.keys(io.sockets.sockets);

            if (allSocketIds.indexOf(user.socketId) > -1) {
              io.sockets.sockets[user.socketId].leave(roomToUnfollow.roomName);
              io.to(user.socketId).emit('unfollow', { data: dataToEmit });
            }
          }

          callback({ data: dataToEmit });
        },
      });
    },
  });
}

/**
 * List rooms
 * @param {Object} [params.socket] Socket io
 * @param {Function} params.callback Callback
 */
function listRooms({ token, socket, callback }) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.GetRoom.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const user = data.user;

      dbRoom.getAllRooms({
        user,
        callback: ({ error: getError, data: roomsData }) => {
          if (getError) {
            callback({ error: getError });

            return;
          }

          const filteredRooms = roomsData.rooms.map((room) => {
            return {
              roomName: room.roomName,
              password: room.password !== '',
            };
          });

          const socketId = socket ? socket.id : user.socketId || '';
          const userRooms = socket ? Object.keys(socket.rooms) : user.rooms;
          const rooms = filteredRooms.filter(room => userRooms.indexOf(room.roomName) < 0);
          const followedRooms = messenger.filterHiddenRooms({ roomNames: userRooms, socketId }).map((roomName) => { return { roomName, password: false }; });
          const protectedRooms = filteredRooms.filter(room => room.password);
          const whisperRooms = user.whisperRooms.map((roomName) => { return { roomName, password: false }; });

          if (user.userName === '') {
            callback({
              data: {
                rooms,
                followedRooms,
                protectedRooms: [],
                ownedRooms: [],
                whisperRooms: [],
              },
            });
          } else {
            dbRoom.getOwnedRooms({
              user,
              callback: ({ error: ownedError, data: ownedData }) => {
                if (ownedError) {
                  callback({ error: ownedError });

                  return;
                }

                callback({
                  data: {
                    rooms,
                    followedRooms,
                    protectedRooms,
                    whisperRooms,
                    ownedRooms: ownedData.rooms.map((room) => { return { roomName: room.roomName, password: room.password }; }),
                  },
                });
              },
            });
          }
        },
      });
    },
  });
}

/**
 * Remove room
 * @param {Object} params.user Owner of the room
 * @param {Object} params.room Room to remove
 * @param {Object} [params.socket] Socket io
 * @param {Object} params.io socket io. Will be used if socket is not set
 * @param {Function} params.callback Callback
 */
function removeRoom({ user, room, socket, io, callback }) {
  const roomToRemove = room;
  roomToRemove.roomName = roomToRemove.roomName.toLowerCase();

  dbRoom.getRoom({
    roomName: roomToRemove.roomName,
    callback: ({ error: roomError, data: roomData }) => {
      if (roomError) {
        callback({ error: roomError });

        return;
      } else if (roomData.room.owner !== user.userName) {
        callback({ error: new errorCreator.NotAllowed({ name: 'not owner of room' }) });
      }

      const retrievedRoom = roomData.room;

      dbRoom.removeRoom({
        roomName: retrievedRoom.roomName,
        callback: ({ error: removeError }) => {
          if (removeError) {
            callback({ error: removeError });

            return;
          }

          dbUser.removeRoomFromAllUsers({
            roomName: retrievedRoom.roomName,
            callback: ({ error: allError }) => {
              if (allError) {
                callback({ error: allError });

                return;
              }

              const connectedIds = Object.keys(io.sockets.adapter.rooms[retrievedRoom.roomName].sockets);
              const allSockets = io.sockets.connected;

              connectedIds.forEach(connectedId => allSockets[connectedId].leave(retrievedRoom.roomName));

              if (socket) {
                socket.broadcast.to(retrievedRoom.roomName).emit('unfollow', { data: { room: retrievedRoom } });
              } else {
                io.to(retrievedRoom.roomName).emit('unfollow', { data: { room: retrievedRoom } });
              }

              callback({ data: { room: retrievedRoom } });
            },
          });
        },
      });
    },
  });
}

/**
 * Match sent partial room name to one or more rooms followed. Match will start from index 0
 * @param {string} params.partialName Partial room name
 * @param {Function} params.callback Callback
 */
function matchMyPartialRoomName({ token, partialName, callback }) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.GetRoom.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const user = data.user;

      const regex = new RegExp(`^${partialName}.*`);
      const rooms = messenger.filterHiddenRooms({ roomNames: user.rooms.filter(roomName => roomName.match(regex)), socketId: user.socketId });

      if (user.team) {
        rooms.push('team');
      }

      callback({
        data: { matched: rooms },
      });
    },
  });
}

/**
 * Match sent partial room name to one or more rooms. Match will start from index 0
 * @param {string} params.partialName Partial room name
 * @param {Function} params.callback Callback
 */
function matchPartialRoomName({ token, partialName, callback }) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.GetRoom.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      dbRoom.matchPartialRoom({
        partialName,
        user: data.user,
        callback: ({ error: partialError, data: partialData }) => {
          if (partialError) {
            callback({ error: partialError });

            return;
          }

          callback({
            data: {
              matched: partialData.matched.map(room => room.roomName),
            },
          });
        },
      });
    },
  });
}

/**
 * Get room
 * @param {string} params.roomName Name of the room to retrieve
 * @param {Function} params.callback Callback
 */
function getRoom({ token, roomName, callback }) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.GetRoom.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const sentRoomName = roomName.toLowerCase();

      dbRoom.getRoom({
        roomName: sentRoomName,
        callback: ({ error: roomError, data: roomData }) => {
          if (roomError) {
            callback({ error: roomError });

            return;
          } else if (data.user.accessLevel < roomData.room.visibility) {
            callback({ error: new errorCreator.NotAllowed({ name: `room ${sentRoomName}` }) });

            return;
          }

          callback({ data: roomData });
        },
      });
    },
  });
}

/**
 * Get users
 * @param {Object} params.user User retrieving users
 * @param {Function} params.callback Callback
 */
function getUsers({ token, callback }) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.GetUser.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      dbUser.getUsers({
        user: data.user,
        callback: ({ error: usersError, data: usersData }) => {
          if (usersError) {
            callback({ error: usersError });

            return;
          }

          callback({
            data: {
              users: usersData.users.map((userObj) => {
                return {
                  userName: userObj.userName,
                  team: userObj.team,
                  online: userObj.online,
                };
              }),
            },
          });
        },
      });
    },
  });
}

/**
 * Send password reset mail
 * @param {string} params.userName User name of the user receiving a password recovery mail
 * @param {Function} params.callback Callback
 */
function sendPasswordReset({ token, userName, callback }) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.RequestPasswordReset.name,
    callback: ({ error }) => {
      if (error) {
        callback({ error });

        return;
      } else if (!objectValidator.isValidData({ token, userName, callback }, { token: true, userName: true, callback: true })) {
        callback({ error: new errorCreator.InvalidData({ expected: '{ token, userName, callback }' }) });
      }

      dbUser.getUser({
        userName,
        callback: ({ error: userError, data: userData }) => {
          if (userError) {
            callback({ error: userError });

            return;
          }

          mailer.sendPasswordReset({
            address: userData.user.mail,
            userName: userData.user.userName,
            callback: ({ error: resetError }) => {
              if (resetError) {
                callback({ error: resetError });

                return;
              }

              callback({ data: { success: true } });
            },
          });
        },
      });
    },
  });
}

/**
 * Get user by name
 * @param {string} params.userName User to retrieve
 * @param {Object} params.user User retrieving the user
 * @param {Function} params.callback Callback
 */
function getUser({ token, userName, callback }) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.GetUser.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const allowedUser = data.user;

      dbUser.getUser({
        userName: userName.toLowerCase(),
        callback: ({ error: userError, data: userData }) => {
          if (userError) {
            callback({ error: userError });

            return;
          } else if (userData.user.userName !== allowedUser.userName && (userData.user.accessLevel > allowedUser.accessLevel || userData.user.accessLevel > allowedUser.visibility)) {
            callback({ error: new errorCreator.NotAllowed({ name: `user ${userName}` }) });

            return;
          }

          callback({ data });
        },
      });
    },
  });
}

/**
 *
 * @param {Object} params.mission Mission to cancel
 * @param {Object} params.io Socket io
 * @param {Function} params.callback Callback
 */
function cancelActiveCalibrationMission({ token, io, callback, owner }) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.CancelCalibrationMission.name,
    callback: ({ error }) => {
      if (error) {
        callback({ error });

        return;
      }

      dbCalibrationMission.setMissionCompleted({
        owner,
        callback: ({ error: missionError, data: missionData }) => {
          if (missionError) {
            callback({ error: missionError });

            return;
          }

          const updatedMission = missionData.mission;

          dbUser.getUserByAlias({
            alias: updatedMission.owner,
            callback: ({ error: aliasError, data: aliasData }) => {
              if (aliasError) {
                callback({ error: aliasError });

                return;
              }

              const { user } = aliasData;

              if (user.socketId !== '') {
                io.to(user.socketId).emit('terminal', { data: { mission: { missionType: 'calibrationMission', cancelled: true } } });
              }

              callback({ data: { mission: updatedMission, cancelled: true } });
            },
          });
        },
      });
    },
  });
}

/**
 * Get devices
 * @param {Function} params.callback Callback
 */
function getDevices({ token, callback }) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.GetDevices.name,
    callback: ({ error }) => {
      if (error) {
        callback({ error });

        return;
      }

      dbDevice.getAllDevices({
        callback: ({ error: deviceError, data }) => {
          if (deviceError) {
            callback({ error: deviceError });

            return;
          }

          callback({ data });
        },
      });
    },
  });
}

/**
 * Update device's lastAlive, lastUser and socketId, retrieved from the user account
 * @param {Object} params.device Device
 * @param {string} params.device.deviceId Device id of the device to update
 * @param {Function} params.callback Callback
 */
function updateDevice({ token, device, callback }) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.UpdateDevice.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      } else if (!objectValidator.isValidData({ device }, { device: { deviceId: true } })) {
        callback({ error: new errorCreator.InvalidData({ expected: '{ device: { deviceId } }' }) });

        return;
      }

      const deviceToUpdate = {};
      deviceToUpdate.lastAlive = new Date();
      deviceToUpdate.deviceId = device.deviceId;

      if (!data.user.isAnonymous) {
        deviceToUpdate.socketId = data.user.socketId;
        deviceToUpdate.lastUser = data.user.userName;
      }

      dbDevice.updateDevice({
        device: deviceToUpdate,
        callback: ({ error: updateError, data: deviceData }) => {
          if (updateError) {
            callback({ error: updateError });
          }

          // TODO Shold create device room, if upsert

          callback({ data: deviceData });
        },
      });
    },
  });
}

/**
 * Update device alias
 * @param {Object} params.device Device
 * @param {string} params.device.deviceId Id of the device to update
 * @param {string} params.device.deviceAlias New alias for the device
 * @param {Function} param.scallback Callback
 */
function updateDeviceAlias({ token, device, callback }) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.UpdateDeviceAlias.name,
    callback: ({ error }) => {
      if (error) {
        callback({ error });

        return;
      } else if (!objectValidator.isValidData({ device }, { device: { deviceId: true, deviceAlias: true } })) {
        callback({ error: new errorCreator.InvalidData({ expected: '{ device: { deviceId, deviceAlias } }' }) });

        return;
      }

      const deviceToUpdate = {};
      deviceToUpdate.deviceId = device.deviceId;
      deviceToUpdate.deviceAlias = device.deviceAlias;

      dbDevice.updateDeviceAlias({
        device: deviceToUpdate,
        callback: ({ error: updateError, data: deviceData }) => {
          if (updateError) {
            callback({ error: updateError });
          }

          callback({ data: deviceData });
        },
      });
    },
  });
}

/**
 * User accepts sent invitation and joins the team
 * @param {Object} params.user User accepting invite
 * @param {Object} params.invitation Invitation that will be accepted
 * @param {Object} params.io Socket io. Will be used if socket is not set
 * @param {Object} [params.socket] Socket io.
 * @param {Function} params.callback Callback
 */
function acceptTeamInvitation({ token, invitation, io, socket, callback }) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.AcceptInvitation.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      } else if (!objectValidator.isValidData({ invitation, io }, { invitation: { invitationType: true, itemName: true }, io: true })) {
        callback({ error: new errorCreator.InvalidData({ expected: '{ invitation: { invitationType, itemName }, io }' }) });

        return;
      }

      const user = data.user;
      const userName = user.userName;

      dbInvitation.getInvitations({
        userName,
        callback: (invitationData) => {
          if (invitationData.error) {
            callback({ error: invitationData.error });

            return;
          }

          const retrievedInvitation = invitationData.data.list.invitations.find(inv => inv.itemName === invitation.itemName && inv.invitationType === invitation.invitationType);

          if (!retrievedInvitation) {
            callback({ error: new errorCreator.DoesNotExist({ name: `invitation ${invitation.itemName} ${invitation.invitationType} for ${userName}` }) });

            return;
          }

          dbTeam.getTeam({
            teamName: retrievedInvitation.itemName,
            callback: ({ error: teamError, data: teamData }) => {
              if (teamError) {
                callback({ error: teamError });

                return;
              }

              addUserToTeam({
                socket,
                io,
                user,
                team: teamData.team,
                callback: (addUserData) => {
                  if (addUserData.error) {
                    callback({ error: addUserData.error });

                    return;
                  }

                  dbInvitation.removeInvitationTypeFromList({
                    userName,
                    invitationType: retrievedInvitation.invitationType,
                    callback: (removeData) => {
                      if (removeData.error) {
                        callback({ error: removeData.error });

                        return;
                      }

                      callback({ data: addUserData.data });

                      if (socket) {
                        socket.broadcast.to(`${addUserData.data.team.teamName}${appConfig.teamAppend}`).emit('teamMember', { data: { user: { userName: user.userName } } });
                      } else {
                        io.to(`${addUserData.data.team.teamName}${appConfig.teamAppend}`).emit('teamMember', { data: { user: { userName: user.userName } } });
                      }
                    },
                  });
                },
              });
            },
          });
        },
      });
    },
  });
}

/**
 * Get calibration missions
 * @param {string} params.token jwt
 * @param {boolean} [params.getInactive] Should completed missions also be retrieved?
 * @param {Function} params.callback Callback
 */
function getCalibrationMissions({ token, getInactive, callback }) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.GetCalibrationMissions.name,
    callback: ({ error }) => {
      if (error) {
        callback({ error });

        return;
      }

      dbCalibrationMission.getMissions({
        getInactive,
        callback,
      });
    },
  });
}

/**
 * Get aliases from user
 * @param {Object} params.user User to retrieve aliases from
 * @param {Object} params.token jwt
 * @param {Function} params.callback Callback
 */
function getAliases({ token, callback, user = {} }) {
  authenticator.isUserAllowed({
    token,
    matchUserNameTo: user.userName,
    commandName: dbConfig.apiCommands.GetAliases.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const userName = user.userName || data.user.userName;

      dbUser.getUser({
        userName,
        callback: ({ error: userError, data: userData }) => {
          if (userError) {
            callback({ error: userError });

            return;
          }

          callback({
            data: {
              aliases: userData.user.aliases,
              userName: userData.user.userName,
            },
          });
        },
      });
    },
  });
}

/**
 * Get DocFiles
 * @param {string} params.token jwt
 * @param {Function} params.callback Callback
 */
function getDocFiles({ token, callback }) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.GetDocFile.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const user = data.user;

      dbDocFile.getDocFilesList({
        accessLevel: user.accessLevel,
        userName: user.userName,
        callback: ({ error: docError, data: docData }) => {
          if (docError) {
            callback({ error: docError });

            return;
          }

          callback({ data: docData });
        },
      });
    },
  });
}

/**
 * Get DocFile
 * @param {string} params.docFileId ID of docfile to retrieve
 * @param {string} params.token jwt
 * @param {Function} params.callback Callback
 */
function getDocFile({ docFileId, token, callback }) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.GetDocFile.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      dbDocFile.getDocFileById({
        docFileId,
        user: data.user,
        callback: ({ error: docError, data: docData }) => {
          if (docError) {
            callback({ error: docError });

            return;
          }

          callback({ data: docData });
        },
      });
    },
  });
}

/**
 * Get lantern rounds
 * @param {string} params.token jwt
 * @param {Function} params.callback Callback
 */
function getLanternRounds({ token, callback }) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.GetLanternRound.name,
    callback: ({ error }) => {
      if (error) {
        callback({ error });

        return;
      }

      dbLanternHack.getLanternRounds({
        callback: ({ error: roundError, data: roundData }) => {
          if (roundError) {
            callback({ error: roundError });

            return;
          }

          const currentTime = new Date();
          const rounds = roundData.rounds.filter(round => currentTime >= new Date(round.endTime));

          callback({ data: { rounds } });
        },
      });
    },
  });
}

/**
 * Get lantern round
 * @param {number} params.roundId Id of the lantern round to get
 * @param {string} params.token jwt
 * @param {Function} params.callback Callback
 */
function getLanternRound({ roundId, token, callback }) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.GetLanternRound.name,
    callback: ({ error }) => {
      if (error) {
        callback({ error });

        return;
      }

      dbLanternHack.getLanternRound({
        roundId,
        callback: ({ error: roundError, data: roundData }) => {
          if (roundError) {
            callback({ error: roundError });

            return;
          }

          callback({ data: roundData });
        },
      });
    },
  });
}

/**
 * Get active lantern round
 * @param {string} params.token jwt
 * @param {Function} params.callback Callback
 */
function getActiveLanternRound({ token, callback }) {
  authenticator.isUserAllowed({
    token,
    commandName: db.apiCommands.GetActiveLanternRound.name,
    callback: ({ error }) => {
      if (error) {
        callback({ error });

        return;
      }

      dbLanternHack.getActiveLanternRound({
        callback: ({ error: roundError, data: roundData }) => {
          if (roundError) {
            callback({ error: roundError });

            return;
          }

          const round = roundData;
          const dataToSend = {
            round,
            noActiveRound: typeof round === 'undefined',
          };

          callback({ data: dataToSend });
        },
      });
    },
  });
}

/**
 * Create lantern round
 * @param {Object} params.round Round to create
 * @param {string} params.token jwt
 * @param {Function} params.callback Callback
 */
function createLanternRound({ round, token, callback }) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.CreateLanternRound.name,
    callback: ({ error }) => {
      if (error) {
        callback({ error });

        return;
      }

      dbLanternHack.createLanternRound({
        round,
        callback: ({ error: lanternError, data: lanternData }) => {
          if (lanternError) {
            callback({ error: lanternError });

            return;
          }

          callback({ data: lanternData });
        },
      });
    },
  });
}

/**
 * Start lantern round
 * @param {number} params.roundId ID of the round to start
 * @param {string} params.token jwt
 * @param {Function} params.callback Callback
 */
function startLanternRound({ roundId, token, callback }) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.StartLanternRound.name,
    callback: ({ error }) => {
      if (error) {
        callback({ error });

        return;
      }

      dbLanternHack.getActiveLanternRound({
        callback: ({ error: activeLanternError }) => {
          if (activeLanternError) {
            callback({ error: activeLanternError });

            return;
          }

          dbLanternHack.startLanternRound({
            roundId,
            callback: ({ error: startLanternError, data: startLanternData }) => {
              if (startLanternError) {
                callback({ error: startLanternError });

                return;
              }

              callback({ data: startLanternData });
            },
          });
        },
      });
    },
  });
}

/**
 * End lantern round
 * @param {Object} params.io socket io
 * @param {string} params.token jwt
 * @param {Function} params.callback Callback
 */
function endLanternRound({ io, token, callback }) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.EndLanternRound.name,
    callback: ({ error }) => {
      if (error) {
        callback({ error });

        return;
      }

      dbLanternHack.endLanternRound({
        callback: ({ error: roundError }) => {
          if (roundError) {
            callback({ error: roundError });

            return;
          }

          // TODO Emit to clients
          io.emit('endLanternRound');

          callback({ data: { success: true } });
        },
      });
    },
  });
}

/**
 * Update lantern round
 * @param {number} params.roundId Id of the round to update
 * @param {Date} params.startTime Start time of the round
 * @param {Date} params.endTime Ending time of the round
 * @param {string} params.token jwt
 * @param {Function} params.callback Callback
 */
function updateLanternRound({ roundId, startTime, endTime, token, callback }) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.UpdateLanternRound.name,
    callback: ({ error }) => {
      if (error) {
        callback({ error });

        return;
      }

      dbLanternHack.updateLanternRound({
        roundId,
        startTime,
        endTime,
        callback: ({ error: lanternError, data: lanternData }) => {
          if (lanternError) {
            callback({ error: lanternError });

            return;
          }

          // TODO Push to clients, if next round

          callback({ data: lanternData });
        },
      });
    },
  });
}

/**
 * Get lantern stations
 * @param {string} params.token jwt
 * @param {Function} params.callback Callback
 */
function getLanternStations({ token, callback }) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.GetLanternStations.name,
    callback: ({ error }) => {
      if (error) {
        callback({ error });

        return;
      }

      dbLanternHack.getAllStations({
        callback: ({ error: stationError, data: stationData }) => {
          if (stationError) {
            callback({ error: stationError });

            return;
          }

          callback({ data: stationData });
        },
      });
    },
  });
}

/**
 * Get lantern station
 * @param {number} params.stationId Id of the station to retrieve
 * @param {string} params.token jwt
 * @param {Function} params.callback Callback
 */
function getLanternStation({ stationId, token, callback }) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.GetLanternStations.name,
    callback: ({ error }) => {
      if (error) {
        callback({ error });

        return;
      }

      dbLanternHack.getStation({
        stationId,
        callback: ({ error: stationError, data: stationData }) => {
          if (stationError) {
            callback({ error: stationError });

            return;
          }

          callback({ data: stationData });
        },
      });
    },
  });
}

/**
 * Create lantern station
 * @param {Object} params.io Socket io
 * @param {Object} params.station Station to create
 * @param {string} params.token jwt
 * @param {Function} params.callback Callback
 */
function createLanternStation({ io, station, token, callback }) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.CreateLanternStation.name,
    callback: ({ error }) => {
      if (error) {
        callback({ error });

        return;
      }

      dbLanternHack.createStation({
        station,
        callback: ({ error: stationError, data: stationData }) => {
          if (stationError) {
            callback({ error: stationError });

            return;
          }

          io.emit('lanternStations', { stations: [stationData.station] });
          callback({ data: stationData });
        },
      });
    },
  });
}

/**
 * Update lantern stations
 * @param {number} params.stationId Id of the station to update
 * @param {Object} params.io Socket io
 * @param {Object} params.station Parameters to change in station
 * @param {string} params.token jwt
 * @param {Function} params.callback Callback
 */
function updateLanternStation({ io, station, stationId, token, callback }) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.UpdateLanternStation.name,
    callback: ({ error }) => {
      if (error) {
        callback({ error });

        return;
      }

      const { attacker, isActive, stationName, owner } = station;

      dbLanternHack.updateLanternStation({
        attacker,
        stationId,
        isActive,
        stationName,
        owner,
        callback: ({ error: updateError, data: updateData }) => {
          if (updateError) {
            callback({ error: updateError });

            return;
          }

          io.emit('lanternStations', { stations: [updateData.station] });
          callback({ data: updateData });
        },
      });
    },
  });
}

/**
 * Get lantern teams
 * @param {string} params.token jwt
 * @param {Function} params.callback Callback
 */
function getLanternTeams({ token, callback }) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.GetLanternTeam.name,
    callback: ({ error }) => {
      if (error) {
        callback({ error });

        return;
      }

      dbLanternHack.getTeams({
        callback: ({ error: teamError, data: teamData }) => {
          if (teamError) {
            callback({ error: teamError });

            return;
          }

          callback({ data: teamData });
        },
      });
    },
  });
}

/**
 * Create lantern team
 * @param {Object} params.io socket io
 * @param {Object} params.team Team to create
 * @param {string} params.token jwt
 * @param {Function} params.callback Callback
 */
function createLanternTeam({ io, team, token, callback }) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.CreateLanternTeam.name,
    callback: ({ error }) => {
      if (error) {
        callback({ error });

        return;
      }

      dbLanternHack.createLanternTeam({
        team,
        callback: ({ error: teamError, data: teamData }) => {
          if (teamError) {
            callback({ error: teamError });

            return;
          }

          io.emit('lanternTeams', { teams: [teamData.team] });
          callback({ data: teamData });
        },
      });
    },
  });
}

/**
 * Update lantern team
 * @param {Object} params.io Socket io
 * @param {Object} params.team Parameters to update in teawm
 * @param {string} params.teamName Full or short name of team to update
 * @param {string} params.token jwt
 * @param {Function} params.callback Callback
 */
function updateLanternTeam({ io, team, teamName, token, callback }) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.UpdateLanternStation.name,
    callback: ({ error }) => {
      if (error) {
        callback({ error });

        return;
      }

      dbLanternHack.updateLanternTeam({
        teamName,
        isActive: team.isActive,
        points: team.points,
        resetPoints: team.resetPoints,
        callback: ({ error: teamError, data: teamData }) => {
          if (teamError) {
            callback({ error: teamError });

            return;
          }

          io.emit('lanternTeams', { teams: [teamData.team] });
          callback({ data: teamData });
        },
      });
    },
  });
}

/**
 * Get wallets
 * @param {string} params.token jwt
 * @param {Function} params.callback Callback
 */
function getWallets({ token, callback }) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.GetWallet.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      dbWallet.getWallets({
        user: data.user,
        callback: ({ error: walletError, data: walletsData }) => {
          if (walletError) {
            callback({ error: walletError });

            return;
          }

          callback({ data: walletsData });
        },
      });
    },
  });
}

/**
 * Get wallet
 * @param {string} params.owner Owner of the wallet
 * @param {string} params.token jwt
 * @param {Function} params.callback Callback
 */
function getWallet({ owner, token, callback }) {
  authenticator.isUserAllowed({
    token,
    matchUserNameTo: owner,
    commandName: dbConfig.apiCommands.GetWallet.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const walletOwner = owner || data.user.userName;

      dbWallet.getWallet({
        owner: walletOwner,
        callback: ({ error: walletError, data: walletData }) => {
          if (walletError) {
            callback({ error: walletError });

            return;
          }

          callback({ data: walletData });
        },
      });
    },
  });
}

/**
 * Set wallet amount to 0
 * @param {string} params.owner User name of owner
 * @param {string} params.token jwt
 * @param {Function} params.callback Callback
 */
function emptyWallet({ owner, token, callback }) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.DecreaseWalletAmount.name,
    callback: ({ error }) => {
      if (error) {
        callback({ error });

        return;
      }

      dbWallet.resetWalletAmount({
        owner,
        callback: ({ error: walletError, data: walletData }) => {
          if (walletError) {
            callback({ error: walletError });

            return;
          }

          callback({ data: walletData });
        },
      });
    },
  });
}

/**
 * Get teams
 * @param {string} params.token jwt
 * @param {Function} params.callback Callback
 */
function getTeams({ token, callback }) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.GetTeams.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      dbTeam.getTeams({
        user: data.user,
        callback: ({ error: teamError, data: teamData }) => {
          if (teamError) {
            callback({ error: teamError });

            return;
          }

          callback({ data: teamData });
        },
      });
    },
  });
}

/**
 * Get team
 * @param {string} params.teamName Short of full team name
 * @param {string} params.token jwt
 * @param {Function} params.callback Callback
 */
function getTeam({ teamName, token, callback }) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.GetTeam.name,
    callback: ({ error }) => {
      if (error) {
        callback({ error });

        return;
      }

      dbTeam.getTeam({
        teamName,
        callback: ({ error: teamError, data: teamData }) => {
          if (teamError) {
            callback({ error: teamError });

            return;
          }

          callback({ data: teamData });
        },
      });
    },
  });
}

exports.createRoom = createRoom;
exports.joinRooms = joinRooms;
exports.getHistory = getHistory;
exports.createAlias = createAlias;
exports.getTransactions = getTransactions;
exports.createTransaction = createTransaction;
exports.followRoom = followRoom;
exports.updateUserTeam = updateUserTeam;
exports.leaveSocketRooms = leaveSocketRooms;
exports.addUserToTeam = addUserToTeam;
exports.isRequiredRoom = isRequiredRoom;
exports.createUser = createUser;
exports.getActiveCalibrationMission = getActiveCalibrationMission;
exports.completeActiveCalibrationMission = completeActiveCalibrationMission;
exports.createDocFile = createDocFile;
exports.updateDocFile = updateDocFile;
exports.decreaseWalletAmount = decreaseWalletAmount;
exports.increaseWalletAmount = increaseWalletAmount;
exports.createTeam = createTeam;
exports.inviteToTeam = inviteToTeam;
exports.authUserToRoom = authUserToRoom;
exports.followWhisperRoom = followWhisperRoom;
exports.unfollowRoom = unfollowRoom;
exports.getRooms = listRooms;
exports.removeRoom = removeRoom;
exports.matchMyPartialRoomName = matchMyPartialRoomName;
exports.matchPartialRoomName = matchPartialRoomName;
exports.getRoom = getRoom;
exports.getUsers = getUsers;
exports.sendPasswordReset = sendPasswordReset;
exports.getUser = getUser;
exports.cancelActiveCalibrationMission = cancelActiveCalibrationMission;
exports.getDevices = getDevices;
exports.updateDevice = updateDevice;
exports.updateDeviceAlias = updateDeviceAlias;
exports.acceptTeamInvitation = acceptTeamInvitation;
exports.getCalibrationMissions = getCalibrationMissions;
exports.getAliases = getAliases;
exports.getDocFiles = getDocFiles;
exports.getDocFile = getDocFile;
exports.getBroadcasts = getBroadcasts;
exports.getLanternRounds = getLanternRounds;
exports.getActiveLanternRound = getActiveLanternRound;
exports.createLanternRound = createLanternRound;
exports.startLanternRound = startLanternRound;
exports.endLanternRound = endLanternRound;
exports.updateLanternRound = updateLanternRound;
exports.getLanternStations = getLanternStations;
exports.createLanternStation = createLanternStation;
exports.updateLanternStation = updateLanternStation;
exports.getLanternTeams = getLanternTeams;
exports.createLanternTeam = createLanternTeam;
exports.updateLanternTeam = updateLanternTeam;
exports.getWallets = getWallets;
exports.getWallet = getWallet;
exports.emptyWallet = emptyWallet;
exports.getTeams = getTeams;
exports.getTeam = getTeam;
exports.getLanternRound = getLanternRound;
exports.getLanternStation = getLanternStation;
