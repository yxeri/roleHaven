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

const { appConfig, dbConfig } = require('../config/defaults/config');
const errorCreator = require('../error/errorCreator');
const objectValidator = require('../utils/objectValidator');
const authenticator = require('../helpers/authenticator');
const dbSimpleMsg = require('../db/connectors/simpleMsg');
const managerHelper = require('../helpers/manager');

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
  simpleMsgId,
  internalCallUser,
}) {
  authenticator.isUserAllowed({
    commandName: dbConfig.apiCommands.GetSimpleMsgs.name,
    token,
    internalCallUser,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const { user: authUser } = data;

      dbSimpleMsg.getSimpleMsgById({
        simpleMsgId,
        callback: ({ error: msgError, data: msgData }) => {
          if (msgError) {
            callback({ error: msgError });

            return;
          }

          const { simpleMsg: foundSimpleMsg } = msgData;
          const {
            hasAccess,
            canSee,
          } = authenticator.hasAccessTo({
            objectToAccess: foundSimpleMsg,
            toAuth: authUser,
          });

          if (!canSee) {
            callback({ error: new errorCreator.NotAllowed({ name: `get simplemsg ${simpleMsgId}` }) });

            return;
          } else if (!hasAccess) {
            callback({ data: { simpleMsg: managerHelper.stripObject({ object: foundSimpleMsg }) } });

            return;
          }

          callback({ data: msgData });
        },
      });
    },
  });
}

/**
 * Send simple message.
 * @param {Object} params - Parameters.
 * @param {string} params.text - Text to add to message.
 * @param {Object} params.io - Socket io.
 * @param {string} params.token - jwt.
 * @param {Function} params.callback - Callback.
 */
function sendSimpleMsg({
  text,
  io,
  token,
  callback,
  socket,
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
      } else if (text.length === 0 || text.length > appConfig.messageMaxLength) {
        callback({ error: new errorCreator.InvalidCharacters({ expected: `text length 1-${appConfig.messageMaxLength}` }) });

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
            socket.broadcast.emit(dbConfig.EmitTypes.SIMPLEMSG, dataToSend);
          } else {
            io.emit(dbConfig.EmitTypes.SIMPLEMSG, dataToSend);
          }

          callback(dataToSend);
        },
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
  socket,
}) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.UpdateSimpleMsg.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const { user: authUser } = data;

      getSimpleMsgById({
        simpleMsgId,
        internalCallUser: authUser,
        callback: ({ error: getError, data: getData }) => {
          if (getError) {
            callback({ error: getError });

            return;
          }

          const { simpleMsg: foundSimpleMsg } = getData;
          const {
            hasFullAccess,
          } = authenticator.hasAccessTo({
            objectToAccess: foundSimpleMsg,
            toAuth: authUser,
          });

          if (!hasFullAccess) {
            callback({ error: new errorCreator.NotAllowed({ name: `update simpleMsg ${simpleMsgId}` }) });

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

              const { simpleMsg: updatedMessage } = updateData;
              const dataToSend = {
                data: {
                  simpleMsg: updatedMessage,
                  changeType: dbConfig.ChangeTypes.UPDATE,
                },
              };

              if (socket) {
                socket.broadcast.emit(dbConfig.EmitTypes.SIMPLEMSG, dataToSend);
              } else {
                io.emit(dbConfig.EmitTypes.SIMPLEMSG, dataToSend);
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
  io,
  socket,
}) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.RemoveSimpleMsg.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const { user: authUser } = data;

      getSimpleMsgById({
        simpleMsgId,
        internalCallUser: authUser,
        callback: ({ error: accessError, data: msgData }) => {
          if (accessError) {
            callback({ error: accessError });

            return;
          }

          const { simpleMsg } = msgData;

          const {
            hasFullAccess,
          } = authenticator.hasAccessTo({
            objectToAccess: simpleMsg,
            toAuth: authUser,
          });

          if (!hasFullAccess) {
            callback({ error: new errorCreator.NotAllowed({ name: `remove simpleMsg ${simpleMsgId}` }) });

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

              if (socket) {
                socket.broadcast.emit(dbConfig.EmitTypes.SIMPLEMSG, dataToSend);
              } else {
                io.emit(dbConfig.EmitTypes.SIMPLEMSG, dataToSend);
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
 * Get simple messages that the user has access to.
 * @param {Object} params - Parameters.
 * @param {string} params.token - jwt.
 * @param {Function} params.callback - Callback.
 */
function getSimpleMsgsByUser({
  token,
  callback,
}) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.GetSimpleMsgs.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const { user: authUser } = data;

      dbSimpleMsg.getAllSimpleMsgs({
        callback: ({ error: getError, data: getData }) => {
          if (getError) {
            callback({ error: getError });

            return;
          }

          const { simpleMsgs } = getData;
          const allSimpleMsgs = simpleMsgs.map((simpleMsg) => {
            const { hasFullAccess } = authenticator.hasAccessTo({
              toAuth: authUser,
              objectToAccess: simpleMsg,
            });

            if (!hasFullAccess) {
              return managerHelper.stripObject({ object: simpleMsg });
            }

            return simpleMsg;
          });

          callback({ data: { simpleMsgs: allSimpleMsgs } });
        },
      });
    },
  });
}

exports.sendSimpleMsg = sendSimpleMsg;
exports.getSimpleMsgsByUser = getSimpleMsgsByUser;
exports.updateSimpleMsg = updateSimpleMsg;
exports.removeSimpleMsg = removeSimpleMsg;
exports.getSimpleMsgById = getSimpleMsgById;
