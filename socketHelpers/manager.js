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
const errorCreator = require('../objects/error/errorCreator');
const dbTransaction = require('../db/connectors/transaction');

/**
 * Does string contain valid characters?
 * @param {string} text - String to check
 * @returns {boolean} Does string contain valid characters?
 */
function isTextAllowed(text) {
  return /^[\w\d\såäöÅÄÖ\-]+$/g.test(text);
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
 * Gets user by sent socket ID from socket.io
 * @param {string} socketId - Users ID in the socket from socket.io
 * @param {Function} callback - callback
 */
function getUserById(socketId, callback) {
  dbUser.getUserById(socketId, (err, user) => {
    callback(err, user);
  });
}

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
 * @param {string} socketId - The users socket ID from socket.io
 * @param {string} commandName - Name of the command
 * @param {Function} callback - callback
 * @param {string} [userName] - Name of the user trying to use the command
 */
function userIsAllowed(socketId, commandName, callback, userName) {
  let isAllowed = false;
  const callbackFunc = (err, user) => {
    if (err) {
      callback(err);
    } else {
      const commandUser = {
        userName: user ? user.userName : '',
        accessLevel: user ? user.accessLevel : 0,
        whisperRooms: user ? user.whisperRooms : [],
      };

      getCommand(commandName, (cmdErr, command) => {
        if (cmdErr) {
          callback(cmdErr);
        } else {
          const commandLevel = command.accessLevel;

          if (commandUser.accessLevel >= commandLevel) {
            isAllowed = true;
          }
        }

        if (isAllowed) {
          dbCommand.incrementCommandUsage(commandName);
        }

        callback(cmdErr, isAllowed, commandUser);
      });
    }
  };

  if (socketId !== '') {
    getUserById(socketId, callbackFunc);
  } else {
    getUserByName(userName, callbackFunc);
  }
}

/**
 * Gets history (messages) from one or more rooms
 * @param {string[]} rooms - The rooms to retrieve the history from
 * @param {number} [lines] - How many message to retrieve
 * @param {boolean} [missedMsgs] - Set to true if only the messages since the users last connection should be returned
 * @param {Date} [lastOnline] - Date of the last time the user was online
 * @param {string} [whisperTo] - User name whispered to
 * @param {Function} callback - callback
 */
function getHistory({ lastOnline = new Date(), rooms, lines, missedMsgs, whisperTo, callback }) {
  dbChatHistory.getHistoryFromRooms(rooms, (err, history) => {
    let historyMessages = [];

    if (err || history === null) {
      logger.sendErrorMsg({
        code: logger.ErrorCodes.db,
        text: ['Failed to get history'],
        err,
      });
    } else {
      const maxLines = lines === null || isNaN(lines) ? appConfig.historyLines : lines;

      for (const roomHistory of history) {
        historyMessages = historyMessages.concat(roomHistory.messages);
      }

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

    callback(err, historyMessages, history[0].anonymous);
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
 * Updates user's socket ID in the database
 * @param {string} socketId - User's socket ID for socket.io
 * @param {string} userName - User's name
 * @param {Function} callback - callback
 */
function updateUserSocketId(socketId, userName, callback) {
  dbUser.updateUserSocketId(userName, socketId, (err, user) => {
    if (err) {
      logger.sendErrorMsg({
        code: logger.ErrorCodes.db,
        text: ['Failed to update Id'],
        err,
      });
    }

    callback(err, user);
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

  for (const room of allRooms) {
    socket.join(room);
  }
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
      callback({ error: new errorCreator.Database() });

      return;
    }

    const room = {
      owner: user.userName,
      roomName: alias + appConfig.whisperAppend,
    };

    createRoom(room, user, (createErr, createdRoom) => {
      if (createErr || !createdRoom) {
        callback({ error: new errorCreator.Database() });

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
      callback({ error: new errorCreator.Database() });

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
      callback({ err: new errorCreator.Database() });

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
 * @param {Object} transaction - New transaction
 * @param {Function} callback - Callback
 * @param {Object} user - User creating the transaction
 * @param {Object} io - Socket.io io
 */
function createTransaction({ transaction, callback, user, io }) {
  dbWallet.getWallet(transaction.from, (walletErr, userWallet) => {
    if (walletErr) {
      callback({ error: new errorCreator.Database() });

      return;
    } else if (userWallet.amount - transaction.amount < 0) {
      callback({ error: new errorCreator.Missing() });

      return;
    }

    dbTransaction.createTransaction(transaction, (transErr) => {
      if (transErr) {
        callback({ error: new errorCreator.Database() });

        return;
      }

      dbWallet.decreaseAmount(user.userName, user.accessLevel, transaction.from, transaction.amount, (errDecrease, decreasedWallet) => {
        if (errDecrease) {
          callback({ error: new errorCreator.Database() });

          return;
        }

        dbWallet.increaseAmount(transaction.to, transaction.amount, (err, increasedWallet) => {
          if (err) {
            callback({ error: new errorCreator.Database() });

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
          });
        });
      });
    });
  });
}

exports.userIsAllowed = userIsAllowed;
exports.getHistory = getHistory;
exports.createRoom = createRoom;
exports.updateUserSocketId = updateUserSocketId;
exports.joinRooms = joinRooms;
exports.addAlias = addAlias;
exports.createWallet = createWallet;
exports.getAllUserTransactions = getAllUserTransactions;
exports.createTransaction = createTransaction;
