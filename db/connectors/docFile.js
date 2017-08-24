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
const databaseConnector = require('../databaseConnector');
const dbConfig = require('../../config/defaults/config').databasePopulation;

const docFileSchema = new mongoose.Schema({
  visibility: { type: Number, default: dbConfig.AccessLevels.ANONYMOUS },
  accessLevel: { type: Number, default: dbConfig.AccessLevels.ANONYMOUS },
  isPublic: { type: Boolean, default: true },
  creator: { type: String, default: 'SYSTEM' },
  accessUsers: { type: [String], default: [] },
  accessGroups: { type: [String], default: [] },
  docFileId: { type: String, unique: true },
  title: { type: String, unique: true },
  text: [String],
  team: String,
  customCreator: String,
}, { collection: 'docFiles' });

const DocFile = mongoose.model('DocFile', docFileSchema);

/**
 * Create and save docFile
 * @param {Object} params.docFile New docFile
 * @param {Function} params.callback Callback
 */
function createDocFile({ docFile, callback }) {
  const newDocFile = new DocFile(docFile);
  const query = {
    $or: [
      { docFileId: docFile.docFileId },
      { title: docFile.title },
    ],
  };

  DocFile.findOne(query).lean().exec((err, foundDocFile) => {
    if (err) {
      callback({ error: new errorCreator.Database({ errorObject: err, name: 'createDocFile' }) });

      return;
    } else if (foundDocFile) {
      callback({
        error: new errorCreator.AlreadyExists({
          name: 'Docfile',
          extraData: {
            title: foundDocFile.title === docFile.title,
            docFileId: foundDocFile.docFileId === docFile.docFileId,
          },
        }),
      });

      return;
    }

    databaseConnector.saveObject({
      object: newDocFile,
      objectType: 'docFile',
      callback: (savedData) => {
        if (savedData.error) {
          callback({ error: savedData.error });

          return;
        }

        callback({ data: { docFile: savedData.data.savedObject } });
      },
    });
  });
}

/**
 * Update docFile
 * @param {string} params.docFileId ID of docFile
 * @param {string[]} [params.text] Array with text
 * @param {string} [params.title] Title
 * @param {number} [params.visibility] Minimum access level required to see document
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
 * Get docFile
 * @param {string} params.docFileId ID of docFile
 * @param {string} params.title Title of doc file
 * @param {Object} params.user User retrieving docfile
 * @param {Function} params.callback Callback
 */
function getDocFile({ docFileId, title, user, callback }) {
  const query = {
    $and: [
      {
        $or: [
          { docFileId },
          { $and: [
            { title },
            { team: { $exists: true } },
            { team: user.team },
          ] },
        ],
      }, {
        $or: [
          { creator: user.userName },
          { accessUsers: { $in: [user.userName] } },
          { team: user.team },
          { accessLevel: { $lte: user.accessLevel } },
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
 * Get list of docFiles
 * @param {number} params.accessLevel Access level
 * @param {string} params.userName User name
 * @param {string[]} params.creatorAliases User's aliases for file creation
 * @param {Function} params.callback Callback
 */
function getDocFiles({ accessLevel, userName, creatorAliases, callback }) {
  const query = {
    $and: [
      { $or: [
        { isPublic: true },
        { accessLevel: { $lte: accessLevel } },
      ] },
      { $or: [
        { isPublic: true },
        { visibility: { $lte: accessLevel } },
        { creator: userName },
        { customCreator: { $exists: true, $in: creatorAliases } },
      ] },
    ],
  };
  const filter = { _id: 0, text: 0, visibility: 0, accessLevel: 0 };

  DocFile.find(query, filter).lean().exec((err, docFiles = []) => {
    if (err) {
      callback({ error: new errorCreator.Database({ errorObject: err, name: 'getDocFiles' }) });

      return;
    }

    callback({ data: { docFiles } });
  });
}

exports.createDocFile = createDocFile;
exports.getDocFiles = getDocFiles;
exports.updateDocFile = updateDocFile;
exports.addAccessUser = addAccessUser;
exports.getDocFile = getDocFile;
