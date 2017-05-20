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
const dbSimpleMsg = require('../../db/connectors/simpleMsg');
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
      if (allowErr) {
        callback({ error: new errorCreator.Database({}) });

        return;
      } else if (!allowed) {
        callback({ error: new errorCreator.NotAllowed({ name: 'createDocFile' }) });

        return;
      }

      docFile.creator = user.userName;
      docFile.docFileId = docFile.docFileId.toLowerCase();

      dbDocFile.createDocFile(docFile, (err, newDocFile) => {
        if (err) {
          callback({ error: new errorCreator.Database({}) });

          return;
        } else if (!newDocFile) {
          callback({ error: new errorCreator.AlreadyExists({ name: 'document' }) });

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
      callback({ error: new errorCreator.InvalidData({ expected: '{ docFileId }' }) });

      return;
    }

    manager.userIsAllowed(socket.id, databasePopulation.commands.docFiles.commandName, (allowErr, allowed) => {
      if (allowErr) {
        callback({ error: new errorCreator.Database({}) });

        return;
      } else if (!allowed) {
        callback({ error: new errorCreator.NotAllowed({ name: 'updateDocFile' }) });

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

      dbDocFile.getDocFilesList(user, (err, docFiles) => {
        if (err) {
          callback({ error: new errorCreator.Database() });

          return;
        }

        const filteredDocFiles = docFiles.map((docFile) => {
          const filteredDocFile = docFile;

          if ((docFile.team && (!user.team || docFile.team !== user.team)) || (!docFile.team && docFile.creator !== user.userName && !docFile.isPublic)) {
            filteredDocFile.docFileId = null;
            filteredDocFile.isLocked = true;
          }

          return filteredDocFile;
        });

        const myDocFiles = [];
        const myTeamDocFiles = [];
        const teamDocFiles = [];
        const userDocFiles = filteredDocFiles.filter((docFile) => {
          if (!docFile.team && docFile.creator !== user.userName) {
            return true;
          }

          if (docFile.creator === user.userName) {
            myDocFiles.push(docFile);
          }

          if (docFile.team) {
            if (user.team && user.team === docFile.team) {
              myTeamDocFiles.push(docFile);
            } else {
              teamDocFiles.push(docFile);
            }
          }

          return false;
        });

        callback({ data: { myDocFiles, myTeamDocFiles, userDocFiles, teamDocFiles } });
      });
    });
  });

  socket.on('rebootAll', () => {
    manager.userIsAllowed(socket.id, databasePopulation.commands.rebootAll.commandName, (allowErr, allowed) => {
      if (allowErr || !allowed) {
        return;
      }

      socket.broadcast.emit('reboot');
    });
  });

  socket.on('simpleMsg', ({ text }, callback = () => {}) => {
    if (!objectValidator.isValidData({ text }, { text: true })) {
      callback({ error: new errorCreator.InvalidData({ expected: '{ text }' }) });

      return;
    }

    manager.userIsAllowed(socket.id, databasePopulation.commands.simpleMsg.commandName, (allowErr, allowed) => {
      if (allowErr) {
        callback({ error: new errorCreator.Database({}) });

        return;
      } else if (!allowed) {
        callback({ error: new errorCreator.NotAllowed({ name: 'simpleMsg' }) });

        return;
      }

      const simpleMsg = {
        time: new Date(),
        userName: allowed.userName,
        text,
      };

      dbSimpleMsg.createSimpleMsg(simpleMsg, (err, newSimpleMsg) => {
        if (allowErr || !newSimpleMsg) {
          callback({ error: new errorCreator.Database({}) });

          return;
        }

        callback({ data: { simpleMsg } });
        socket.broadcast.emit('simpleMsg', simpleMsg);
      });
    });
  });

  socket.on('getSimpleMessages', (params, callback = () => {}) => {
    manager.userIsAllowed(socket.id, databasePopulation.commands.getSimpleMsgs.commandName, (allowErr, allowed) => {
      if (allowErr) {
        callback({ error: new errorCreator.Database({}) });

        return;
      } else if (!allowed) {
        callback({ error: new errorCreator.NotAllowed({ name: 'getSimpleMsgs' }) });

        return;
      }

      dbSimpleMsg.getAllSimpleMsgs((err, simpleMsgs = []) => {
        if (err) {
          callback({ error: new errorCreator.Database() });

          return;
        }

        callback({ data: { simpleMsgs } });
      });
    });
  });
}

exports.handle = handle;
