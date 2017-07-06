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
const errorCreator = require('../../objects/error/errorCreator');
const dbSource = require('../../db/connectors/computingSource');

/**
 * @param {object} socket Socket.IO socket
 */
function handle(socket) {
  socket.on('getSources', ({ token }, callback = () => {}) => {
    manager.userIsAllowed({
      token,
      commandName: dbConfig.commands.getSources.commandName,
      callback: ({ error }) => {
        if (error) {
          callback({ error });

          return;
        }

        dbSource.getSources(({ error: errorSource, data }) => {
          if (errorSource) {
            callback({ error: new errorCreator.Database({ errorObject: errorSource, name: 'getSources' }) });

            return;
          }

          const { sources } = data;
          const inactiveSources = [];
          const activeSources = sources.filter((source) => {
            if (!source.isActive) {
              inactiveSources.push(source);

              return false;
            }

            return true;
          });

          callback({ data: { inactiveSources, activeSources } });
        });
      },
    });
  });
}

exports.handle = handle;
