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

const dbChatHistory = require('../db/connectors/chatHistory');
const dbConfig = require('../config/defaults/config').databasePopulation;
const authenticator = require('../helpers/authenticator');

/**
 * Get broadcasts
 * @param {string} params.token jwt
 * @param {Function} params.callback Callback
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

      dbChatHistory.getHistory({
        roomName: dbConfig.rooms.bcast.roomName,
        callback: ({ error: historyError, data: historyData }) => {
          if (historyError) {
            callback({ error: historyError });

            return;
          }

          callback({ data: historyData });
        },
      });
    },
  });
}

exports.getBroadcasts = getBroadcasts;

