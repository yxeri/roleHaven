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
const logger = require('./../utils/logger.js');
const appConfig = require('./../config/defaults/config').app;
const dbConfig = require('../config/defaults/config').databasePopulation;
const errorCreator = require('../objects/error/errorCreator');
const dbTransaction = require('../db/connectors/transaction');
const messenger = require('../socketHelpers/messenger');
const jwt = require('jsonwebtoken');

/**
 * Does string contain valid characters?
 * @param {string} text - String to check
 * @returns {boolean} Does string contain valid characters?
 */
function isTextAllowed(text) {
  return /^[\w\d\såäöÅÄÖ-]+$/g.test(text);
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
 * Gets user by user name
 * @param {string} userName - User name
 * @param {Function} callback - callback
 */
function getUserByName(userName, callback) {
  dbUser.getUserByAlias(userName, (err, user) => {
    callback(err, user);
  });
}

/**
 * Gets a command
 * @param {string} commandName - Name of the command to retrieve
 * @param {Function} callback - callback
 */
function getCommand(commandName, callback) {
  dbCommand.getCommand(commandName, (err, command) => {
    callback(err, command);
  });
}

/**
 * Checks if the user is allowed to use the command
 * @param {string} params.token Json web token
 * @param {string} params.commandName Name of the command
 * @param {Function} params.callback callback
 */
function userIsAllowed({ token = '', commandName, callback = () => {} }) {
  const callbackFunc = (err, user) => {
    if (err) {
      callback({ error: new errorCreator.Database({}) });

      return;
    }

    const commandUser = {
      userName: user ? user.userName : '',
      accessLevel: user ? user.accessLevel : 0,
      visibility: user ? user.visibility : 0,
      whisperRooms: user ? user.whisperRooms : [],
      isTracked: user ? user.isTracked : false,
      team: user ? user.team : null,
      shortTeam: user ? user.shortTeam : null,
    };

    getCommand(commandName, (cmdErr, command) => {
      if (cmdErr) {
        callback({ error: new errorCreator.Database({}) });

        return;
      } else if (commandUser.accessLevel < command.accessLevel) {
        callback({ error: new errorCreator.NotAllowed({ name: commandName }) });

        return;
      }

      dbCommand.incrementCommandUsage(commandName);

      callback({ allowedUser: commandUser });
    });
  };

  jwt.verify(token, appConfig.jsonKey, (jwtErr, decoded) => {
    if (jwtErr) {
      callback({ error: new errorCreator.Database({}) });

      return;
    } else if (!decoded) {
      callback({ error: new errorCreator.NotAllowed({ name: commandName }) });

      return;
    }

    getUserByName(decoded.data.userName, callbackFunc);
  });
}

/**
 * Gets getHistory (messages) from one or more rooms
 * @param {string[]} rooms - The rooms to retrieve the getHistory from
 * @param {number} [lines] - How many message to retrieve
 * @param {boolean} [missedMsgs] - Set to true if only the messages since the users last connection should be returned
 * @param {Date} [lastOnline] - Date of the last time the user was online
 * @param {string} [whisperTo] - User name whispered to
 * @param {Function} callback - callback
 */
function getHistory({ lastOnline = new Date(), rooms, lines, missedMsgs, whisperTo, callback }) {
  dbChatHistory.getHistoryFromRooms(rooms, (err, histories) => {
    let historyMessages = [];

    if (err || histories === null) {
      logger.sendErrorMsg({
        code: logger.ErrorCodes.db,
        text: ['Failed to get getHistory'],
        err,
      });
    } else {
      const maxLines = lines === null || isNaN(lines) ? appConfig.historyLines : lines;

      histories.forEach(history => historyMessages.concat(history.messages));

      if (whisperTo) {
        historyMessages = historyMessages.filter(message => message.roomName === `${whisperTo}${appConfig.whisperAppend}` || message.userName === whisperTo);
      }

      historyMessages.sort(messageSort);

      if (maxLines !== '*') {
        historyMessages = historyMessages.slice(-maxLines);
      }

      if (missedMsgs) {
        for (let i = historyMessages.length - 1; i > 0; i -= 1) {
          const message = historyMessages[i];

          if (lastOnline > message.time) {
            historyMessages = historyMessages.slice(i + 1);

            break;
          }
        }
      }
    }

    callback(err, historyMessages, histories[0].anonymous);
  });
}

/**
 * Creates a new chat room and adds the user who created it to it
 * @param {Object} sentRoom - New room
 * @param {Object} user User who is creating the new room
 * @param {Function} callback - callback
 */
function createRoom(sentRoom, user, callback) {
  const newRoom = sentRoom;
  newRoom.roomName = sentRoom.roomName.toLowerCase();

  dbRoom.createRoom(newRoom, null, (err, room) => {
    if (err || room === null) {
      logger.sendErrorMsg({
        code: logger.ErrorCodes.db,
        text: [`Failed to create room for user ${user.userName}`],
        err,
      });
      callback(err);
    } else {
      dbUser.addRoomToUser(user.userName, room.roomName, (roomErr) => {
        if (roomErr) {
          logger.sendErrorMsg({
            code: logger.ErrorCodes.db,
            text: [`Failed to add user ${user.userName} to its room`],
            err: roomErr,
          });
        }

        callback(roomErr, room);
      });
    }
  });
}

/**
 * Joins the user's socket to all sent rooms and added standard rooms
 * @param {string[]} rooms - Rooms for the user to join
 * @param {Object} socket - socket.io socket
 * @param {string} [device] - DeviceID of the user
 */
function joinRooms(rooms, socket, device) {
  const allRooms = rooms;

  if (device) {
    allRooms.push(device + appConfig.deviceAppend);
  }

  allRooms.forEach(room => socket.join(room));
}

/**
 * Add alias to users
 * @param {Object} user - User that will get a new alias
 * @param {string} alias - Alias to add
 * @param {Function} callback - Callback
 */
function addAlias({ user, alias, callback }) {
  if (!isTextAllowed(alias)) {
    callback({ error: new errorCreator.InvalidCharacters({ propertyName: 'alias name' }) });

    return;
  }

  const aliasLower = alias.toLowerCase();

  dbUser.addAlias(user.userName, aliasLower, (err, aliasUser) => {
    if (err || aliasUser === null) {
      callback({ error: new errorCreator.Database({}) });

      return;
    }

    const room = {
      owner: user.userName,
      roomName: alias + appConfig.whisperAppend,
      accessLevel: dbConfig.accessLevels.superUser,
      visibility: dbConfig.accessLevels.superUser,
    };

    createRoom(room, user, (createErr, createdRoom) => {
      if (createErr || !createdRoom) {
        callback({ error: new errorCreator.Database({}) });

        return;
      }

      callback({ data: { alias: aliasLower } });
    });
  });
}

/**
 * Creates a new wallet
 * @param {Object} wallet - New wallet
 * @param {Function} callback - callback
 */
function createWallet(wallet, callback) {
  dbWallet.createWallet(wallet, (error) => {
    if (error) {
      callback({ error: new errorCreator.Database({}) });

      return;
    }

    callback({ data: { wallet } });
  });
}

/**
 * Get all user's transactions
 * @param {string} userName - Name of the user
 * @param {Function} callback - Callback
 */
function getAllUserTransactions({ userName, callback = () => {} }) {
  dbTransaction.getAllUserTransactions(userName, (err, transactions) => {
    if (err) {
      callback({ err: new errorCreator.Database({}) });

      return;
    }

    const data = {};

    if (transactions && transactions.length > 0) {
      data.toTransactions = transactions.filter(transaction => transaction.to === userName);
      data.fromTransactions = transactions.filter(transaction => transaction.from === userName);
    } else {
      data.toTransactions = [];
      data.fromTransactions = [];
    }

    callback({ data });
  });
}

/**
 *
 * @param {Object} params.transaction New transaction
 * @param {Object} params.user User creating the transaction
 * @param {Object} params.io Socket.io io
 * @param {boolean} params.emitToSender Should event be emitted to sender?
 * @param {Function} [params.callback] Callback
 */
function createTransaction({ transaction, user, io, emitToSender, callback = () => {} }) {
  transaction.amount = Math.abs(transaction.amount);
  transaction.time = new Date();
  transaction.from = user.userName;

  dbWallet.getWallet(transaction.from, (walletErr, userWallet) => {
    if (walletErr) {
      callback({ error: new errorCreator.Database({}) });

      return;
    } else if (userWallet.amount - transaction.amount < 0) {
      callback({ error: new errorCreator.NotAllowed({ name: 'transfer too much' }) });

      return;
    }

    dbTransaction.createTransaction(transaction, (transErr) => {
      if (transErr) {
        callback({ error: new errorCreator.Database({}) });

        return;
      }

      dbWallet.decreaseAmount(user.userName, user.accessLevel, transaction.from, transaction.amount, (errDecrease, decreasedWallet) => {
        if (errDecrease) {
          callback({ error: new errorCreator.Database({}) });

          return;
        }

        dbWallet.increaseAmount(transaction.to, transaction.amount, (err, increasedWallet) => {
          if (err) {
            callback({ error: new errorCreator.Database({}) });

            return;
          }

          callback({ data: { transaction, wallet: decreasedWallet } });

          dbUser.getUserByAlias(transaction.to, (aliasErr, receiver) => {
            if (aliasErr) {
              return;
            }

            if (receiver.socketId !== '') {
              io.to(receiver.socketId).emit('transaction', { transaction, wallet: increasedWallet });
            }

            if (emitToSender) {
              dbUser.getUserByAlias(user.userName, (senderErr, sender) => {
                if (senderErr) {
                  return;
                }

                if (sender.socketId) {
                  io.to(sender.socketId).emit('transaction', { transaction, wallet: decreasedWallet });
                }
              });
            }
          });
        });
      });
    });
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
  room.roomName = room.roomName.toLowerCase();
  room.password = room.password || '';

  dbRoom.authUserToRoom(user, room.roomName, room.password, (err, authRoom) => {
    if (err) {
      callback({ error: new errorCreator.Database({}) });

      return;
    } else if (authRoom === null) {
      callback({ error: new errorCreator.NotAllowed({ name: `follow room ${room.roomName}` }) });

      return;
    }

    dbUser.addRoomToUser(user.userName, room.roomName, (roomErr) => {
      if (roomErr) {
        callback({ error: new errorCreator.Database({}) });

        return;
      }

      followRoom({ userName: user.userName, room, callback, socket });
    });
  });
}

/**
 * Update user's team
 * @param {Object} params.socket Socket.IO socket
 * @param {string} params.userName Name of the user
 * @param {string} params.teamName Name of the team
 * @param {string} params.shortTeamName Short name of the team
 * @param {Function} [params.callback] Callback
 */
function updateUserTeam({ socket, userName, teamName, shortTeamName, callback = () => {} }) {
  dbUser.updateUserTeam(userName, teamName, shortTeamName, (err, user) => {
    if (err) {
      callback({ error: new errorCreator.Database({}) });

      return;
    }

    messenger.sendMsg({
      socket,
      message: {
        text: [`You have been added to the team ${teamName}`],
        text_se: [`Ni har blivit tillagd i teamet ${teamName}`],
        userName: 'SYSTEM',
      },
      sendTo: userName + appConfig.whisperAppend,
    });

    callback({ data: { user } });
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

exports.userIsAllowed = userIsAllowed;
exports.getHistory = getHistory;
exports.createRoom = createRoom;
exports.joinRooms = joinRooms;
exports.addAlias = addAlias;
exports.createWallet = createWallet;
exports.getAllUserTransactions = getAllUserTransactions;
exports.createTransaction = createTransaction;
exports.authFollowRoom = authFollowRoom;
exports.followRoom = followRoom;
exports.updateUserTeam = updateUserTeam;
exports.leaveSocketRooms = leaveSocketRooms;
