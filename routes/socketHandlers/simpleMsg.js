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
const objectValidator = require('../../utils/objectValidator');
const dbSimpleMsg = require('../../db/connectors/simpleMsg');
const errorCreator = require('../../objects/error/errorCreator');

/**
 * @param {Object} socket - Socket.IO socket
 */
function handle(socket) {
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
