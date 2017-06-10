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
const objectValidator = require('./../utils/objectValidator');
const errorCreator = require('../objects/error/errorCreator');
const manager = require('../socketHelpers/manager');

/**
 * Add a sent message to a room's getHistory in the database
 * @param {string} params.roomName Name of the room
 * @param {Object} params.message Message to be added
 * @param {Function} params.callback callback
 */
function addMsgToHistory({ roomName, message, callback }) {
  dbChatHistory.addMsgToHistory({
    roomName,
    message,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });
      }

      message.anonymous = data.history.anonymous;

      callback({ data: { message } });
    },
  });
}

/**
 * Sends multiple message to the user's socket
 * @param {{text: string[]}[]} params.messages - Messages to send
 * @param {Object} params.socket Socket.io socket
 */
function sendSelfMsg({ messages, socket }) {
  if (!objectValidator.isValidData({ messages, socket }, { socket: true, messages: true })) {
    return;
  }

  socket.emit('messages', { messages });
}

/**
 * Checks if the user is following a room
 * @param {Object} params.user User to check
 * @param {string} params.roomName Name of the room
 * @returns {boolean} Is the socket following the room?
 */
function isUserFollowingRoom({ user, roomName }) {
  return user.rooms.indexOf(roomName) > -1;
}

/**
 * Sends a message to a room. The message will not be stored in history
 * Emits message
 * @param {Object} params.message Message to send
 * @param {string[]} params.message.roomName Room to send the message to
 * @param {Object} params.io Socket.io
 * @param {Object} [params.socket] Socket.io socket
 */
function sendMsg({ socket, message, io }) {
  if (!objectValidator.isValidData({ message }, { message: { roomName: true } })) {
    return;
  }

  message.time = new Date();
  message.userName = databasePopulation.users.admin.userName.toUpperCase();

  if (socket) {
    socket.broadcast.to(message.roomName).emit('message', { message });
  } else {
    io.to(message.roomName).emit('message', { message });
  }
}

/**
 * Store message in history and send to connected clients
 * @param {Object} params.user User sending the message
 * @param {Function} params.callback Callback
 * @param {Object} params.message Message to send
 * @param {Object} params.io Socket.io. Used by API, when no socket is available
 * @param {Object} params.socket Socket.io socket
 */
function sendAndStoreChatMsg({ user, callback, message, io, socket }) {
  dbUser.getUser({
    userName: user.userName,
    callback: (userData) => {
      if (userData.error) {
        callback({ error: userData.error });

        return;
      } else if (!isUserFollowingRoom({ user: userData.data.user, roomName: message.roomName })) {
        callback({ error: new errorCreator.NotAllowed({ used: `send message to ${message.roomName}` }) });

        return;
      }

      message.time = new Date();

      addMsgToHistory({
        message,
        roomName: message.roomName,
        callback: ({ error }) => {
          if (error) {
            callback({ error });

            return;
          }

          const data = {
            messages: [message],
            room: { roomName: message.roomName },
          };

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
        },
      });
    },
  });
}

/**
 * Sends a message to a room and stores it in history
 * Emits message
 * @param {Object} params.message Message to be sent
 * @param {Object} params.user User sending the message
 * @param {Object} params.io Socket.io. Used by API, when no socket is available
 * @param {Object} params.socket Socket.io socket
 * @param {Function} params.callback Client callback
 */
function sendChatMsg({ message, user, callback, io, socket }) {
  if (!objectValidator.isValidData({ message, user, callback, io }, { user: { userName: true }, message: { text: true, roomName: true }, io: true })) {
    callback({ error: new errorCreator.InvalidData({ expected: '{ user: { userName }, message: { text, roomName }, io }' }) });

    return;
  }

  if (message.roomName === 'team') {
    message.roomName = user.team + appConfig.teamAppend;
  }

  if (!message.userName || message.userName === user.userName) {
    message.shortTeam = user.shortTeam;
    message.team = user.team;
  }

  if (message.userName) {
    dbUser.getUserByAlias({
      alias: message.userName,
      callback: (aliasData) => {
        if (aliasData.error) {
          callback({ error: aliasData.error });

          return;
        } else if (aliasData.data.user.userName !== user.userName) {
          callback({ error: new errorCreator.NotAllowed({ name: 'alias does not match with user name' }) });

          return;
        }

        sendAndStoreChatMsg({ io, message, user, callback, socket });
      },
    });
  } else {
    message.userName = user.userName;

    sendAndStoreChatMsg({ io, message, user, callback, socket });
  }
}

/**
 * Sends a message to a whisper room (*user name*-whisper), which is followed by a single user, and stores it in history
 * Emits message
 * @param {Object} params.message Message to be sent
 * @param {Object} params.user User who sent the message
 * @param {Object} params.io Socket.io. Used by API, when no socket is available
 * @param {Object} [params.socket] Socket.io socket
 * @param {Function} params.callback Client callback
 */
function sendWhisperMsg({ io, user, message, socket, callback }) {
  if (!objectValidator.isValidData({ message, io }, { message: { text: true, roomName: true, userName: true }, io: true })) {
    callback({ error: new errorCreator.InvalidData({ expected: '{ message: { text, roomName, userName }, io }' }) });

    return;
  }

  dbUser.getUserByAlias({
    alias: message.userName,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      } else if (data.user.userName !== user.userName) {
        callback({ error: new errorCreator.NotAllowed({ name: 'user names do not match' }) });

        return;
      }

      message.roomName += appConfig.whisperAppend;
      message.extraClass = 'whisperMsg';
      message.time = new Date();

      // TODO Message should be removed if db fails to store it at senders
      addMsgToHistory({
        message,
        roomName: message.roomName,
        callback: ({ error: historyError }) => {
          if (historyError) {
            callback({ error: historyError });

            return;
          }

          const senderRoomName = message.userName + appConfig.whisperAppend;

          addMsgToHistory({
            message,
            roomName: senderRoomName,
            callback: ({ error: sendError }) => {
              if (sendError) {
                callback({ error: sendError });

                return;
              }

              const sendData = {
                messages: [message],
                room: { roomName: message.roomName },
                whisper: true,
              };

              if (socket) {
                socket.broadcast.to(message.roomName).emit('chatMsgs', sendData);
              } else {
                io.to(message.roomName).emit('chatMsgs', sendData);
              }


              callback({ data: sendData });
            },
          });
        },
      });
    },
  });
}

/**
 * Sends a message with broadcastMsg class to all connected sockets
 * It is stored in a separate broadcast history
 * Emits message
 * @param {Object} params.message Message to be sent
 * @param {Object} [params.socket] Socket.io socket
 * @param {Object} params.io Socket.io. Used by API, when no socket is available
 * @param {string} params.token jwt token
 * @param {Function} params.callback Client callback
 */
function sendBroadcastMsg({ message, socket, callback, io, token }) {
  manager.userIsAllowed({
    token,
    commandName: databasePopulation.commands.broadcast.commandName,
    callback: ({ error }) => {
      if (error) {
        callback({ error });

        return;
      } else if (!objectValidator.isValidData({ message, socket, callback }, { message: { text: true }, io: true })) {
        callback({ error: new errorCreator.InvalidData({ expected: '{ message: { text }, io }' }) });

        return;
      }

      const data = { message };
      data.message.extraClass = 'broadcastMsg';
      data.message.roomName = databasePopulation.rooms.bcast.roomName;
      data.message.time = new Date();

      if (!data.message.userName) {
        data.message.userName = 'SYSTEM';
      }

      addMsgToHistory({
        roomName: data.message.roomName,
        message: data.message,
        callback: (historyData) => {
          if (historyData.error) {
            callback({ error: historyData.error });

            return;
          }

          if (socket) {
            socket.broadcast.to(data.message.roomName).emit('bcastMsg', data);
          } else {
            io.to(data.message.roomName).emit('bcastMsg', data);
          }

          callback({ data });
        },
      });
    },
  });
}

exports.sendChatMsg = sendChatMsg;
exports.sendWhisperMsg = sendWhisperMsg;
exports.sendBroadcastMsg = sendBroadcastMsg;
exports.sendMsg = sendMsg;
exports.sendSelfMsg = sendSelfMsg;
