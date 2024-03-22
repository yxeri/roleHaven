'use strict';

import bodyParser from 'body-parser';
import compression from 'compression';
import express from 'express';
import { __express } from 'hbs';
import morgan from 'morgan';
import path from 'path';
import { appConfig } from './config/defaults/config';
import dbForum from './db/connectors/forum';
import dbRoom from './db/connectors/room';
import positionManager from './managers/positions';
import triggerEventManager from './managers/triggerEvents';
import { name as appName, version as appVersion } from './package';

const socketIo = require('socket.io');

const app = express();
const io = socketIo();

console.log(`Running version ${appVersion} of ${appName}.`);

app.io = io;

app.disable('x-powered-by');

// view engine setup
app.set('views', path.join(appConfig.publicBase, appConfig.viewsPath));
app.set('view engine', 'html');
// eslint-disable-next-line no-underscore-dangle, import/newline-after-import
app.engine('html', __express.__express);
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

triggerEventManager.startTriggers(io);

if (!appConfig.jsonKey) {
  console.log('WARNING! JSONKEY is not set in the config. User authentication will not work.');
}

if (appConfig.mode !== appConfig.Modes.TEST) {
  dbRoom.populateDbRooms({});
  dbForum.populateDbForums({});
}

if (!appConfig.disablePositionImport) {
  const getGooglePositions = () => {
    positionManager.getAndStoreGooglePositions({
      io,
      callback: ({
        error,
        data,
      }) => {
        if (error) {
          console.log(error, 'Failed to retrieve Google Maps positions');

          return;
        }

        console.log(`Retrieved and saved ${data.positions.length + 1} positions from Google Maps`);
      },
    });
  };

  getGooglePositions();
}

appConfig.startupFuncs.forEach((func) => func({ io }));

/*
 * Catches all exceptions.
 */
process.on('uncaughtException', (err) => {
  console.error('Caught exception', err);
  console.error(err.stack);
});

export default app;
