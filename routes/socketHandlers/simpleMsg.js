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

const manager = require('../../helpers/manager');
const databasePopulation = require('../../config/defaults/config').databasePopulation;
const objectValidator = require('../../utils/objectValidator');
const dbSimpleMsg = require('../../db/connectors/simpleMsg');
const errorCreator = require('../../objects/error/errorCreator');

/**
 * @param {Object} socket - Socket.IO socket
 */
function handle(socket) {
  socket.on('simpleMsg', ({ text, token }, callback = () => {}) => {
    if (!objectValidator.isValidData({ text }, { text: true })) {
      callback({ error: new errorCreator.InvalidData({ expected: '{ text }' }) });

      return;
    }

    manager.userIsAllowed({
      token,
      commandName: databasePopulation.commands.simpleMsg.commandName,
      callback: ({ error, allowedUser }) => {
        if (error) {
          callback({ error });

          return;
        }

        const simpleMsg = {
          text,
          time: new Date(),
          userName: allowedUser.userName,
        };

        dbSimpleMsg.createSimpleMsg({
          simpleMsg,
          callback: (simpleMsgData) => {
            if (simpleMsgData.error) {
              callback({ error: simpleMsgData.error });

              return;
            }

            callback({ data: { simpleMsg } });
            socket.broadcast.emit('simpleMsg', simpleMsg);
          },
        });
      },
    });
  });

  socket.on('getSimpleMessages', ({ token }, callback = () => {}) => {
    manager.userIsAllowed({
      token,
      commandName: databasePopulation.commands.getSimpleMsgs.commandName,
      callback: ({ error }) => {
        if (error) {
          callback({ error });

          return;
        }

        dbSimpleMsg.getAllSimpleMsgs({
          callback: (simpleMsgsData) => {
            if (simpleMsgsData.error) {
              callback({ error: simpleMsgsData.error });

              return;
            }

            const { simpleMsgs } = simpleMsgsData.data;

            callback({ data: { simpleMsgs } });
          },
        });
      },
    });
  });
}

exports.handle = handle;
