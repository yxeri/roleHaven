'use strict';

const dbConnector = require('./databaseConnector.js');
const dbDefaults = require('./config/dbPopDefaults.js');
const logger = require('./logger.js');
const config = require('./config/config');

const messageSort = function(a, b) {
  if (a.time < b.time) {
    return -1;
  } else if (a.time > b.time) {
    return 1;
  }

  return 0;
};

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

function addToHistory(roomName, message, callback) {
}

/**
 *
 * @param rooms Array. History from these rooms will retrieved
 * @param lines Number. Amount of lines returned for each room
 * @param missedMsgs Boolean. If true, only messages that the user missed since being logged in last time are returned
 * @param lastOnline Date. Last time user was online. Used to determine which missed messages to send
 */
function getHistory(rooms, lines, missedMsgs, lastOnline, callback) {
  dbConnector.getHistoryFromRooms(rooms, function(err, history) {
    if (err || history === null) {
      logger.sendErrorMsg(logger.ErrorCodes.db, 'Failed to get history');
    } else {
      const historyMessages = [];
      const maxLines = lines === null || isNaN(lines) ? config.historyLines : lines;

      for (let i = 0; i < history.length; i++) {
        const currentHistory = history[i];

        if (currentHistory.messages.length > 0) {
          const messages = currentHistory.messages.slice(-maxLines);
          const messageLength = messages.length - 1;

          for (let j = messageLength; j !== 0; j--) {
            const message = messages[j];

            /*
             * Pushes all the messages from the room OR only the messages that the user hasn't already seen
             */
            if (!missedMsgs || (message !== undefined && lastOnline <= message.time)) {
              message.roomName = currentHistory.roomName;
              historyMessages.push(message);
            }
          }
        }
      }

      // Above loop pushes in everything in the reverse order.
      historyMessages.reverse();
      historyMessages.sort(messageSort);

      callback(historyMessages);
    }
  });
}

exports.userAllowedCommand = userAllowedCommand;
exports.addToHistory = addToHistory;
exports.getHistory = getHistory;