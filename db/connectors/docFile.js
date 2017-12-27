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
const dbConnector = require('../databaseConnector');

const docFileSchema = new mongoose.Schema(dbConnector.createSchema({
  code: { type: String, unique: true },
  title: { type: String, unique: true },
  text: [String],
}), { collection: 'docFiles' });

const DocFile = mongoose.model('DocFile', docFileSchema);

/**
 * Add custom id to the object
 * @param {Object} docFile - Doc file object
 * @return {Object} - Doc file object with id
 */
function addCustomId(docFile) {
  const updatedDocFile = docFile;
  updatedDocFile.docFileId = docFile.objectId;

  return updatedDocFile;
}

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

      callback({ data: { docFile: addCustomId(data.object) } });
    },
  });
}

/**
 * Get doc files.
 * @private
 * @param {Object} params - Parameters.
 * @param {Object} params.query - Query to get doc files.
 * @param {Function} params.callback - Callback.
 */
function getDocFiles({ query, callback, lite }) {
  const filter = {};

  if (lite) {
    filter.text = 0;
  }

  dbConnector.getObjects({
    query,
    filter,
    object: DocFile,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      callback({
        data: {
          docFiles: data.objects.map(docFile => addCustomId(docFile)),
        },
      });
    },
  });
}

/**
 * Get doc file.
 * @private
 * @param {Object} params - Parameters.
 * @param {string} params.query - Query to get doc file.
 * @param {Function} params.callback - Callback.
 */
function getDocFile({ lite, query, callback }) {
  const filter = {};

  if (lite) {
    filter.text = 0;
  }

  dbConnector.getObject({
    query,
    filter,
    object: DocFile,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      } else if (!data.object) {
        callback({ error: new errorCreator.DoesNotExist({ name: `docFile ${query.toString()}` }) });

        return;
      }

      callback({ data: { docFile: addCustomId(data.object) } });
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

          callback({ data: { docFile: addCustomId(savedData.data.savedObject) } });
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
 * @param {string} [params.docFile.code] - DocFile code.
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
    code,
    text,
    title,
    visibility,
    isPublic,
    ownerAliasId,
  } = docFile;

  const update = { $set: {} };

  if (code) { update.$set.code = code; }
  if (text) { update.$set.text = text; }
  if (title) { update.$set.title = title; }
  if (visibility) { update.$set.visibility = visibility; }
  if (typeof isPublic === 'boolean') { update.$set.isPublic = isPublic; }

  if (resetOwnerAliasId) {
    update.$unset = { ownerAliasId: '' };
  } else if (ownerAliasId) {
    update.set.ownerAliasId = ownerAliasId;
  }

  updateObject({
    docFileId,
    update,
    callback,
  });
}

/**
 * Add users and/teams that are allowed access to a document.
 * @param {Object} params - Parameters.
 * @param {string} params.docFileId - ID of the document to update.
 * @param {string[]} [params.userIds] - ID of the users.
 * @param {string[]} [params.teamIds] - ID of the teams.
 * @param {string[]} [params.bannedIds] - ID of the blocked Ids to add.
 * @param {string[]} [params.teamAdminIds] - Id of the teams to give admin access to. They will also be added to teamIds.
 * @param {string[]} [params.userAdminIds] - Id of the users to give admin access to. They will also be added to userIds.
 * @param {Function} params.callback - Callback.
 */
function addAccess({
  docFileId,
  userIds,
  teamIds,
  bannedIds,
  teamAdminIds,
  userAdminIds,
  callback,
}) {
  dbConnector.addObjectAccess({
    userIds,
    teamIds,
    bannedIds,
    teamAdminIds,
    userAdminIds,
    objectId: docFileId,
    object: DocFile,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      callback({ data: { docFile: addCustomId(data.object) } });
    },
  });
}

/**
 * Remove access to the doc file for users and/or teams.
 * @param {Object} params - Parameters.
 * @param {string} params.docFileId - ID of the doc file.
 * @param {string[]} [params.userIds] - ID of the users.
 * @param {string[]} [params.teamIds] - ID of the teams.
 * @param {string[]} [params.bannedIds] - Blocked IDs.
 * @param {string[]} [params.teamAdminIds] - Id of the teams to remove admin access from. They will not be removed from teamIds.
 * @param {string[]} [params.userAdminIds] - Id of the users to remove admin access from. They will not be removed from userIds.
 * @param {Function} params.callback - Callback.
 */
function removeAccess({
  userIds,
  teamIds,
  bannedIds,
  teamAdminIds,
  userAdminIds,
  docFileId,
  callback,
}) {
  dbConnector.removeObjectAccess({
    userIds,
    teamIds,
    bannedIds,
    userAdminIds,
    teamAdminIds,
    objectId: docFileId,
    object: DocFile,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      callback({ data: { docFile: addCustomId(data.object) } });
    },
  });
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
 * @param {boolean} [params.lite] - Should parameters with a large amount of data be filtered out?
 * @param {Function} params.callback - Callback.
 */
function getAllDocFiles({ callback, lite = true }) {
  getDocFiles({
    lite,
    callback,
    errorNameContent: 'getAllDocFiles',
  });
}

/**
 * Get doc file by id.
 * @param {Object} params - Parameters.
 * @param {string} params.docFileId - ID of the doc file.
 * @param {boolean} [params.lite] - Should parameters with a large amount of data be filtered out?
 * @param {Function} params.callback - Callback.
 */
function getDocFileById({ lite, docFileId, callback }) {
  getDocFile({
    callback,
    lite,
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
 * Get a list of doc files that the user can try to access.
 * @param {Object} params - Parameters.
 * @param {Object} params.user - User.
 * @param {Function} params.callback - Callback.
 */
function getDocFilesListByUser({ user, callback }) {
  const userIdToCheck = [user.userId];
  const query = {
    bannedIds: { $nin: userIdToCheck.concat(user.partOfTeams) },
    $or: [
      { isPublic: true },
      { userIds: { $in: userIdToCheck } },
      { visibility: { $lte: user.accessLevel } },
      { teamIds: { $in: user.partOfTeams } },
    ],
  };

  getDocFiles({
    query,
    callback,
    lite: true,
  });
}

/**
 * Get files by user.
 * @param {Object} params - Parameters.
 * @param {Object} params.userId - ID of the user retrieving the files.
 * @param {Function} params.callback - Callback.
 */
function getDocFilesByUser({ userId, callback }) {
  const query = {
    $or: [
      { ownerId: userId },
      { userIds: { $in: [userId] } },
    ],
  };

  getDocFiles({
    query,
    callback,
  });
}

exports.createDocFile = createDocFile;
exports.updateDocFile = updateDocFile;
exports.addAccess = addAccess;
exports.removeAccess = removeAccess;
exports.getDocFileById = getDocFileById;
exports.removeDocFile = removeDocFile;
exports.getAllDocFiles = getAllDocFiles;
exports.getDocFileByCode = getDocFileByCode;
exports.getDocFilesListByUser = getDocFilesListByUser;
exports.getDocFilesByUser = getDocFilesByUser;
