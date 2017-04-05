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
const dbDocFile = require('../../db/connectors/docFile');
const errorCreator = require('../../objects/error/errorCreator');

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
    manager.userIsAllowed(socket.id, databasePopulation.commands.time.commandName, (allowErr, allowed) => {
      if (allowErr || !allowed) {
        return;
      }

      const now = new Date();

      now.setFullYear(now.getFullYear() + appConfig.yearModification);
      callback({ time: now });
    });
  });

  socket.on('createDocFile', (docFile, callback = () => {}) => {
    if (!objectValidator.isValidData(docFile, { docFileId: true, text: true, title: true })) {
      callback({ error: new errorCreator.InvalidData({}) });

      return;
    }

    manager.userIsAllowed(socket.id, databasePopulation.commands.docFiles.commandName, (allowErr, allowed, user) => {
      if (allowErr || !allowed) {
        callback({ error: new errorCreator.NotAllowed({ used: databasePopulation.commands.docFiles.commandName }) });

        return;
      }

      docFile.creator = user.userName;

      dbDocFile.createDocFile(docFile, (err, newDocFile) => {
        if (err) {
          callback({ error: new errorCreator.Database({}) });

          return;
        }

        callback({ data: { docFile: newDocFile } });

        if (newDocFile.isPublic) {
          socket.broadcast.emit('docFile', { docFile: newDocFile });
        } else if (newDocFile.team && newDocFile.team !== '') {
          const teamRoom = newDocFile.team + appConfig.teamAppend;

          socket.broadcast.to(teamRoom).emit('docFile', { docFile: newDocFile });
        }
      });
    });
  });

  socket.on('updateDocFile', ({ docFileId, title, text, visibility, isPublic }, callback = () => {}) => {
    if (!objectValidator.isValidData({ docFileId }, { docFileId: true })) {
      callback({ error: new errorCreator.InvalidData({}) });

      return;
    }

    manager.userIsAllowed(socket.id, databasePopulation.commands.docFiles.commandName, (allowErr, allowed) => {
      if (allowErr || !allowed) {
        callback({ error: new errorCreator.NotAllowed({ used: databasePopulation.commands.docFiles.commandName }) });

        return;
      }

      dbDocFile.updateDocFile(docFileId, { title, text, visibility, isPublic }, (err, docFile) => {
        if (err) {
          callback({ error: new errorCreator.Database({}) });

          return;
        }

        callback({ data: { docFile } });
      });
    });
  });

  socket.on('getDocFile', ({ docFileId }, callback = () => {}) => {
    if (!objectValidator.isValidData({ docFileId }, { docFileId: true })) {
      callback({ error: new errorCreator.InvalidData({}) });

      return;
    }

    manager.userIsAllowed(socket.id, databasePopulation.commands.getDocFile.commandName, (allowErr, allowed, user) => {
      if (allowErr || !allowed) {
        callback({ error: new errorCreator.NotAllowed({ used: databasePopulation.commands.getDocFile.commandName }) });

        return;
      }

      dbDocFile.getDocFile(docFileId.toLowerCase(), user.accessLevel, (err, docFile) => {
        if (err) {
          callback({ error: new errorCreator.Database({}) });

          return;
        }

        callback({ data: { docFile } });
      });
    });
  });

  socket.on('getDocFilesList', (params, callback = () => {}) => {
    manager.userIsAllowed(socket.id, databasePopulation.commands.getDocFiles.commandName, (allowErr, allowed, user) => {
      if (allowErr || !allowed) {
        callback({ error: new errorCreator.NotAllowed({ used: databasePopulation.commands.getDocFiles.commandName }) });

        return;
      }

      dbDocFile.getDocFilesList(user.accessLevel, user.userName, (err, docFiles) => {
        if (err) {
          callback({ error: new errorCreator.Database() });

          return;
        }

        const userDocFiles = docFiles.filter(docFile => docFile.creator === user.userName);
        const publicDocFiles = docFiles.filter(docFile => docFile.creator !== user.userName && docFile.isPublic);

        callback({ data: { userDocFiles, publicDocFiles } });
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
    manager.userIsAllowed(socket.id, databasePopulation.commands.weather.commandName, (allowErr, allowed) => {
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
    manager.userIsAllowed(socket.id, databasePopulation.commands.rebootall.commandName, (allowErr, allowed) => {
      if (allowErr || !allowed) {
        return;
      }

      socket.broadcast.emit('reboot');
    });
  });
}

exports.handle = handle;
