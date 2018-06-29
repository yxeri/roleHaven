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

const dbForum = require('../db/connectors/forum');
const { dbConfig } = require('../config/defaults/config');
const errorCreator = require('../error/errorCreator');
const authenticator = require('../helpers/authenticator');
const managerHelper = require('../helpers/manager');

/**
 * Get forum by Id.
 * @param {Object} params - Parameters.
 * @param {string} params.token - jwt.
 * @param {Function} params.callback - Callback.
 * @param {string} [params.forumId] - Id of forum to retrieve.
 */
function getForumById({
  forumId,
  token,
  internalCallUser,
  needsAccess,
  callback,
}) {
  managerHelper.getObjectById({
    token,
    callback,
    internalCallUser,
    needsAccess,
    objectId: forumId,
    objectType: 'forum',
    objectIdType: 'forumId',
    dbCallFunc: dbForum.getForumById,
    commandName: dbConfig.apiCommands.GetForum.name,
  });
}

/**
 * Update last updated date on forum.
 * @param {Object} params - Parameters.
 * @param {string} params.forumId - Id of the forum.
 * @param {Function} params.callback - Callback.
 */
function updateForumTime({
  forumId,
  callback,
}) {
  dbForum.updateForum({
    forumId,
    callback,
    forum: {},
  });
}

/**
 * Create a new forum.
 * @param {Object} params - Parameters.
 * @param {Object} params.forum - Forum to create.
 * @param {Object} params.callback - Callback.
 * @param {Object} params.token - jwt.
 * @param {Object} params.io - Socket.io.
 */
function createForum({
  forum,
  callback,
  token,
  io,
}) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.CreateForum.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const { user: authUser } = data;

      const forumToCreate = forum;
      forumToCreate.ownerId = authUser.objectId;

      if (forumToCreate.ownerAliasId && !authUser.aliases.includes(forumToCreate.ownerAliasId)) {
        callback({ error: new errorCreator.NotAllowed({ name: `create forum with alias ${forumToCreate.ownerAliasId}` }) });

        return;
      }

      dbForum.createForum({
        forum: forumToCreate,
        callback: ({ error: createError, data: createData }) => {
          if (createError) {
            callback({ error: createError });

            return;
          }

          const { forum: createdForum } = createData;
          const creatorDataToSend = {
            data: {
              forum: createdForum,
              changeType: dbConfig.ChangeTypes.CREATE,
            },
          };
          const dataToSend = {
            data: {
              forum: managerHelper.stripObject({ object: Object.assign({}, createdForum) }),
              changeType: dbConfig.ChangeTypes.CREATE,
            },
          };

          io.emit(dbConfig.EmitTypes.FORUM, dataToSend);
          io.to(authUser.objectId).emit(dbConfig.EmitTypes.FORUM, creatorDataToSend);

          callback(creatorDataToSend);
        },
      });
    },
  });
}

/**
 * Get all forums.
 * @param {Object} params - Parameters.
 * @param {Function} params.callback - Callback.
 * @param {string} params.token - jwt.
 */
function getAllForums({ callback, token }) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.GetFull.name,
    callback: ({ error }) => {
      if (error) {
        callback({ error });

        return;
      }

      dbForum.getAllForums({ callback });
    },
  });
}

/**
 * Update forum.
 * @param {Object} params - Parameters.
 * @param {Object} params.forum - Forum.
 * @parm {Object} params.options - Options.
 * @param {Function} params.callback - Callback.
 * @param {Object} params.io - Socket io.
 */
function updateForum({
  token,
  forum,
  forumId,
  options,
  callback,
  io,
  internalCallUser,
}) {
  managerHelper.updateObject({
    callback,
    options,
    token,
    io,
    internalCallUser,
    objectId: forumId,
    object: forum,
    commandName: dbConfig.apiCommands.UpdateForum.name,
    objectType: 'forum',
    dbCallFunc: dbForum.updateForum,
    emitType: dbConfig.EmitTypes.FORUM,
    objectIdType: 'forumId',
    getDbCallFunc: dbForum.getForumById,
    getCommandName: dbConfig.apiCommands.GetForum.name,
  });
}

/**
 * Remove forum.
 * @param {Object} params - Parameters.
 * @param {string} params.token - jwt.
 * @param {string} params.forumId - Id of the forum.
 * @param {Object} params.io - Socket io.
 * @param {Function} params.callback - Callback.
 */
function removeForum({
  token,
  forumId,
  callback,
  io,
}) {
  managerHelper.removeObject({
    callback,
    token,
    io,
    getDbCallFunc: dbForum.getForumById,
    getCommandName: dbConfig.apiCommands.GetForum.name,
    objectId: forumId,
    commandName: dbConfig.apiCommands.RemoveForum.name,
    objectType: 'forum',
    dbCallFunc: dbForum.removeForum,
    emitType: dbConfig.EmitTypes.FORUM,
    objectIdType: 'forumId',
  });
}

/**
 * Get forums by user.
 * @param {Object} params - Parameters.
 * @param {string} params.token - jwt.
 * @param {Function} params.callback - Callback
 */
function getForumsByUser({
  token,
  callback,
}) {
  managerHelper.getObjects({
    callback,
    token,
    shouldSort: true,
    sortName: 'title',
    commandName: dbConfig.apiCommands.GetForum.name,
    objectsType: 'forums',
    dbCallFunc: dbForum.getForumsByUser,
  });
}

exports.createForum = createForum;
exports.removeForum = removeForum;
exports.updateForum = updateForum;
exports.getAllForums = getAllForums;
exports.getForumById = getForumById;
exports.getForumsByUser = getForumsByUser;
exports.updateForumTime = updateForumTime;
