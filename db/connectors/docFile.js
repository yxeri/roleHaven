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
const databaseConnector = require('../databaseConnector');

const docFileSchema = new mongoose.Schema({
  visibility: { type: Number, default: 0 },
  isPublic: { type: Boolean, default: true },
  text: [String],
  docFileId: { type: String, unique: true },
  title: { type: String, unique: true },
  creator: { type: String, default: 'SYSTEM' },
  team: String,
  accessUsers: [String],
}, { collection: 'docFiles' });

const DocFile = mongoose.model('DocFile', docFileSchema);

/**
 * Create and save docFile
 * @param {Object} params.docFile New docFile
 * @param {Function} params.callback Callback
 */
function createDocFile({ docFile, callback }) {
  const newDocFile = new DocFile(docFile);
  const query = { docFileId: docFile.docFileId };

  DocFile.findOne(query).lean().exec((err, foundDocFile) => {
    if (err) {
      callback({ error: new errorCreator.Database({ errorObject: err, name: 'createDocFile' }) });

      return;
    } else if (foundDocFile) {
      callback({ error: new errorCreator.AlreadyExists({ name: `docfile ${docFile.docFileId}` }) });

      return;
    }

    databaseConnector.saveObject({
      callback,
      object: newDocFile,
      objectType: 'docFile',
    });
  });
}

/**
 * Set text on docFile
 * @param {string} params.docFileId ID of docFile
 * @param {string[]} [params.text] Array with text
 * @param {string} [params.title] Title
 * @param {number} [params.visibility] Access level required to access the document
 * @param {boolean} [params.isPublic] Is the document visible to the public?
 * @param {Function} params.callback Callback
 */
function updateDocFile({ docFileId, text, title, visibility, isPublic, callback }) {
  const query = { docFileId };
  const update = {};
  const options = { new: true };

  if (text) { update.text = text; }
  if (title) { update.title = title; }
  if (visibility) { update.visibility = visibility; }
  if (isPublic) { update.isPublic = isPublic; }

  DocFile.findOneAndUpdate(query, update, options).lean().exec((err, docFile) => {
    if (err) {
      callback({ error: new errorCreator.Database({ errorObject: err, name: 'updateDocFile' }) });

      return;
    }

    callback({ data: { docFile } });
  });
}

/**
 * Add a user that is allowed access to a document
 * @param {string} params.docFileId ID of the document to update
 * @param {string} params.userName User name of the user with access to the document
 * @param {Function} params.callback Callback
 */
function addAccessUser({ docFileId, userName, callback }) {
  const query = { docFileId };
  const update = { $push: { accessUsers: userName } };
  const options = { new: true };

  DocFile.findOneAndUpdate(query, update, options).lean().exec((err, docFile) => {
    if (err) {
      callback({ error: new errorCreator.Database({ errorObject: err, name: 'addAccessUser' }) });

      return;
    }

    callback({ data: { docFile } });
  });
}

/**
 * Get docFile by docFile ID and user access level
 * @param {string} params.docFileId ID of docFile
 * @param {string} params.title Title of the docfile
 * @param {string} params.team Retrieves user team
 * @param {number} params.accessLevel User access level
 * @param {Function} params.callback Callback
 */
function getDocFile({ title, team, docFileId, accessLevel, callback }) {
  const query = {
    $or: [
      {
        $and: [
          { visibility: { $lte: accessLevel } },
          { docFileId },
        ],
      }, {
        $and: [
          { visibility: { $lte: accessLevel } },
          { title },
          { team },
        ],
      },
    ],
  };

  DocFile.findOne(query).lean().exec((err, docFile) => {
    if (err) {
      callback({ error: new errorCreator.Database({ errorObject: err, name: 'getDocFile' }) });

      return;
    } else if (!docFile) {
      callback({ error: new errorCreator.DoesNotExist({ name: `docfile ${docFileId}` }) });

      return;
    }

    callback({ data: { docFile } });
  });
}

/**
 * Get list of docFiles, based on user access level
 * @param {number} params.accessLevel Access level
 * @param {Function} params.callback Callback
 */
function getDocFilesList({ accessLevel, userName, callback }) {
  const query = {
    $or: [
      { visibility: { $lte: accessLevel } },
      { owner: userName },
    ],
  };
  const filter = { _id: 0, text: 0 };

  DocFile.find(query, filter).lean().exec((err, docFiles) => {
    if (err) {
      callback({ error: new errorCreator.Database({ errorObject: err, name: 'getDocFilesList' }) });

      return;
    }

    callback({ data: { docFiles } });
  });
}

exports.createDocFile = createDocFile;
exports.getDocFile = getDocFile;
exports.getDocFilesList = getDocFilesList;
exports.updateDocFile = updateDocFile;
exports.addAccessUser = addAccessUser;
