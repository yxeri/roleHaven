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
const messenger = require('../helpers/messenger');

/**
 * Get broadcast messages
 * @param {Object} params - Parameters
 * @param {string} params.token - jwt
 * @param {Function} params.callback - Callback
 */
function getBroadcasts({ token, callback }) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.GetBroadcasts.name,
    callback: ({ error }) => {
      if (error) {
        callback({ error });

        return;
      }

      dbMessage.getMessagesByRoom({
        roomId: dbConfig.rooms.bcast.roomId,
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
}

/**
 * Send broadcast message
 * @param {Object} params - Parameters
 * @param {Object} params.message - Message to be sent
 * @param {Object} [params.socket] - Socket.io socket
 * @param {Object} params.io - Socket.io. Used by API, when no socket is available
 * @param {Function} params.callback - Client callback
 */
function sendBroadcastMsg({ token, message, socket, callback, io }) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.SendBroadcast.name,
    callback: ({ error, data }) => {
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

      const user = data.user;
      const newMessage = message;
      newMessage.messageType = dbMessage.MessageTypes.BROADCAST;

      if (newMessage.ownerAliasId) {
        aliasManager.getAlias({
          token,
          aliasId: newMessage.ownerAliasId,
          userId: user.userId,
          callback: (aliasData) => {
            if (aliasData.error) {
              callback({ error: aliasData.error });

              return;
            }

            messenger.sendMessage({
              newMessage,
              socket,
              io,
              callback,
            });
          },
        });
      } else {
        messenger.sendMessage({
          newMessage,
          socket,
          io,
          callback,
        });
      }
    },
  });
}

exports.getBroadcasts = getBroadcasts;
exports.sendBroadcastMsg = sendBroadcastMsg;
