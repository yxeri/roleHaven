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

const express = require('express');
const socketIo = require('socket.io');
const path = require('path');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const compression = require('compression');
const appConfig = require('./config/defaults/config').app;
const databasePopulation = require('./config/defaults/config').databasePopulation;

const app = express();

// noinspection JSCheckFunctionSignatures
app.io = socketIo();

app.disable('x-powered-by');

// view engine setup
app.set('views', path.join(__dirname, appConfig.publicBase, appConfig.viewsPath));
app.set('view engine', 'html');
app.engine('html', require('hbs').__express); // eslint-disable-line no-underscore-dangle, import/newline-after-import
app.use(bodyParser.json());
// noinspection JSCheckFunctionSignatures
app.use(compression());
// Logging
app.use(morgan(appConfig.logLevel));
// Serve files from public path
app.use(express.static(path.join(__dirname, appConfig.publicBase)));

/*
 * Add all request paths and corresponding file paths to Express
 */
for (const route of appConfig.routes) {
  app.use(route.sitePath, require(path.resolve(route.filePath))(app.io)); // eslint-disable-line import/no-dynamic-require, global-require
}

require('./db/connectors/user').populateDbUsers(databasePopulation.users);
require('./db/connectors/room').populateDbRooms(databasePopulation.rooms, databasePopulation.users.superuser);
require('./db/connectors/command').populateDbCommands(databasePopulation.commands);

/*
 * Catches all exceptions and keeps the server running
 */
process.on('uncaughtException', (err) => {
  console.log('Caught exception', err);
  console.log(err.stack);
});

module.exports = app;
