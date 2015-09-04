'use strict';

const express = require('express');
const socketIo = require('socket.io');
const path = require('path');
const morgan = require('morgan');
const compression = require('compression');
const fs = require('fs');
const minifier = require('./minifier');
const dbConnector = require('./databaseConnector');
const config = require('./config/config');
const confDefaults = require('./config/dbPopDefaults');
const logger = require('./logger');
const app = express();

// TODO: This should be moved
const eventsFunc = function(io) {
  dbConnector.getPassedEvents(function(err, events) {
    if (err) {
      logger.sendErrorMsg(logger.ErrorCodes.general, 'Failed to get events', err);
    } else if (events.length > 1) {
      for (let i = 0; i < events.length; i++) {

      }
    }
  });
};

app.io = socketIo();

// view engine setup
app.set('views', path.join(__dirname, config.publicBase, config.paths.views));
app.set('view engine', 'html');
app.engine('html', require('hbs').__express);

app.use(compression());
app.use(morgan(config.logLevel));
app.use(express.static(path.join(__dirname, config.publicBase)));

app.use('/', require('./routes/index')(app.io));
app.use('*', require('./routes/error')(app.io));

dbConnector.populateDbUsers(confDefaults.users);
dbConnector.populateDbRooms(confDefaults.rooms, confDefaults.users.superuser);
dbConnector.populateDbCommands(confDefaults.commands);

setInterval(eventsFunc, 1000, app.io);

function watchPrivate() {
  // fs.watch is unstable. Recursive only works in OS X.
  fs.watch(config.privateBase, { persistant : true, recursive : true },
    function(triggeredEvent, filePath) {
      const fullPath = path.join(config.privateBase, filePath);

      if ((triggeredEvent === 'rename' || triggeredEvent === 'change') &&
          path.extname(fullPath) !== '.tmp' && fullPath.indexOf('___') < 0) {
        fs.readFile(fullPath, function(err) {
          if (err) {
            throw err;
          }

          minifier.minifyFile(
            fullPath, path.join(config.publicBase, filePath));
          logger.sendInfoMsg('Event: ' + triggeredEvent + '. File: ' + fullPath);
        });
      }
    });
}

if(config.mode === 'dev') {
  watchPrivate();
}

module.exports = app;
