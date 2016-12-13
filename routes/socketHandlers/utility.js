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

const manager = require('../../socketHelpers/manager');
const databasePopulation = require('../../config/defaults/config').databasePopulation;
const appConfig = require('../../config/defaults/config').app;
const logger = require('../../utils/logger');
const http = require('http');
const objectValidator = require('../../utils/objectValidator');
const dbArchive = require('../../db/connectors/archive');

// FIXME SMHI API changed. Structure needs to be fixed here before usage
/**
 * Prepare a weather report from the retrieved json object
 * @param {Object} jsonObj - JSON object retrieved from external source
 * @returns {Object} Weather report
 */
function createWeatherReport(jsonObj) {
  const weatherRep = jsonObj;

  // weatherRep.time = new Date(jsonObj.validTime);
  // weatherRep.temperature = jsonObj.parameters.find((group) => group.name === 't');
  // weatherRep.visibility = jsonObj.parameters.find((group) => group.name === 'vis');
  // weatherRep.windDirection = jsonObj.parameters.find((group) => group.name === 'wd');
  // weatherRep.thunder = jsonObj.parameters.find((group) => group.name === 'tstm');
  // weatherRep.gust = jsonObj.parameters.find((group) => group.name === 'gust');
  // weatherRep.cloud = jsonObj.parameters.find((group) => group.name === 'tcc_mean');
  // weatherRep.precipitation = jsonObj.parameters.find((group) => group.name === 'pcat');

  return weatherRep;
}

/**
 * @param {Object} socket - Socket.IO socket
 */
function handle(socket) {
  /**
   * Time command. Returns current date
   * Emits time
   */
  socket.on('time', (params, callback = () => {}) => {
    manager.userAllowedCommand(socket.id, databasePopulation.commands.time.commandName, (allowErr, allowed) => {
      if (allowErr || !allowed) {
        return;
      }

      const now = new Date();

      now.setFullYear(now.getFullYear() + appConfig.yearModification);
      callback({ time: now });
    });
  });

  socket.on('getArchive', (params, callback = () => {}) => {
    if (!objectValidator.isValidData(params, { archiveId: true })) {
      return;
    }

    manager.userAllowedCommand(socket.id, databasePopulation.commands.archives.commandName, (allowErr, allowed, user) => {
      if (allowErr || !allowed) {
        return;
      }

      dbArchive.getArchive(params.archiveId.toLowerCase(), user.accessLevel, (err, archive) => {
        if (err) {
          return;
        }

        callback({ archive });
      });
    });
  });

  socket.on('getArchivesList', (params, callback = () => {}) => {
    manager.userAllowedCommand(socket.id, databasePopulation.commands.archives.commandName, (allowErr, allowed, user) => {
      if (allowErr || !allowed) {
        return;
      }

      dbArchive.getArchivesList(user.accessLevel, (err, archives) => {
        if (err) {
          return;
        }

        callback({ archives });
      });
    });
  });

  // TODO Should average values across hours
  // FIXME SMHI API changed. Structure needs to be fixed here before usage
  /**
   * Weather command. Returns weather for coming days. Weather is retrieved from external source
   * Emits weather
   */
  socket.on('weather', () => {
    manager.userAllowedCommand(socket.id, databasePopulation.commands.weather.commandName, (allowErr, allowed) => {
      if (allowErr || !allowed) {
        return;
      }

      const lat = appConfig.centerLat.toFixed(3);
      const lon = appConfig.centerLong.toFixed(3);
      const hoursAllowed = [0, 4, 8, 12, 16, 20];
      let url = '';

      if (appConfig.country.toLowerCase() === 'sweden') {
        url = `http://opendata-download-metfcst.smhi.se/api/category/pmp2g/version/2/geotype/point/lon/${lon}/lat/${lat}/data.json`;
      }

      http.get(url, (resp) => {
        let body = '';

        resp.on('data', (chunk) => {
          body += chunk;
        });

        resp.on('end', () => {
          /**
           * @type {{ timeSeries: Object[] }}
           */
          const response = JSON.parse(body);
          /**
           * @type { { validTime: Date }[] }
           */
          const times = response.timeSeries;
          const now = new Date();
          const report = [];

          for (let i = 0; i < times.length; i += 1) {
            const weatherRep = createWeatherReport(times[i]);

            if (weatherRep.time > now && hoursAllowed.indexOf(weatherRep.time.getHours()) > -1) {
              report.push(weatherRep);
            } else if (weatherRep.time < now && times[i + 1] && new Date(times[i + 1].validTime) > now) {
              if (now.getMinutes() > 30) {
                report.push(createWeatherReport(times[i + 1]));
              } else {
                report.push(weatherRep);
              }
            }
          }

          socket.emit('weather', report.splice(0, appConfig.maxWeatherReports));
        });
      }).on('error', (err) => {
        logger.sendErrorMsg({
          code: logger.ErrorCodes.general,
          text: ['Failed to get weather status'],
          err,
        });
      });
    });
  });

  socket.on('rebootAll', () => {
    manager.userAllowedCommand(socket.id, databasePopulation.commands.rebootall.commandName, (allowErr, allowed) => {
      if (allowErr || !allowed) {
        return;
      }

      socket.broadcast.emit('reboot');
    });
  });
}

exports.handle = handle;
