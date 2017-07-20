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

const authenticator = require('../../helpers/authenticator');
const manager = require('../../helpers/manager');
const databasePopulation = require('../../config/defaults/config').databasePopulation;

/**
 * Get active calibration mission
 * @param {Object} params.token jwt for user retrieving mission
 * @param {Function} params.callback Callback
 */
function getCalibrationMission({ token, callback }) {
  authenticator.isUserAllowed({
    token,
    commandName: databasePopulation.apiCommands.GetCalibrationMission.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      manager.getActiveCalibrationMission({
        userName: data.user.userName,
        callback: ({ error: calibrationError, data: calibrationData }) => {
          if (calibrationError) {
            callback({ error: calibrationError });

            return;
          }

          callback({ data: calibrationData });
        },
      });
    },
  });
}

/**
 * @param {object} socket - Socket.IO socket
 */
function handle(socket) {
  socket.on('getCalibrationMission', ({ token }, callback = () => {}) => {
    getCalibrationMission({ token, callback });
  });
}

exports.getCalibrationMission = getCalibrationMission;
exports.handle = handle;
