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

const dbUser = require('./../db/connectors/user');
const dbCommand = require('./../db/connectors/command');
const dbRoom = require('./../db/connectors/room');
const dbChatHistory = require('./../db/connectors/chatHistory');
const dbWallet = require('../db/connectors/wallet');
const appConfig = require('./../config/defaults/config').app;
const dbConfig = require('../config/defaults/config').databasePopulation;
const errorCreator = require('../objects/error/errorCreator');
const dbTransaction = require('../db/connectors/transaction');
const dbInvitation = require('../db/connectors/invitationList');
const mailer = require('../socketHelpers/mailer');
const jwt = require('jsonwebtoken');

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
 * Checks if the user is allowed to use the command
 * @param {string} params.token Json web token
 * @param {string} params.commandName Name of the command
 * @param {Function} params.callback callback
 */
function userIsAllowed({ commandName, token, callback = () => {} }) {
  const anonUser = {
    userName: '',
    accessLevel: 0,
    visibility: 0,
    aliases: [],
    rooms: [],
    whisperRooms: [],
    isTracked: false,
    team: null,
    shortTeam: null,
  };

  dbCommand.getCommand({
    commandName,
    callback: (commandData) => {
      if (commandData.error) {
        callback({ error: commandData.error });

        return;
      } else if (!token) {
        if (commandData.data.command.accessLevel > anonUser.accessLevel) {
          callback({ error: new errorCreator.NotAllowed({ name: commandName }) });

          return;
        }

        dbCommand.incrementCommandUsage({ commandName });
        callback({ allowedUser: anonUser });

        return;
      }

      jwt.verify(token, appConfig.jsonKey, (jwtErr, decoded) => {
        if (jwtErr) {
          callback({ error: new errorCreator.Database({ errorObject: jwtErr, name: 'jwt' }) });

          return;
        } else if (!decoded) {
          callback({ error: new errorCreator.NotAllowed({ name: commandName }) });

          return;
        }

        dbUser.getUserByAlias({
          alias: decoded.data.userName,
          callback: (aliasData) => {
            if (aliasData.error) {
              callback({ error: aliasData.error });

              return;
            } else if (commandData.data.command.accessLevel > aliasData.data.user.accessLevel) {
              callback({ error: new errorCreator.NotAllowed({ name: commandName }) });

              return;
            }

            callback({ allowedUser: aliasData.data.user });
          },
        });
      });
    },
  });
}

/**
 * Gets getHistory (messages) from one or more rooms
 * @param {string[]} params.rooms The rooms to retrieve the getHistory from
 * @param {string} [params.whisperTo] User name whispered to
 * @param {Function} params.callback Callback
 */
function getHistory({ rooms, whisperTo, callback }) {
  dbChatHistory.getHistoryFromRooms({
    rooms,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const allMessages = [];

      data.histories.forEach((history) => {
        Array.prototype.push.apply(allMessages, history.messages);
      });

      const isAnonymous = data.histories[0].anonymous;
      const filteredMessages = allMessages
        .filter((message) => {
          if (whisperTo) {
            return (message.roomName === `${whisperTo}${appConfig.whisperAppend}` || message.userName === whisperTo);
          }

          return true;
        })
        .map((message) => {
          if (isAnonymous) {
            const anonMessage = message;

            anonMessage.time = new Date();
            anonMessage.time.setHours(0);
            anonMessage.time.setMinutes(0);
            anonMessage.time.setSeconds(0);
            anonMessage.userName = 'anonymous';

            return anonMessage;
          }

          return message;
        })
        .sort(messageSort);

      // TODO Should send earliest date in each history
      // TODO Separate chat histories should be sent
      callback({
        data: {
          messages: filteredMessages,
          anonymous: isAnonymous,
          timeZoneOffset: new Date().getTimezoneOffset(),
        },
      });
    },
  });
}

/**
 * Creates a new chat room and adds the user who created it to it
 * @param {Object} params.room New room
 * @param {Object} params.user User who is creating the new room
 * @param {Function} params.callback callback
 */
function createRoom({ room, user, callback }) {
  const newRoom = room;
  newRoom.roomName = room.roomName.toLowerCase();

  dbRoom.createRoom({
    room: newRoom,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      dbUser.addRoomToUser({
        userName: user.userName,
        roomName: newRoom.roomName,
        callback: ({ error: addError }) => {
          if (addError) {
            callback({ error: addError });

            return;
          }

          callback({ data: { room: data.savedObject } });
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
 * Add alias to users
 * @param {Object} params.user User that will get a new alias
 * @param {string} params.alias Alias to add
 * @param {Function} params.callback Callback
 */
function addAlias({ user, alias, callback }) {
  if (!isTextAllowed(alias)) {
    callback({ error: new errorCreator.InvalidCharacters({ propertyName: 'alias name' }) });

    return;
  }

  const aliasLower = alias.toLowerCase();

  dbUser.addAlias({
    userName: user.userName,
    alias: aliasLower,
    callback: (aliasData) => {
      if (aliasData.error) {
        callback({ error: aliasData.error });

        return;
      }

      const room = {
        owner: user.userName,
        roomName: alias + appConfig.whisperAppend,
        accessLevel: dbConfig.accessLevels.superUser,
        visibility: dbConfig.accessLevels.superUser,
      };

      createRoom({
        room,
        user,
        callback: (roomData) => {
          if (roomData.error) {
            callback({ error: roomData.error });

            return;
          }

          callback({ data: { alias: aliasLower } });
        },
      });
    },
  });
}

/**
 * Creates a new wallet
 * @param {Object} params.wallet New wallet
 * @param {Function} params.callback callback
 */
function createWallet({ wallet, callback }) {
  dbWallet.createWallet({
    wallet,
    callback: (walletData) => {
      if (walletData.error) {
        callback({ error: walletData.error });

        return;
      }

      callback({ data: { wallet } });
    },
  });
}

/**
 * Get all user/team transactions
 * @param {string} params.owner Name of the user or team
 * @param {Function} params.callback Callback
 */
function getAllTransactions({ owner, callback = () => {} }) {
  dbTransaction.getAllTransactions({
    owner,
    callback: (transactionsData) => {
      if (transactionsData.error) {
        callback({ err: transactionsData.error });

        return;
      }

      const { transactions } = transactionsData.data;
      const data = {};

      if (transactions.length > 0) {
        data.toTransactions = transactions.filter(transaction => transaction.to === owner);
        data.fromTransactions = transactions.filter(transaction => transaction.from === owner);
      } else {
        data.toTransactions = [];
        data.fromTransactions = [];
      }

      callback({ data });
    },
  });
}

/**
 *
 * @param {Object} params.transaction New transaction
 * @param {Object} params.user User creating the transaction
 * @param {Object} params.io Socket.io io
 * @param {boolean} params.emitToSender Should event be emitted to sender?
 * @param {boolean} params.fromTeam Is the transaction made by a team?
 * @param {Function} [params.callback] Callback
 */
function createTransaction({ transaction, user, io, emitToSender, fromTeam, callback = () => {} }) {
  if (fromTeam && !user.team) {
    callback({ error: new errorCreator.DoesNotExist({ name: 'not part of team' }) });

    return;
  } else if (user.userName === transaction.to) {
    callback({ error: new errorCreator.Incorrect({ name: 'transfer to self' }) });

    return;
  }

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
      } else if (walletData.data.wallet.amount - newTransaction.amount < 0) {
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

          const createdTransaction = transactionData.data.savedObject;

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
                        transaction: createdTransaction,
                        wallet: increasedWallet,
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
                                transaction: createdTransaction,
                                wallet: decreasedWallet,
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
                              transaction: createdTransaction,
                              wallet: increasedWallet,
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
                                    transaction: createdTransaction,
                                    wallet: decreasedWallet,
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
                      transaction: createdTransaction,
                      wallet: increasedWallet,
                    });
                    io.to(createdTransaction.from).emit('transaction', {
                      transaction: createdTransaction,
                      wallet: decreasedWallet,
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
 * Follow a new room on the socket
 * @param {Object} params Parameters
 * @param {string} params.userName User name following the room
 * @param {Object} params.room New room to follow
 * @param {Function} params.callback Callback
 * @param {Object} [params.socket] Socket.IO socket
 */
function followRoom({ userName, socket, room, callback }) {
  const roomName = room.roomName;

  socket.broadcast.to(roomName).emit('roomFollower', { userName, roomName, isFollowing: true });
  socket.join(roomName);
  callback({ data: { room } });
}

/**
 * Follow a new room on the user
 * @param {Object} params.room Room to follow
 * @param {Object} params.room.roomName Name of the room
 * @param {Object} [params.room.password] Password to the room
 * @param {Object} params.user User trying to follow a room
 * @param {Function} params.callback Callback
 * @param {Object} [params.socket] Socket.io socket
 */
function authFollowRoom({ socket, room, user, callback }) {
  const roomToFollow = room;
  roomToFollow.roomName = roomToFollow.roomName.toLowerCase();
  roomToFollow.password = roomToFollow.password || '';

  dbRoom.authUserToRoom({
    user,
    roomName: roomToFollow.roomName,
    password: roomToFollow.password,
    callback: (authData) => {
      if (authData.error) {
        callback({ error: authData.error });

        return;
      }

      dbUser.addRoomToUser({
        userName: user.userName,
        roomName: roomToFollow.roomName,
        callback: (userData) => {
          if (userData.error) {
            callback({ error: userData.error });

            return;
          }

          followRoom({
            callback,
            socket,
            room: roomToFollow,
            userName: user.userName,
          });
        },
      });
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
 * Add user to team's room
 * @param {string} params.userName Name of the user
 * @param {string} params.roomName Name of the room
 * @param {Object} params.io Socket.IO
 * @param {Function} params.callback Callback
 */
function addUserTeamRoom({ roomName, userName, io, callback = () => {} }) {
  dbUser.addRoomToUser({
    userName,
    roomName,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const userSocket = io.sockets.connected[data.user.socketId];

      if (userSocket) {
        userSocket.join(roomName);
        userSocket.emit('follow', { room: { roomName } });
      }

      callback({ data: { room: { roomName } } });
    },
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
    callback: ({ error: updateError }) => {
      if (updateError) {
        callback({ error: updateError });

        return;
      }

      addUserTeamRoom({
        io,
        userName: user.userName,
        roomName: team.teamName + appConfig.teamAppend,
      });

      callback({ data: { team: { teamName: team.teamName, shortName: team.shortName } } });
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
  const isAliasWhisperRoom = user.aliases ? user.aliases.map(alias => alias + appConfig.whisperAppend).indexOf(roomName) > -1 : false;
  const isRequired = dbConfig.requiredRooms.indexOf(roomName) > -1;
  const isSocketRoom = socketId && roomName === socketId;
  const isWhisperRoom = roomName === user.userName + appConfig.whisperAppend;

  return isAliasWhisperRoom || isRequired || isSocketRoom || isWhisperRoom;
}

/**
 * Create a user and all other objects needed for it
 * @param {Object} params.user User to create
 * @param {boolean} params.autoVerifyMail Should the mail verification step be skipped?
 * @param {Function} params.callback Callback
 */
function createUser({ user, autoVerifyMail, callback }) {
  mailer.isValidAddress({
    autoVerifyMail,
    address: user.mail,
    callback: (validData) => {
      if (validData.error) {
        callback({ error: validData.error });

        return;
      }

      const { userName, fullName, password, registerDevice, mail, accessLevel, verified, banned } = user;

      const userObj = {
        userName,
        password,
        registerDevice,
        mail,
        accessLevel,
        verified,
        banned,
        registeredAt: new Date(),
        fullName: fullName || userName,
        socketId: '',
        rooms: [
          dbConfig.rooms.public.roomName,
          dbConfig.rooms.bcast.roomName,
          dbConfig.rooms.important.roomName,
          dbConfig.rooms.user.roomName,
          dbConfig.rooms.news.roomName,
          dbConfig.rooms.schedule.roomName,
        ],
      };
      const wallet = {
        owner: userObj.userName,
      };

      dbUser.createUser({
        user: userObj,
        callback: (userData) => {
          if (userData.error) {
            callback({ error: userData.error });

            return;
          }

          const whisperRoom = {
            roomName: userObj.userName + appConfig.whisperAppend,
            visibility: dbConfig.accessLevels.superUser,
            accessLevel: dbConfig.accessLevels.superUser,
          };

          createRoom({
            room: whisperRoom,
            user: userObj,
            callback: () => {},
          });
          createWallet({
            wallet,
            callback: () => {},
          });
          dbInvitation.createInvitationList({
            userName,
            callback: () => {},
          });

          mailer.sendVerification({
            address: user.mail,
            userName: user.userName,
            callback: (verifyData) => {
              if (verifyData.error) {
                callback({ error: verifyData.error });

                return;
              }

              callback({ data: { user: userData.data.savedObject } });
            },
          });
        },
      });
    },
  });
}


// function changeDocFileAccess({ docFileId, visibility, isPublic, callback, io }) {
//   dbDocFile.updateDocFile({
//     docFileId,
//     visibility,
//     isPublic,
//     callback: ({ error, data }) => {
//       if (error) {
//         callback({ error });
//
//         return;
//       }
//
//         if (isPublic) {
//         }
//
//       callback();
//     },
//   });
// }
//
// function addUserToDocFile({ docFileId, userName, callback, io }) {
//   dbDocFile.addAccessUser({
//     docFileId,
//     userName,
//     callback: ({ error, data }) => {
//       if (error) {
//         callback({ error });
//
//         return;
//       }
//
//       callback();
//     },
//   });
// }

exports.userIsAllowed = userIsAllowed;
exports.getHistory = getHistory;
exports.createRoom = createRoom;
exports.joinRooms = joinRooms;
exports.addAlias = addAlias;
exports.createWallet = createWallet;
exports.getAllTransactions = getAllTransactions;
exports.createTransaction = createTransaction;
exports.authFollowRoom = authFollowRoom;
exports.followRoom = followRoom;
exports.updateUserTeam = updateUserTeam;
exports.leaveSocketRooms = leaveSocketRooms;
exports.addUserTeamRoom = addUserTeamRoom;
exports.addUserToTeam = addUserToTeam;
exports.isRequiredRoom = isRequiredRoom;
exports.createUser = createUser;
// exports.changeDocFileAccess = changeDocFileAccess;
// exports.addUserToDocFile = addUserToDocFile;
