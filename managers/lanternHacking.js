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

const objectValidator = require('../utils/objectValidator');
const appConfig = require('../config/defaults/config').app;
const dbConfig = require('../config/defaults/config').databasePopulation;
const errorCreator = require('../objects/error/errorCreator');
const dbLanternHack = require('../db/connectors/lanternhack');
const textTools = require('../utils/textTools');
const authenticator = require('../helpers/authenticator');
const lanternRoundManager = require('../managers/lanternRounds');
const lanternStationManager = require('../managers/lanternStations');
const lanternTeamManager = require('../managers/lanternTeams');
const poster = require('../helpers/poster');

/**
 * Lower/increase signal value on all stations towards default value
 * @param {Function} params.callback Callback
 */
function resetStations({ io, callback = () => {} }) {
  if (appConfig.mode === appConfig.Modes.TEST || appConfig.signalResetTimeout === 0) {
    return;
  }

  dbLanternHack.getLanternRound({
    callback: ({ error: roundError, data: roundData }) => {
      if (roundError) {
        callback({ error: roundError });

        return;
      } else if (!roundData.isActive) {
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

            const stationId = station.stationId;
            const signalValue = station.signalValue;
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
            const stationId = station.stationId;
            const newSignalValue = station.signalValue;

            dbLanternHack.updateSignalValue({
              stationId,
              signalValue: newSignalValue,
              callback: ({ error: updateError }) => {
                if (updateError) {
                  return;
                }

                poster.postRequest({
                  host: appConfig.hackingApiHost,
                  path: '/reports/set_boost',
                  data: {
                    station: stationId,
                    boost: newSignalValue,
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
 * Starts reset interval for stations
 * @param {Object} params.io Socket io
 */
function startResetInterval({ io }) {
  setInterval(resetStations, appConfig.signalResetTimeout, { io });
}

/**
 * Update signal value on a station
 * @param {number} params.stationId Station ID
 * @param {boolean} params.boostingSignal Should the signal be increased?
 * @param {Function} params.callback Callback
 */
function updateSignalValue({ stationId, boostingSignal, callback }) {
  dbLanternHack.getStation({
    stationId,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const { station } = data;

      /**
       * Set new signalvalue
       * @private
       * @param {number} params.signalValue New signal value
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

      const signalValue = station.signalValue;
      const difference = Math.abs(signalValue - appConfig.signalDefaultValue);
      let signalChange = (appConfig.signalThreshold - difference) * appConfig.signalChangePercentage;

      if (boostingSignal && signalValue < appConfig.signalDefaultValue) {
        signalChange = appConfig.signalMaxChange;
      } else if (!boostingSignal && signalValue > appConfig.signalDefaultValue) {
        signalChange = appConfig.signalMaxChange;
      }

      setNewValue({ signalValue: signalValue + (boostingSignal ? signalChange : -Math.abs(signalChange)) });
    },
  });
}

/**
 * Create client hack data
 * @param {Object} params.lanternHack Lantern hack
 * @param {Function} params.callback Callback
 */
function createHackData({ lanternHack, callback }) {
  dbLanternHack.getAllFakePasswords({
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const passwords = data.passwords;
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
 * Create lantern hack for user
 * @param {number} params.stationId Station id
 * @param {string} params.owner User name of the hack owner
 * @param {number} params.triesLeft Amount of hacking tries before the hack fails
 * @param {Function} params.callback Callback
 */
function createLanternHack({ stationId, owner, triesLeft, callback }) {
  dbLanternHack.getGameUsers({
    stationId,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      } else if (data.gameUsers.length <= 0) {
        callback({ error: new errorCreator.DoesNotExist({ name: 'game users' }) });

        return;
      }

      const gameUsers = textTools.shuffleArray(data.gameUsers).slice(0, 2).map((gameUser) => {
        const passwordRand = Math.floor(Math.random() * (gameUser.passwords.length));
        const password = gameUser.passwords[passwordRand];
        const randomIndex = Math.floor(Math.random() * password.length);

        return {
          password,
          userName: gameUser.userName,
          passwordHint: { index: randomIndex, character: password.charAt(randomIndex) },
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
 * Manipulate station
 * @param {string} params.password Password to allow boost change
 * @param {boolean} params.boostingSignal Will the boost be increased?
 * @param {Object} params.token jwt
 * @param {Function} params.callback Callback
 */
function manipulateStation({ password, boostingSignal, token, callback }) {
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

      const user = data.user;

      dbLanternHack.getLanternHack({
        owner: user.userName,
        callback: ({ error: getError, data: hackLanternData }) => {
          if (getError) {
            callback({ error: getError });

            return;
          }

          const lanternHack = hackLanternData.lanternHack;
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

                dbLanternHack.removeLanternHack({
                  owner: user.userName,
                  callback: ({ error: removeError }) => {
                    if (removeError) {
                      callback({ error: removeError });

                      return;
                    }

                    callback({ data: { success: true, boostingSignal } });
                  },
                });
              },
            });

            return;
          }

          dbLanternHack.lowerHackTries({
            owner: user.userName,
            callback: ({ error: lowerError, data: lowerData }) => {
              if (lowerError) {
                callback({ error: lowerError });

                return;
              }

              const { lanternHack: loweredHack } = lowerData;

              if (loweredHack.triesLeft <= 0) {
                dbLanternHack.removeLanternHack({
                  owner: user.userName,
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
              const correctPlacement = sentPassword.filter(char => correctUser.password.indexOf(char) === sentPassword.includes(char));

              callback({
                data: {
                  correctPlacement,
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
 * Get lantern hack
 * @param {number} params.stationId ID of the station to hack
 * @param {string} params.token jwt
 * @param {Function} params.callback Callback
 */
function getLanternHack({ stationId, token, callback }) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.HackLantern.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      } else if (!objectValidator.isValidData({ stationId }, { stationId: true })) {
        callback({ error: new errorCreator.InvalidData({ expected: '{ stationId }' }) });

        return;
      }

      const user = data.user;

      dbLanternHack.getLanternHack({
        owner: user.userName,
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
              owner: user.userName,
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
 * Get round and stations
 * @param {string} params.token jwt
 * @param {Function} params.callback Callback
 */
function getLanternInfo({ token, callback }) {
  lanternRoundManager.getLanternRound({
    token,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const startTime = data.startTime ? new Date(data.startTime) : 0;
      const endTime = data.endTime ? new Date(data.endTime) : 0;

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

          lanternTeamManager.getLanternTeams({
            token,
            callback: ({ error: teamsError, data: teamsData }) => {
              if (teamsError) {
                callback({ error: teamsError });

                return;
              }


              callback({
                data: {
                  round: data,
                  timeLeft: textTools.getDifference({ laterDate: endTime, firstDate: new Date() }),
                  teams: teamsData.teams,
                  activeStations: stationData.activeStations,
                  inactiveStations: stationData.inactiveStations,
                },
              });
            },
          });
        },
      });
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
