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
const dbConfig = require('../../config/defaults/config').databasePopulation;

const gameCodeSchema = new mongoose.Schema(dbConnector.createSchema({
  code: { type: String, unique: true },
  codeType: { type: String, default: dbConfig.GameCodeTypes.TRANSACTION },
  codeContent: { type: [String], default: [] },
  isRenewable: { type: Boolean, default: false },
  used: { type: Boolean, default: false },
}), { collection: 'gameCodes' });

const GameCode = mongoose.model('GameCode', gameCodeSchema);

/**
 * Add custom id to the object
 * @param {Object} gameCode - Game code object
 * @return {Object} - Game code object with id
 */
function addCustomId(gameCode) {
  const updatedGameCode = gameCode;
  updatedGameCode.gameCodeId = gameCode.objectId;

  return updatedGameCode;
}

/**
 * Update game code
 * @private
 * @param {Object} params - Parameters
 * @param {string} params.code - ID of the game code to update
 * @param {Object} params.update - Update
 * @param {Function} params.callback - Callback
 */
function updateObject({ code, update, callback }) {
  dbConnector.updateObject({
    update,
    query: { code },
    object: GameCode,
    errorNameContent: 'updateGameCode',
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      callback({ data: { gameCode: addCustomId(data.object) } });
    },
  });
}

/**
 * Get game code
 * @private
 * @param {Object} params - Parameters
 * @param {string} params.query - Query to get game code
 * @param {Function} params.callback - Callback
 */
function getGameCode({ query, callback }) {
  dbConnector.getObject({
    query,
    object: GameCode,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      } else if (!data.object) {
        callback({ error: new errorCreator.DoesNotExist({ name: `gameCode ${query.toString()}` }) });

        return;
      }

      callback({ data: { gameCode: addCustomId(data.object) } });
    },
  });
}

/**
 * Get game codes
 * @private
 * @param {Object} params - Parameters
 * @param {Object} params.query - Query to get game codes
 * @param {Function} params.callback - Callback
 */
function getGameCodes({ query, callback }) {
  dbConnector.getObjects({
    query,
    object: GameCode,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      callback({
        data: {
          gameCodes: data.objects.map(gameCode => addCustomId(gameCode)),
        },
      });
    },
  });
}

/**
 * Create game code
 * @param {Object} params - Parameters
 * @param {Object} params.gameCode - Game code
 * @param {Function} params.callback - Callback
 */
function createGameCode({ gameCode, callback }) {
  getGameCode({
    query: { code: gameCode.code },
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      } else if (data.gameCode) {
        callback({ error: new error.AlreadyExists({ name: `Game code ${gameCode.code}` }) });

        return;
      }

      dbConnector.saveObject({
        object: new GameCode(gameCode),
        objectType: 'gameCode',
        callback: (savedData) => {
          if (savedData.error) {
            callback({ error: savedData.error });

            return;
          }

          callback({ data: { gameCode: addCustomId(savedData.data.savedObject) } });
        },
      });
    },
  });
}

/**
 * Update a game code.
 * @param {Object} params - Parameters.
 * @param {Function} params.callback - Callback.
 * @param {Object} params.gameCode - Game code.
 * @param {string} [params.gameCode.code] - Game code.
 * @param {string} 8params.gameCode.codeType] - Type of game code.
 * @param {boolean} [params.gameCode.isRenewable] - Should a new game code be created after usage?
 * @param {string[]} [params.gameCode.codeContent] - Content that will be retrieved by user that uses the code.
 */
function updateGameCode({ code, gameCode, callback }) {
  const {
    codeType,
    isRenewable,
    used,
    codeContent,
  } = gameCode;

  const update = { $set: {} };

  if (codeContent) { update.$set.codeContent = codeContent; }
  if (codeType) { update.$set.codeType = codeType; }
  if (typeof isRenewable === 'boolean') { update.$set.isRenewable = isRenewable; }
  if (typeof used === 'boolean') { update.$set.used = used; }

  updateObject({
    update,
    callback,
    code,
  });
}

/**
 * Get game codes
 * @param {Object} params - Parameters
 * @param {string} params.ownerId - User or team ID of the owner of the game code
 * @param {Function} params.callback - Callback
 */
function getGameCodesByOwner({ ownerId, callback }) {
  getGameCodes({
    callback,
    query: {
      ownerId,
      used: false,
    },
  });
}

/**
 * Get game code by code
 * @param {Object} params - Parameters
 * @param {string} params.code - Code of the game code
 * @param {Function} params.callback - Callback
 */
function getGameCodeByCode({ code, callback }) {
  const query = { code };

  getGameCode({
    query,
    callback,
  });
}

/**
 * Remove game code.
 * @param {Object} params - Parameters.
 * @param {string} params.code - Code of the game code.
 * @param {Function} params.callback - Callback.
 */
function removeGameCode({ code, callback }) {
  dbConnector.removeObject({
    callback,
    object: GameCode,
    query: { code },
  });
}

/**
 * Get user's profile code.
 * @param {Object} params - Parameters.
 * @param {string} params.ownerId - Id of the user.
 * @param {Function} params.callback - Callback
 */
function getProfileGameCode({ ownerId, callback }) {
  getGameCode({
    callback,
    query: {
      ownerId,
      codeType: dbConfig.GameCodeTypes.PROFILE,
    },
  });
}

exports.createGameCode = createGameCode;
exports.updateGameCode = updateGameCode;
exports.removeGameCode = removeGameCode;
exports.getGameCodeByCode = getGameCodeByCode;
exports.getGameCodesByOwner = getGameCodesByOwner;
exports.getProfileGameCode = getProfileGameCode;
