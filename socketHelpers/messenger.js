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

const dbChatHistory = require('./../db/connectors/chatHistory');
const dbUser = require('./../db/connectors/user');
const databasePopulation = require('./../config/defaults/config').databasePopulation;
const appConfig = require('./../config/defaults/config').app;
const logger = require('./../utils/logger');
const objectValidator = require('./../utils/objectValidator');
const errorCreator = require('../objects/error/errorCreator');
const manager = require('../socketHelpers/manager');

/**
 * Add a sent message to a room's history in the database
 * @param {string} roomName - Name of the room
 * @param {Object} message - Message to be added
 * @param {Function} callback - callback
 */
function addMsgToHistory(roomName, message, callback) {
  dbChatHistory.addMsgToHistory(roomName, message, (err, history) => {
    if (err || history === null) {
      logger.sendErrorMsg({
        code: logger.ErrorCodes.db,
        text: ['Failed to add message to history'],
        err,
      });
      callback(err || {});
    } else {
      message.anonymous = history.anonymous;

      callback(err, message);
    }
  });
}

/**
 * Send a message to the user's socket
 * @param {{text: string[]}} message - Message to send
 * @param {Object} socket - Socket.io socket
 */
function sendSelfMsg({ message, socket }) {
  if (!objectValidator.isValidData({ message, socket }, { socket: true, message: { text: true } })) {
    return;
  }

  socket.emit('message', { message });
}

/**
 * Sends multiple message to the user's socket
 * @param {{text: string[]}[]} messages - Messages to send
 * @param {Object} socket - Socket.io socket
 */
function sendSelfMsgs({ messages, socket }) {
  if (!objectValidator.isValidData({ messages, socket }, { socket: true, messages: true })) {
    return;
  }

  socket.emit('messages', { messages });
}

/**
 * Sends multiple message to the user's socket
 * @param {{text: string[]}[]} messages - Messages to send
 * @param {Object} socket - Socket.io socket
 */
function sendSelfChatMsgs({ messages, socket }) {
  if (!objectValidator.isValidData({ messages, socket }, { socket: true, messages: true })) {
    return;
  }

  socket.emit('chatMsgs', { messages });
}

/**
 * Checks if the user is following a room
 * @param {Object} user - User to check
 * @param {string} roomName - Name of the room
 * @returns {boolean} Is the socket following the room?
 */
function isUserFollowingRoom(user, roomName) {
  return user.rooms.indexOf(roomName) > -1;
}

/**
 * Sends a message to a room. The message will not be stored in history
 * Emits message
 * @param {string} sendTo - User name to send to
 * @param {Object} socket - Socket.io socket
 * @param {Object} params.message - Message to send
 * @param {string} params.message.userName - Name of sender
 * @param {string[]} params.message.text - Text in message
 * @param {string[]} [params.message.text_se] - Text in message
 */
function sendMsg({ socket, message, userName, sendTo }) {
  if (!objectValidator.isValidData({ message, userName }, { socket: true, message: { text: true, userName: true }, sendTo: true })) {
    return;
  }

  const data = {
    message,
    sendTo,
  };

  socket.broadcast.to(data.sendTo).emit('chatMsg', data);
}

/**
 * Store message in history and send to connected clients
 * @param {Object} params.user - User sending the message
 * @param {Function} params.callback - Callback
 * @param {Object} params.message - Message to send
 * @param {Object} params.io - Socket.io. Used by API, when no socket is available
 * @param {Object} params.socket - Socket.io socket
 */
function sendAndStoreChatMsg({ user, callback, message, io, socket }) {
  dbUser.getUser(user.userName, (userErr, foundUser) => {
    if (userErr || foundUser === null) {
      callback({ error: new errorCreator.Database() });

      return;
    } else if (!isUserFollowingRoom(foundUser, message.roomName)) {
      callback({ error: new errorCreator.NotAllowed({ used: `send message to ${message.roomName}` }) });

      return;
    }

    message.time = new Date();

    const data = {
      messages: [message],
      room: { roomName: message.roomName },
    };

    addMsgToHistory(message.roomName, message, (err) => {
      if (err) {
        callback({ error: new errorCreator.Database() });

        return;
      }

      if (message.anonymous) {
        message.userName = 'anonymous';
        message.time.setHours(0);
        message.time.setMinutes(0);
        message.time.setSeconds(0);
      }

      if (socket) {
        socket.broadcast.to(message.roomName).emit('chatMsgs', data);
      } else {
        io.to(message.roomName).emit('chatMsgs', data);
      }

      callback({ data });
    });
  });
}

/**
 * Sends a message to a room and stores it in history
 * Emits message
 * @param {Object} message - Message to be sent
 * @param {Object} user - User sending the message
 * @param {Object} params.io - Socket.io. Used by API, when no socket is available
 * @param {Object} params.socket - Socket.io socket
 * @param {Function} callback - Client callback
 */
function sendChatMsg({ message, user, callback, io, socket }) {
  if (!objectValidator.isValidData({ message, user, callback, io }, { user: { userName: true }, message: { text: true, roomName: true }, io: true })) {
    callback({ error: new errorCreator.InvalidData() });

    return;
  }

  if (message.roomName === 'team') {
    message.roomName = user.team + appConfig.teamAppend;
  }

  if (message.userName) {
    dbUser.getUserByAlias(message.userName, (aliasErr, aliasUser) => {
      if (aliasErr) {
        callback({ error: new errorCreator.Database() });

        return;
      } else if (aliasUser === null || aliasUser.userName !== user.userName) {
        callback({
          error: {
            called: sendChatMsg.name,
            message: {
              text: ['User name does not match user trying to send the message'],
            },
          },
        });

        return;
      }

      sendAndStoreChatMsg({ io, message, user, callback, socket });
    });
  } else {
    message.userName = user.userName;

    sendAndStoreChatMsg({ io, message, user, callback, socket });
  }
}

/**
 * Sends a message to a whisper room (*user name*-whisper), which is followed by a single user, and stores it in history
 * Emits message
 * @param {Object} message - Message to be sent
 * @param {Object} user - User who sent the message
 * @param {Object} socket - Socket.io socket
 * @param {Object} io - Socket.io. Used by API, when no socket is available
 * @param {Function} callback - Client callback
 */
function sendWhisperMsg({ io, user, message, socket, callback }) {
  if (!objectValidator.isValidData({ message, io }, { message: { text: true, roomName: true, userName: true }, io: true })) {
    callback({ error: {} });

    return;
  }

  dbUser.getUserByAlias(message.userName, (aliasErr, aliasUser) => {
    if (aliasErr) {
      callback({ error: {} });

      return;
    } else if (aliasUser === null || aliasUser.userName !== user.userName) {
      callback({
        error: {
          called: sendChatMsg.name,
          message: {
            text: ['User name does not match user trying to send the message'],
          },
        },
      });

      return;
    }

    message.roomName += appConfig.whisperAppend;
    message.extraClass = 'whisperMsg';
    message.time = new Date();

    const data = {
      messages: [message],
      room: { roomName: message.roomName },
      whisper: true,
    };

    // TODO Message should be removed if db fails to store it at senders
    addMsgToHistory(message.roomName, message, (err) => {
      if (err) {
        callback({ error: {} });

        return;
      }

      const senderRoomName = message.userName + appConfig.whisperAppend;

      addMsgToHistory(senderRoomName, message, (senderErr) => {
        if (senderErr) {
          callback({ error: {} });

          return;
        }

        if (socket) {
          socket.broadcast.to(message.roomName).emit('chatMsgs', data);
        } else {
          io.to(message.roomName).emit('chatMsgs', data);
        }


        callback({ data });
      });
    });
  });
}

/**
 * Sends a message with broadcastMsg class to all connected sockets
 * It is stored in a separate broadcast history
 * Emits message
 * @param {Object} message - Message to be sent
 * @param {Object} socket - Socket.io socket
 * @param {Object} io - Socket.io. Used by API, when no socket is available
 * @param {Function} callback - Client callback
 */
function sendBroadcastMsg({ message, socket, callback, io, user }) {
  const allowCallback = (allowErr, allowed) => {
    if (allowErr || !allowed) {
      callback({ error: new errorCreator.NotAllowed({ used: 'broadcast' }) });

      return;
    }
    if (!objectValidator.isValidData({ message, socket, callback }, { message: { text: true }, io: true })) {
      callback({ error: {} });

      return;
    }

    const data = {
      message,
    };
    data.message.extraClass = 'broadcastMsg';
    data.message.roomName = databasePopulation.rooms.bcast.roomName;
    data.message.time = new Date();

    if (!data.message.userName) {
      data.message.userName = 'SYSTEM';
    }

    addMsgToHistory(data.message.roomName, data.message, (err) => {
      if (err) {
        callback({ error: {} });

        return;
      }

      if (socket) {
        socket.broadcast.to(data.message.roomName).emit('bcastMsg', data);
      } else {
        io.to(data.message.roomName).emit('bcastMsg', data);
      }

      callback({ data });
    });
  };

  const socketId = socket ? socket.id : '';

  manager.userIsAllowed(socketId, databasePopulation.commands.broadcast.commandName, allowCallback, user.userName);
}

/**
 * Send an array of strings with an optional title
 * Emits list
 * @param {{socket: Object, itemList: { itemList: Object[], listTitle: string}, columns: number}} params - Parameters
 */
function sendList(params) {
  if (!objectValidator.isValidData(params, { socket: true, itemList: { itemList: true, listTitle: true } })) {
    return;
  }

  const socket = params.socket;
  const data = {
    itemList: params.itemList,
    columns: params.columns,
  };

  socket.emit('list', data);
}

exports.sendChatMsg = sendChatMsg;
exports.sendWhisperMsg = sendWhisperMsg;
exports.sendBroadcastMsg = sendBroadcastMsg;
exports.sendMsg = sendMsg;
exports.sendSelfMsg = sendSelfMsg;
exports.sendSelfMsgs = sendSelfMsgs;
exports.sendList = sendList;
exports.sendSelfChatMsgs = sendSelfChatMsgs;
