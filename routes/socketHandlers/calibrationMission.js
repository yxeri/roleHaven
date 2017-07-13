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

const manager = require('../../socketHelpers/manager');
const databasePopulation = require('../../config/defaults/config').databasePopulation;

/**
 * @param {object} socket - Socket.IO socket
 */
function handle(socket) {
  socket.on('getCalibrationMission', ({ token }, callback = () => {}) => {
    manager.userIsAllowed({
      token,
      commandName: databasePopulation.commands.calibrationMission.commandName,
      callback: ({ error, allowedUser }) => {
        if (error) {
          callback({ error });

          return;
        }

        manager.getActiveCalibrationMission({
          userName: allowedUser.userName,
          callback: () => {},
        });
      },
    });
  });
}

exports.handle = handle;
