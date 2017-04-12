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
const dbCalibrationMission = require('../../db/connectors/calibrationMission');
const errorCreator = require('../../objects/error/errorCreator');

/**
 * @param {object} socket - Socket.IO socket
 */
function handle(socket) {
  socket.on('getCalibrationMission', (params, callback = () => {}) => {
    manager.userIsAllowed(socket.id, databasePopulation.commands.calibrationMission.commandName, (allowErr, allowed, user) => {
      if (allowErr || !allowed) {
        callback({ error: new errorCreator.NotAllowed({ used: 'getCalibrationMission' }) });

        return;
      }

      dbCalibrationMission.getActiveMission(user.userName, (activeErr, activeMission) => {
        if (activeErr) {
          callback({ error: new errorCreator.Database() });

          return;
        } else if (!activeMission) {
          dbCalibrationMission.getInactiveMissions(user.userName, (inactiveErr, inactiveMissions) => {
            if (inactiveErr) {
              callback({ error: new errorCreator.Database() });

              return;
            }

            const stationIds = [1, 2, 3, 4]; // TODO This is jsut for testing purposes. Remove when organisers have their backend ready

            if (inactiveMissions && inactiveMissions.length > 0) {
              const previousStationId = inactiveMissions[inactiveMissions.length - 1].stationId;

              stationIds.splice(stationIds.indexOf(previousStationId), 1);
            }

            const newStationId = stationIds[Math.floor(Math.random() * (stationIds.length))];
            const newCode = Math.floor(Math.random() * (((99999999 - 10000000) + 1) + 10000000));
            const mission = {
              owner: user.userName,
              stationId: newStationId,
              code: newCode,
            };

            dbCalibrationMission.createMission(mission, (newErr, newMission) => {
              if (newErr) {
                callback({ error: new errorCreator.Database() });

                return;
              }

              callback({ data: { mission: newMission, isNew: true } });
            });
          });

          return;
        }

        callback({ data: { mission: activeMission } });
      });
    });
  });
}

exports.handle = handle;
