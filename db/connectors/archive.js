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

const mongoose = require('mongoose');
const logger = require('../../utils/logger');
const databaseConnector = require('../databaseConnector');

const archiveSchema = new mongoose.Schema({
  visibility: { type: Number, default: 0 },
  public: { type: Boolean, default: true },
  text: [String],
  archiveId: { type: String, unique: true },
  title: String,
  creator: { type: String, default: 'SYSTEM' },
}, { collection: 'archives' });

const Archive = mongoose.model('Archive', archiveSchema);

/**
 * Create and save archive
 * @param {Object} archive - New archive
 * @param {Function} callback - Callback
 */
function createArchive(archive, callback) {
  const query = { archiveId: archive.archiveId };

  Archive.findOne(query).lean().exec((err, foundArchive) => {
    if (err) {
      logger.sendErrorMsg({
        code: logger.ErrorCodes.db,
        text: ['Failed to check if user exists'],
        err,
      });
    } else if (foundArchive === null) {
      const newArchive = new Archive(archive);

      databaseConnector.saveObject(newArchive, 'archive', callback);
    } else {
      callback(err, null);
    }
  });
}

/**
 * Get archive by archive ID and user access level
 * @param {string} archiveId - ID of archive
 * @param {number} accessLevel - User access level
 * @param {Function} callback - Callback
 */
function getArchive(archiveId, accessLevel, callback) {
  const query = {
    $and: [
      { visibility: { $lte: accessLevel } },
      { archiveId },
    ],
  };

  Archive.findOne(query).lean().exec((err, archive) => {
    if (err) {
      logger.sendErrorMsg({
        code: logger.ErrorCodes.db,
        text: [`Failed to get archive with id ${archiveId}`],
        err,
      });
    }

    callback(err, archive);
  });
}

/**
 * Get all archives based on user access level
 * @param {number} accessLevel - User access level
 * @param {Function} callback - Callback
 */
function getArchives(accessLevel, callback) {
  const query = { accessLevel: { $lte: accessLevel } };

  Archive.find(query).lean().exec((err, archives) => {
    if (err) {
      logger.sendErrorMsg({
        code: logger.ErrorCodes.db,
        text: ['Failed to get archives'],
        err,
      });
    }

    callback(err, archives);
  });
}

/**
 * Get list of archives, based on user access level and if archive is public
 * @param {number} accessLevel - User access level
 * @param {Function} callback - Callback
 */
function getArchivesList(accessLevel, callback) {
  const query = {
    $and: [
      { visibility: { $lte: accessLevel } },
      { public: true },
    ],
  };

  Archive.find(query).lean().exec((err, archives) => {
    if (err) {
      logger.sendErrorMsg({
        code: logger.ErrorCodes.db,
        text: ['Failed to get archives list'],
        err,
      });
    }

    callback(err, archives);
  });
}

exports.createArchive = createArchive;
exports.getArchive = getArchive;
exports.getArchives = getArchives;
exports.getArchivesList = getArchivesList;
