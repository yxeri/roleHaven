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
 * Gets getHistory (messages) from one or more rooms
 * @param {Object} params.user User retrieving history
 * @param {string[]} params.rooms The rooms to retrieve the getHistory from
 * @param {Object} params.io socket io. Will be used if socket is not set
 * @param {Object} [params.socket] Socket io
 * @param {Function} params.callback Callback
 */
function getHistory({ user, callback, socket, io, rooms }) {
  if (!objectValidator.isValidData({ rooms }, { rooms: true })) {
    callback({ error: new errorCreator.InvalidData({ expected: '{ rooms }' }) });

    return;
  }

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
    return allUserRooms.indexOf(roomName) === -1;
  });

  dbChatHistory.getHistories({
    rooms: roomsToGet,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const histories = data.histories.map((history) => {
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
}

/**
 * Creates a new chat room and adds the user who created it to it
 * @param {Object} params.room New room
 * @param {Object} params.user User who is creating the new room
 * @param {Object} [params.socket] Socket io
 * @param {Object} [params.io] Socket.io. Used if socket isn't set
 * @param {boolean} [params.bypassChecks] Should the room be created even if breaks requirements?
 * @param {Function} params.callback callback
 */
function createRoom({ room, user, bypassChecks, socket, io, callback }) {
  if (!objectValidator.isValidData({ room }, { room: { roomName: true } })) {
    callback({ error: new errorCreator.InvalidData({ expected: '{ room: { roomName } }' }) });

    return;
  } else if (!bypassChecks && (room.roomName.length > appConfig.roomNameMaxLength || !textTools.isAlphaNumeric(room.roomName))) {
    callback({ error: new errorCreator.InvalidCharacters({ expected: 'a-z 0-9 length: 10' }) });

    return;
  } else if (!bypassChecks && (room.roomName.indexOf(appConfig.whisperAppend) > -1 || room.roomName.indexOf(appConfig.teamAppend) > -1 || room.roomName.indexOf(appConfig.scheduleAppend) > -1)) {
    callback({ error: new errorCreator.InvalidCharacters({ expected: 'not protected words' }) });

    return;
  }

  const newRoom = room;
  newRoom.roomName = room.roomName.toLowerCase();
  newRoom.owner = user.userName;

  dbRoom.createRoom({
    room: newRoom,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const createdRoom = data.room;

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
    callback({ error: new errorCreator.InvalidCharacters({ name: 'alias name', expected: 'a-z 0-9' }) });

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
        accessLevel: dbConfig.AccessLevels.SUPERUSER,
        visibility: dbConfig.AccessLevels.SUPERUSER,
        isWhisper: true,
      };

      createRoom({
        room,
        user,
        bypassChecks: true,
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
 * @param {Object} params.user User trying to follow a room
 * @param {Function} params.callback Callback
 * @param {Object} [params.socket] Socket.io socket
 * @param {Object} params.io Socket.io. Used if sockket is not set
 */
function followRoom({ socket, io, room, user, callback }) {
  if (!objectValidator.isValidData({ room }, { room: { roomName: true } })) {
    callback({ error: new errorCreator.InvalidData({ expected: '{ room: { roomName } }' }) });

    return;
  }

  const roomToFollow = room;
  roomToFollow.roomName = roomToFollow.roomName.toLowerCase();

  authUserToRoom({
    user,
    room,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

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

          const roomName = data.room.roomName;
          const dataToSend = {
            roomName,
            userName: user.userName,
            isFollowing: true,
          };

          if (socket) {
            socket.broadcast.to(roomName).emit('roomFollower', { data: dataToSend });
            socket.join(roomName);
          } else {
            io.to(user.socketId).emit('follow', { data: { room: data.room } });
            io.to(roomName).emit('roomFollower', { data: dataToSend });
          }

          callback({ data });
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

      followRoom({
        socket,
        io,
        user,
        room,
        callback: ({ error: followError }) => {
          if (followError) {
            callback({ error: followError });

            return;
          }

          callback({ data: { team: { teamName: team.teamName, shortName: team.shortName } } });
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
function createUser({ user, callback }) {
  if (!textTools.isAllowedFull(user.userName.toLowerCase())) {
    callback({ error: new errorCreator.InvalidCharacters({ name: `User name: ${user.userName}` }) });

    return;
  } else if (user.userName.length > appConfig.userNameMaxLength || user.password.length > appConfig.passwordMaxLength || user.registerDevice.length > appConfig.deviceIdLength) {
    callback({ error: new errorCreator.InvalidCharacters({ name: `User name length: ${appConfig.userNameMaxLength} Password length: ${appConfig.userNameMaxLength} Device length: ${appConfig.deviceIdLength}` }) });

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

      const whisperRoom = {
        roomName: createdUser.userName + appConfig.whisperAppend,
        visibility: dbConfig.AccessLevels.SUPERUSER,
        accessLevel: dbConfig.AccessLevels.SUPERUSER,
        isWhisper: true,
      };

      createRoom({
        room: whisperRoom,
        user: createdUser,
        bypassChecks: true,
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
}

/**
 * Get active calibration mission for user. Creates a new one if there is none for the user
 * @param {string} params.userName User name
 * @param {Function} params.callback Callback
 */
function getActiveCalibrationMission({ userName, callback }) {
  dbCalibrationMission.getActiveMission({
    owner: userName,
    silentOnDoesNotExist: true,
    callback: ({ error: activeErr, data }) => {
      if (activeErr) {
        callback({ error: activeErr });

        return;
      }

      /**
       * Return active mission, if it exists, or continue with creating a new one
       */
      if (data.mission) {
        callback({ data });

        return;
      }

      dbCalibrationMission.getInactiveMissions({
        owner: userName,
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
            owner: userName,
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

              const newMission = createData.savedObject;

              callback({ data: { mission: newMission, isNew: true } });
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
function completeActiveCalibrationMission({ mission, io, callback }) {
  dbCalibrationMission.setMissionCompleted({
    io,
    code: mission.code,
    stationId: mission.stationId,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const completedMission = data.mission;

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

          const createdTransaction = createTransactionData.data.savedObject;

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
}

/**
 * Create a docFile
 * @param {Object} params.user User creating doc file
 * @param {Object} params.docFile DocFile to create
 * @param {Function} params.callback Callback
 */
function createDocFile({ user, docFile, callback }) {
  const joinedText = docFile.text.join('');

  if (!textTools.isAlphaNumeric(docFile.docFileId)) {
    callback({ error: new errorCreator.InvalidCharacters({ expected: `alphanumeric ${docFile.docFileId}` }) });

    return;
  } else if (joinedText.length > appConfig.docFileMaxLength || joinedText === '') {
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
  newDocFile.creator = user.userName;
  newDocFile.docFileId = newDocFile.docFileId.toLowerCase();

  dbDocFile.createDocFile({
    docFile: newDocFile,
    callback: (createData) => {
      if (createData.error) {
        callback({ error: createData.error });

        return;
      }

      callback({ data: { docFile: createData.data.docFile } });
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
function decreaseWalletAmount({ owner, amount, callback }) {
  if (amount <= 0) {
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
        owner,
        amount,
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
}

/**
 * Increase wallet amount
 * @param {string} params.owner Name of the owner of the wallet
 * @param {number} params.amount The amount to increase wallet amount with
 * @param {Function} params.callback Callback
 */
function increaseWalletAmount({ owner, amount, callback }) {
  if (amount <= 0) {
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
        owner,
        amount,
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
}

/**
 * Create team
 * @param {Object} params.team Team to create
 * @param {Object} params.user User creating team
 * @param {Object} [params.socket] Socket io
 * @param {Object} [params.io] Socket io. Will be used if socket is not set
 * @param {Function} params.callback Callback
 */
function createTeam({ team, user, socket, io, callback }) {
  if (team.teamName.toLowerCase() === 'team') {
    callback({ error: new errorCreator.InvalidData({ expected: 'team name !== team' }) });

    return;
  } else if (team.teamName.length > appConfig.teamNameMaxLength || team.shortName.length > appConfig.shortTeamMaxLength) {
    callback({ error: new errorCreator.InvalidData({ name: `Team name length: ${appConfig.teamNameMaxLength} Short name length: ${appConfig.shortTeamMaxLength}` }) });

    return;
  } else if (user.team) {
    callback({ error: new errorCreator.AlreadyExists({ name: 'already in team' }) });

    return;
  }

  const newTeam = team;
  newTeam.owner = user.userName;
  newTeam.verified = false;

  dbTeam.createTeam({
    team: newTeam,
    callback: ({ error: teamError, data: teamData }) => {
      if (teamError) {
        callback({ error: teamError });

        return;
      }

      const createdTeam = teamData.team;
      const teamRoom = {
        owner: dbConfig.systemUserName,
        roomName: createdTeam.teamName + appConfig.teamAppend,
        accessLevel: dbConfig.AccessLevels.SUPERUSER,
        visibility: dbConfig.AccessLevels.SUPERUSER,
      };
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

          createRoom({
            user,
            room: teamRoom,
            bypassChecks: true,
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
}

/**
 * Invite user to team
 * @param {Object} params.user User making the invitation
 * @param {string} params.to Name of the user to invite
 * @param {Object} [params.socket] Socket io
 * @param {Object} [params.io] Socket io. Will be used if socket is not set
 * @param {Function} params.callback Callback
 */
function inviteToTeam({ user, to, socket, io, callback }) {
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
 * @param {Object} params.user User that is unfollowing a room
 * @param {boolean} params.isWhisperRoom Is it a whisper room?
 * @param {Object} params.room Room to unfollow
 * @param {Function} params.callback Callback
 * @param {Object} [params.socket] Socket io socket
 * @param {Object} params.io Socket io. Will be used if socket is not set
 */
function unfollowRoom({ user, socket, io, isWhisperRoom, room, callback }) {
  if (!objectValidator.isValidData({ room }, { room: { roomName: true } })) {
    callback({ error: new errorCreator.InvalidData({ expected: '{ room: { roomName } }' }) });

    return;
  } else if (socket && Object.keys(socket.rooms).indexOf(room.roomName.toLowerCase()) === -1) {
    callback({ error: new errorCreator.NotAllowed({ name: 'unfollow room that is not followed' }) });

    return;
  } else if (socket && isRequiredRoom({ roomName: room.roomName, socketId: socket.id, user })) {
    callback({ error: new errorCreator.NotAllowed({ name: 'unfollow protected room' }) });

    return;
  }

  const roomToUnfollow = room;
  roomToUnfollow.roomName = roomToUnfollow.roomName.toLowerCase();

  dbUser.removeRoomFromUser({
    userName: user.userName,
    roomName: roomToUnfollow.roomName,
    isWhisperRoom,
    callback: ({ error: removeError }) => {
      if (removeError) {
        callback({ error: removeError });

        return;
      }

      const dataToEmit = {
        room: roomToUnfollow,
        userName: user.userName,
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
}

/**
 * List rooms
 * @param {Object} params.user User listing rooms
 * @param {Object} [params.socket] Socket io
 * @param {Function} params.callback Callback
 */
function listRooms({ user, socket, callback }) {
  dbRoom.getAllRooms({
    user,
    callback: ({ error: getError, data }) => {
      if (getError) {
        callback({ error: getError });

        return;
      }

      const filteredRooms = data.rooms.map((room) => {
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
          callback: ({ error: ownedError, data: roomsData }) => {
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
                ownedRooms: roomsData.rooms.map((room) => { return { roomName: room.roomName, password: room.password }; }),
              },
            });
          },
        });
      }
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
 * @param {Object} params.user User retrieving rooms
 * @param {string} params.partialName Partial room name
 * @param {Function} params.callback Callback
 */
function matchMyPartialRoomName({ user, partialName, callback }) {
  const regex = new RegExp(`^${partialName}.*`);
  const rooms = messenger.filterHiddenRooms({ roomNames: user.rooms.filter(roomName => roomName.match(regex)), socketId: user.socketId });

  if (user.team) {
    rooms.push('team');
  }

  callback({
    data: { matched: rooms },
  });
}

/**
 * Match sent partial room name to one or more rooms. Match will start from index 0
 * @param {Object} params.user User retrieving rooms
 * @param {string} params.partialName Partial room name
 * @param {Function} params.callback Callback
 */
function matchPartialRoomName({ user, partialName, callback }) {
  dbRoom.matchPartialRoom({
    partialName,
    user,
    callback: ({ error: partialError, data }) => {
      if (partialError) {
        callback({ error: partialError });

        return;
      }

      callback({
        data: { matched: data.matched.map(room => room.roomName) },
      });
    },
  });
}

/**
 * Get room
 * @param {string} params.roomName Name of the room to retrieve
 * @param {Object} params.user user retrieving room
 * @param {Function} params.callback Callback
 */
function getRoom({ roomName, user, callback }) {
  const sentRoomName = roomName.toLowerCase();

  dbRoom.getRoom({
    roomName: sentRoomName,
    callback: ({ error: roomError, data: roomData }) => {
      if (roomError) {
        callback({ error: roomError });

        return;
      } else if (user.accessLevel < roomData.room.visibility) {
        callback({ error: new errorCreator.NotAllowed({ name: `room ${sentRoomName}` }) });

        return;
      }

      callback({ data: roomData });
    },
  });
}

/**
 * Get users
 * @param {Object} params.user User retrieving users
 * @param {Function} params.callback Callback
 */
function getAllUsers({ user, callback }) {
  dbUser.getAllUsers({
    user,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      callback({
        data: {
          users: data.users.map((userObj) => {
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
}

/**
 * Send password reset mail
 * @param {string} params.mail Mail address for the user
 * @param {Function} params.callback Callback
 */
function sendPasswordReset({ mail, callback }) {
  dbUser.getUserByMail({
    mail,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      mailer.sendPasswordReset({
        address: data.user.mail,
        userName: data.user.userName,
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
}

/**
 * Get user by name
 * @param {string} params.userName User to retrieve
 * @param {Object} params.user User retrieving the user
 * @param {Function} params.callback Callback
 */
function getUser({ userName, user, callback }) {
  dbUser.getUser({
    userName: userName.toLowerCase(),
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      } else if (user.userName !== data.user.userName && (user.accessLevel < data.user.accessLevel || user.accessLevel < data.user.visibility)) {
        callback({ error: new errorCreator.DoesNotExist({ name: `user ${userName}` }) });

        return;
      }

      callback({ data });
    },
  });
}

/**
 *
 * @param {Object} params.mission Mission to cancel
 * @param {number} params.mission.code Mission code
 * @param {number} params.stationid Station id
 * @param {Object} params.io Socket io
 * @param {Function} params.callback Callback
 */
function cancelActiveCalibrationMission({ mission, io, callback }) {
  dbCalibrationMission.setMissionCompleted({
    code: mission.code,
    stationId: mission.stationId,
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
}

/**
 * Get devices
 * @param {Function} params.callback Callback
 */
function getDevices({ callback }) {
  dbDevice.getAllDevices({
    callback: ({ error: deviceError, data }) => {
      if (deviceError) {
        callback({ error: deviceError });

        return;
      }

      callback({ data });
    },
  });
}

/**
 * Update device's lastAlive, lastUser and socketId, retrieved from the user account
 * @param {Object} params.device Device
 * @param {string} params.device.deviceId Device id of the device to update
 * @param {Function} params.callback Callback
 */
function updateDevice({ user, device, callback }) {
  const deviceToUpdate = {};
  deviceToUpdate.lastAlive = new Date();
  deviceToUpdate.deviceId = device.deviceId;

  if (user) {
    deviceToUpdate.socketId = user.socketId;
    deviceToUpdate.lastUser = user.userName;
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
}

/**
 * Update device alias
 * @param {Object} params.device Device
 * @param {string} params.device.deviceId Id of the device to update
 * @param {string} params.device.deviceAlias New alias for the device
 * @param {Function} param.scallback Callback
 */
function updateDeviceAlias({ device, callback }) {
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
}

exports.createRoom = createRoom;
exports.joinRooms = joinRooms;
exports.getHistory = getHistory;
exports.addAlias = addAlias;
exports.getAllTransactions = getAllTransactions;
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
exports.listRooms = listRooms;
exports.removeRoom = removeRoom;
exports.matchMyPartialRoomName = matchMyPartialRoomName;
exports.matchPartialRoomName = matchPartialRoomName;
exports.getRoom = getRoom;
exports.getAllUsers = getAllUsers;
exports.sendPasswordReset = sendPasswordReset;
exports.getUser = getUser;
exports.cancelActiveCalibrationMission = cancelActiveCalibrationMission;
exports.getDevices = getDevices;
exports.updateDevice = updateDevice;
exports.updateDeviceAlias = updateDeviceAlias;
