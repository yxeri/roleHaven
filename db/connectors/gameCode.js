/*
 Copyright 2017 Carmilla Mina Jankovic

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
const errorCreator = require('../../error/errorCreator');
const { dbConfig } = require('../../config/defaults/config');

const gameCodeSchema = new mongoose.Schema(dbConnector.createSchema({
  code: { type: String, unique: true },
  codeType: { type: String, default: dbConfig.GameCodeTypes.TRANSACTION },
  codeContent: { type: [String], default: [] },
  isRenewable: { type: Boolean, default: false },
  used: { type: Boolean, default: false },
}), { collection: 'gameCodes' });

const GameCode = mongoose.model('GameCode', gameCodeSchema);

/**
 * Update game code.
 * @private
 * @param {Object} params Parameters.
 * @param {string} params.gameCodeId Id of the game code to update.
 * @param {Object} params.update Update.
 * @param {Function} params.callback Callback.
 */
function updateObject({ gameCodeId, update, callback }) {
  dbConnector.updateObject({
    update,
    query: { _id: gameCodeId },
    object: GameCode,
    errorNameContent: 'updateGameCode',
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      callback({ data: { gameCode: data.object } });
    },
  });
}

/**
 * Get game code
 * @private
 * @param {Object} params Parameters
 * @param {string} params.query Query to get game code
 * @param {Function} params.callback Callback
 */
function getGameCode({
  query,
  callback,
  filter,
}) {
  dbConnector.getObject({
    query,
    filter,
    object: GameCode,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      if (!data.object) {
        callback({ error: new errorCreator.DoesNotExist({ name: `gameCode ${JSON.stringify(query, null, 4)}` }) });

        return;
      }

      callback({ data: { gameCode: data.object } });
    },
  });
}

/**
 * Get game codes
 * @private
 * @param {Object} params Parameters.
 * @param {Object} params.query Query to get game codes.
 * @param {Function} params.callback Callback.
 */
function getGameCodes({
  query,
  filter,
  callback,
}) {
  dbConnector.getObjects({
    query,
    filter,
    object: GameCode,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      callback({
        data: {
          gameCodes: data.objects,
        },
      });
    },
  });
}

/**
 * Does the game code exist?
 * @private
 * @param {Object} params Parameters.
 * @param {string} params.query Query to get game code.
 * @param {Function} params.callback Callback.
 */
function doesExist({ query, callback }) {
  dbConnector.getObject({
    query,
    callback,
    object: GameCode,
  });
}

/**
 * Create game code
 * @param {Object} params Parameters.
 * @param {Object} params.gameCode Game code.
 * @param {Function} params.callback Callback.
 */
function createGameCode({ gameCode, callback }) {
  doesExist({
    query: { code: gameCode.code },
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      if (data.exists) {
        callback({ error: new errorCreator.AlreadyExists({ name: `Game code ${gameCode.code}` }) });

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
 * Update a game code.
 * @param {Object} params Parameters.
 * @param {Function} params.callback Callback.
 * @param {Object} params.gameCode Game code.
 * @param {string} [params.gameCode.code] Game code.
 * @param {string} 8params.gameCode.codeType] Type of game code.
 * @param {boolean} [params.gameCode.isRenewable] Should a new game code be created after usage?
 * @param {string[]} [params.gameCode.codeContent] Content that will be retrieved by user that uses the code.
 */
function updateGameCode({
  gameCodeId,
  gameCode,
  callback,
}) {
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
    gameCodeId,
  });
}

/**
 * Get game codes by user.
 * @param {Object} params Parameters.
 * @param {Object} params.user User retrieving game codes.
 * @param {Function} params.callback Callback.
 */
function getGameCodesByUser({
  user,
  callback,
}) {
  const query = dbConnector.createUserQuery({ user });
  query.used = false;

  getGameCodes({
    callback,
    query,
  });
}

/**
 * Get game code by Id.
 * @param {Object} params Parameters
 * @param {string} params.gameCodeId Id of the game code to retrieve.
 * @param {Function} params.callback Callback.
 */
function getGameCodeById({
  gameCodeId,
  callback,
}) {
  const query = { _id: gameCodeId };

  getGameCode({
    query,
    callback,
  });
}

/**
 * Remove game code.
 * @param {Object} params Parameters.
 * @param {string} params.gameCodeId Id of the game code.
 * @param {Function} params.callback Callback.
 */
function removeGameCode({ gameCodeId, callback }) {
  dbConnector.removeObject({
    callback,
    object: GameCode,
    query: { _id: gameCodeId },
  });
}

/**
 * Get user's profile code.
 * @param {Object} params Parameters.
 * @param {string} params.ownerId Id of the user.
 * @param {Function} params.callback Callback
 */
function getProfileGameCode({ ownerId, callback }) {
  const query = {
    ownerId,
    codeType: dbConfig.GameCodeTypes.PROFILE,
  };

  getGameCode({
    callback,
    query,
  });
}

exports.createGameCode = createGameCode;
exports.updateGameCode = updateGameCode;
exports.removeGameCode = removeGameCode;
exports.getGameCodeById = getGameCodeById;
exports.getGameCodesByUser = getGameCodesByUser;
exports.getProfileGameCode = getProfileGameCode;
