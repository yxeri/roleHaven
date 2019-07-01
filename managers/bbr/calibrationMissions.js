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

const dbTransaction = require('../../db/connectors/transaction');
const dbCalibrationMission = require('../../db/connectors/bbr/calibrationMission');
const authenticator = require('../../helpers/authenticator');
const dbLanternHack = require('../../db/connectors/bbr/lanternHack');
const errorCreator = require('../../error/errorCreator');
const poster = require('../../helpers/poster');
const userManager = require('../users');
const walletManager = require('../wallets');
const {
  dbConfig,
  appConfig,
} = require('../../config/defaults/config');

/**
 * Get active calibration mission for user. Creates a new one if there is none for the user.
 * @param {Object} params Parameters.
 * @param {string} [params.userName] Owner of the mission. Will default to current user.
 * @param {number} [params.stationId] Station Id for the mission.
 * @param {Function} params.callback Callback.
 */
function getActiveCalibrationMission({
  token,
  stationId,
  callback,
  userName,
}) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.GetCalibrationMission.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const { user: authUser } = data;
      const owner = userName;

      userManager.getUserById({
        username: owner,
        internalCallUser: authUser,
        callback: ({ error: userError }) => {
          if (userError) {
            callback({ error: userError });

            return;
          }

          dbLanternHack.getLanternRound({
            callback: ({ error: lanternError, data: lanternData }) => {
              if (lanternError) {
                callback({ error: lanternError });

                return;
              }

              if (lanternData.isActive) {
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

                      if (inactiveData.missions.length > 0 && new Date().getTime() < new Date(inactiveData.missions[inactiveData.missions.length - 1].timeCreated).getTime() + (appConfig.calibrationTimeout * 60000)) {
                        callback({
                          error: new errorCreator.TooFrequent({
                            name: 'calibration mission',
                            extraData: {
                              timeLeft: new Date().getTime() - (new Date(inactiveData.missions[inactiveData.missions.length - 1].timeCreated).getTime() + (appConfig.calibrationTimeout * 60000)),
                            },
                          }),
                        });

                        return;
                      }

                      dbLanternHack.getAllStations({
                        callback: ({ error: stationsError, data: stationsData }) => {
                          if (stationsError) {
                            callback({ error: stationsError });

                            return;
                          }

                          if (stationsData.stations.length < 1) {
                            callback({ error: new errorCreator.DoesNotExist({ name: 'no active stations' }) });

                            return;
                          }

                          const stationIds = stationsData.stations.map(station => station.stationId);
                          const { missions: inactiveMissions } = inactiveData;

                          if (inactiveMissions && inactiveMissions.length > 0) {
                            const previousStationIds = inactiveMissions.length > 1
                              ? [inactiveMissions[inactiveMissions.length - 1].stationId, inactiveMissions[inactiveMissions.length - 2].stationId]
                              : [inactiveMissions[inactiveMissions.length - 1].stationId];

                            if (stationId && previousStationIds.indexOf(stationId) > -1) {
                              callback({ error: new errorCreator.InvalidData({ expected: 'not equal station' }) });

                              return;
                            }

                            previousStationIds.forEach((stationIdToRemove) => {
                              stationIds.splice(stationIds.indexOf(stationIdToRemove), 1);
                            });
                          }

                          if (stationIds.length === 0) {
                            callback({ error: new errorCreator.DoesNotExist({ name: 'no active stations' }) });

                            return;
                          }

                          const newStationId = stationId || stationIds[Math.floor(Math.random() * (stationIds.length))];
                          const newCode = Math.floor(Math.random() * (((99999999 - 10000000) + 1) + 10000000));
                          const missionToCreate = {
                            owner,
                            stationId: newStationId,
                            timeCreated: new Date(),
                            code: newCode,
                          };

                          dbCalibrationMission.createMission({
                            mission: missionToCreate,
                            callback: ({ error: createError, data: createData }) => {
                              if (createError) {
                                callback({ error: createError });

                                return;
                              }

                              const { mission } = createData;

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
                                          callback({ error: removeError });

                                          return;
                                        }

                                        callback({ error: requestError });
                                      },
                                    });

                                    return;
                                  }

                                  callback({
                                    data: {
                                      mission: createData.mission,
                                      isNew: true,
                                      changeType: dbConfig.ChangeTypes.CREATE,
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
        },
      });
    },
  });
}

/**
 * Complete active calibration mission and create transaction to user.
 * @param {Object} params Parameters.
 * @param {Object} params.io Socket io.
 * @param {Function} params.callback Callback.
 */
function completeActiveCalibrationMission({
  token,
  owner,
  io,
  callback,
}) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.CompleteCalibrationMission.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const { user: authUser } = data;

      userManager.getUserById({
        username: owner,
        internalCallUser: authUser,
        callback: ({ error: userError, data: userData }) => {
          if (userError) {
            callback({ error: userError });

            return;
          }

          const { user } = userData;
          const { objectId: ownerId } = user;

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
                    toWalletId: ownerId,
                    fromWalletId: dbConfig.users.systemUser.objectId,
                    amount: stationData.station.calibrationReward || appConfig.calibrationRewardAmount,
                    note: `CALIBRATION OF STATION ${completedMission.stationId}`,
                  };

                  dbTransaction.createTransaction({
                    transaction,
                    callback: ({ error: transactionError, data: transactionData }) => {
                      if (transactionError) {
                        callback({ error: transactionError });

                        return;
                      }

                      const { transaction: newTransaction } = transactionData;

                      walletManager.runTransaction({
                        transaction: newTransaction,
                        callback: ({ error: walletError }) => {
                          if (walletError) {
                            callback({ error: walletError });

                            return;
                          }

                          const transactionToSend = {
                            data: {
                              transaction: newTransaction,
                              changeType: dbConfig.ChangeTypes.CREATE,
                            },
                          };

                          io.to(ownerId).emit(dbConfig.EmitTypes.TRANSACTION, transactionToSend);

                          callback({
                            data: {
                              mission: completedMission,
                              transaction: newTransaction,
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
 * Cancel a user's active calibration mission.
 * @param {Object} params Parameters.
 * @param {Object} params.io Socket io.
 * @param {Function} params.callback Callback.
 */
function cancelActiveCalibrationMission({
  token,
  io,
  callback,
  owner,
}) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.CancelCalibrationMission.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const { user: authUser } = data;

      userManager.getUserById({
        username: owner,
        internalCallUser: authUser,
        callback: ({ error: userError, data: userData }) => {
          if (userError) {
            callback({ error: userError });

            return;
          }

          const { user } = userData;

          dbCalibrationMission.setMissionCompleted({
            owner,
            cancelled: true,
            callback: ({ error: missionError, data: missionData }) => {
              if (missionError) {
                callback({ error: missionError });

                return;
              }

              const { mission: updatedMission } = missionData;
              updatedMission.cancelled = true;

              io.to(user.objectId).emit('calibrationMission', {
                data: {
                  mission: updatedMission,
                  changeType: dbConfig.ChangeTypes.REMOVE,
                },
              });

              callback({ data: { mission: updatedMission, cancelled: true } });
            },
          });
        },
      });
    },
  });
}

/**
 * Get calibration missions.
 * @param {Object} params Parameters.
 * @param {string} params.token jwt.
 * @param {Function} params.callback Callback.
 * @param {boolean} [params.getInactive] Should completed missions also be retrieved?
 */
function getCalibrationMissions({
  token,
  getInactive,
  callback,
}) {
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

/**
 * Get valid station options for user.
 * @param {Object} params Parameters.
 * @param {string} params.token jwt token.
 * @param {Function} params.callback Callback.
 */
function getValidStations({
  token,
  callback,
}) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.GetCalibrationMissions.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const { user: authUser } = data;
      const { username: owner } = authUser;

      dbCalibrationMission.getActiveMission({
        owner,
        silentOnDoesNotExist: true,
        callback: ({ error: activeError, data: activeData }) => {
          if (activeError) {
            callback({ error: activeError });

            return;
          }

          if (activeData.mission) {
            callback({ data: activeData });

            return;
          }

          dbCalibrationMission.getInactiveMissions({
            owner,
            callback: ({ error: inactiveErr, data: inactiveData }) => {
              if (inactiveErr) {
                callback({ error: inactiveErr });

                return;
              }

              if (inactiveData.missions.length > 0 && new Date().getTime() < new Date(inactiveData.missions[inactiveData.missions.length - 1].timeCreated).getTime() + (appConfig.calibrationTimeout * 60000)) {
                callback({
                  error: new errorCreator.TooFrequent({
                    name: 'calibration mission',
                    extraData: {
                      timeLeft: new Date().getTime() - (new Date(inactiveData.missions[inactiveData.missions.length - 1].timeCreated).getTime() + (appConfig.calibrationTimeout * 60000)),
                    },
                  }),
                });

                return;
              }

              dbLanternHack.getAllStations({
                callback: ({ error: stationsError, data: stationsData }) => {
                  if (stationsError) {
                    callback({ error: stationsError });

                    return;
                  }

                  if (stationsData.stations.length < 1) {
                    callback({ error: new errorCreator.DoesNotExist({ name: 'no active stations' }) });

                    return;
                  }

                  const stationIds = stationsData.stations.map(station => station.stationId);
                  const { missions } = inactiveData;

                  if (missions && missions.length > 0) {
                    const previousStationIds = missions.length > 1
                      ? [missions[missions.length - 1].stationId, missions[missions.length - 2].stationId]
                      : [missions[missions.length - 1].stationId];

                    previousStationIds.forEach((stationIdToRemove) => {
                      stationIds.splice(stationIds.indexOf(stationIdToRemove), 1);
                    });
                  }

                  callback({
                    data: {
                      stations: stationsData.stations.filter(station => stationIds.indexOf(station.stationId) > -1),
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
 * Cancels all calibration missions based on station Id.
 * @param {Object} params Parameters.
 * @param {string} params.token jwt token.
 * @param {number} params.stationId Id of the station.
 * @param {Function} params.callback Callback.
 */
function removeCalibrationMissionsById({ token, stationId, callback }) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.CancelCalibrationMission.name,
    callback: ({ error }) => {
      if (error) {
        callback({ error });

        return;
      }

      dbCalibrationMission.getMissions({
        callback: ({ error: missionError, data: missionData }) => {
          if (missionError) {
            callback({ error: missionError });

            return;
          }

          missionData.missions.forEach((mission) => {
            if (stationId === mission.stationId) {
              dbCalibrationMission.removeMission({
                mission,
                callback: () => {},
              });
            }
          });

          callback({ data: { success: true } });
        },
      });
    },
  });
}

exports.getValidStations = getValidStations;
exports.getActiveCalibrationMission = getActiveCalibrationMission;
exports.completeActiveCalibrationMission = completeActiveCalibrationMission;
exports.cancelActiveCalibrationMission = cancelActiveCalibrationMission;
exports.getCalibrationMissions = getCalibrationMissions;
exports.removeCalibrationMissionsById = removeCalibrationMissionsById;
