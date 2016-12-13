/*
 Copyright 2015 Aleksandar Jankovic

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

const dbConnector = require('../../db/databaseConnector');
const dbStation = require('../../db/connectors/station');
const messenger = require('../../socketHelpers/messenger');
const objectValidator = require('../../utils/objectValidator');
const manager = require('../../socketHelpers/manager');
const appConfig = require('../../config/defaults/config').app;
const databasePopulation = require('../../config/defaults/config').databasePopulation;
const http = require('http');
const request = require('request');
const gameUserManager = require('../../utils/gameUserManager');

const signalThreshold = 50;
const signalDefault = 100;
const changePercentage = 0.2;
const signalMaxChange = 10;
let resetInterval = null;

/**
 * Post request to external server
 * @param {Object} params - Parameters
 * @param {string} params.host - Host name
 * @param {string} params.path - Path
 * @param {Function} params.callback - Path
 * @param {*} params.data - Data to send
 */
function postRequest(params) {
  const host = params.host;
  const path = params.path;
  const callback = params.callback;
  const dataString = JSON.stringify(params.data);
  const options = {
    host,
    path,
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': dataString.length,
    },
    method: 'POST',
  };

  const req = http.request(options, (response) => {
    response.on('end', () => {
      callback(response.statusCode);
    });
  });

  req.write(dataString);
  req.end();
}

/**
 * Create signal value reset interval
 */
function setResetInterval() {
  /**
   * Lower/increase signal value on all stations towards default value
   * @private
   */
  function resetStations() {
    dbStation.getAllStations((err, stations) => {
      if (err) {
        return;
      }

      for (const station of stations) {
        const signalValue = station.signalValue;
        const stationId = station.stationId;
        let newSignalValue = signalValue;

        if (signalValue !== signalDefault) {
          if (signalValue > signalDefault) {
            newSignalValue -= 1;
          } else {
            newSignalValue += 1;
          }

          dbStation.updateSignalValue(stationId, newSignalValue, (signErr) => {
            if (signErr) {
              return;
            }

            postRequest({
              host: 'wrecking.bbreloaded.se',
              path: '/reports/set_boost',
              data: {
                station: stationId,
                boost: newSignalValue,
                key: 'hemligt',
              },
              callback: () => {
              },
            });
          });
        }
      }
    });
  }

  if (appConfig.signalResetInterval !== 0) {
    if (resetInterval === null) {
      resetInterval = setInterval(resetStations, appConfig.signalResetInterval);
    } else {
      clearInterval(resetInterval);
      resetInterval = setInterval(resetStations, appConfig.signalResetInterval);
    }
  }
}

/**
 * @private
 * @param {string[]} array - Array to be shuffled
 * @returns {string[]} Shuffled array
 */
function shuffleArray(array) {
  const shuffledArray = array;
  let currentIndex = array.length;
  let tempVal;
  let randIndex;

  while (currentIndex !== 0) {
    randIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;
    tempVal = array[currentIndex];
    shuffledArray[currentIndex] = array[randIndex];
    shuffledArray[randIndex] = tempVal;
  }

  return shuffledArray;
}

/**
 * Fetch station status from external server
 * @param {Function} callback - Callback
 */
function retrieveStationStats(callback) {
  request.get('http://wrecking.bbreloaded.se/public.json', (err, response, body) => {
    if (err) {
      console.log('Error request', response, err);

      return;
    }

    if (body) {
      /**
       * @type {{ stations: Object[], teams: Object[], active_round: Object, coming_rounds: Object[] }}
       */
      const stats = JSON.parse(body);
      const stations = stats.stations;
      const teams = stats.teams;
      const currentRound = stats.active_round;
      const futureRounds = stats.coming_rounds;

      callback(stations, teams, currentRound, futureRounds);
    }
  });
}

/**
 * Update signal value on a station
 * @param {number} stationId - Station ID
 * @param {boolean} boostingSignal - Should the signal be increased?
 */
function updateSignalValue(stationId, boostingSignal) {
  dbStation.getStation(stationId, (err, station) => {
    if (err) {
      return;
    }

    /**
     * Set new signalvalue
     * @private
     * @param {number} newSignalValue - New value
     */
    function setNewValue(newSignalValue) {
      let ceilSignalValue = Math.ceil(newSignalValue);
      const minValue = signalDefault - signalThreshold;
      const maxValue = signalDefault + signalThreshold;

      if (ceilSignalValue > maxValue) {
        ceilSignalValue = maxValue;
      } else if (ceilSignalValue < minValue) {
        ceilSignalValue = minValue;
      }

      dbStation.updateSignalValue(stationId, ceilSignalValue, (updateErr) => {
        if (updateErr) {
          return;
        }
        postRequest({
          host: 'wrecking.bbreloaded.se',
          path: '/reports/set_boost',
          data: {
            station: stationId,
            boost: ceilSignalValue,
            key: 'hemligt',
          },
          callback: (response) => {
            console.log(response);
          },
        });
      });
    }
    const signalValue = station.signalValue;
    const difference = Math.abs(signalValue - signalDefault);
    let signalChange = (signalThreshold - difference) * changePercentage;

    if (boostingSignal && signalValue < signalDefault) {
      signalChange = signalMaxChange;
    } else if (!boostingSignal && signalValue > signalDefault) {
      signalChange = signalMaxChange;
    }

    setNewValue(signalValue + (boostingSignal ? signalChange : -Math.abs(signalChange)));
  });
}

/**
 * @param {Object} socket - Socket.IO socket
 */
function handle(socket) {
  socket.on('createGameUser', (params) => {
    manager.userAllowedCommand(socket.id, databasePopulation.commands.creategameuser.commandName, () => {
    });

    if (!objectValidator.isValidData(params, { userName: true, password: true })) {
      return;
    }

    const gameUser = {
      userName: params.userName,
      password: params.password,
    };

    dbConnector.createGameUser(gameUser, () => {
    });
  });

  socket.on('createGamePassword', (params) => {
    manager.userAllowedCommand(socket.id, databasePopulation.commands.creategameword.commandName, () => {
    });

    if (!objectValidator.isValidData(params, { password: true })) {
      return;
    }

    dbConnector.createGamePassword(params, () => {
    });
  });

  socket.on('getAllGamePasswords', () => {
    manager.userAllowedCommand(socket.id, databasePopulation.commands.creategameword.commandName, () => {
    });

    dbConnector.getAllGamePasswords((err, gamePasswords) => {
      if (err) {
        return;
      }

      messenger.sendSelfMsg({
        socket,
        message: {
          text: [gamePasswords.map(gamePassword => `${gamePassword.password}`).join(' - ')],
        },
      });
    });
  });

  socket.on('getAllGameUsers', () => {
    manager.userAllowedCommand(socket.id, databasePopulation.commands.creategameuser.commandName, () => {
    });

    dbConnector.getAllGameUsers((err, gameUsers) => {
      if (err) {
        return;
      }

      console.log('Get all game users');

      messenger.sendSelfMsg({
        socket,
        message: {
          text: gameUsers.map(gameUser => `Name: ${gameUser.userName}. Pass: ${gameUser.password}`),
        },
      });
    });
  });

  socket.on('getStationStats', (params, callback) => {
    retrieveStationStats((stations, teams, currentRound, futureRounds) => {
      dbStation.getActiveStations((err, dbStations) => {
        if (err) {
          return;
        }

        if (stations) {
          for (const station of stations) {
            const foundStation = dbStations.find(dbs => dbs.stationId === station.id);

            if (foundStation) {
              station.signalValue = foundStation.signalValue;
            } else {
              station.signalValue = station.boost;
            }
          }

          callback({ stations, teams, currentRound, futureRounds, now: new Date() });
        }
      });
    });
  });

  socket.on('manipulateStation', (params) => {
    manager.userAllowedCommand(socket.id, databasePopulation.commands.hacklantern.commandName, (allowErr, allowed, allowedUser) => {
      if (allowErr || !allowed) {
        return;
      }

      if (!objectValidator.isValidData(params, { users: true, gameUser: true, choice: true, stationId: true })) {
        return;
      }

      const sentUser = params.gameUser;

      if (params.users.map(user => user.userName).indexOf(sentUser.userName) === -1) {
        messenger.sendSelfMsg({
          socket,
          message: {
            text: ['User is not authorized to access the LANTERN'],
          },
        });
        socket.emit('commandStep', { reset: true });

        return;
      }

      dbConnector.getGameUser(sentUser.userName.toLowerCase(), (err, gameUser) => {
        if (err) {
          socket.emit('commandFail');

          return;
        } else if (gameUser === null) {
          messenger.sendSelfMsg({
            socket,
            message: {
              text: [`User ${sentUser.userName} does not exist`],
            },
          });
          socket.emit('commandStep', { reset: true });

          return;
        }

        if (params.gameUser.password === gameUser.password) {
          const choice = params.choice;

          switch (choice) {
            case '1': {
              messenger.sendSelfMsg({
                socket,
                message: {
                  text: [
                    'You have been authorized to access the LANTERN',
                    'LSM is fully functional and running',
                    'Amplifying signal output',
                  ],
                },
              });
              socket.emit('commandSuccess', { noStepCall: true });
              updateSignalValue(params.stationId, true);
              messenger.sendMsg({
                socket,
                message: {
                  text: [`LANTERN ${params.stationId}> User ${allowedUser.userName} has amplified the signal of the station. User is part of team: ${allowedUser.team || '-'}`],
                  userName: 'SYSTEM',
                },
                sendTo: `lantern${params.stationId}`,
              });

              break;
            }
            case '2': {
              messenger.sendSelfMsg({
                socket,
                message: {
                  text: [
                    'You have been authorized to access the LANTERN',
                    'LSM is fully functional and running',
                    'Dampening signal output',
                  ],
                },
              });
              socket.emit('commandSuccess', { noStepCall: true });
              updateSignalValue(params.stationId, false);
              messenger.sendMsg({
                socket,
                message: {
                  text: [`LANTERN ${params.stationId}> WARNING! User ${allowedUser.userName} has dampened the signal of the station. User is part of team: ${allowedUser.team || '-'}`],
                  userName: 'SYSTEM',
                },
                sendTo: `lantern${params.stationId}`,
              });

              break;
            }
            default: {
              messenger.sendSelfMsg({
                socket,
                message: {
                  text: ['Incorrect choice'],
                },
              });
              socket.emit('commandStep', { reset: true });

              break;
            }
          }
        } else {
          messenger.sendSelfMsg({
            socket,
            message: {
              text: ['Incorrect password'],
            },
          });
          socket.emit('commandStep', { reset: true });
        }
      });
    });
  });

  socket.on('getGameUsersSelection', (params) => {
    if (!objectValidator.isValidData(params, { userAmount: true })) {
      return;
    }

    dbConnector.getAllGameUsers((err, gameUsers) => {
      if (err || gameUsers === null) {
        socket.emit('commandFail');

        return;
      }

      dbConnector.getAllGamePasswords((passErr, gamePasswords) => {
        if (passErr || gamePasswords === null) {
          socket.emit('commandFail');

          return;
        }

        const userAmount = params.userAmount;
        const users = shuffleArray(gameUsers).slice(0, userAmount);
        const correctPassword = users[Math.floor(Math.random() * userAmount)].password;
        const shuffledPasswords = shuffleArray(gamePasswords.map(password => password.password));
        const halfPasswordLength = shuffledPasswords.length > 12 ? 6 : shuffledPasswords.length / 2;
        const passwordMaxLength = shuffledPasswords.length > 12 ? 12 : shuffledPasswords.length;

        const passwords = [
          shuffleArray(shuffledPasswords.slice(0, halfPasswordLength).concat([correctPassword])),
          shuffleArray(shuffledPasswords.slice(halfPasswordLength, passwordMaxLength).concat([correctPassword])),
        ];

        for (const user of users) {
          user.hints = shuffleArray(gameUserManager.createHints(user.password)).slice(0, 2);
        }

        socket.emit('commandSuccess', {
          freezeStep: true,
          newData: {
            users,
            passwords,
          },
        });
      });
    });
  });

  socket.on('getActiveStations', () => {
    retrieveStationStats((stations) => {
      const activeStations = stations ? stations.filter(station => station.active === true) : [];

      if (activeStations.length > 0) {
        socket.emit('commandSuccess', { newData: { stations: activeStations } });
      } else {
        messenger.sendSelfMsg({
          socket,
          message: {
            text: [
              '----------------',
              'LANTERN INACTIVE',
              '----------------',
              'There are no active LANTERNs available',
              'Unable to proceed',
              'Please wait for the next connection window',
            ],
          },
        });
        socket.emit('commandFail');
      }
    });
  });
}

setResetInterval();

exports.handle = handle;
