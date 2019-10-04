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

const mongoose = require('mongoose');
const errorCreator = require('../../error/errorCreator');
const dbConnector = require('../databaseConnector');
const dbForumThread = require('./forumThread');
const { dbConfig } = require('../../config/defaults/config');

const forumSchema = new mongoose.Schema(dbConnector.createSchema({
  title: { type: String, unique: true },
  text: { type: [String], default: [] },
  isPersonal: { type: Boolean, default: false },
  image: dbConnector.imageSchema,
}), { collection: 'forums' });

const Forum = mongoose.model('Forum', forumSchema);

/**
 * Update forum object fields.
 * @private
 * @param {Object} params Parameters.
 * @param {string} params.forumId Id of forum to update.
 * @param {Object} params.update Update.
 * @param {Function} params.callback Callback.
 */
function updateObject({
  forumId,
  update,
  callback,
}) {
  dbConnector.updateObject({
    update,
    object: Forum,
    query: { _id: forumId },
    errorNameContent: 'updateForum',
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      callback({ data: { forum: data.object } });
    },
  });
}

/**
 * Get forums
 * @private
 * @param {Object} params Parameters
 * @param {Object} params.query Query to get forums
 * @param {Function} params.callback Callback
 */
function getForums({
  query,
  filter,
  callback,
}) {
  dbConnector.getObjects({
    query,
    filter,
    object: Forum,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      callback({
        data: {
          forums: data.objects,
        },
      });
    },
  });
}

/**
 * Get forum object
 * @private
 * @param {Object} params Parameters
 * @param {string} params.query Query to get forum object
 * @param {Function} params.callback Callback
 */
function getForum({ query, callback }) {
  dbConnector.getObject({
    query,
    object: Forum,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      if (!data.object) {
        callback({ error: new errorCreator.DoesNotExist({ name: `forum ${JSON.stringify(query, null, 4)}` }) });

        return;
      }

      callback({ data: { forum: data.object } });
    },
  });
}

/**
 * Does forum exist?
 * @param {Object} params Parameters
 * @param {string} params.title Title of the forum
 * @param {Function} params.callback Callback
 */
function doesForumExist({ title, callback }) {
  dbConnector.doesObjectExist({
    callback,
    query: { title },
    object: Forum,
  });
}

/**
 * Create a forum.
 * @param {Object} params Parameters.
 * @param {Object} params.forum Forum to save.
 * @param {Function} params.callback Callback.
 * @param {Object} [params.options] Creation options.
 */
function createForum({
  forum,
  callback,
  silentExistsError,
  options = {},
}) {
  const { setId } = options;

  doesForumExist({
    title: forum.title,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      if (data.exists) {
        if (silentExistsError) {
          callback({ data: { exists: true } });
        } else {
          callback({ error: new errorCreator.AlreadyExists({ name: `createForum ${forum.title}` }) });
        }

        return;
      }

      const forumToSave = forum;

      if (setId) {
        forumToSave._id = forumToSave.objectId; // eslint-disable-line no-underscore-dangle
      }

      dbConnector.saveObject({
        object: new Forum(forum),
        objectType: 'forum',
        callback: (forumData) => {
          if (forumData.error) {
            callback({ error: forumData.error });

            return;
          }

          callback({ data: { forum: forumData.data.savedObject } });
        },
      });
    },
  });
}

/**
 * Get forum by Id
 * @param {Object} params Parameters
 * @param {string} params.forumId ID of the forum
 * @param {Function} params.callback Callback
 */
function getForumById({ forumId, callback }) {
  getForum({
    callback,
    query: { _id: forumId },
  });
}

/**
 * Get forums by Id
 * @param {Object} params Parameters
 * @param {string[]} params.forumIds ID of the forum
 * @param {Function} params.callback Callback
 */
function getForumsByIds({ forumIds, callback }) {
  getForums({
    callback,
    query: { _id: { $in: forumIds } },
  });
}

/**
 * Get all forums
 * @param {Object} params Parameters
 * @param {Function} params.callback Callback
 */
function getAllForums({ callback }) {
  getForums({ callback });
}

/**
 * Update existing forum
 * @param {Object} params Parameters
 * @param {string} params.forumId ID of the forum
 * @param {Object} params.forum Forum updates
 * @param {Function} params.callback Callback
 */
function updateForum({ forumId, forum, callback }) {
  const update = { $set: {} };

  if (forum.text) { update.$set.text = forum.text; }

  if (forum.title) {
    update.$set.title = forum.title;

    doesForumExist({
      title: forum.title,
      callback: ({ error, data }) => {
        if (error) {
          callback({ error });

          return;
        }

        if (data.exists) {
          callback({ error: new errorCreator.AlreadyExists({ name: `forum title ${forum.title}` }) });

          return;
        }

        updateObject({
          update,
          forumId,
          callback,
        });
      },
    });

    return;
  }

  updateObject({
    update,
    forumId,
    callback,
  });
}

/**
 * Remove forum.
 * Setting fullRemoval will also remove all connected forum threads and posts.
 * @param {Object} params Parameters
 * @param {string[]} params.forumId ID of forum to remove
 * @param {boolean} params.fullRemoval Should connected forum threads and posts be removed?
 * @param {Function} params.callback Callback
 */
function removeForum({ forumId, fullRemoval, callback }) {
  dbConnector.removeObjects({
    object: Forum,
    query: { _id: forumId },
    callback: ({ error }) => {
      if (error) {
        callback({ error: new errorCreator.Database({ errorObject: error, name: 'removeForum' }) });

        return;
      }

      if (fullRemoval) {
        dbForumThread.getThreadsByForum({
          forumId,
          callback: (threadsData) => {
            if (threadsData.error) {
              callback({ error: threadsData.error });

              return;
            }

            dbForumThread.removeThreads({
              callback,
              threadIds: threadsData.data.threads.map((forumThread) => forumThread.objectId),
              fullRemoval: true,
            });
          },
        });

        return;
      }

      callback({ data: { success: true } });
    },
  });
}

/**
 * Update access to the forum.
 * @param {Object} params Parameters.
 * @param {Function} params.callback Callback.
 * @param {boolean} [params.shouldRemove] Should access be removed?
 * @param {string[]} [params.userIds] Id of the users to update.
 * @param {string[]} [params.teamIds] Id of the teams to update.
 * @param {string[]} [params.bannedIds] Id of the blocked Ids to update.
 * @param {string[]} [params.teamAdminIds] Id of the teams to update admin access for.
 * @param {string[]} [params.userAdminIds] Id of the users to update admin access for.
 */
function updateAccess(params) {
  const { callback } = params;
  const accessParams = params;
  accessParams.objectId = params.forumId;
  accessParams.object = Forum;
  accessParams.callback = ({ error, data }) => {
    if (error) {
      callback({ error });

      return;
    }

    callback({ data: { forum: data.object } });
  };

  if (params.shouldRemove) {
    dbConnector.removeObjectAccess(params);
  } else {
    dbConnector.addObjectAccess(params);
  }
}

/**
 * Get forums by user.
 * @param {Object} params Parameters.
 * @param {Object} params.user User retrieving the forums.
 * @param {Function} params.callback Callback.
 */
function getForumsByUser({
  user,
  callback,
}) {
  const query = dbConnector.createUserQuery({ user });

  getForums({
    query,
    callback,
  });
}

/**
 * Add forums to db.
 * @param {Object} params Parameters.
 * @param {Function} params.callback Callback.
 */
function populateDbForums({ callback = () => {} }) {
  console.info('Creating default forums, if needed');

  const { forums } = dbConfig;

  /**
   * Adds a room to database. Recursive.
   * @param {string[]} forumNames Forum names.
   */
  function addForum(forumNames) {
    const forumName = forumNames.shift();

    if (forumName) {
      createForum({
        forum: forums[forumName],
        silentExistsError: true,
        options: { setId: true },
        callback: ({ error }) => {
          if (error) {
            callback({ error });

            return;
          }

          addForum(forumNames);
        },
      });

      return;
    }

    callback({ data: { success: true } });
  }

  addForum(Object.keys(forums));
}

exports.createForum = createForum;
exports.getForumById = getForumById;
exports.getForumById = getForumById;
exports.updateForum = updateForum;
exports.getAllForums = getAllForums;
exports.getForumsByIds = getForumsByIds;
exports.removeForum = removeForum;
exports.updateAccess = updateAccess;
exports.getForumsByUser = getForumsByUser;
exports.populateDbForums = populateDbForums;
