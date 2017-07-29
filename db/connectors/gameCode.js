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
const errorCreator = require('../../objects/error/errorCreator');
const textTools = require('../../utils/textTools');
const dbConfig = require('../../config/defaults/config').databasePopulation;

const gameCodeSchema = new mongoose.Schema({
  owner: String,
  code: String,
  codeType: String,
  renewable: { type: Boolean, default: false },
}, { collection: 'gameCodes' });

const GameCode = mongoose.model('GameCode', gameCodeSchema);

/**
 * Creates game code
 * @returns {string} numerical game code
 */
function generateGameCode() {
  return textTools.shuffleArray(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']).slice(0, 6).join('');
}

/**
 * Update (or create) game code
 * @param {string} params.owner Owner of the game code
 * @param {string} params.code Game code
 * @param {string} params.codeType Type of game code
 * @param {boolean} params.renewable Should a new game code be created after usage?
 * @param {Function} params.callback Callback
 */
function updateGameCode({ owner, code, codeType, renewable, callback }) {
  const newCode = code || generateGameCode();
  const query = { owner, codeType, code: newCode };
  const update = { $set: { owner, code: newCode, codeType, renewable } };
  const options = { new: true, upsert: true };

  GameCode.findOneAndUpdate(query, update, options).lean().exec((err, gameCode) => {
    if (err) {
      callback({ error: new errorCreator.Database({ errorObject: err, name: 'updateGameCode' }) });

      return;
    }

    callback({ data: { gameCode } });
  });
}

/**
 * Get game codes
 * @param {string} params.owner Owner of the game code
 * @param {Function} params.callback Callback
 */
function getGameCodesByUserName({ owner, callback }) {
  const query = { owner };

  GameCode.find(query).lean().exec((err, gameCodes) => {
    if (err) {
      callback({ error: new errorCreator.Database({ errorObject: err, name: 'getGameCodesByUserName' }) });

      return;
    } else if (!gameCodes) {
      callback({ error: new errorCreator.DoesNotExist({ name: `game codes for ${owner}` }) });

      return;
    }

    callback({ data: { gameCodes } });
  });
}

/**
 * Get game code by code
 * @param {string} params.code Game code
 * @param {Function} params.callback Callback
 */
function getGameCodeByCode({ code, callback }) {
  const query = { code };

  GameCode.findOne(query).lean().exec((err, gameCode) => {
    if (err) {
      callback({ error: new errorCreator.Database({ errorObject: err, name: 'getGameCodeByCode' }) });

      return;
    } else if (!gameCode) {
      callback({ error: new errorCreator.DoesNotExist({ name: `game code ${code}` }) });

      return;
    }

    callback({ data: { gameCode } });
  });
}

/**
 * Remove game code
 * @param {string} params.code Game code
 * @param {Function} params.callback Callback
 */
function removeGameCode({ code, callback }) {
  const query = { code };

  GameCode.findOneAndRemove(query).lean().exec((err) => {
    if (err) {
      callback({ error: new errorCreator.Database({ errorObject: err, name: 'removeGameCode' }) });

      return;
    }

    callback({ data: { success: true } });
  });
}

/**
 * Get profile game code for owner
 * @param {string} params.sowner Owner of game code
 * @param {Function} params.callback Callback
 */
function getProfileGameCode({ owner, callback }) {
  const query = {
    owner,
    codeType: dbConfig.GameCodeTypes.PROFILE,
  };

  GameCode.findOne(query).lean().exec((err, gameCode) => {
    if (err) {
      callback({ error: new errorCreator.Database({ errorObject: err, name: 'getProfileGameCode' }) });

      return;
    } else if (!gameCode) {
      updateGameCode({
        owner,
        code: generateGameCode(),
        codeType: dbConfig.GameCodeTypes.PROFILE,
        renewable: true,
        callback,
      });

      return;
    }

    callback({ data: { gameCode } });
  });
}

exports.getGameCodeByCode = getGameCodeByCode;
exports.updateGameCode = updateGameCode;
exports.removeGameCode = removeGameCode;
exports.getGameCodesByUserName = getGameCodesByUserName;
exports.getProfileGameCode = getProfileGameCode;
