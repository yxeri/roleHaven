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

const dbMessage = require('./../db/connectors/message');
const dbUser = require('./../db/connectors/user');
const dbConfig = require('./../config/defaults/config').databasePopulation;
const appConfig = require('./../config/defaults/config').app;
const objectValidator = require('./../utils/objectValidator');
const errorCreator = require('../objects/error/errorCreator');
const textTools = require('../utils/textTools');
const fs = require('fs');
const authenticator = require('./authenticator');

/**
 * Store and send message
 * @param {Object} params - Parameters
 * @param {Object} params.newMessage - New message to store and send
 * @param {string} params.eventType - Event type to trigger on socket
 * @param {string} params.to - Room to send to
 * @param {Object} [params.socket] - Socket.io
 * @param {Object} params.io - Socket.io. Will be used if socket is not set
 * @param {Function} params.callback - Callback
 */
function sendMessage({ newMessage, eventType, to, socket, io, callback }) {
  dbMessage.createMessage({
    message: newMessage,
    callback: (createData) => {
      if (createData.error) {
        callback({ error: createData.error });

        return;
      }

      const dataToSend = { message: createData.data.message };

      if (socket) {
        if (to) {
          socket.broadcast.to(to).emit(eventType, { data: dataToSend });
        } else {
          socket.broadcast.emit(eventType, { data: dataToSend });
        }
      } else {
        io.to(to).emit(eventType, { data: dataToSend });
      }

      callback({ data: dataToSend });
    },
  });
}

/**
 * Sends a message to a room. The message will not be stored in history
 * Emits message
 * @param {Object} params - Parameters
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
  messageToSend.username = dbConfig.systemUsername;

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
 * @param {Object} params - Parameters
 * @param {Object} params.user User sending the message
 * @param {Function} params.callback Callback
 * @param {Object} params.message Message to send
 * @param {Object} params.io Socket.io. Used by API, when no socket is available
 * @param {Object} params.socket Socket.io socket
 */
function sendAndStoreChatMsg({ user, callback, message, io, socket }) {
  dbUser.getUser({
    username: user.username,
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
            newMessage.username = dbConfig.anonymousUsername;
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
 * @param {Object} params - Parameters
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

  const fileName = `${new Buffer(user.username).toString('base64')}-${appConfig.mode}-${image.imageName.replace(/[^\w.]/g, '-')}`;

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
 * @param {Object} params - Parameters
 * @param {Object} params.message - Message to be sent
 * @param {Object} params.message.roomId - Message to be sent
 * @param {Object} params.message.userId - Message to be sent
 * @param {Object} params.io - Socket.io. Used by API, when no socket is available
 * @param {Object} params.socket - Socket.io socket
 * @param {Object} [params.image] - Image to attach to the message
 * @param {Function} [params.callback] - Client callback
 */
function sendChatMsg({ token, image, message, io, socket, callback = () => {} }) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.SendMessage.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      } else if (!objectValidator.isValidData({ message, io }, { message: { text: true, roomId: true }, io: true })) {
        callback({ error: new errorCreator.InvalidData({ expected: '{ user: { userId }, message: { text, roomId }, io }' }) });

        return;
      } else if (message.text.join('').length > appConfig.messageMaxLength) {
        callback({ error: new errorCreator.InvalidCharacters({ expected: `text length ${appConfig.messageMaxLength}` }) });

        return;
      }

      const user = data.user;

      /**
       * Send message
       * @param {Object} params.newMessage - Message to send
       */
      function sendMessage({ newMessage }) {
        if (newMessage.aliasId) {
          redisAlias.hasAccessToAlias({
            userId: user.userId,
            teamId: user.teamId,
            aliasId: newMessage.aliasId,
            callback: (aliasData) => {
              if (aliasData.error) {
                callback({ error: aliasData.error });

                return;
              } else if (!aliasData.data.hasAccess) {
                callback({ error: new errorCreator.NotAllowed({ name: `alias ${newMessage.aliasId}` }) });

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

        sendAndStoreChatMsg({
          io,
          user,
          callback,
          socket,
          message: newMessage,
        });
      }

      const newMessage = message;
      newMessage.text = textTools.cleanText(newMessage.text);

      // TODO Check if it still works
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

        return;
      }

      sendMessage({ newMessage });
    },
  });
}

/**
 * Sends a message to a whisper room (*user name*-whisper), which is followed by a single user, and stores it in history
 * Emits message
 * @param {Object} params - Parameters
 * @param {Object} params.message Message to be sent
 * @param {Object} params.io Socket.io. Used by API, when no socket is available
 * @param {Object} [params.socket] Socket.io socket
 * @param {Function} [params.callback] Client callback
 */
function sendWhisperMsg({ io, token, message, socket, callback = () => {} }) {
  authenticator.isUserAllowed({
    token,
    matchToId: message.username,
    commandName: dbConfig.apiCommands.SendWhisper.name,
    callback: ({ error }) => {
      if (error) {
        callback({ error });

        return;
      } else if (!objectValidator.isValidData({ message, io }, { message: { text: true, roomName: true, username: true }, io: true })) {
        callback({ error: new errorCreator.InvalidData({ expected: '{ message: { text, roomName, username }, io }' }) });

        return;
      }

      const to = message.roomName;

      const newMessage = message;
      newMessage.username = newMessage.username.toLowerCase();
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
                username: aliasData.user.username,
                roomName: `${to}-whisper-${message.username}`,
                callback: (whisperData) => {
                  if (whisperData.error) {
                    callback({ error: whisperData.error });

                    return;
                  }

                  addMsgToHistory({
                    message: newMessage,
                    roomName: newMessage.username + appConfig.whisperAppend,
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

exports.sendMessage = sendMessage;

exports.sendChatMsg = sendChatMsg;
exports.sendMsg = sendMsg;
exports.filterHiddenRooms = filterHiddenRooms;
