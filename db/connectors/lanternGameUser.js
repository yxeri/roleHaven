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

const gameUserSchema = new mongoose.Schema(dbConnector.createSchema({
  username: { type: String, unique: true },
  passwords: [String],
  stationId: Number,
}), { collection: 'gameUsers' });

const GameUser = mongoose.model('GameUser', gameUserSchema);

/**
 * Add custom id to the object
 * @param {Object} gameUser - Game user object
 * @return {Object} - Game user object with id
 */
function addCustomId(gameUser) {
  const updatedGameUser = gameUser;
  updatedGameUser.gameUserId = gameUser.objectId;

  return updatedGameUser;
}

/**
 * Create and save game users. Existing will be ignored
 * @param {Object} params - Parameters
 * @param {Object} params.gameUsers - Game users
 * @param {Function} [params.callback] - Callback
 */
function createGameUsers({ gameUsers = [], callback = () => {} }) {
  const savedGameUsers = [];

  /**
   * Save the game user
   */
  function saveGameUser() {
    const gameUser = gameUsers.shift();

    if (!gameUser) {
      callback({ data: { gameUsers: savedGameUsers } });

      return;
    }

    const newGameUser = new GameUser(gameUser);
    const query = { username: gameUser.username };

    GameUser.findOne(query).lean().exec((err, foundGameUser) => {
      if (err || foundGameUser) {
        return;
      }

      dbConnector.saveObject({
        object: newGameUser,
        objectType: 'gameUser',
        callback: ({ error, data }) => {
          if (error) {
            callback({ error });

            return;
          }

          savedGameUsers.push(addCustomId(data.savedObject));

          saveGameUser();
        },
      });
    });
  }

  saveGameUser();
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

      callback({
        data: {
          gameUsers: data.objects.map(gameUser => addCustomId(gameUser)),
        },
      });
    },
  });
}

/**
 * Remove game user.
 * @param {Object} params - Parameters.
 * @param {string} params.gameUserId - ID of the game user.
 * @param {Function} params.callback - Callback.
 */
function removeGameUser({ gameUserId, callback }) {
  const query = { _id: gameUserId };

  dbConnector.removeObject({
    query,
    callback,
    object: GameUser,
  });
}

exports.createGameUsers = createGameUsers;
exports.getGameUsers = getGameUsers;
exports.removeGameuser = removeGameUser;
