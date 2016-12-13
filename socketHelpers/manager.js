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
const logger = require('./../utils/logger.js');
const appConfig = require('./../config/defaults/config').app;

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
 */
function userAllowedCommand(socketId, commandName, callback) {
  let isAllowed = false;
  const callbackFunc = (err, user) => {
    if (err) {
      callback(err);
    } else {
      getCommand(commandName, (cmdErr, command) => {
        if (cmdErr) {
          callback(cmdErr);
        } else {
          const userLevel = user ? user.accessLevel : 0;
          const commandLevel = command.accessLevel;

          if (userLevel >= commandLevel) {
            isAllowed = true;
          }
        }

        if (isAllowed) {
          dbCommand.incrementCommandUsage(commandName);
        }

        callback(cmdErr, isAllowed, user);
      });
    }
  };

  getUserById(socketId, callbackFunc);
}

/**
 * Gets history (messages) from one or more rooms
 * @param {string[]} rooms - The rooms to retrieve the history from
 * @param {number} [lines] - How many message to retrieve
 * @param {boolean} [missedMsgs] - Set to true if only the messages since the users last connection should be returned
 * @param {Date} [lastOnline] - Date of the last time the user was online
 * @param {Function} callback - callback
 */
function getHistory({ lastOnline = new Date(), rooms, lines, missedMsgs, callback }) {
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

    callback(err, historyMessages);
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

exports.userAllowedCommand = userAllowedCommand;
exports.getHistory = getHistory;
exports.createRoom = createRoom;
exports.updateUserSocketId = updateUserSocketId;
exports.joinRooms = joinRooms;
