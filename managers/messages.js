/*
 Copyright 2017 Carmilla Mina Jankovic

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

const appConfig = require('../config/defaults/appConfig');
const dbConfig = require('../config/defaults/dbConfig');
const authenticator = require('../helpers/authenticator');
const dbMessage = require('../db/connectors/message');
const errorCreator = require('../error/errorCreator');
const objectValidator = require('../utils/objectValidator');
const roomManager = require('./rooms');
const textTools = require('../utils/textTools');
const managerHelper = require('../helpers/manager');
const userManager = require('./users');
const aliasManager = require('./aliases');
const imager = require('../helpers/imager');

/**
 * Get an emit type based on the message type
 * @param {Object} message The message to generate an emit type from.
 * @return {string} Emit type
 */
function generateEmitType(message) {
  switch (message.messageType) {
    case dbConfig.MessageTypes.WHISPER: { return dbConfig.EmitTypes.WHISPER; }
    case dbConfig.MessageTypes.BROADCAST: { return dbConfig.EmitTypes.BROADCAST; }
    default: { return dbConfig.EmitTypes.CHATMSG; }
  }
}

/**
 * Store and send a message.
 * @param {Object} params Parameters.
 * @param {Object} params.message Message to store and send.
 * @param {Function} params.callback Callback.
 * @param {Object} params.io Socket.io.
 * @param {string} params.emitType Type of emit event.
 * @param {Object} [params.image] Image attached to the message.
 */
function sendAndStoreMessage({
  message,
  callback,
  io,
  emitType,
  image,
  socket,
}) {
  const messageCallback = (chatMsg) => {
    dbMessage.createMessage({
      message: chatMsg,
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
  };

  if (image) {
    imager.createImage({
      image,
      callback: ({ error: imageError, data: imageData }) => {
        if (imageError) {
          callback({ error: imageError });

          return;
        }

        const { image: createdImage } = imageData;
        const chatMsg = message;
        chatMsg.image = createdImage;

        messageCallback(chatMsg);
      },
    });

    return;
  }

  messageCallback(message);
}

/**
 * Get a message by Id.
 * @param {Object} params Parameters.
 * @param {string} params.token jwt.
 * @param {Function} params.callback Callback.
 * @param {string} params.messageId Id of the message to retrieve.
 */
function getMessageById({
  token,
  callback,
  messageId,
  internalCallUser,
}) {
  managerHelper.getObjectById({
    token,
    internalCallUser,
    callback,
    objectId: messageId,
    objectType: 'message',
    objectIdType: 'messageId',
    dbCallFunc: dbMessage.getMessageById,
    commandName: dbConfig.apiCommands.GetMessage.name,
  });
}

/**
 * Get messages by room
 * @param {Object} params Parameters.
 * @param {string} params.token jwt.
 * @param {Function} params.callback Callback.
 * @param {string} params.roomId Id of the room to retrieve messages from.
 * @param {Date} [params.startDate] Date for when to start the span of messages.
 * @param {boolean} [params.shouldGetFuture] Should messages from the future of the start date be retrieved?
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

      const { user: authUser } = data;

      if (!authUser.accessLevel < dbConfig.AccessLevels.ADMIN && !authUser.followingRooms.includes(roomId)) {
        callback({ error: new errorCreator.NotAllowed({ name: `${dbConfig.apiCommands.GetHistory.name}. User: ${authUser.objectId}. Access: messages room ${roomId}` }) });

        return;
      }

      roomManager.getRoomById({
        roomId,
        internalCallUser: authUser,
        needsAccess: true,
        callback: ({ error: roomError }) => {
          if (roomError) {
            callback({ error: roomError });

            return;
          }

          dbMessage.getMessagesByRoom({
            startDate,
            shouldGetFuture,
            roomId,
            callback,
            user: authUser,
          });
        },
      });
    },
  });
}

/**
 * Get messages from all the rooms that the user is following.
 * @param {Object} params Parameters.
 * @param {string} params.token jwt
 * @param {Function} params.callback Callback.
 */
function getMessagesByUser({
  token,
  callback,
}) {
  managerHelper.getObjects({
    token,
    callback,
    shouldSort: true,
    sortName: 'customTimeCreated',
    fallbackSortName: 'timeCreated',
    commandName: dbConfig.apiCommands.GetMessage.name,
    objectsType: 'messages',
    dbCallFunc: dbMessage.getMessagesByUser,
  });
}

/**
 * Get all messages from all rooms. Ids of the users and aliases are translated to names.
 * It returns rooms that includes messages.
 * @param {Object} params Parameters.
 * @param {string} params.token jwt.
 * @param {Function} params.callback Callback.
 */
function getFullHistory({ token, callback }) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.GetAllMessages.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const { user: authUser } = data;

      dbMessage.getAllMessages({
        callback: ({ error: messagesError, data: messagesData }) => {
          if (messagesError) {
            callback({ error: messagesError });

            return;
          }

          roomManager.getAllRooms({
            internalCallUser: authUser,
            callback: ({ error: roomsError, data: roomsData }) => {
              if (roomsError) {
                callback({ error: roomsError });

                return;
              }

              userManager.getAllUsers({
                internalCallUser: authUser,
                callback: ({ error: usersError, data: usersData }) => {
                  if (usersError) {
                    callback({ error: usersError });

                    return;
                  }

                  aliasManager.getAllAliases({
                    internalCallUser: authUser,
                    callback: ({ error: aliasesError, data: aliasesData }) => {
                      if (aliasesError) {
                        callback({ error: aliasesError });

                        return;
                      }

                      const { aliases } = aliasesData;
                      const { users } = usersData;
                      const { rooms } = roomsData;
                      const roomsCollection = rooms.map((room) => {
                        const roomToSave = room;

                        if (room.isWhisper) {
                          const firstParticipant = users[room.participantIds[0]] || aliases[room.participantIds[0]];
                          const secondParticipant = users[room.participantIds[1]] || aliases[room.participantIds[1]];

                          roomToSave.roomName = `Whisper: ${firstParticipant.username || firstParticipant.aliasName} <-> ${secondParticipant.username || secondParticipant.aliasName}`;
                        }

                        return roomToSave;
                      });

                      messagesData.messages.sort((a, b) => {
                        const aTime = a.customTimeCreated || a.timeCreated;
                        const bTime = b.customTimeCreated || b.timeCreated;

                        if (aTime < bTime) {
                          return -1;
                        }

                        if (aTime > bTime) {
                          return 1;
                        }

                        return 0;
                      }).forEach((message) => {
                        const messageToSave = {
                          username: message.ownerAliasId
                            ? aliases[message.ownerAliasId].aliasName
                            : users[message.ownerId].username,
                          roomName: roomsCollection[message.roomId].roomName,
                          time: message.customTimeCreated || message.timeCreated,
                        };

                        roomsCollection[messageToSave.roomId].messages.push(messageToSave);
                      });

                      callback({
                        data: {
                          rooms: roomsCollection,
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
 * Send broadcast message.
 * @param {Object} params Parameters.
 * @param {Object} params.message Message to be sent.
 * @param {Object} params.io Socket.io. Used by API, when no socket is available.
 * @param {Function} params.callback Client callback.
 * @param {Object} [params.socket] Socket.io socket.
 * @param {Object} [params.image] Image attached to the message.
 */
function sendBroadcastMsg({
  token,
  message,
  socket,
  callback,
  io,
  image,
  internalCallUser,
}) {
  authenticator.isUserAllowed({
    token,
    internalCallUser,
    commandName: dbConfig.apiCommands.SendBroadcast.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      if (!objectValidator.isValidData({ message, io }, { message: { text: true }, io: true })) {
        callback({ error: new errorCreator.InvalidData({ expected: '{ message: { text }, io }' }) });

        return;
      }

      const text = message.text.join('');

      if (!image && (text.length > appConfig.broadcastMaxLength || text.length <= 0)) {
        callback({ error: new errorCreator.InvalidLength({ expected: `text length ${appConfig.broadcastMaxLength}` }) });

        return;
      }

      const { user: authUser } = data;
      const newMessage = message;
      newMessage.text = textTools.cleanText(message.text);
      newMessage.messageType = dbConfig.MessageTypes.BROADCAST;
      newMessage.roomId = dbConfig.rooms.bcast.objectId;

      if (message.ownerAliasId && !authUser.aliases.includes(message.ownerAliasId)) {
        callback({ error: new errorCreator.NotAllowed({ name: `${dbConfig.apiCommands.SendBroadcast.name}. User: ${authUser.objectId}. Access alias ${message.ownerAliasId}` }) });

        return;
      }

      sendAndStoreMessage({
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
 * @param {Object} params Parameters.
 * @param {Object} params.message Message to be sent.
 * @param {Object} params.io Socket.io. Used by API, when no socket is available.
 * @param {Function} params.callback Client callback.
 * @param {Object} [params.socket] Socket.io socket.
 * @param {Object} [params.image] Image attached to the message.
 */
function sendChatMsg({
  token,
  message,
  socket,
  callback,
  io,
  image,
  internalCallUser,
}) {
  authenticator.isUserAllowed({
    token,
    internalCallUser,
    commandName: dbConfig.apiCommands.SendMessage.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      if (!objectValidator.isValidData({ message, io }, { message: { text: true, roomId: true }, io: true })) {
        callback({ error: new errorCreator.InvalidData({ expected: '{ message: { text }, io }' }) });

        return;
      }

      const text = message.text.join('');

      if (!image && (text.length > appConfig.messageMaxLength || text.length <= 0)) {
        callback({ error: new errorCreator.InvalidCharacters({ expected: `text length ${appConfig.messageMaxLength}` }) });

        return;
      }

      const { user: authUser } = data;
      const newMessage = message;
      newMessage.text = textTools.cleanText(message.text);
      newMessage.messageType = dbConfig.MessageTypes.CHAT;
      newMessage.ownerId = authUser.objectId;

      if (message.ownerAliasId && !authUser.aliases.includes(message.ownerAliasId)) {
        callback({ error: new errorCreator.NotAllowed({ name: `${dbConfig.apiCommands.SendMessage.name}. User: ${authUser.objectId}. Access alias ${message.ownerAliasId}` }) });

        return;
      }

      roomManager.getRoomById({
        needsAccess: true,
        internalCallUser: authUser,
        roomId: newMessage.roomId,
        callback: ({ error: roomError }) => {
          if (roomError) {
            callback({ error: roomError });

            return;
          }

          sendAndStoreMessage({
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
 * @param {Object} params Parameters.
 * @param {Object} params.message Message to be sent.
 * @param {Object} params.io Socket.io. Used by API, when no socket is available.
 * @param {Function} params.callback Client callback.
 * @param {string} params.participantIds Id of the users.
 * @param {Object} [params.socket] Socket.io socket.
 * @param {Object} [params.image] Image attached to the message.
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
      }

      if (!objectValidator.isValidData({ message, io }, { message: { text: true, roomId: true }, io: true })) {
        callback({ error: new errorCreator.InvalidData({ expected: '{ message: { text }, io }' }) });

        return;
      }

      const text = message.text.join('');

      if (!image && (text.length > appConfig.messageMaxLength || text.length <= 0)) {
        callback({ error: new errorCreator.InvalidCharacters({ expected: `text length ${appConfig.messageMaxLength}` }) });

        return;
      }

      const { user: authUser } = data;
      const newMessage = message;
      newMessage.text = textTools.cleanText(message.text);
      newMessage.messageType = dbConfig.MessageTypes.WHISPER;
      newMessage.ownerId = authUser.objectId;
      newMessage.ownerAliasId = participantIds.find(participant => authUser.aliases.includes(participant));

      if (message.ownerAliasId && !authUser.aliases.includes(message.ownerAliasId)) {
        callback({ error: new errorCreator.NotAllowed({ name: `${dbConfig.apiCommands.SendWhisper.name}. User: ${authUser.objectId}. Access alias ${message.ownerAliasId}` }) });

        return;
      }

      roomManager.doesWhisperRoomExist({
        participantIds,
        callback: ({ error: existsError, data: existsData }) => {
          if (existsError) {
            callback({ error: existsError });

            return;
          }

          const { exists } = existsData;

          if (!exists) {
            roomManager.createAndFollowWhisperRoom({
              participantIds,
              socket,
              io,
              token,
              user: authUser,
              callback: (newWhisperData) => {
                if (newWhisperData.error) {
                  callback({ error: newWhisperData.error });

                  return;
                }

                const { room: newRoom } = newWhisperData.data;
                newMessage.roomId = newRoom.objectId;

                roomManager.getRoomById({
                  roomId: newMessage.roomId,
                  internalCallUser: authUser,
                  callback: (roomData) => {
                    if (roomData.error) {
                      callback({ error: roomData.error });

                      return;
                    }

                    sendAndStoreMessage({
                      socket,
                      io,
                      callback,
                      image,
                      emitType: dbConfig.EmitTypes.WHISPER,
                      message: newMessage,
                    });
                  },
                });
              },
            });

            return;
          }

          roomManager.getRoomById({
            needsAccess: true,
            roomId: newMessage.roomId,
            internalCallUser: authUser,
            callback: (roomData) => {
              if (roomData.error) {
                callback({ error: roomData.error });

                return;
              }

              sendAndStoreMessage({
                socket,
                io,
                callback,
                image,
                emitType: dbConfig.EmitTypes.WHISPER,
                message: newMessage,
              });
            },
          });
        },
      });
    },
  });
}

/**
 * Remove a message.
 * @param {Object} params Parameters.
 * @param {string} params.messageId Id of the message.
 * @param {Function} params.callback Callback.
 * @param {string} params.token jwt.
 * @param {Object} params.io Socket.io.
 */
function removeMessage({
  messageId,
  callback,
  token,
  io,
  socket,
  internalCallUser,
}) {
  managerHelper.removeObject({
    callback,
    token,
    io,
    socket,
    internalCallUser,
    getDbCallFunc: dbMessage.getMessageById,
    getCommandName: dbConfig.apiCommands.GetMessage.name,
    objectId: messageId,
    commandName: dbConfig.apiCommands.RemoveMessage.name,
    objectType: 'message',
    dbCallFunc: dbMessage.removeMessage,
    emitTypeGenerator: generateEmitType,
    objectIdType: 'messageId',
  });
}

/**
 * Update a message.
 * @param {Object} params Parameters.
 * @param {Object} params.message Message to update with.
 * @param {string} params.messageId Id of the message.
 * @param {Function} params.callback Callback.
 * @param {string} params.token jwt.
 * @param {Object} params.io Socket.io.
 * @param {Object} params.options Update options.
 */
function updateMessage({
  messageId,
  message,
  callback,
  token,
  io,
  options,
  internalCallUser,
}) {
  authenticator.isUserAllowed({
    token,
    internalCallUser,
    commandName: dbConfig.apiCommands.UpdateMessage.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const authUser = internalCallUser || data.user;

      getMessageById({
        messageId,
        internCallUser: authUser,
        callback: ({ error: getError, data: getData }) => {
          if (getError) {
            callback({ error: getError });

            return;
          }

          const { message: oldMessage } = getData;
          const {
            hasFullAccess,
          } = authenticator.hasAccessTo({
            objectToAccess: oldMessage,
            toAuth: authUser,
          });

          if (!hasFullAccess) {
            callback({ error: new errorCreator.NotAllowed({ name: `${dbConfig.apiCommands.UpdateMessage.name}. User: ${authUser.objectId}. Access message ${messageId}` }) });

            return;
          }

          dbMessage.updateMessage({
            messageId,
            message,
            options,
            callback: ({ error: updateError, data: updateData }) => {
              if (updateError) {
                callback({ error: updateError });

                return;
              }

              const { message: updatedMessage } = updateData;

              const emitType = generateEmitType(updatedMessage);
              const oldRoomId = oldMessage.roomId;
              const sendToId = updatedMessage.roomId;
              const dataToSend = {
                data: {
                  message: updatedMessage,
                  changeType: dbConfig.ChangeTypes.UPDATE,
                },
              };

              if (oldRoomId !== sendToId) {
                const oldDataToSend = {
                  data: {
                    message: { objectId: oldMessage.objectId },
                    changeType: dbConfig.ChangeTypes.REMOVE,
                  },
                };

                io.to(oldRoomId).emit(emitType, oldDataToSend);
              }

              io.to(sendToId).emit(emitType, dataToSend);

              callback(dataToSend);
            },
          });
        },
      });
    },
  });
}

exports.sendBroadcastMsg = sendBroadcastMsg;
exports.sendChatMsg = sendChatMsg;
exports.sendWhisperMsg = sendWhisperMsg;
exports.removeMesssage = removeMessage;
exports.updateMessage = updateMessage;
exports.getMessagesByRoom = getMessagesByRoom;
exports.getMessageById = getMessageById;
exports.getMessagesByUser = getMessagesByUser;
exports.getFullHistory = getFullHistory;
