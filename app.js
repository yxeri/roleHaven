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

const express = require('express');
const socketIo = require('socket.io');
const path = require('path');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const compression = require('compression');
const appConfig = require('./config/defaults/config').app;
const dbConfig = require('./config/defaults/config').dbConfig;
const dbRoom = require('./db/connectors/room');
const positionManager = require('./managers/positions');
const { version: appVersion, name: appName } = require('./package');

const app = express();
const io = socketIo();

console.log(`Running version ${appVersion} of ${appName}.`);

app.io = io;

app.disable('x-powered-by');

// view engine setup
app.set('views', path.join(appConfig.publicBase, appConfig.viewsPath));
app.set('view engine', 'html');
// eslint-disable-next-line no-underscore-dangle, import/newline-after-import
app.engine('html', require('hbs').__express);
app.use(bodyParser.json());
app.use(compression());
// Logging
app.use(morgan(appConfig.logLevel));

// Serve files from public path
app.use(express.static(appConfig.publicBase));

appConfig.routes.forEach((route) => {
  // eslint-disable-next-line global-require, import/no-dynamic-require
  app.use(route.sitePath, require(path.resolve(route.filePath))(app.io));
});

if (!appConfig.jsonKey) {
  console.log('WARNING! JSONKEY is not set in the config. User authentication will not work.');
}

if (appConfig.mode !== appConfig.Modes.TEST) {
  dbRoom.populateDbRooms({ rooms: dbConfig.rooms });
}

if (!appConfig.bypassExternalConnections) {
  positionManager.getAndStoreGooglePositions({
    callback: ({ error, data }) => {
      if (error) {
        console.log('Failed to retrieve Google Maps positions');

        return;
      }

      console.log(`Retrieved and saved ${data.positions.length + 1} positions from Google Maps`);
    },
  });
}

/*
 * Catches all exceptions.
 */
process.on('uncaughtException', (err) => {
  console.error('Caught exception', err);
  console.error(err.stack);
});

module.exports = app;
