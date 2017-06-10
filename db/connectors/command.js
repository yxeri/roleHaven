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
const errorCreator = require('../../objects/error/errorCreator');

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
 * @param {string} params.commandName Name of the command
 */
function incrementCommandUsage({ commandName }) {
  const query = { commandName };
  const update = { $inc: { timesUsed: 1 } };

  Command.findOneAndUpdate(query, update).lean().exec();
}

/**
 * Updates all commands. Creates new ones if they don't already exist
 * @param {Object} params.commands New commands
 */
function populateDbCommands({ commands }) {
  console.log('Adding commands, if needed');

  const cmdKeys = Object.keys(commands);
  cmdKeys.forEach((commandName) => {
    const query = { commandName };
    const command = commands[commandName];
    const options = { upsert: true };

    Command.findOneAndUpdate(query, command, options).lean().exec();
  });
}

/**
 * Get command
 * @param {string} params.commandName Name of the command
 * @param {Function} params.callback Callback
 */
function getCommand({ commandName, callback }) {
  const query = { commandName };

  Command.findOne(query).lean().exec((err, command) => {
    if (err) {
      callback({ error: new errorCreator.Database({ errorObject: err, name: 'getCommand' }) });

      return;
    }

    callback({ data: { command } });
  });
}

exports.getCommand = getCommand;
exports.populateDbCommands = populateDbCommands;
exports.incrementCommandUsage = incrementCommandUsage;
