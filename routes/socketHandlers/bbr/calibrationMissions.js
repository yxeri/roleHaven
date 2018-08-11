/*
 Copyright 2018 Carmilla Mina Jankovic
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

const calibrationMissionManager = require('../../../managers/bbr/calibrationMissions');

/**
 * @param {object} socket - Socket.IO socket
 */
function handle(socket) {
  socket.on('getCalibrationMission', ({
    userName,
    token,
    stationId,
  }, callback = () => {}) => {
    calibrationMissionManager.getActiveCalibrationMission({
      token,
      userName,
      stationId,
      callback,
    });
  });

  socket.on('getValidCalibrationStations', ({
    userName,
    token,
  }, callback = () => {}) => {
    calibrationMissionManager.getValidStations({
      userName,
      token,
      callback,
    });
  });
}

exports.handle = handle;
