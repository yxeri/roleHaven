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
 * Send simplage message
 * @param {string} params.text Text to add to message
 * @param {Object} [params.socket] Socket io
 * @param {Object} params.io Socket io. Used if socket is not set
 * @param {string} params.token jwt
 * @param {Function} params.callback Callback
 */
function sendSimpleMsg({ text, socket, io, token, callback }) {
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


      const simpleMsg = {
        text,
        time: new Date(),
        username: data.user.username,
      };

      dbSimpleMsg.createSimpleMsg({
        simpleMsg,
        callback: ({ error: createError, data: newData }) => {
          if (createError) {
            callback({ error: createError });

            return;
          }

          if (socket) {
            socket.broadcast.emit('simpleMsg', { data: newData });
          } else {
            io.emit('simpleMsg', { data: newData });
          }

          callback({ data: newData });
        },
      });
    },
  });
}

/**
 * Get simple messages
 * @param {string} params.token jwt
 * @param {Function} params.callback Callback
 */
function getSimpleMsgs({ token, callback }) {
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
