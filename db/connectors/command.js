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

const mongoose = require('mongoose');
const logger = require('../../utils/logger');

const commandSchema = new mongoose.Schema({
  commandName: String,
  accessLevel: Number,
  visibility: Number,
  authGroup: String,
  category: String,
  timesUsed: Number,
}, { collection: 'commands' });

const Command = mongoose.model('Command', commandSchema);

/**
 * Increment command usage
 * @param {string} commandName - Name of the command
 */
function incrementCommandUsage(commandName) {
  const query = { commandName };
  const update = { $inc: { timesUsed: 1 } };

  Command.findOneAndUpdate(query, update).lean().exec((err) => {
    if (err) {
      logger.sendErrorMsg({
        code: logger.ErrorCodes.db,
        text: ['Failed to increment command usage'],
        err,
      });
    }
  });
}

/**
 * Update command visibility
 * @param {string} cmdName - Name of the command
 * @param {number} value - New visibility value
 * @param {Function} callback - Callback
 */
function updateCommandVisibility(cmdName, value, callback) {
  const query = { commandName: cmdName };
  const update = { $set: { visibility: value } };
  const options = { new: true };

  Command.findOneAndUpdate(query, update, options).lean().exec(
    (err, cmd) => {
      if (err) {
        logger.sendErrorMsg({
          code: logger.ErrorCodes.db,
          text: ['Failed to update command visibility'],
          err,
        });
      }

      callback(err, cmd);
    }
  );
}

/**
 * Update command access level
 * @param {string} cmdName - Name of the command
 * @param {number} value - New access level value
 * @param {Function} callback - Callback
 */
function updateCommandAccessLevel(cmdName, value, callback) {
  const query = { commandName: cmdName };
  const update = { $set: { accessLevel: value } };
  const options = { new: true };

  Command.findOneAndUpdate(query, update, options).lean().exec(
    (err, cmd) => {
      if (err) {
        logger.sendErrorMsg({
          code: logger.ErrorCodes.db,
          text: ['Failed to update command access level'],
          err,
        });
      }

      callback(err, cmd);
    }
  );
}

/**
 * Get all commands
 * @param {Function} callback - Callback
 */
function getAllCommands(callback) {
  const filter = { _id: 0 };

  Command.find({}, filter).lean().exec((err, commands) => {
    if (err || commands === null) {
      logger.sendErrorMsg({
        code: logger.ErrorCodes.db,
        text: ['Failed to get all command'],
        err,
      });
    }

    callback(err, commands);
  });
}

/**
 * Updates all commands. Creates new ones if they don't already exist
 * @param {Object} sentCommands - New commands
 */
function populateDbCommands(sentCommands) {
  const cmdKeys = Object.keys(sentCommands);
  const callback = (err) => {
    if (err) {
      logger.sendErrorMsg({
        code: logger.ErrorCodes.db,
        text: ['PopulateDb: [failure] Failed to update command'],
        err,
      });
    }
  };

  for (let i = 0; i < cmdKeys.length; i += 1) {
    const command = sentCommands[cmdKeys[i]];
    const query = { commandName: command.commandName };
    const options = { upsert: true };

    Command.findOneAndUpdate(query, command, options).lean().exec(callback);
  }
}

/**
 * Get command
 * @param {string} commandName - Name of the command
 * @param {Function} callback - Callback
 */
function getCommand(commandName, callback) {
  const query = { commandName };

  Command.findOne(query).lean().exec((err, command) => {
    if (err) {
      logger.sendErrorMsg({
        code: logger.ErrorCodes.db,
        text: ['Failed to get command'],
        err,
      });
    }

    callback(err, command);
  });
}

exports.getCommand = getCommand;
exports.updateCommandVisibility = updateCommandVisibility;
exports.updateCommandAccessLevel = updateCommandAccessLevel;
exports.getAllCommands = getAllCommands;
exports.populateDbCommands = populateDbCommands;
exports.incrementCommandUsage = incrementCommandUsage;
