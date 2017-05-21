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

const gameCodeSchema = new mongoose.Schema({
  owner: String,
  code: String,
  codeType: String,
  renewable: { type: Boolean, default: false },
}, { collection: 'gameCodes' });

const GameCode = mongoose.model('GameCode', gameCodeSchema);

/**
 * Update (or create) game code
 * @param {string} params.owner Owner of the game code
 * @param {string} params.code Game code
 * @param {string} params.codeType Type of game code
 * @param {boolean} params.renewable Should a new game code be created after usage?
 * @param {Function} callback - Callback
 */
function updateGameCode({ owner, code, codeType, renewable }, callback) {
  const query = { owner, codeType, code };
  const update = { $set: { owner, code, codeType, renewable } };
  const options = { new: true, upsert: true };

  GameCode.findOneAndUpdate(query, update, options).lean().exec((err, gameCode) => {
    if (err) {
      logger.sendErrorMsg({
        code: logger.ErrorCodes.db,
        text: ['Failed to update docFile'],
        err,
      });
    }

    callback(err, gameCode);
  });
}

/**
 * Get profile game code
 * @param {string} owner Owner of the game code
 * @param {Function} callback Callback
 */
function getGameCodeByUserName({ owner, codeType }, callback) {
  const query = { owner, codeType };

  GameCode.findOne(query).lean().exec((err, gameCode) => {
    console.log(gameCode);
    if (err) {
      logger.sendErrorMsg({
        code: logger.ErrorCodes.db,
        text: [`Failed to get game code for ${owner} ${codeType}`],
        err,
      });
    }

    callback(err, gameCode);
  });
}

/**
 * Get game code by code
 * @param {string} code Game code
 * @param {Function} callback Callback
 */
function getGameCodeByCode(code, callback) {
  const query = { code };

  GameCode.findOne(query).lean().exec((err, gameCode) => {
    if (err) {
      logger.sendErrorMsg({
        code: logger.ErrorCodes.db,
        text: ['Failed to get game code'],
        err,
      });
    }

    callback(err, gameCode);
  });
}

/**
 * Remove game code
 * @param {string} code Game code
 * @param {Function} callback Callback
 */
function removeGameCode(code, callback) {
  const query = { code };

  GameCode.findOneAndRemove(query).lean().exec((err) => {
    if (err) {
      logger.sendErrorMsg({
        code: logger.ErrorCodes.db,
        text: ['Failed to remove game code'],
        err,
      });

      return;
    }

    callback(err);
  });
}

exports.getGameCodeByUserName = getGameCodeByUserName;
exports.getGameCodeByCode = getGameCodeByCode;
exports.updateGameCode = updateGameCode;
exports.removeGameCode = removeGameCode;
