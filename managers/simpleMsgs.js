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

const appConfig = require('../config/defaults/config').app;
const dbConfig = require('../config/defaults/config').databasePopulation;
const errorCreator = require('../objects/error/errorCreator');
const objectValidator = require('../utils/objectValidator');
const authenticator = require('../helpers/authenticator');
const dbSimpleMsg = require('../db/connectors/simpleMsg');

/**
 * Send simple message.
 * @param {Object} params - Parameters.
 * @param {string} params.text - Text to add to message.
 * @param {Object} params.io - Socket io. Used if socket is not set.
 * @param {string} params.token - jwt.
 * @param {Function} params.callback - Callback.
 * @param {string} params.userId - ID of the user sending the message.
 */
function sendSimpleMsg({
  text,
  socket,
  io,
  token,
  callback,
  userId,
}) {
  authenticator.isUserAllowed({
    token,
    matchToId: userId,
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

      const simpleMsg = {
        text,
        ownerId: data.user.userId,
      };

      dbSimpleMsg.createSimpleMsg({
        simpleMsg,
        callback: ({ error: createError, data: newData }) => {
          if (createError) {
            callback({ error: createError });

            return;
          }

          if (socket) {
            socket.broadcast.to(dbConfig.AccessLevels.ANONYMOUS.toString()).emit('simpleMsg', { data: newData });
          } else {
            io.to(dbConfig.AccessLevels.ANONYMOUS.toString()).emit('simpleMsg', { data: newData });
          }

          callback({ data: newData });
        },
      });
    },
  });
}

/**
 * Get a simple msg
 * @param {Object} params - Parameters
 * @param {string} params.userId - ID of the user retrieving the message
 * @param {string} params.token - jwt
 * @param {Function} params.callback - Callback
 * @param {string} params.simpleMsgId - ID of the message
 */
function getSimpleMsg({
  userId,
  token,
  callback,
  simpleMsgId,
}) {
  authenticator.isUserAllowed({
    token,
    matchToId: userId,
    commandName: dbConfig.apiCommands.GetSimpleMsgs.name,
    callback: ({ error }) => {
      if (error) {
        callback({ error });

        return;
      }

      dbSimpleMsg.getSimpleMsgById({
        callback,
        simpleMsgId,
      });
    },
  });
}

/**
 * Update a simple msg
 * @param {Object} params - Parameters
 * @param {string} params.userId - ID of the user updating the message
 * @param {string} params.token - jwt
 * @param {Function} params.callback - Callback
 * @param {string} params.simpleMsgId - ID of the message to update
 * @param {Object} params.simpleMsg - Parameters to update
 */
function updateSimpleMsg({
  userId,
  token,
  callback,
  simpleMsgId,
  simpleMsg,
}) {
  authenticator.isUserAllowed({
    token,
    matchToId: userId,
    commandName: dbConfig.apiCommands.UpdateSimpleMsg.name,
    callback: ({ error }) => {
      if (error) {
        callback({ error });

        return;
      }

      dbSimpleMsg.updateSimpleMsg({
        callback,
        simpleMsg,
        simpleMsgId,
      });
    },
  });
}

/**
 * Remove a simple msg
 * @param {Object} params - Parameters
 * @param {string} params.userId - ID of the user removing the room
 * @param {string} params.token - jwt
 * @param {Function} params.callback - Callback
 * @param {string} params.simpleMsgId - ID of the message
 */
function removeSimpleMsg({
  userId,
  token,
  callback,
  simpleMsgId,
}) {
  authenticator.isUserAllowed({
    token,
    matchToId: userId,
    commandName: dbConfig.apiCommands.RemoveSimpleMsg.name,
    callback: ({ error }) => {
      if (error) {
        callback({ error });

        return;
      }

      dbSimpleMsg.removeSimpleMsg({
        callback,
        simpleMsgId,
      });
    },
  });
}

/**
 * Get simple messages.
 * @param {Object} params - Parameters.
 * @param {string} params.token - jwt.
 * @param {Function} params.callback - Callback.
 */
function getSimpleMsgs({
  token,
  callback,
}) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.GetSimpleMsgs.name,
    callback: ({ error }) => {
      if (error) {
        callback({ error });

        return;
      }

      dbSimpleMsg.getAllSimpleMsgs({
        callback: ({ error: getError, data: messageData }) => {
          if (getError) {
            callback({ error: getError });

            return;
          }

          callback({ data: messageData });
        },
      });
    },
  });
}

exports.sendSimpleMsg = sendSimpleMsg;
exports.getSimpleMsgs = getSimpleMsgs;
exports.updateSimpleMsg = updateSimpleMsg;
exports.removeSimpleMsg = removeSimpleMsg;
exports.getSimpleMsg = getSimpleMsg;
