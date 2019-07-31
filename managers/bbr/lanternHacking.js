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

const objectValidator = require('../../utils/objectValidator');
const errorCreator = require('../../error/errorCreator');
const dbLanternHack = require('../../db/connectors/bbr/lanternHack');
const textTools = require('../../utils/textTools');
const authenticator = require('../../helpers/authenticator');
const lanternRoundManager = require('./lanternRounds');
const lanternStationManager = require('./lanternStations');
const lanternTeamManager = require('./lanternTeams');
const messageManager = require('../messages');
const poster = require('../../helpers/poster');
const {
  dbConfig,
  appConfig,
} = require('../../config/defaults/config');

/**
 * Lower/increase signal value on all stations towards default value.
 * @param {Object} params Parameters.
 * @param {Function} params.callback Callback.
 */
function resetStations({
  io,
  callback = () => {},
}) {
  if (appConfig.mode === appConfig.Modes.TEST || appConfig.signalResetTimeout === 0) {
    return;
  }

  dbLanternHack.getLanternRound({
    callback: ({ error: roundError, data: roundData }) => {
      if (roundError) {
        callback({ error: roundError });

        return;
      }

      if (!roundData.isActive) {
        return;
      }

      dbLanternHack.getAllStations({
        callback: ({ error, data }) => {
          if (error) {
            callback({ error });

            return;
          }

          const { stations } = data;

          stations.forEach((station) => {
            if (station.signalValue === appConfig.signalDefaultValue) {
              return;
            }

            const {
              stationId,
              signalValue,
            } = station;
            let newSignalValue = signalValue;

            if (signalValue > appConfig.signalDefaultValue) {
              newSignalValue -= 1;
            } else {
              newSignalValue += 1;
            }

            stations.find(foundStation => foundStation.stationId === stationId).signalValue = newSignalValue;
          });

          io.emit('lanternStations', { data: { stations } });

          callback({ data: { success: true } });

          stations.forEach((station) => {
            const {
              stationId,
              signalValue,
            } = station;

            dbLanternHack.updateSignalValue({
              stationId,
              signalValue,
              callback: ({ error: updateError }) => {
                if (updateError) {
                  return;
                }

                poster.postRequest({
                  host: appConfig.hackingApiHost,
                  path: '/reports/set_boost',
                  data: {
                    station: stationId,
                    boost: signalValue,
                    key: appConfig.hackingApiKey,
                  },
                  callback: () => {},
                });
              },
            });
          });
        },
      });
    },
  });
}

/**
 * Starts reset interval for stations.
 * @param {Object} params Parameters.
 * @param {Object} params.io Socket io.
 */
function startResetInterval({ io }) {
  setInterval(resetStations, appConfig.signalResetTimeout, { io });
}

/**
 * Update signal value on a station.
 * @param {Object} params Parameters.
 * @param {number} params.stationId Station Id.
 * @param {boolean} params.boostingSignal Should the signal be increased?
 * @param {Function} params.callback Callback.
 */
function updateSignalValue({
  stationId,
  boostingSignal,
  callback,
}) {
  dbLanternHack.getStation({
    stationId,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const { station } = data;

      /**
       * Set new signalvalue.
       * @private
       * @param {Object} params Parameters.
       * @param {number} params.signalValue New signal value.
       */
      function setNewValue({ signalValue }) {
        const minValue = appConfig.signalDefaultValue - appConfig.signalThreshold;
        const maxValue = appConfig.signalDefaultValue + appConfig.signalThreshold;
        let ceilSignalValue = Math.ceil(signalValue);

        if (ceilSignalValue > maxValue) {
          ceilSignalValue = maxValue;
        } else if (ceilSignalValue < minValue) {
          ceilSignalValue = minValue;
        }

        dbLanternHack.updateSignalValue({
          stationId,
          signalValue: ceilSignalValue,
          callback: ({ error: updateError }) => {
            if (updateError) {
              callback({ error: updateError });

              return;
            }

            poster.postRequest({
              host: appConfig.hackingApiHost,
              path: '/reports/set_boost',
              data: {
                station: stationId,
                boost: ceilSignalValue,
                key: appConfig.hackingApiKey,
              },
              callback: ({ error: requestError, data: requestData }) => {
                if (requestError) {
                  callback({ error: requestError });

                  return;
                }

                callback({ data: requestData });
              },
            });
          },
        });
      }

      const { signalValue } = station;
      const difference = Math.abs(signalValue - appConfig.signalDefaultValue);
      let signalChange = (appConfig.signalThreshold - difference) * appConfig.signalChangePercentage;

      if (boostingSignal && signalValue < appConfig.signalDefaultValue) {
        signalChange = appConfig.signalMaxChange;
      } else if (!boostingSignal && signalValue > appConfig.signalDefaultValue) {
        signalChange = appConfig.signalMaxChange;
      }

      setNewValue({
        signalValue: signalValue + (boostingSignal
          ? signalChange
          : -Math.abs(signalChange)),
      });
    },
  });
}

/**
 * Create client hack data.
 * @param {Object} params Parameters.
 * @param {Object} params.lanternHack Lantern hack.
 * @param {Function} params.callback Callback.
 */
function createHackData({
  lanternHack,
  callback,
}) {
  dbLanternHack.getAllFakePasswords({
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const { passwords } = data;
      const correctUser = lanternHack.gameUsers.find(gameUser => gameUser.isCorrect);

      callback({
        data: {
          passwords: textTools.shuffleArray(passwords).slice(0, 13).concat(lanternHack.gameUsers.map(gameUser => gameUser.password)),
          triesLeft: lanternHack.triesLeft,
          userName: correctUser.userName,
          passwordType: correctUser.passwordType,
          passwordHint: correctUser.passwordHint,
          stationId: lanternHack.stationId,
        },
      });
    },
  });
}

/**
 * Create lantern hack for user.
 * @param {Object} params Parameters.
 * @param {number} params.stationId Station id.
 * @param {string} params.owner User name of the hack owner.
 * @param {number} params.triesLeft Amount of hacking tries before the hack fails.
 * @param {Function} params.callback Callback.
 */
function createLanternHack({
  stationId,
  owner,
  triesLeft,
  callback,
}) {
  dbLanternHack.getGameUsers({
    stationId,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      if (data.gameUsers.length <= 0) {
        callback({ error: new errorCreator.DoesNotExist({ name: 'game users' }) });

        return;
      }

      const gameUsers = textTools.shuffleArray(data.gameUsers).slice(0, 2).map((gameUser) => {
        const passwordRand = Math.floor(Math.random() * ((gameUser.passwords.length - 1) + 1));
        const password = gameUser.passwords[passwordRand];
        const randomIndex = Math.floor(Math.random() * ((password.length - 1) + 1));

        return {
          password,
          userName: gameUser.userName,
          passwordHint: {
            index: randomIndex,
            character: password.charAt(randomIndex),
          },
        };
      });

      // Set first game user + password to the right combination
      gameUsers[0].isCorrect = true;

      dbLanternHack.updateLanternHack({
        stationId,
        owner,
        gameUsers,
        triesLeft,
        callback: ({ error: updateError, data: updateData }) => {
          if (updateError) {
            callback({ error: updateError });

            return;
          }

          callback({ data: { lanternHack: updateData.lanternHack } });
        },
      });
    },
  });
}

/**
 * Manipulate station.
 * @param {Object} params Parameters.
 * @param {string} params.password Password to allow boost change.
 * @param {boolean} params.boostingSignal Will the boost be increased?
 * @param {Object} params.token jwt.
 * @param {Function} params.callback Callback.
 */
function manipulateStation({
  socket,
  io,
  password,
  boostingSignal,
  token,
  callback,
}) {
  if (!objectValidator.isValidData({ password, boostingSignal }, { password: true, boostingSignal: true })) {
    callback({ error: new errorCreator.InvalidData({ expected: '{ password, boostingSignal }' }) });

    return;
  }

  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.HackLantern.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const { user: authUser } = data;

      dbLanternHack.getLanternHack({
        owner: authUser.username,
        callback: ({ error: getError, data: hackLanternData }) => {
          if (getError) {
            callback({ error: getError });

            return;
          }

          const { lanternHack } = hackLanternData;
          const correctUser = lanternHack.gameUsers.find(gameUser => gameUser.isCorrect);

          if (correctUser.password === password.toLowerCase() && lanternHack.triesLeft > 0) {
            updateSignalValue({
              boostingSignal,
              stationId: lanternHack.stationId,
              callback: ({ error: updateError }) => {
                if (updateError) {
                  callback({ error: new errorCreator.External({ name: 'wrecking' }) });

                  return;
                }

                dbLanternHack.setDone({
                  owner: authUser.username,
                  wasSuccessful: true,
                  callback: ({ error: removeError }) => {
                    if (removeError) {
                      callback({ error: removeError });

                      return;
                    }

                    const { stationId } = lanternHack;

                    dbLanternHack.getStation({
                      stationId,
                      callback: (stationData) => {
                        if (stationData.error) {
                          callback({ error });

                          return;
                        }

                        const { stationName } = stationData.data.station;

                        messageManager.sendBroadcastMsg({
                          io,
                          socket,
                          message: {
                            ownerId: dbConfig.users.systemUser.objectId,
                            text: [
                              `ACTIVITY DETECTED: user ${authUser.username} has ${boostingSignal
                                ? 'blocked'
                                : 'amplified'} the signal to station ${stationName}`,
                            ],
                          },
                          internalCallUser: authUser,
                          callback: ({ error: messageError }) => {
                            if (messageError) {
                              callback({ error: messageError });

                              return;
                            }

                            callback({ data: { success: true, boostingSignal } });
                          },
                        });
                      },
                    });
                  },
                });
              },
            });

            return;
          }

          dbLanternHack.lowerHackTries({
            owner: authUser.username,
            callback: ({ error: lowerError, data: lowerData }) => {
              if (lowerError) {
                callback({ error: lowerError });

                return;
              }

              const { lanternHack: loweredHack } = lowerData;

              if (loweredHack.triesLeft <= 0) {
                dbLanternHack.setDone({
                  owner: authUser.username,
                  callback: ({ error: removeError }) => {
                    if (removeError) {
                      callback({ error: removeError });

                      return;
                    }

                    callback({
                      data: {
                        success: false,
                        triesLeft: loweredHack.triesLeft,
                      },
                    });
                  },
                });

                dbLanternHack.setDone({
                  owner: authUser.userName,
                  wasSuccessful: false,
                  callback: ({ error: removeError }) => {
                    if (removeError) {
                      callback({ error: removeError });

                      return;
                    }

                    callback({
                      data: {
                        success: false,
                        triesLeft: loweredHack.triesLeft,
                      },
                    });
                  },
                });

                return;
              }

              const sentPassword = Array.from(password.toLowerCase());
              const matches = sentPassword.filter(char => correctUser.password.includes(char));

              callback({
                data: {
                  success: false,
                  triesLeft: loweredHack.triesLeft,
                  matches: { amount: matches.length },
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
 * Get lantern hack.
 * @param {Object} params Parameters.
 * @param {number} params.stationId Id of the station to hack.
 * @param {string} params.token jwt.
 * @param {Function} params.callback Callback.
 */
function getLanternHack({
  stationId,
  token,
  callback,
}) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.HackLantern.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      if (!objectValidator.isValidData({ stationId }, { stationId: true })) {
        callback({ error: new errorCreator.InvalidData({ expected: '{ stationId }' }) });

        return;
      }

      const { user: authUser } = data;

      dbLanternHack.getLanternHack({
        owner: authUser.username,
        callback: ({ error: getError, data: lanternHackData }) => {
          if (getError && getError.type !== errorCreator.ErrorTypes.DOESNOTEXIST) {
            callback({ error: getError });

            return;
          }

          /**
           * Generates a new hack if the chosen station is different from the users previous choice
           * Different users + passwords are connected to specific stations
           */
          if (!lanternHackData || lanternHackData.lanternHack.stationId !== stationId) {
            createLanternHack({
              stationId,
              owner: authUser.username,
              triesLeft: appConfig.hackingTriesAmount,
              callback: ({ error: createError, data: createdData }) => {
                if (createError) {
                  callback({ error: createError });

                  return;
                }

                createHackData({
                  lanternHack: createdData.lanternHack,
                  callback: ({ error: hackDataErr, data: hackData }) => {
                    if (hackDataErr) {
                      callback({ error: hackDataErr });

                      return;
                    }

                    callback({ data: hackData });
                  },
                });
              },
            });

            return;
          }

          createHackData({
            lanternHack: lanternHackData.lanternHack,
            callback: ({ error: hackDataErr, data: hackData }) => {
              if (hackDataErr) {
                callback({ error: hackDataErr });

                return;
              }

              callback({ data: hackData });
            },
          });
        },
      });
    },
  });
}

/**
 * Get round and stations.
 * @param {Object} params Parameters.
 * @param {string} params.token jwt.
 * @param {Function} params.callback Callback.
 */
function getLanternInfo({ token, callback }) {
  lanternRoundManager.getLanternRound({
    token,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const startTime = data.startTime
        ? new Date(data.startTime)
        : 0;
      const endTime = data.endTime
        ? new Date(data.endTime)
        : 0;

      if (!data.isActive) {
        callback({
          data: {
            timeLeft: textTools.getDifference({ laterDate: startTime, firstDate: new Date() }),
            round: data,
          },
        });

        return;
      }

      lanternStationManager.getLanternStations({
        token,
        callback: ({ error: stationError, data: stationData }) => {
          if (stationError) {
            callback({ error: stationError });

            return;
          }

          const {
            activeStations,
            inactiveStations,
          } = stationData;

          lanternTeamManager.getLanternTeams({
            token,
            callback: ({ error: teamsError, data: teamsData }) => {
              if (teamsError) {
                callback({ error: teamsError });

                return;
              }

              callback({
                data: {
                  activeStations,
                  inactiveStations,
                  round: data,
                  timeLeft: textTools.getDifference({ laterDate: endTime, firstDate: new Date() }),
                  teams: teamsData.teams,
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
 * Get wrecking status
 * @param {Object} params Parameters.
 * @param {Object} params.socket Socket.io.
 * @param {Function} params.callback Callback.
 */
function getWreckingStatus({
  socket,
  callback,
}) {
  dbLanternHack.getLanternStats({
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const { lanternStats } = data;
      const {
        round,
        teams,
        stations,
      } = lanternStats;

      socket.emit('lanternTeams', { data: { teams } });
      socket.emit('lanternStations', { data: { stations } });
      socket.emit('lanternRound', { data: { round } });
    },
  });
}

exports.createLanternHack = createLanternHack;
exports.updateSignalValue = updateSignalValue;
exports.manipulateStation = manipulateStation;
exports.getLanternHack = getLanternHack;
exports.getLanternInfo = getLanternInfo;
exports.resetStations = resetStations;
exports.startResetInterval = startResetInterval;
exports.getWreckingStatus = getWreckingStatus;
