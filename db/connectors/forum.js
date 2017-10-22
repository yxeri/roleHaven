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

const mongoose = require('mongoose');
const errorCreator = require('../../objects/error/errorCreator');
const dbConnector = require('../databaseConnector');

/**
 * First: threadId, isThreadStarter
 * Level 1: threadId
 * Level 2: threadId. postId
 */

/**
 * @typedef ForumPost
 * @property isThreadStarter - Is the post the start of the thread?
 */

const forumSchema = new mongoose.Schema({
  timeCreated: Date,
  lastUpdated: Date,
  ownerId: String,
  ownerAliasId: String,
  title: String,
  threadIds: { type: [String], default: [] },
  text: { type: [String], default: [] },
  isPublic: { type: Boolean, default: true },
  userIds: { type: [String], default: [] },
  teamIds: { type: [String], default: [] },
  adminIds: { type: [String], default: [] },
}, { collection: 'forums' });
const forumThreadSchema = new mongoose.Schema({
  timeCreated: Date,
  lastUpdated: Date,
  forumId: String,
  title: String,
  ownerId: String,
  ownerAliasId: String,
  text: { type: [String], default: [] },
  isPublic: { type: Boolean, default: true },
  postIds: { type: [String], default: [] },
  userIds: { type: [String], default: [] },
  teamIds: { type: [String], default: [] },
  adminIds: { type: [String], default: [] },
}, { collection: 'forumThreads' });
const forumPostSchema = new mongoose.Schema({
  threadId: String,
  parentPostId: String,
  timeCreated: Date,
  lastUpdated: Date,
  ownerId: String,
  ownerAliasId: String,
  text: { type: [String], default: [] },
  depth: { type: Number, default: 0 },
  isPublic: { type: Boolean, default: true },
  userIds: { type: [String], default: [] },
  teamIds: { type: [String], default: [] },
  adminIds: { type: [String], default: [] },
}, { collection: 'forumPosts' });

const Forum = mongoose.model('Forum', forumSchema);
const ForumThread = mongoose.model('ForumThread', forumThreadSchema);
const ForumPost = mongoose.model('ForumPost', forumPostSchema);

/**
 * Modify forum parameters
 * @param {Object} params - Parameters
 * @param {Object} params.forumItem - Forum it
 * @return {Object} Modified forum item
 */
function modifyForumParameters({ forumItem, type = '' }) {
  const modifiedForumItem = forumItem;

  if (type === 'post') {
    modifiedForumItem.postId = modifiedForumItem._id; // eslint-disable-line no-underscore-dangle
  } else if (type === 'thread') {
    modifiedForumItem.threadId = modifiedForumItem._id; // eslint-disable-line no-underscore-dangle
  } else {
    modifiedForumItem.forumId = modifiedForumItem._id; // eslint-disable-line no-underscore-dangle
  }

  return modifiedForumItem;
}

/**
 * Create forum post.
 * @param {Object} params - Parameters
 * @param {Object} params.post - Forum post to save
 * @param {string} params.post.threadId - ID of the thread to attach the post to
 * @param {string} [params.post.postId] - ID of the post
 * @param {boolean} [params.post.isThreadStarter] - Is this the first post in the thread?
 * @param {Function} params.callback - Callback
 */
function createForumPost({ post, callback }) {
  const forumPostToSave = post;
  const parentPostIsSet = typeof forumPostToSave.parentPostId !== 'undefined';

  if (parentPostIsSet) {
    forumPostToSave.depth = 1;
  }

  const getPost = (forumPostCallback) => {
    const forumPostQuery = { _id: forumPostToSave.parentPostId };

    ForumPost.findOne(forumPostQuery).lean().exec((forumPostError, foundForumPost) => {
      if (forumPostError) {
        callback({ error: new errorCreator.Database({ errorObject: forumPostError, name: 'createForumPost' }) });

        return;
      } else if (!foundForumPost) {
        callback({ error: new errorCreator.DoesNotExist({ name: `forumPost ${forumPostToSave.parentPostId}` }) });

        return;
      } else if (foundForumPost.depth > 0) {
        callback({ error: new errorCreator.Incorrect({ name: `forumPost ${foundForumPost._id} depth ${foundForumPost.depth}` }) });

        return;
      }

      if (parentPostIsSet) {
        forumPostToSave.adminIds = post.adminIds ? post.adminIds : foundForumPost.adminIds;
        forumPostToSave.userIds = post.userIds ? post.userIds : foundForumPost.userIds;
        forumPostToSave.teamIds = post.teamIds ? post.teamIds : foundForumPost.teamIds;
      }

      forumPostCallback({ data: { post: modifyForumParameters({ forumItem: foundForumPost, type: 'post' }) } });
    });
  };
  const savePost = (saveForumPostCallback) => {
    const forumThreadQuery = { _id: forumPostToSave.threadId };

    ForumThread.findOne(forumThreadQuery).lean().exec((forumThreadError, foundForumThread) => {
      if (forumThreadError) {
        saveForumPostCallback({ error: new errorCreator.Database({ errorObject: forumThreadError, name: 'createForumPost' }) });

        return;
      } else if (!foundForumThread) {
        saveForumPostCallback({ error: new errorCreator.DoesNotExist({ name: `forumThread ${forumPostToSave.threadId}` }) });

        return;
      }

      forumPostToSave.adminIds = post.adminIds ? post.adminIds : foundForumThread.adminIds;
      forumPostToSave.userIds = post.userIds ? post.userIds : foundForumThread.userIds;
      forumPostToSave.teamIds = post.teamIds ? post.teamIds : foundForumThread.teamIds;

      const now = new Date();
      forumPostToSave.lastUpdated = now;
      forumPostToSave.timeCreated = now;

      dbConnector.saveObject({
        object: new ForumPost(forumPostToSave),
        objectType: 'post',
        callback: ({ error: saveError, data: saveData }) => {
          if (saveError) {
            saveForumPostCallback({ error: new errorCreator.Database({ errorObject: saveError, name: 'createForumPost' }) });

            return;
          }

          saveForumPostCallback({ data: { post: modifyForumParameters({ forumItem: saveData.savedObject, type: 'post' }) } });
        },
      });
    });
  };

  if (parentPostIsSet) {
    getPost((forumData) => {
      if (forumData.error) {
        callback({ error: forumData.error });

        return;
      }

      savePost(callback);
    });

    return;
  }

  savePost(callback);
}

/**
 * Create forum.
 * @param {Object} params - Parameters
 * @param {Object} params.forum - Forum to save
 * @param {Function} params.callback - Callback
 */
function createForum({ forum, callback }) {
  const query = { forumName: forum.forumName };

  Forum.findOne(query).lean().exec((histErr, foundForum) => {
    if (histErr) {
      callback({ error: new errorCreator.Database({ errorObject: histErr, name: 'createForum' }) });

      return;
    } else if (foundForum) {
      callback({ error: new errorCreator.AlreadyExists({ name: `createForum ${forum.forumName}` }) });

      return;
    }

    const now = new Date();
    const forumToSave = forum;
    forumToSave.lastUpdated = now;
    forumToSave.timeCreated = now;

    dbConnector.saveObject({
      object: new Forum(forumToSave),
      objectType: 'Forum',
      callback: ({ error, data }) => {
        if (error) {
          callback({ error });

          return;
        }

        callback({ data: { forum: modifyForumParameters({ forumItem: data.savedObject, type: 'forum' }) } });
      },
    });
  });
}

/**
 * Create thread.
 * @param {Object} params - Parameters
 * @param {Object} params.thread - Forum thread to save
 * @param {Function} params.callback - Callback
 */
function createThread({ thread, callback }) {
  const query = { _id: thread.forumId };

  Forum.findOne(query).lean().exec((err, foundForum) => {
    if (err) {
      callback({ error: new errorCreator.Database({ errorObject: err, name: 'createThread' }) });

      return;
    } else if (!foundForum) {
      callback({ error: new errorCreator.DoesNotExist({ name: `forum ${thread.forumId}` }) });

      return;
    }

    const now = new Date();
    const threadToSave = thread;
    threadToSave.lastUpdated = now;
    threadToSave.timeCreated = now;

    dbConnector.saveObject({
      object: new ForumThread(threadToSave),
      objectType: 'ForumThread',
      callback: ({ error, data }) => {
        if (error) {
          callback({ error });

          return;
        }

        callback({ data: { thread: modifyForumParameters({ forumItem: data.savedObject, type: 'thread' }) } });
      },
    });
  });
}

/**
 * Get forum by Id
 * @param {Object} params - Parameters
 * @param {string} params.forumId - ID of the forum
 * @param {Function} params.callback - Callback
 */
function getForumById({ forumId, callback }) {
  const query = { _id: forumId };

  Forum.findOne(query).lean().exec((error, foundForum) => {
    if (error) {
      callback({ error: new errorCreator.Database({ errorObject: error, name: 'getForum' }) });

      return;
    } else if (!foundForum) {
      callback({ error: new errorCreator.DoesNotExist({ name: `forum ${forumId}` }) });

      return;
    }

    callback({ data: { forum: modifyForumParameters({ forumItem: foundForum, type: 'forum' }) } });
  });
}

/**
 * Get forums by Id
 * @param {Object} params - Parameters
 * @param {string[]} params.forumIds - ID of the forum
 * @param {Function} params.callback - Callback
 */
function getForumsByIds({ forumIds, callback }) {
  const query = { _id: { $in: forumIds } };

  Forum.find(query).lean().exec((error, foundForums = []) => {
    if (error) {
      callback({ error: new errorCreator.Database({ errorObject: error, name: 'getForumsByIds' }) });

      return;
    }

    callback({ data: { forums: foundForums.map(forum => modifyForumParameters({ forumItem: forum, type: 'forum' })) } });
  });
}

/**
 * Get all forums
 * @param {Object} params - Parameters
 * @param {Function} params.callback - Callback
 */
function getAllForums({ callback }) {
  Forum.find({}).lean().exec((error, foundForums = []) => {
    if (error) {
      callback({ error: new errorCreator.Database({ errorObject: error, name: 'getForums' }) });

      return;
    }

    callback({ data: { forums: foundForums.map(forum => modifyForumParameters({ forumItem: forum, type: 'forum' })) } });
  });
}

/**
 * Get forum thread
 * @param {Object} params - Parameters
 * @param {string} params.threadId - ID of the thread
 * @param {Function} params.callback - Callback
 */
function getForumThread({ threadId, callback }) {
  const query = { _id: threadId };

  ForumThread.findOne(query).lean().exec((error, foundForumThread) => {
    if (error) {
      callback({ error: new errorCreator.Database({ errorObject: error, name: 'getForumThread' }) });

      return;
    } else if (!foundForumThread) {
      callback({ error: new errorCreator.DoesNotExist({ name: `forumThread ${threadId}` }) });

      return;
    }

    callback({ data: { thread: modifyForumParameters({ forumItem: foundForumThread, type: 'thread' }) } });
  });
}

/**
 * Get forum post
 * @param {Object} params - Parameters
 * @param {string} params.postId - ID of the forum post
 * @param {Function} params.callback - Callback
 */
function getForumPost({ postId, callback }) {
  const query = { _id: postId };

  ForumPost.findOne(query).lean().exec((error, foundForumPost) => {
    if (error) {
      callback({ error: new errorCreator.Database({ errorObject: error, name: 'getForumPost' }) });

      return;
    } else if (!foundForumPost) {
      callback({ error: new errorCreator.DoesNotExist({ name: `forumPost ${postId}` }) });

      return;
    }

    callback({ data: { post: modifyForumParameters({ forumItem: foundForumPost, type: 'post' }) } });
  });
}

/**
 * Get forum posts
 * @param {Object} params - Parameters
 * @param {string} params.postIds - ID of the forum posts
 * @param {Function} params.callback - Callback
 */
function getForumPosts({ postIds, callback }) {
  const query = { _id: { $in: postIds } };

  ForumPost.find(query).lean().exec((error, foundForumPost) => {
    if (error) {
      callback({ error: new errorCreator.Database({ errorObject: error, name: 'getForumPosts' }) });

      return;
    }

    callback({ data: { post: modifyForumParameters({ forumItem: foundForumPost, type: 'post' }) } });
  });
}

/**
 * Get forum posts by thread ids
 * @param {Object} params - Parameters
 * @param {string} params.threadIds - ID of the threads
 * @param {Function} params.callback - Callback
 */
function getForumPostsByThreads({ threadIds, callback }) {
  const query = { threadId: { $in: threadIds } };

  ForumPost.find(query).lean().exec((error, foundForumPosts = []) => {
    if (error) {
      callback({ error: new errorCreator.Database({ errorObject: error, name: 'getForumPostsByThreads' }) });

      return;
    }

    callback({ data: { posts: foundForumPosts.map(post => modifyForumParameters({ forumItem: post, type: 'post' })) } });
  });
}

/**
 * Get threads by forum
 * @param {Object} params - Parameters
 * @param {string} params.forumId - ID of the forum
 * @param {Function} params.callback - Callback
 */
function getThreadsByForum({ forumId, callback }) {
  const query = { forumId };

  ForumThread.find(query).lean().exec((error, foundForumThreads = []) => {
    if (error) {
      callback({ error: new errorCreator.Database({ errorObject: error, name: 'getThreadsByForum' }) });

      return;
    }

    callback({ data: { threads: foundForumThreads.map(thread => modifyForumParameters({ forumItem: thread, type: 'thread' })) } });
  });
}

/**
 * Get threads by forums
 * @param {Object} params - Parameters
 * @param {string[]} params.forumIds - ID of the forums
 * @param {Function} params.callback - Callback
 */
function getThreadsByForums({ forumIds, callback }) {
  const query = { forumId: { $in: forumIds } };

  ForumThread.find(query).lean().exec((error, foundForumThreads = []) => {
    if (error) {
      callback({ error: new errorCreator.Database({ errorObject: error, name: 'getThreadsByForums' }) });

      return;
    }

    callback({ data: { threads: foundForumThreads.map(thread => modifyForumParameters({ forumItem: thread, type: 'thread' })) } });
  });
}

/**
 * Update existing forum
 * @param {Object} params - Parameters
 * @param {Object} params.forum - Forum updates
 * @param {Function} params.callback - Callback
 */
function updateForum({ forum, callback }) {
  const query = { _id: forum.forumId };
  const update = {};
  const options = { new: true };
  const $set = {
    lastUpdated: new Date(),
  };

  if (forum.forumName) { $set.forumName = forum.forumName; }

  Forum.findOneAndUpdate(query, update, options).lean().exec((error, updatedForum) => {
    if (error) {
      callback({ error: new errorCreator.Database({ errorObject: error, name: 'updateForum' }) });

      return;
    } else if (!updatedForum) {
      callback({ error: new errorCreator.DoesNotExist({ name: `forum ${forum.forumId}` }) });

      return;
    }

    callback({ data: { forum: modifyForumParameters({ forumItem: updatedForum, type: 'forum' }) } });
  });
}

/**
 * Update existing forum thread
 * @param {Object} params - Parameters
 * @param {Object} params.thread - Thread updates
 * @param {Function} params.callback - Callback
 */
function updateForumThread({ thread, callback }) {
  const query = { _id: thread.threadId };
  const update = {};
  const options = { new: true };
  const $set = {
    lastUpdated: new Date(),
  };

  if (thread.forumId) { $set.forumId = thread.forumId; }

  if (thread.title) { $set.title = thread.title; }

  if (thread.text) { $set.text = thread.text; }

  ForumThread.findOneAndUpdate(query, update, options).lean().exec((error, updatedThread) => {
    if (error) {
      callback({ error: new errorCreator.Database({ errorObject: error, name: 'updateForumThread' }) });

      return;
    } else if (!updatedThread) {
      callback({ error: new errorCreator.DoesNotExist({ name: `forum thread ${thread.threadId}` }) });

      return;
    }

    callback({ data: { thread: modifyForumParameters({ forumItem: updatedThread, type: 'thread' }) } });
  });
}

/**
 * Update existing forum post
 * @param {Object} params - Parameters
 * @param {Object} params.post - Forum post updates
 * @param {Function} params.callback - Callback
 */
function updateForumPost({ post, callback }) {
  const query = { _id: post.postId };
  const update = {};
  const options = { new: true };
  const $set = {
    lastUpdated: new Date(),
  };

  if (post.ownerAliasId) { $set.aliasId = post.aliasId; }

  if (post.text) { $set.text = post.text; }

  ForumPost.findOneAndUpdate(query, update, options).lean().exec((error, updatedForumPost) => {
    if (error) {
      callback({ error: new errorCreator.Database({ errorObject: error, name: 'updatedForumPost' }) });

      return;
    } else if (!updatedForumPost) {
      callback({ error: new errorCreator.DoesNotExist({ name: `forum post ${post.postId}` }) });

      return;
    }

    callback({ data: { post: modifyForumParameters({ forumItem: updatedForumPost, type: 'post' }) } });
  });
}

/**
 * Remove forum threads.
 * Setting fullRemoval will also remove all connected forum posts.
 * @param {Object} params - Parameters
 * @param {string[]} params.threadIds - IDs of forums threads to remove
 * @param {boolean} params.fullRemoval - Should connected forum posts be removed?
 * @param {Function} params.callback - Callback
 */
function removeForumThreads({ threadIds, fullRemoval, callback }) {
  const query = { _id: { $in: threadIds } };
  const options = { justOne: threadIds.length === 1 };

  ForumThread.remove(query, options).lean().exec((error) => {
    if (error) {
      callback({ error: new errorCreator.Database({ errorObject: error, name: 'removeForumThread' }) });

      return;
    }

    if (fullRemoval) {
      ForumPost.getForumPostsByThreads({
        threadIds,
        callback: (forumPostData) => {
          if (forumPostData.error) {
            callback({ error: forumPostData.error });

            return;
          }

          removeForumPosts({ // eslint-disable-line no-use-before-define
            callback,
            postIds: forumPostData.data.posts.map(forumPost => forumPost._id),
          });
        },
      });

      return;
    }

    callback({ data: { success: true } });
  });
}

/**
 * Remove forum posts.
 * Setting fullRemoval will also remove all threads that have the post as their thread starter.
 * @param {Object} params - Parameters
 * @param {string[]} params.threadIds - IDs of forums threads to remove
 * @param {boolean} params.fullRemoval - Should forum threads with the posts as thread starters be removed?
 * @param {Function} params.callback - Callback
 */
function removeForumPosts({ postIds, fullRemoval, callback }) {
  const query = { _id: { $in: postIds } };
  const options = { justOne: postIds.length === 1 };

  ForumPost.getForumPosts({
    postIds,
    callback: (forumPostsData) => {
      if (forumPostsData.error) {
        callback({ error: forumPostsData.error });

        return;
      }

      ForumPost.remove(query, options).lean().exec((error) => {
        if (error) {
          callback({ error: new errorCreator.Database({ errorObject: error, name: 'removeForumPost' }) });

          return;
        }

        if (fullRemoval) {
          removeForumThreads({
            fullRemoval: true,
            threadIds: forumPostsData.data.posts.data.forumPosts.filter(forumPost => forumPost.isThreadStarter).map(forumPost => forumPost.threadId),
            callback,
          });

          return;
        }

        callback({ data: { success: true } });
      });
    },
  });
}

/**
 * Remove forum.
 * Setting fullRemoval will also remove all connected forum threads and posts.
 * @param {Object} params - Parameters
 * @param {string[]} params.forumId - ID of forum to remove
 * @param {boolean} params.fullRemoval - Should connected forum threads and posts be removed?
 * @param {Function} params.callback - Callback
 */
function removeForum({ forumId, fullRemoval, callback }) {
  const query = { _id: forumId };
  const options = { justOne: true };

  Forum.remove(query, options).lean().exec((error) => {
    if (error) {
      callback({ error: new errorCreator.Database({ errorObject: error, name: 'removeForum' }) });

      return;
    }

    if (fullRemoval) {
      getThreadsByForum({
        forumId,
        callback: (threadsData) => {
          if (threadsData.error) {
            callback({ error: threadsData.error });

            return;
          }

          removeForumThreads({
            threadIds: threadsData.data.threads.map(forumThread => forumThread._id),
            fullRemoval: true,
            callback,
          });
        },
      });

      return;
    }

    callback({ data: { success: true } });
  });
}

exports.createForum = createForum;
exports.createThread = createThread;
exports.createForumPost = createForumPost;
exports.getForumById = getForumById;
exports.getForumThread = getForumThread;
exports.getForumPost = getForumPost;
exports.getForumPostsByThreads = getForumPostsByThreads;
exports.getThreadsByForum = getThreadsByForum;
exports.getThreadsByForums = getThreadsByForums;
exports.removeForum = removeForum;
exports.removeForumPosts = removeForumPosts;
exports.removeForumThreads = removeForumThreads;
exports.getForumPosts = getForumPosts;
exports.updateForum = updateForum;
exports.updateForumThread = updateForumThread;
exports.updateForumPost = updateForumPost;
exports.getAllForums = getAllForums;
exports.getForumsByIds = getForumsByIds;
