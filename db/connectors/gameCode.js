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

const gameCodeSchema = new mongoose.Schema(dbConnector.createSchema({
  code: { type: String, unique: true },
  codeType: String,
  isRenewable: { type: Boolean, default: false },
  used: { type: Boolean, default: false },
}), { collection: 'gameCodes' });

const GameCode = mongoose.model('GameCode', gameCodeSchema);

/**
 * Update game code fields
 * @private
 * @param {Object} params - Parameters
 * @param {string} params.objectId - ID of the game code to update
 * @param {Object} params.update - Update
 * @param {Function} params.callback - Callback
 */
function updateGameCodeFields({ objectId, update, callback }) {
  dbConnector.updateObject({
    update,
    query: { _id: objectId },
    object: GameCode,
    errorNameContent: 'updateGameCodeFields',
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      callback({ alias: data.object });
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

      callback({ gameCode: data.object });
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

      callback({ gameCodes: data.objects });
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

          callback({ data: { gameCode: savedData.data.savedObject } });
        },
      });
    },
  });
}

/**
 * Update (or create) game code
 * @param {Object} params - Parameters
 * @param {string} params.objectId - ID of the game code
 * @param {Object} params.gameCode - Game code
 * @param {string} params.gameCode.ownerId - User ID of the owner of the game code
 * @param {string} params.gameCode.code - Game code
 * @param {string} params.gameCode.codeType - Type of game code
 * @param {boolean} params.gameCode.isRenewable - Should a new game code be created after usage?
 * @param {Function} params.callback - Callback
 */
function updateGameCode({ objectId, gameCode, callback }) {
  const {
    codeType,
    isRenewable,
    code,
    used,
  } = gameCode;

  const update = { $set: {} };

  if (codeType) { update.$set.codeType = codeType; }

  if (code) { update.$set.code = code; }

  if (typeof isRenewable === 'boolean') { update.$set.isRenewable = isRenewable; }

  if (typeof used === 'boolean') { update.$set.used = used; }

  updateGameCodeFields({
    update,
    callback,
    objectId,
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
 * Remove game code
 * @param {Object} params - Parameters
 * @param {string} params.objectId - Code of the game code
 * @param {Function} params.callback - Callback
 */
function removeGameCode({ objectId, callback }) {
  dbConnector.removeObject({
    callback,
    object: GameCode,
    query: { _id: objectId },
  });
}

exports.getGameCodeByCode = getGameCodeByCode;
exports.updateGameCode = updateGameCode;
exports.removeGameCode = removeGameCode;
exports.getGameCodesByOwner = getGameCodesByOwner;
exports.createGameCode = createGameCode;
