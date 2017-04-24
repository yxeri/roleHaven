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
const databaseConnector = require('../databaseConnector');

const docFileSchema = new mongoose.Schema({
  visibility: { type: Number, default: 0 },
  isPublic: { type: Boolean, default: true },
  text: [String],
  docFileId: { type: String, unique: true },
  title: String,
  creator: { type: String, default: 'SYSTEM' },
  team: String,
}, { collection: 'docFiles' });

const DocFile = mongoose.model('DocFile', docFileSchema);

/**
 * Create and save docFile
 * @param {Object} docFile - New docFile
 * @param {Function} callback - Callback
 */
function createDocFile(docFile, callback) {
  const query = { docFileId: docFile.docFileId };

  DocFile.findOne(query).lean().exec((err, foundDocFile) => {
    if (err) {
      logger.sendErrorMsg({
        code: logger.ErrorCodes.db,
        text: ['Failed to check if user exists'],
        err,
      });
    } else if (foundDocFile === null) {
      const newDocFile = new DocFile(docFile);

      databaseConnector.saveObject(newDocFile, 'docFile', callback);
    } else {
      callback(err, null);
    }
  });
}

/**
 * Set text on docFile
 * @param {string} docFileId - ID of docFile
 * @param {Object} params - Properties to change in the docFile
 * @param {string[]} params.text - Array with text
 * @param {string} params.title - Title
 * @param {number} params.visibility - Access level required to access the document
 * @param {boolean} params.isPublic - Is the document visible to the public?
 * @param {Function} callback - Callback
 */
function updateDocFile(docFileId, { text, title, visibility, isPublic }, callback) {
  const query = { docFileId };
  const update = { };
  const options = { new: true };

  if (text) { update.text = text; }
  if (title) { update.title = title; }
  if (visibility) { update.visibility = visibility; }
  if (isPublic) { update.isPublic = isPublic; }

  DocFile.findOneAndUpdate(query, update, options).lean().exec((err, docFile) => {
    if (err) {
      logger.sendErrorMsg({
        code: logger.ErrorCodes.db,
        text: ['Failed to update docFile'],
        err,
      });
    }

    callback(err, docFile);
  });
}

/**
 * Get docFile by docFile ID and user access level
 * @param {string} docFileId - ID of docFile
 * @param {number} accessLevel - User access level
 * @param {Function} callback - Callback
 */
function getDocFile(docFileId, accessLevel, callback) {
  const query = {
    $and: [
      { visibility: { $lte: accessLevel } },
      { docFileId },
    ],
  };

  DocFile.findOne(query).lean().exec((err, docFile) => {
    if (err) {
      logger.sendErrorMsg({
        code: logger.ErrorCodes.db,
        text: [`Failed to get archive with id ${docFileId}`],
        err,
      });
    }

    callback(err, docFile);
  });
}

/**
 * Get all docFiles based on user access level
 * @param {number} accessLevel - User access level
 * @param {Function} callback - Callback
 */
function getDocFiles(accessLevel, callback) {
  const query = { accessLevel: { $lte: accessLevel } };

  DocFile.find(query).lean().exec((err, docFile) => {
    if (err) {
      logger.sendErrorMsg({
        code: logger.ErrorCodes.db,
        text: ['Failed to get docFiles'],
        err,
      });
    }

    callback(err, docFile);
  });
}

/**
 * Get list of docFiles, based on user access level and if docFile is public
 * @param {number} accessLevel - User access level
 * @param {string} userName - User name
 * @param {Function} callback - Callback
 */
function getDocFilesList(accessLevel, userName, callback) {
  const query = {
    visibility: { $lte: accessLevel },
    $or: [{ isPublic: true }, { creator: userName }],
  };
  const filter = { _id: 0, text: 0 };

  DocFile.find(query, filter).lean().exec((err, docFiles) => {
    if (err) {
      logger.sendErrorMsg({
        code: logger.ErrorCodes.db,
        text: ['Failed to get docFiles list'],
        err,
      });
    }

    callback(err, docFiles);
  });
}

exports.createDocFile = createDocFile;
exports.getDocFile = getDocFile;
exports.getDocFiles = getDocFiles;
exports.getDocFilesList = getDocFilesList;
exports.updateDocFile = updateDocFile;
