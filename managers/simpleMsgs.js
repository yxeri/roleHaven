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

const { appConfig, dbConfig } = require('../config/defaults/config');
const errorCreator = require('../error/errorCreator');
const objectValidator = require('../utils/objectValidator');
const authenticator = require('../helpers/authenticator');
const dbSimpleMsg = require('../db/connectors/simpleMsg');

/**
 * Get simple message by Id and check if the user has access to it.
 * @param {Object} params - Parameters.
 * @param {Object} params.user - User retrieving the message.
 * @param {string} params.simpleMsgId - Id of the message to retrieve.
 * @param {Function} params.callback - Callback.
 * @param {string} [params.errorContentText] - Text to be printed on error.
 * @param {boolean} [params.shouldBeAdmin] - Does the user have to be an admin?
 */
function getAccessibleMessage({
  user,
  simpleMsgId,
  callback,
  shouldBeAdmin,
  full,
  errorContentText = `simpleMsgId ${simpleMsgId}`,
}) {
  dbSimpleMsg.getSimpleMsgById({
    simpleMsgId,
    callback: (messageData) => {
      if (messageData.error) {
        callback({ error: messageData.error });

        return;
      } else if (!authenticator.hasAccessTo({
        shouldBeAdmin,
        toAuth: user,
        objectToAccess: messageData.data.simpleMsg,
      })) {
        callback({ error: new errorCreator.NotAllowed({ name: errorContentText }) });

        return;
      }

      const foundMsg = messageData.data.simpleMsg;
      const filteredMsg = {
        text: foundMsg.text,
        lastUpdated: foundMsg.lastUpdated,
        ownerId: foundMsg.ownerId,
        ownerAliasId: foundMsg.ownerAliasId,
      };

      callback({
        data: {
          simpleMsg: full ? foundMsg : filteredMsg,
        },
      });
    },
  });
}

/**
 * Send simple message.
 * @param {Object} params - Parameters.
 * @param {string} params.text - Text to add to message.
 * @param {Object} params.io - Socket io. Used if socket is not set.
 * @param {string} params.token - jwt.
 * @param {Function} params.callback - Callback.
 */
function sendSimpleMsg({
  text,
  socket,
  io,
  token,
  callback,
}) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.SendSimpleMsg.name,
    callback: ({ data, error }) => {
      if (error) {
        callback({ error });

        return;
      } else if (!objectValidator.isValidData({ text }, { text: true })) {
        callback({ error: new errorCreator.InvalidData({ expected: '{ text }' }) });

        return;
      } else if (text.length > appConfig.messageMaxLength) {
        callback({ error: new errorCreator.InvalidCharacters({ expected: `text length ${appConfig.messageMaxLength}` }) });

        return;
      }

      const { user } = data;

      const simpleMsg = {
        text,
        ownerId: user.objectId,
      };

      dbSimpleMsg.createSimpleMsg({
        simpleMsg,
        callback: ({ error: createError, data: newData }) => {
          if (createError) {
            callback({ error: createError });

            return;
          }

          const dataToSend = {
            data: {
              simpleMsg: newData.simpleMsg,
              changeType: dbConfig.ChangeTypes.CREATE,
            },
          };

          if (socket) {
            socket.broadcast.emit('simpleMsg', dataToSend);
          } else {
            io.emit('simpleMsg', dataToSend);
          }

          callback(dataToSend);
        },
      });
    },
  });
}

/**
 * Get a simple msg.
 * @param {Object} params - Parameters.
 * @param {string} params.token - jwt.
 * @param {Function} params.callback - Callback.
 * @param {string} params.simpleMsgId - Id of the message.
 */
function getSimpleMsgById({
  token,
  callback,
  full,
  simpleMsgId,
}) {
  authenticator.isUserAllowed({
    token,
    commandName: full ? dbConfig.apiCommands.GetFull.name : dbConfig.apiCommands.GetSimpleMsgs.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const { user } = data;

      getAccessibleMessage({
        user,
        full,
        simpleMsgId,
        callback,
      });
    },
  });
}

/**
 * Update a simple msg.
 * @param {Object} params - Parameters.
 * @param {string} params.token - jwt.
 * @param {Function} params.callback - Callback.
 * @param {string} params.simpleMsgId - Id of the message to update.
 * @param {Object} params.simpleMsg - Parameters to update.
 */
function updateSimpleMsg({
  token,
  callback,
  simpleMsgId,
  simpleMsg,
  io,
  options,
}) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.UpdateSimpleMsg.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const { user } = data;

      getAccessibleMessage({
        user,
        simpleMsgId,
        shouldBeAdmin: true,
        callback: ({ error: accessError }) => {
          if (accessError) {
            callback({ error: accessError });

            return;
          }

          dbSimpleMsg.updateSimpleMsg({
            simpleMsgId,
            simpleMsg,
            options,
            callback: ({ error: updateError, data: updateData }) => {
              if (updateError) {
                callback({ error: updateError });

                return;
              }

              const updatedMessage = updateData.simpleMsg;
              const dataToSend = {
                data: {
                  simpleMsg: updatedMessage,
                  changeType: dbConfig.ChangeTypes.UPDATE,
                },
              };

              io.emit(dataToSend);

              callback(dataToSend);
            },
          });
        },
      });
    },
  });
}

/**
 * Remove a simple msg.
 * @param {Object} params - Parameters.
 * @param {string} params.token - jwt.
 * @param {Function} params.callback - Callback.
 * @param {string} params.simpleMsgId - Id of the message.
 */
function removeSimpleMsg({
  token,
  callback,
  simpleMsgId,
}) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.RemoveSimpleMsg.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const { user } = data;

      getAccessibleMessage({
        user,
        simpleMsgId,
        shouldBeAdmin: true,
        callback: ({ error: accessError }) => {
          if (accessError) {
            callback({ error: accessError });

            return;
          }

          dbSimpleMsg.removeSimpleMsg({
            simpleMsgId,
            callback: ({ error: removeError }) => {
              if (removeError) {
                callback({ error: removeError });

                return;
              }

              const dataToSend = {
                data: {
                  simpleMsg: { objectId: simpleMsgId },
                  changeType: dbConfig.ChangeTypes.REMOVE,
                },
              };

              callback(dataToSend);
            },
          });
        },
      });
    },
  });
}

/**
 * Get simple messages that the user has access to.
 * @param {Object} params - Parameters.
 * @param {string} params.token - jwt.
 * @param {Function} params.callback - Callback.
 */
function getSimpleMsgsByUser({
  token,
  callback,
  full,
}) {
  authenticator.isUserAllowed({
    token,
    commandName: full ? dbConfig.apiCommands.GetFull.name : dbConfig.apiCommands.GetSimpleMsgs.name,
    callback: ({ error }) => {
      if (error) {
        callback({ error });

        return;
      }

      dbSimpleMsg.getAllSimpleMsgs({
        full,
        callback,
      });
    },
  });
}

exports.sendSimpleMsg = sendSimpleMsg;
exports.getSimpleMsgsByUser = getSimpleMsgsByUser;
exports.updateSimpleMsg = updateSimpleMsg;
exports.removeSimpleMsg = removeSimpleMsg;
exports.getSimpleMsgById = getSimpleMsgById;
