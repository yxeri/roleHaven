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

const mongoose = require('mongoose');
const dbConnector = require('../databaseConnector');
const errorCreator = require('../../objects/error/errorCreator');

const gameUserSchema = new mongoose.Schema(dbConnector.createSchema({
  username: { type: String, unique: true },
  passwords: [String],
  stationId: Number,
}), { collection: 'gameUsers' });
const fakePasswordSchema = new mongoose.Schema(dbConnector.createSchema({
  passwords: { type: [String], default: [] },
}), { collection: 'fakePasswords' });

const GameUser = mongoose.model('GameUser', gameUserSchema);
const FakePassword = mongoose.model('FakePassword', fakePasswordSchema);

/**
 * Create and save game users. Existing will be ignored
 * @param {Object} params - Parameters
 * @param {Object} params.gameUsers - Game users
 */
function createGameUsers({ gameUsers = [] }) {
  gameUsers.forEach((gameUser) => {
    const newGameUser = new GameUser(gameUser);
    const query = { username: gameUser.username };

    GameUser.findOne(query).lean().exec((err, foundGameUser) => {
      if (err || foundGameUser) {
        return;
      }

      dbConnector.saveObject({
        object: newGameUser,
        objectType: 'gameUser',
        callback: () => {},
      });
    });
  });
}

/**
 * Get all game users
 * @param {Object} params - Parameters
 * @param {Function} params.callback - Callback
 */
function getGameUsers({ callback }) {
  dbConnector.getObjects({
    object: GameUser,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      callback({ data: { gameUsers: data.objects } });
    },
  });
}

/**
 * Add new fake passwords. Existing will be ignored
 * @param {Object} params - Parameters
 * @param {string[]} params.passwords - Fake passwords to add
 * @param {Function} params.callback - Callback
 */
function addFakePasswords({ passwords, callback }) {
  dbConnector.updateObject({
    query: {},
    object: FakePassword,
    update: { $addToSet: { passwords: { $each: passwords } } },
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      } else if (!data.object) {
        callback({ error: new errorCreator.DoesNotExist({ name: 'fake password container' }) });

        return;
      }

      callback({ data: { passwords: data.object.passwords } });
    },
  });
}

/**
 * Get all fake passwords
 * @param {Object} params - Parameters
 * @param {Function} params.callback - Callback
 */
function getAllFakePasswords({ callback }) {
  dbConnector.getObject({
    object: FakePassword,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      callback({ data: { passwords: data.object ? data.object.passwords : [] } });
    },
  });
}

/**
 * Create fake passsword container
 * @param {Function} callback - Callback
 */
function createFakePasswordsContainer(callback) {
  FakePassword.findOne({}).lean().exec((error, data) => {
    if (error) {
      callback({ error });

      return;
    } else if (!data) {
      dbConnector.saveObject({
        callback,
        object: new FakePassword({}),
        objectType: 'fakePasswords',
      });

      return;
    }

    callback({ data: { exists: true } });
  });
}

createFakePasswordsContainer(({ error, data }) => {
  if (error) {
    console.error('Failed to create fake password container');

    return;
  }

  console.log('Created ', data);
});

exports.addFakePasswords = addFakePasswords;
exports.getAllFakePasswords = getAllFakePasswords;
exports.createGameUsers = createGameUsers;
exports.getGameUsers = getGameUsers;
exports.createfakePasswordContainer = createFakePasswordsContainer;
