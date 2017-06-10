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

        dbCalibrationMission.getActiveMission({
          owner: allowedUser.userName,
          callback: ({ error: activeErr, data }) => {
            if (activeErr) {
              callback({ error: activeErr });

              return;
            }

            const { mission } = data;

            if (mission) {
              callback({ data: { mission } });

              return;
            }

            dbCalibrationMission.getInactiveMissions({
              owner: allowedUser.userName,
              callback: ({ error: inactiveErr, data: inactiveData }) => {
                if (inactiveErr) {
                  callback({ error: inactiveErr });

                  return;
                }

                const { missions: inactiveMissions } = inactiveData;
                const stationIds = [1, 2, 3, 4]; // TODO This is just for testing purposes. Remove when organisers have their backend ready

                if (inactiveMissions && inactiveMissions.length > 0) {
                  const previousStationId = inactiveMissions[inactiveMissions.length - 1].stationId;

                  stationIds.splice(stationIds.indexOf(previousStationId), 1);
                }

                const newStationId = stationIds[Math.floor(Math.random() * (stationIds.length))];
                const newCode = Math.floor(Math.random() * (((99999999 - 10000000) + 1) + 10000000));
                const newMission = {
                  owner: allowedUser.userName,
                  stationId: newStationId,
                  code: newCode,
                };

                dbCalibrationMission.createMission({
                  mission: newMission,
                  callback: (newErr) => {
                    if (newErr) {
                      callback({ error: newErr });

                      return;
                    }

                    callback({ data: { mission: newMission, isNew: true } });
                  },
                });
              },
            });
          },
        });
      },
    });
  });
}

exports.handle = handle;
