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

const dbConfig = require('../config/defaults/config').databasePopulation;
const authenticator = require('../helpers/authenticator');
const dbMessage = require('../db/connectors/message');
const errorCreator = require('../objects/error/errorCreator');
const appConfig = require('../config/defaults/config').app;
const objectValidator = require('../utils/objectValidator');
const aliasManager = require('./aliases');
const roomManager = require('./rooms');

/**
 * Get an emit type based on the message type
 * @param {string} messageType - Type of message
 * @return {string} - Emit type
 */
function generateEmitType(messageType) {
  switch (messageType) {
    case dbConfig.MessageTypes.WHISPER: { return dbConfig.EmitTypes.WHISPER; }
    case dbConfig.MessageTypes.BROADCAST: { return dbConfig.EmitTypes.BROADCAST; }
    default: { return dbConfig.EmitTypes.CHATMSG; }
  }
}

/**
 * Get message by ID and check if the user has access to it.
 * @param {Object} params - Parameters.
 * @param {Object} params.user - User retrieving the message.
 * @param {string} params.messageId - ID of the message to retrieve.
 * @param {Function} params.callback - Callback.
 * @param {string} [params.errorContentText] - Text to be printed on error.
 * @param {boolean} [params.shouldBeAdmin] - Does the user have to be an admin?
 */
function getAccessibleMessage({
  user,
  messageId,
  callback,
  shouldBeAdmin,
  errorContentText = `messageId ${messageId}`,
}) {
  dbMessage.getMessageById({
    messageId,
    callback: (messageData) => {
      if (messageData.error) {
        callback({ error: messageData.error });

        return;
      } else if (!authenticator.hasAccessTo({
        shouldBeAdmin,
        toAuth: user,
        objectToAccess: messageData.data.message,
      })) {
        callback({ error: new errorCreator.NotAllowed({ name: errorContentText }) });

        return;
      }

      callback(messageData);
    },
  });
}

/**
 * Store and send a message.
 * @param {Object} params - Parameters.
 * @param {Object} params.message - Message to store and send.
 * @param {Function} params.callback - Callback.
 * @param {Object} params.io - Socket.io. Will be used if socket is not set.
 * @param {string} params.emitType - Type of emit event.
 * @param {Object} [params.socket] - Socket.io.
 * @param {Object} [params.image] - Image attached to the message.
 */
function sendMessage({
  message,
  callback,
  socket,
  io,
  emitType,
  image,
}) {
  if (image) {
    // Contact file storage and create the file or retrieve and existing one.
  }

  dbMessage.createMessage({
    message,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const dataToSend = {
        data: {
          message: data.message,
          changeType: dbConfig.ChangeTypes.CREATE,
        },
      };

      if (socket) {
        socket.broadcast.to(message.roomId).emit(emitType, dataToSend);
      } else {
        io.to(message.roomId).emit(emitType, dataToSend);
      }

      callback(dataToSend);
    },
  });
}

/**
 * Get messages by room.
 * @param {Object} params - Parameters.
 * @param {string} params.token - jwt.
 * @param {Function} params.callback - Callback.
 * @param {string} params.roomId - Id of the room to retrieve messages from.
 * @param {Date} [params.startDate] - Date for when to start the span of messages.
 * @param {boolean} [params.shouldGetFuture] - Should messages from the future of the start date be retrieved?
 */
function getMessagesByRoom({
  token,
  callback,
  shouldGetFuture,
  startDate,
  roomId,
}) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.GetHistory.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const { user } = data;

      roomManager.getAccessibleRoom({
        roomId,
        user,
        callback: (roomData) => {
          if (roomData.error) {
            callback({ error: roomData.error });

            return;
          }

          dbMessage.getMessagesByRoom({
            startDate,
            shouldGetFuture,
            roomId,
            callback: (messageData) => {
              if (messageData.error) {
                callback({ error: messageData.error });

                return;
              }

              callback({ data: { messages: messageData.data.messages } });
            },
          });
        },
      });
    },
  });
}

/**
 * Sends a message that won't be stored in the history.
 * @param {Object} params - Parameters.
 * @param {Object} params.message - Message to send.
 * @param {Object} params.io Socket.io.
 * @param {Function} params.callback - Callback.
 * @param {Object} [params.socket] - Socket.io socket.
 */
function sendOneTimeMessage({
  socket,
  message,
  io,
  callback,
}) {
  const messageToSend = message;
  messageToSend.userId = dbConfig.users.systemUser;

  if (socket) {
    socket.broadcast.to(messageToSend.roomId).emit('message', {
      data: { message: messageToSend },
    });
  } else {
    io.to(messageToSend.roomId).emit('message', {
      data: { message: messageToSend },
    });
  }

  callback({ data: { message: messageToSend } });
}

/**
 * Send broadcast message.
 * @param {Object} params - Parameters.
 * @param {Object} params.message - Message to be sent.
 * @param {Object} params.io - Socket.io. Used by API, when no socket is available.
 * @param {Function} params.callback - Client callback.
 * @param {Object} [params.socket] - Socket.io socket.
 * @param {Object} [params.image] - Image attached to the message.
 */
function sendBroadcastMsg({
  token,
  message,
  socket,
  callback,
  io,
  image,
}) {
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
      newMessage.messageType = dbConfig.MessageTypes.BROADCAST;
      newMessage.roomId = dbConfig.rooms.bcast.roomName;

      if (newMessage.ownerAliasId) {
        aliasManager.getAccessibleAlias({
          aliasId: newMessage.ownerAliasId,
          callback: (aliasData) => {
            if (aliasData.error) {
              callback({ error: aliasData.error });

              return;
            }

            sendMessage({
              socket,
              io,
              callback,
              image,
              emitType: dbConfig.EmitTypes.BROADCAST,
              message: newMessage,
            });
          },
        });

        return;
      }

      sendMessage({
        socket,
        io,
        callback,
        image,
        emitType: dbConfig.EmitTypes.BROADCAST,
        message: newMessage,
      });
    },
  });
}

/**
 * Send a chat message.
 * @param {Object} params - Parameters.
 * @param {Object} params.message - Message to be sent.
 * @param {Object} params.io - Socket.io. Used by API, when no socket is available.
 * @param {Function} params.callback - Client callback.
 * @param {Object} [params.socket] - Socket.io socket.
 * @param {Object} [params.image] - Image attached to the message.
 */
function sendChatMsg({
  token,
  message,
  socket,
  callback,
  io,
  image,
}) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.SendMessage.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      } else if (!objectValidator.isValidData({ message, io }, { message: { text: true, roomId: true }, io: true })) {
        callback({ error: new errorCreator.InvalidData({ expected: '{ message: { text }, io }' }) });

        return;
      } else if (message.text.join('').length > appConfig.messageMaxLength) {
        callback({ error: new errorCreator.InvalidCharacters({ expected: `text length ${appConfig.messageMaxLength}` }) });

        return;
      }

      const { user } = data;
      const newMessage = message;
      newMessage.messageType = dbConfig.MessageTypes.CHAT;
      newMessage.ownerId = user.userId;

      roomManager.getAccessibleRoom({
        user,
        roomId: newMessage.roomId,
        callback: ({ error: roomError }) => {
          if (roomError) {
            callback({ error: roomError });

            return;
          }

          if (newMessage.ownerAliasId) {
            aliasManager.getAccessibleAlias({
              aliasId: newMessage.ownerAliasId,
              callback: (aliasData) => {
                if (aliasData.error) {
                  callback({ error: aliasData.error });

                  return;
                }

                sendMessage({
                  socket,
                  io,
                  callback,
                  image,
                  emitType: dbConfig.EmitTypes.CHATMSG,
                  message: newMessage,
                });
              },
            });

            return;
          }

          sendMessage({
            socket,
            io,
            callback,
            image,
            emitType: dbConfig.EmitTypes.CHATMSG,
            message: newMessage,
          });
        },
      });
    },
  });
}

/**
 * Send whisper message.
 * @param {Object} params - Parameters.
 * @param {Object} params.message - Message to be sent.
 * @param {Object} params.io - Socket.io. Used by API, when no socket is available.
 * @param {Function} params.callback - Client callback.
 * @param {string} params.participantIds - Id of the users.
 * @param {Object} [params.socket] - Socket.io socket.
 * @param {Object} [params.image] - Image attached to the message.
 */
function sendWhisperMsg({
  token,
  participantIds,
  message,
  socket,
  callback,
  io,
  image,
}) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.SendWhisper.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      } else if (!objectValidator.isValidData({ message, io }, { message: { text: true, roomId: true }, io: true })) {
        callback({ error: new errorCreator.InvalidData({ expected: '{ message: { text }, io }' }) });

        return;
      } else if (message.text.join('').length > appConfig.messageMaxLength) {
        callback({ error: new errorCreator.InvalidCharacters({ expected: `text length ${appConfig.messageMaxLength}` }) });

        return;
      }

      const authUser = data.user;
      const newMessage = message;
      newMessage.messageType = dbConfig.MessageTypes.WHISPER;

      const send = () => {
        roomManager.getWhisperRoom({
          participantIds,
          callback: (whisperData) => {
            if (whisperData.error) {
              callback({ error: whisperData.error });

              return;
            }

            const foundRoom = whisperData.data.room;

            if (!foundRoom) {
              roomManager.createAndFollowWhisperRoom({
                participantIds,
                socket,
                io,
                user: authUser,
                callback: (newWhisperData) => {
                  if (newWhisperData.error) {
                    callback({ error: newWhisperData.error });

                    return;
                  }

                  const newRoom = newWhisperData.data.room;
                  newMessage.roomId = newRoom.roomId;

                  sendMessage({
                    socket,
                    io,
                    callback,
                    image,
                    emitType: dbConfig.EmitTypes.WHISPER,
                    message: newMessage,
                  });
                },
              });

              return;
            }

            newMessage.roomId = foundRoom.roomId;

            sendMessage({
              socket,
              io,
              callback,
              image,
              emitType: dbConfig.EmitTypes.WHISPER,
              message: newMessage,
            });
          },
        });
      };

      if (message.ownerAliasId) {
        aliasManager.getAccessibleAlias({
          aliasId: message.ownerAliasId,
          user: authUser,
          callback: (aliasData) => {
            if (aliasData.error) {
              callback({ error: aliasData.error });

              return;
            }

            send();
          },
        });

        return;
      }

      send();
    },
  });
}

/**
 * Remove a message.
 * @param {Object} params - Parameters.
 * @param {string} params.messageId - Id of the message.
 * @param {Function} params.callback - Callback.
 * @param {string} params.token - jwt.
 * @param {Object} params.socket - Socket.io.
 * @param {Object} params.io - Socket.io. Will be used if socket is not set.
 */
function removeMsg({
  messageId,
  callback,
  token,
  socket,
  io,
}) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.RemoveMessage.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      getAccessibleMessage({
        messageId,
        user: data.user,
        shouldBeAdmin: true,
        callback: (roomData) => {
          if (roomData.error) {
            callback({ error: roomData.error });

            return;
          }

          const { messageType, roomId } = roomData.data.message;

          dbMessage.removeMessage({
            messageId,
            callback: (removeData) => {
              if (removeData.error) {
                callback({ error: removeData.error });

                return;
              }

              const emitType = generateEmitType(messageType);
              const dataToSend = {
                data: {
                  message: {
                    messageId,
                    roomId,
                  },
                  changeType: dbConfig.ChangeTypes.REMOVE,
                },
              };

              if (socket) {
                socket.broadcast.to(roomId).emit(emitType, dataToSend);
              } else {
                io.to(roomId).emit(emitType, dataToSend);
              }

              callback(dataToSend);
            },
          });
        },
      });
    },
  });
}

/**
 * Update a message.
 * @param {Object} params - Parameters.
 * @param {Object} params.message - Message to update with.
 * @param {string} params.messageId - Id of the message.
 * @param {Function} params.callback - Callback.
 * @param {string} params.token - jwt.
 * @param {Object} params.socket - Socket.io.
 * @param {Object} params.io - Socket.io. Will be used if socket is not set.
 * @param {Object} params.options - Update options.
 */
function updateMsg({
  messageId,
  message,
  callback,
  token,
  socket,
  io,
  options,
}) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.RemoveMessage.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      getAccessibleMessage({
        messageId,
        user: data.user,
        shouldBeAdmin: true,
        callback: (roomData) => {
          if (roomData.error) {
            callback({ error: roomData.error });

            return;
          }

          dbMessage.updateMessage({
            messageId,
            message,
            options,
            callback: (updateData) => {
              if (updateData.error) {
                callback({ error: updateData.error });

                return;
              }

              const updatedMessage = updateData;
              const emitType = generateEmitType(updatedMessage.messageType);
              const sendTo = message.roomId !== roomData.data.room.roomId ? message.roomId : roomData.data.room.roomId;
              const dataToSend = {
                data: {
                  message: updatedMessage,
                  changeType: dbConfig.ChangeTypes.UPDATE,
                },
              };

              if (socket) {
                socket.broadcast.to(sendTo).emit(emitType, dataToSend);
              } else {
                io.to(sendTo).emit(emitType, dataToSend);
              }

              callback(updateData);
            },
          });
        },
      });
    },
  });
}

exports.sendBroadcastMsg = sendBroadcastMsg;
exports.sendOneTimeMessage = sendOneTimeMessage;
exports.sendChatMsg = sendChatMsg;
exports.sendWhisperMsg = sendWhisperMsg;
exports.removeMsg = removeMsg;
exports.updateMsg = updateMsg;
exports.getMessagesByRoom = getMessagesByRoom;
