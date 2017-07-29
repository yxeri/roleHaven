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
const databasePopulation = require('./config/defaults/config').databasePopulation;
const dbRoom = require('./db/connectors/room');
const dbCommand = require('./db/connectors/command');
const winston = require('winston');

const app = express();

// noinspection JSCheckFunctionSignatures
app.io = socketIo();

app.disable('x-powered-by');

// view engine setup
app.set('views', path.join(appConfig.publicBase, appConfig.viewsPath));
app.set('view engine', 'html');
// eslint-disable-next-line no-underscore-dangle, import/newline-after-import
app.engine('html', require('hbs').__express);
app.use(bodyParser.json());
// noinspection JSCheckFunctionSignatures
app.use(compression());
// Logging
if (appConfig.mode !== 'test') {
  app.use(morgan(appConfig.logLevel));
}

// Serve files from public path
app.use(express.static(appConfig.publicBase));


appConfig.routes.forEach((route) => {
  // eslint-disable-next-line global-require, import/no-dynamic-require
  app.use(route.sitePath, require(path.resolve(route.filePath))(app.io));
});

if (appConfig.mode !== 'test') {
  dbRoom.populateDbRooms({ rooms: databasePopulation.rooms });
  dbCommand.populateDbCommands({ commands: databasePopulation.commands });
}

/*
 * Catches all exceptions and keeps the server running
 */
process.on('uncaughtException', (err) => {
  winston.error('Caught exception', err);
  winston.error(err.stack);
});

module.exports = app;
