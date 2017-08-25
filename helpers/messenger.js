/*
 Copyright 2017 Aleksandar Jankovic

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
const dbConfig = require('./../config/defaults/config').databasePopulation;
const appConfig = require('./../config/defaults/config').app;
const objectValidator = require('./../utils/objectValidator');
const errorCreator = require('../objects/error/errorCreator');
const textTools = require('../utils/textTools');
const fs = require('fs');
const authenticator = require('./authenticator');

/**
 * Check if the room name should be hidden and not returned to client
 * @param {string} params.roomName Name of the room
 * @param {string} socketId Socket.io id
 * @returns {boolean} Should room name be hidden?
 */
function filterHiddenRooms({ roomNames, socketId }) {
  const roomsToHide = dbConfig.roomsToBeHidden;
  roomsToHide.push(socketId);

  return roomNames.filter((roomName) => {
    return roomsToHide.indexOf(roomName) === -1 && roomName.indexOf(appConfig.whisperAppend) === -1 && roomName.indexOf(appConfig.deviceAppend) === -1;
  });
}

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

      const newMessage = message;
      newMessage.anonymous = data.history.anonymous;

      callback({ data: { message: newMessage } });
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

  socket.emit('messages', { data: { messages } });
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

  const messageToSend = message;
  messageToSend.time = new Date();
  messageToSend.userName = dbConfig.systemUserName;

  if (socket) {
    socket.broadcast.to(messageToSend.roomName).emit('message', {
      data: { message: messageToSend },
    });
  } else {
    io.to(messageToSend.roomName).emit('message', {
      data: { message: messageToSend },
    });
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

      const newMessage = message;
      newMessage.time = new Date();

      addMsgToHistory({
        message: newMessage,
        roomName: newMessage.roomName,
        callback: ({ error }) => {
          if (error) {
            callback({ error });

            return;
          }

          const data = {
            message: newMessage,
            roomName: newMessage.roomName,
            timeZoneOffset: new Date().getTimezoneOffset(),
          };

          if (newMessage.anonymous) {
            newMessage.userName = dbConfig.anonymousUserName;
            newMessage.time.setHours(0);
            newMessage.time.setMinutes(0);
            newMessage.time.setSeconds(0);
          }

          if (socket) {
            socket.broadcast.to(newMessage.roomName).emit('chatMsg', { data });
          } else {
            io.to(message.roomName).emit('chatMsg', { data });
          }

          callback({ data });
        },
      });
    },
  });
}

/**
 * Create and return image object
 * @param {Object} params.image Image to create
 * @param {Object} params.user User attaching image
 * @param {Object} params.callback Callback
 */
function createImage({ image, user, callback }) {
  if (!appConfig.allowMessageImage) {
    callback({ error: errorCreator.NotAllowed({ name: 'send image' }) });

    return;
  } else if (!image || !image.imageName || !image.source.match(/^data:image\/((png)|(jpeg));base64,/)) {
    callback({ error: new errorCreator.InvalidData({ name: 'image data' }) });

    return;
  }

  const fileName = `${new Buffer(user.userName).toString('base64')}-${appConfig.mode}-${image.imageName.replace(/[^\w.]/g, '-')}`;

  fs.writeFile(`${appConfig.publicBase}/images/${fileName}`, image.source.replace(/data:image\/((png)|(jpeg));base64,/, ''), { encoding: 'base64' }, (err) => {
    if (err) {
      callback({ error: new errorCreator.Database({ errorObject: err, name: 'writeFile image' }) });

      return;
    }

    callback({
      data: {
        image: {
          fileName,
          imageName: image.imageName,
          width: image.width,
          height: image.height,
        },
      },
    });
  });
}

/**
 * Sends a message to a room and stores it in history
 * Emits message
 * @param {Object} params.message Message to be sent
 * @param {Object} params.io Socket.io. Used by API, when no socket is available
 * @param {Object} params.socket Socket.io socket
 * @param {Object} [params.image] Image to attach to the message
 * @param {Function} [params.callback] Client callback
 */
function sendChatMsg({ token, image, message, io, socket, callback = () => {} }) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.SendMessage.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      } else if (!objectValidator.isValidData({ message, io }, { message: { text: true, roomName: true }, io: true })) {
        callback({ error: new errorCreator.InvalidData({ expected: '{ user: { userName }, message: { text, roomName }, io }' }) });

        return;
      } else if (message.text.join('').length > appConfig.messageMaxLength) {
        callback({ error: new errorCreator.InvalidCharacters({ expected: `text length ${appConfig.messageMaxLength}` }) });

        return;
      }

      const user = data.user;

      const sendMessage = ({ newMessage }) => {
        if (newMessage.userName) {
          dbUser.getUserByAlias({
            alias: newMessage.userName,
            callback: (aliasData) => {
              if (aliasData.error) {
                callback({ error: aliasData.error });

                return;
              } else if (aliasData.data.user.userName !== user.userName) {
                callback({ error: new errorCreator.NotAllowed({ name: 'alias does not match with user name' }) });

                return;
              }

              sendAndStoreChatMsg({
                io,
                user,
                callback,
                socket,
                message: newMessage,
              });
            },
          });

          return;
        }

        const modifiedMessage = newMessage;
        modifiedMessage.userName = user.userName;

        sendAndStoreChatMsg({
          io,
          user,
          callback,
          socket,
          message: modifiedMessage,
        });
      };

      const newMessage = message;
      newMessage.text = textTools.cleanText(newMessage.text);

      if (newMessage.roomName === 'team') {
        newMessage.roomName = user.team + appConfig.teamAppend;
      }

      // TODO ?
      if (!newMessage.userName || newMessage.userName === user.userName) {
        newMessage.shortTeam = user.shortTeam;
        newMessage.team = user.team;
      }

      if (image) {
        createImage({
          image,
          user,
          callback: ({ error: imageError, data: imageData }) => {
            if (imageError) {
              callback({ error: imageError });

              return;
            }

            newMessage.image = imageData.image;

            sendMessage({ newMessage });
          },
        });
      } else {
        sendMessage({ newMessage });
      }
    },
  });
}

/**
 * Sends a message to a whisper room (*user name*-whisper), which is followed by a single user, and stores it in history
 * Emits message
 * @param {Object} params.message Message to be sent
 * @param {Object} params.io Socket.io. Used by API, when no socket is available
 * @param {Object} [params.socket] Socket.io socket
 * @param {Function} [params.callback] Client callback
 */
function sendWhisperMsg({ io, token, message, socket, callback = () => {} }) {
  authenticator.isUserAllowed({
    token,
    matchNameTo: message.userName,
    commandName: dbConfig.apiCommands.SendWhisper.name,
    callback: ({ error }) => {
      if (error) {
        callback({ error });

        return;
      } else if (!objectValidator.isValidData({ message, io }, { message: { text: true, roomName: true, userName: true }, io: true })) {
        callback({ error: new errorCreator.InvalidData({ expected: '{ message: { text, roomName, userName }, io }' }) });

        return;
      }

      const to = message.roomName;

      const newMessage = message;
      newMessage.userName = newMessage.userName.toLowerCase();
      newMessage.text = textTools.cleanText(newMessage.text);
      newMessage.roomName += appConfig.whisperAppend;
      newMessage.extraClass = 'whisperMsg';
      newMessage.time = new Date();

      dbUser.getUserByAlias({
        alias: to,
        callback: ({ error: aliasError, data: aliasData }) => {
          if (aliasError) {
            callback({ error: aliasError });
          }

          addMsgToHistory({
            message: newMessage,
            roomName: newMessage.roomName,
            callback: ({ error: historyError }) => {
              if (historyError) {
                callback({ error: historyError });

                return;
              }

              dbUser.addWhisperRoomToUser({
                userName: aliasData.user.userName,
                roomName: `${to}-whisper-${message.userName}`,
                callback: (whisperData) => {
                  if (whisperData.error) {
                    callback({ error: whisperData.error });

                    return;
                  }

                  addMsgToHistory({
                    message: newMessage,
                    roomName: newMessage.userName + appConfig.whisperAppend,
                    callback: ({ error: sendError }) => {
                      if (sendError) {
                        callback({ error: sendError });

                        return;
                      }

                      const sendData = {
                        message: newMessage,
                        roomName: newMessage.roomName,
                        isWhisper: true,
                      };

                      if (socket) {
                        socket.broadcast.to(newMessage.roomName).emit('chatMsg', { data: sendData });
                      } else {
                        io.to(newMessage.roomName).emit('chatMsg', { data: sendData });
                      }


                      callback({ data: sendData });
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
 * Sends a message with broadcastMsg class to all connected sockets
 * It is stored in a separate broadcast history
 * Emits message
 * @param {Object} params.message Message to be sent
 * @param {Object} [params.socket] Socket.io socket
 * @param {Object} params.io Socket.io. Used by API, when no socket is available
 * @param {Function} params.callback Client callback
 */
function sendBroadcastMsg({ token, message, socket, callback, io }) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.SendBroadcast.name,
    callback: ({ error }) => {
      if (error) {
        callback({ error });

        return;
      } else if (!objectValidator.isValidData({ message, io }, { message: { text: true }, io: true })) {
        callback({ error: new errorCreator.InvalidData({ expected: '{ message: { text }, io }' }) });

        return;
      } else if (message.text.join('').length > appConfig.broadcastMaxLength) {
        callback({ error: new errorCreator.InvalidCharacters({ expected: `text length ${appConfig.broadcastMaxLength}` }) });

        return;
      }

      const newMessage = message;
      newMessage.extraClass = 'broadcastMsg';
      newMessage.roomName = dbConfig.rooms.bcast.roomName;
      newMessage.time = new Date();
      newMessage.userName = 'SYSTEM';

      addMsgToHistory({
        roomName: newMessage.roomName,
        message: newMessage,
        callback: (historyData) => {
          if (historyData.error) {
            callback({ error: historyData.error });

            return;
          }

          const data = { message: newMessage };

          if (socket) {
            socket.broadcast.to(newMessage.roomName).emit('bcastMsg', { data });
          } else {
            io.to(newMessage.roomName).emit('bcastMsg', { data });
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
exports.filterHiddenRooms = filterHiddenRooms;
