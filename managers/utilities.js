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

/**
 * Forces reload of page on all connected clients
 * @param {Object} params.socket Socket io
 * @param {Socket} params.io Socket io. Will be used if socket is not set
 * @param {string} params.token jwt
 * @param {Function} params.callback Callback
 */
function rebootAll({ socket, io, token, callback }) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.RebootAll.name,
    callback: ({ error }) => {
      if (error) {
        callback({ error });

        return;
      }

      if (socket) {
        socket.broadcast.emit('reboot');
      } else {
        io.emit('reboot');
      }

      callback({ data: { success: true } });
    },
  });
}

exports.rebootAll = rebootAll;
