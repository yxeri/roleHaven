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

const dbConfig = require('../../config/defaults/config').databasePopulation;
const manager = require('../../socketHelpers/manager');
const objectValidator = require('../../utils/objectValidator');
const errorCreator = require('../../objects/error/errorCreator');
const dbTimedEvent = require('../../db/connectors/timedEvent');

/**
 * @param {object} socket - Socket.IO socket
 */
function handle(socket) {
  socket.on('createTimedEvent', ({ timedEvent, token }, callback = () => {}) => {
    if (!objectValidator.isValidData({ timedEvent }, { timedEvent: { triggerTime: true, eventType: true } })) {
      callback({ error: new errorCreator.InvalidData({ expected: '{ timedEvent: { triggerTime, eventType } }' }) });

      return;
    } else if (!timedEvent.message && !timedEvent.coordinates) {
      callback({ error: new errorCreator.InvalidData({ expected: '{ timedEvent: { message } } or { timedEvent: { coordinates } }' }) });

      return;
    } else if (timedEvent.coordinates && (typeof timedEvent.coordinates.longitude !== 'number' || typeof timedEvent.coordinates.latitude !== 'number')) {
      callback({ error: new errorCreator.InvalidData({ expected: '{ timedEvent: { coordinates: { longitude, latitude } }' }) });

      return;
    }

    // TODO Message limitations

    manager.userIsAllowed({
      token,
      socketId: socket.id,
      commandName: dbConfig.commands.createTimedEvent.commandName,
      callback: ({ error, allowedUser }) => {
        if (error) {
          callback({ error });

          return;
        }

        timedEvent.owner = allowedUser.userName;
        timedEvent.triggerTime = new Date(timedEvent.triggerTime);

        dbTimedEvent.createTimedEvent({
          timedEvent,
          callback: (createData) => {
            if (createData.error) {
              callback({ error: createData.error });

              return;
            }

            callback({ data: createData.data });
          },
        });
      },
    });
  });
}

exports.handle = handle;
