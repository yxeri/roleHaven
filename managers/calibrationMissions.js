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

const dbUser = require('../db/connectors/user');
const dbWallet = require('../db/connectors/wallet');
const dbConfig = require('../config/defaults/config').databasePopulation;
const dbTransaction = require('../db/connectors/transaction');
const dbCalibrationMission = require('../db/connectors/calibrationMission');
const authenticator = require('../helpers/authenticator');
const appConfig = require('../config/defaults/config').app;
const dbLanternHack = require('../db/connectors/lanternhack');
const errorCreator = require('../objects/error/errorCreator');
const poster = require('../helpers/poster');

/**
 * Get active calibration mission for user. Creates a new one if there is none for the user
 * @param {string} [params.userName] Owner of the mission. Will default to current user
 * @param {Function} params.callback Callback
 */
function getActiveCalibrationMission({ token, callback, userName }) {
  authenticator.isUserAllowed({
    token,
    matchNameTo: userName,
    commandName: dbConfig.apiCommands.GetCalibrationMission.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const owner = userName || data.user.userName;

      dbLanternHack.getLanternRound({
        callback: ({ error: lanternError, data: lanternData }) => {
          if (lanternError) {
            callback({ error: lanternError });

            return;
          } else if (lanternData.isActive) {
            callback({ error: new errorCreator.External({ name: 'lantern hack active' }) });

            return;
          }

          dbCalibrationMission.getActiveMission({
            owner,
            silentOnDoesNotExist: true,
            callback: ({ error: activeErr, data: missionData }) => {
              if (activeErr) {
                callback({ error: activeErr });

                return;
              }

              /**
               * Return active mission, if it exists, or continue with creating a new one
               */
              if (missionData.mission) {
                callback({ data: missionData });

                return;
              }

              dbCalibrationMission.getInactiveMissions({
                owner,
                callback: ({ error: inactiveErr, data: inactiveData }) => {
                  if (inactiveErr) {
                    callback({ error: inactiveErr });

                    return;
                  }

                  dbLanternHack.getActiveStations({
                    callback: ({ error: stationsError, data: stationsData }) => {
                      if (stationsError) {
                        callback({ error: stationsError });

                        return;
                      } else if (stationsData.stations.length < 1) {
                        callback({ error: new errorCreator.DoesNotExist({ name: 'no active stations' }) });

                        return;
                      }

                      const stationIds = stationsData.stations.map(station => station.stationId);
                      const { missions: inactiveMissions } = inactiveData;

                      if (inactiveMissions && inactiveMissions.length > 0) {
                        const previousStationId = inactiveMissions[inactiveMissions.length - 1].stationId;

                        stationIds.splice(stationIds.indexOf(previousStationId), 1);
                      }

                      const newStationId = stationIds[Math.floor(Math.random() * (stationIds.length))];
                      const newCode = Math.floor(Math.random() * (((99999999 - 10000000) + 1) + 10000000));
                      const missionToCreate = {
                        owner,
                        stationId: newStationId,
                        code: newCode,
                      };

                      dbCalibrationMission.createMission({
                        mission: missionToCreate,
                        callback: ({ error: createError, data: createData }) => {
                          if (createError) {
                            callback({ error: createError });

                            return;
                          }

                          const mission = createData.mission;

                          poster.postRequest({
                            host: appConfig.hackingApiHost,
                            path: '/reports/set_mission',
                            data: {
                              mission: {
                                stationId: mission.stationId,
                                owner: mission.owner,
                                code: mission.code,
                              },
                              key: appConfig.hackingApiKey,
                            },
                            callback: ({ error: requestError }) => {
                              if (requestError) {
                                dbCalibrationMission.removeMission({
                                  mission,
                                  callback: ({ error: removeError }) => {
                                    if (removeError) {
                                      callback({ error });

                                      return;
                                    }

                                    callback({ error: requestError });
                                  },
                                });

                                return;
                              }

                              callback({ data: { mission: createData.mission, isNew: true } });
                            },
                          });
                        },
                      });
                    },
                  });
                },
              });
            },
          });
        },
      });
    },
  });
}

/**
 * Complete active calibration mission and create transaction to user
 * @param {Object} params.mission Mission to complete
 * @param {Object} params.io Socket io
 * @param {Function} params.callback Callback
 */
function completeActiveCalibrationMission({ token, owner, io, callback }) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.CompleteCalibrationMission.name,
    callback: ({ error }) => {
      if (error) {
        callback({ error });

        return;
      }

      dbCalibrationMission.setMissionCompleted({
        io,
        owner,
        callback: ({ error: missionError, data: missionData }) => {
          if (missionError) {
            callback({ error: missionError });

            return;
          }

          const completedMission = missionData.mission;

          dbLanternHack.getStation({
            stationId: completedMission.stationId,
            callback: ({ error: stationError, data: stationData }) => {
              if (stationError) {
                callback({ error: stationError });

                return;
              }

              const transaction = {
                to: completedMission.owner,
                from: 'SYSTEM',
                amount: stationData.station.calibrationReward || appConfig.calibrationRewardAmount,
                time: new Date(),
                note: `CALIBRATION OF STATION ${completedMission.stationId}`,
              };

              dbTransaction.createTransaction({
                transaction,
                callback: (createTransactionData) => {
                  if (createTransactionData.error) {
                    callback({ error: createTransactionData.error });

                    return;
                  }

                  const createdTransaction = createTransactionData.data.transaction;

                  dbWallet.increaseAmount({
                    owner: completedMission.owner,
                    amount: createdTransaction.amount,
                    callback: ({ error: walletError, data: walletData }) => {
                      if (walletError) {
                        callback({ error: walletError });

                        return;
                      }

                      const updatedWallet = walletData.wallet;
                      const userRoom = completedMission.owner + appConfig.whisperAppend;

                      io.to(userRoom).emit('transaction', { data: { transaction, wallet: updatedWallet } });
                      io.to(userRoom).emit('terminal', { data: { mission: { missionType: 'calibrationMission', completed: true } } });

                      callback({
                        data: {
                          mission: completedMission,
                          transaction: createdTransaction,
                        },
                      });
                    },
                  });
                },
              });
            },
          });
        },
      });
    },
  });
}

/**
 *
 * @param {Object} params.mission Mission to cancel
 * @param {Object} params.io Socket io
 * @param {Function} params.callback Callback
 */
function cancelActiveCalibrationMission({ token, io, callback, owner }) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.CancelCalibrationMission.name,
    callback: ({ error }) => {
      if (error) {
        callback({ error });

        return;
      }

      dbCalibrationMission.setMissionCompleted({
        owner,
        callback: ({ error: missionError, data: missionData }) => {
          if (missionError) {
            callback({ error: missionError });

            return;
          }

          const updatedMission = missionData.mission;

          dbUser.getUserByAlias({
            alias: updatedMission.owner,
            callback: ({ error: aliasError, data: aliasData }) => {
              if (aliasError) {
                callback({ error: aliasError });

                return;
              }

              const { user } = aliasData;

              io.to(user.userName + appConfig.whisperAppend).emit('terminal', { data: { mission: { missionType: 'calibrationMission', cancelled: true } } });

              callback({ data: { mission: updatedMission, cancelled: true } });
            },
          });
        },
      });
    },
  });
}

/**
 * Get calibration missions
 * @param {string} params.token jwt
 * @param {boolean} [params.getInactive] Should completed missions also be retrieved?
 * @param {Function} params.callback Callback
 */
function getCalibrationMissions({ token, getInactive, callback }) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.GetCalibrationMissions.name,
    callback: ({ error }) => {
      if (error) {
        callback({ error });

        return;
      }

      dbCalibrationMission.getMissions({
        getInactive,
        callback,
      });
    },
  });
}

exports.getActiveCalibrationMission = getActiveCalibrationMission;
exports.completeActiveCalibrationMission = completeActiveCalibrationMission;
exports.cancelActiveCalibrationMission = cancelActiveCalibrationMission;
exports.getCalibrationMissions = getCalibrationMissions;
