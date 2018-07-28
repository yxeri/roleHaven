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
const errorCreator = require('../../error/errorCreator');
const dbConnector = require('../databaseConnector');

const docFileSchema = new mongoose.Schema(dbConnector.createSchema({
  code: { type: String, unique: true },
  title: { type: String, unique: true },
  text: [String],
  pictures: [dbConnector.pictureSchema],
}), { collection: 'docFiles' });

const DocFile = mongoose.model('DocFile', docFileSchema);

/**
 * Update doc file.
 * @private
 * @param {Object} params - Parameters.
 * @param {string} params.docFileId - ID of the doc file to update.
 * @param {Object} params.update - Update.
 * @param {Function} params.callback Callback.
 */
function updateObject({ docFileId, update, callback }) {
  dbConnector.updateObject({
    update,
    query: { _id: docFileId },
    object: DocFile,
    errorNameContent: 'updateDocFile',
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      callback({ data: { docFile: data.object } });
    },
  });
}

/**
 * Get doc files.
 * @private
 * @param {Object} params - Parameters.
 * @param {Function} params.callback - Callback.
 * @param {Object} [params.query] - Query to get doc files.
 * @param {Object} [params.filter] - Result filter.
 */
function getDocFiles({
  query,
  callback,
  filter,
}) {
  dbConnector.getObjects({
    query,
    filter,
    object: DocFile,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      callback({ data: { docFiles: data.objects } });
    },
  });
}

/**
 * Get a doc file.
 * @private
 * @param {Object} params - Parameters.
 * @param {string} params.query - Query to get doc file.
 * @param {Function} params.callback - Callback.
 * @param {Object} [params.filter] - Result filter.
 */
function getDocFile({
  query,
  callback,
  filter = {},
}) {
  dbConnector.getObject({
    query,
    filter,
    object: DocFile,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      } else if (!data.object) {
        callback({ error: new errorCreator.DoesNotExist({ name: `docFile ${JSON.stringify(query, null, 4)}` }) });

        return;
      }

      callback({ data: { docFile: data.object } });
    },
  });
}

/**
 * Does the doc file exist?
 * @param {Object} params - Parameters.
 * @param {string} params.title - Title of the doc file.
 * @param {string} params.code - Code of the doc file.
 * @param {Function} params.callback - Callback.
 */
function doesDocFileExist({ title, code, callback }) {
  const query = { $or: [] };

  if (title) { query.$or.push({ title }); }
  if (code) { query.$or.push({ code }); }

  dbConnector.doesObjectExist({
    query,
    callback,
    object: DocFile,
  });
}

/**
 * Create and save docFile.
 * @param {Object} params - Parameters.
 * @param {Object} params.docFile - New docFile.
 * @param {Function} params.callback - Callback.
 */
function createDocFile({ docFile, callback }) {
  doesDocFileExist({
    code: docFile.code,
    title: docFile.title,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      } else if (data.exists) {
        callback({ error: new errorCreator.AlreadyExists({ name: `Docfile ${docFile.code} ${docFile.title}` }) });

        return;
      }

      dbConnector.saveObject({
        object: new DocFile(docFile),
        objectType: 'docFile',
        callback: (savedData) => {
          if (savedData.error) {
            callback({ error: savedData.error });

            return;
          }

          callback({ data: { docFile: savedData.data.savedObject } });
        },
      });
    },
  });
}

/**
 * Update docFile.
 * @param {Object} params - Parameters.
 * @param {string} params.docFile - Doc file info to update.
 * @param {string} params.docFileId - ID of the doc file to update.
 * @param {string[]} [params.docFile.text] - Array with text.
 * @param {string} [params.docFile.title] - Title.
 * @param {number} [params.docFile.visibility] - Minimum access level required to see document.
 * @param {boolean} [params.docFile.isPublic] - Is the document visible to the public?
 * @param {Object} [params.options] - Options.
 * @param {boolean} [params.options.resetOwnerAliasId] - Should owner alias be reset?
 * @param {Function} params.callback - Callback.
 */
function updateDocFile({
  docFileId,
  docFile,
  callback,
  options = {},
}) {
  const { resetOwnerAliasId } = options;
  const {
    text,
    title,
    visibility,
    isPublic,
    ownerAliasId,
  } = docFile;

  const update = {};
  const set = {};
  const unset = {};

  if (text) { set.text = text; }
  if (title) { set.title = title; }
  if (visibility) { set.visibility = visibility; }
  if (typeof isPublic === 'boolean') { set.isPublic = isPublic; }

  if (resetOwnerAliasId) {
    unset.ownerAliasId = '';
  } else if (ownerAliasId) {
    set.ownerAliasId = ownerAliasId;
  }

  if (Object.keys(set).length > 0) { update.$set = set; }
  if (Object.keys(unset).length > 0) { update.$unset = unset; }

  updateObject({
    docFileId,
    update,
    callback,
  });
}

/**
 * Update access to the file.
 * @param {Object} params - Parameters.
 * @param {Function} params.callback - Callback.
 * @param {boolean} [params.shouldRemove] - Should access be removed?
 * @param {string[]} [params.userIds] - Id of the users to update.
 * @param {string[]} [params.teamIds] - Id of the teams to update.
 * @param {string[]} [params.bannedIds] - Id of the blocked Ids to update.
 * @param {string[]} [params.teamAdminIds] - Id of the teams to update admin access for.
 * @param {string[]} [params.userAdminIds] - Id of the users to update admin access for.
 */
function updateAccess(params) {
  const accessParams = params;
  accessParams.objectId = params.docFileId;
  accessParams.object = DocFile;
  accessParams.callback = ({ error, data }) => {
    if (error) {
      accessParams.callback({ error });

      return;
    }

    accessParams.callback({ data: { docFile: data.object } });
  };

  if (params.shouldRemove) {
    dbConnector.removeObjectAccess(params);
  } else {
    dbConnector.addObjectAccess(params);
  }
}

/**
 * Remove doc file.
 * @param {Object} params - Parameters.
 * @param {string} params.docFileId - ID of the doc file.
 * @param {Function} params.callback - Callback.
 */
function removeDocFile({ docFileId, callback }) {
  const query = { _id: docFileId };

  dbConnector.removeObject({
    query,
    callback,
    object: DocFile,
  });
}

/**
 * Get all doc files.
 * @param {Object} params - Parameters.
 * @param {Function} params.callback - Callback.
 */
function getAllDocFiles({ callback }) {
  getDocFiles({
    callback,
    errorNameContent: 'getAllDocFiles',
  });
}

/**
 * Get doc file by id.
 * @param {Object} params - Parameters.
 * @param {string} params.docFileId - ID of the doc file.
 * @param {Function} params.callback - Callback.
 */
function getDocFileById({
  docFileId,
  callback,
}) {
  getDocFile({
    callback,
    query: { _id: docFileId },
  });
}

/**
 * Get doc file by code.
 * @param {Object} params - Parameters.
 * @param {string} params.code - Docfile code.
 * @param {Function} params.callback - Callback.
 */
function getDocFileByCode({
  code,
  callback,
}) {
  getDocFile({
    callback,
    query: { code },
  });
}

/**
 * Get files by user.
 * @param {Object} params - Parameters.
 * @param {Object} params.user - User retrieving the files.
 * @param {Function} params.callback - Callback.
 */
function getDocFilesByUser({
  user,
  callback,
}) {
  const query = dbConnector.createUserQuery({ user });

  getDocFiles({
    query,
    callback,
  });
}

/**
 * Get list of doc files.
 * @param {Object} params - Parameters.
 * @param {Function} params.callback - Callback.
 */
function getDocFilesList({ callback }) {
  getDocFiles({
    callback,
    errorNameContent: 'getDocFilesList',
  });
}

exports.createDocFile = createDocFile;
exports.updateDocFile = updateDocFile;
exports.updateAccess = updateAccess;
exports.getDocFileById = getDocFileById;
exports.removeDocFile = removeDocFile;
exports.getAllDocFiles = getAllDocFiles;
exports.getDocFileByCode = getDocFileByCode;
exports.getDocFilesByUser = getDocFilesByUser;
exports.getDocFilesList = getDocFilesList;
