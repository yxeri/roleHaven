'use strict';

const dbConnector = require('./databaseConnector.js');
const dbDefaults = require('./config/dbPopDefaults.js');
const logger = require('./logger.js');

function getUserById(socketId, callback) {
  dbConnector.getUserById(socketId, function(err, user) {
    if (err) {
    }

    callback(err, user);
  });
}

function getCommand(commandName, callback) {
  dbConnector.getCommand(commandName, function(err, command) {
    if (err) {
    }

    callback(err, command);
  });
}

function userAllowedCommand(socketId, commandName, callback) {
  let isAllowed = false;
  const callbackFunc = function(err, user) {
    if (err) {
    } else {
      getCommand(commandName, function(err, command) {
        if (err) {
        } else {
          const userLevel = user ? user.accessLevel : 0;
          const commandLevel = command.accessLevel;

          if (userLevel >= commandLevel) {
            isAllowed = true;
          }
        }

        callback(isAllowed, user);
      });
    }
  };

  getUserById(socketId, callbackFunc);
}

exports.userAllowedCommand = userAllowedCommand;