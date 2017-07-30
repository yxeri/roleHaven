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

              const { missions: inactiveMissions } = inactiveData;
              const stationIds = [1, 2, 3, 4]; // TODO This is just for testing purposes. Remove when organisers have their backend ready

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

                  callback({ data: { mission: createData.mission, isNew: true } });
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

          const transaction = {
            to: completedMission.owner,
            from: 'SYSTEM',
            amount: appConfig.calibrationRewardAmount,
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

                  dbUser.getUserByAlias({
                    alias: createdTransaction.to,
                    callback: ({ error: aliasError, data: aliasData }) => {
                      if (aliasError) {
                        callback({ error: aliasError });

                        return;
                      }

                      const { user } = aliasData;

                      if (user.socketId && user.socketId !== '') {
                        io.to(user.socketId).emit('transaction', { data: { transaction, wallet: updatedWallet } });
                        io.to(user.socketId).emit('terminal', { data: { mission: { missionType: 'calibrationMission', completed: true } } });
                      }

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

              if (user.socketId !== '') {
                io.to(user.socketId).emit('terminal', { data: { mission: { missionType: 'calibrationMission', cancelled: true } } });
              }

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
