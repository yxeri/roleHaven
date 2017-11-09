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
const dbConnector = require('../databaseConnector');
const errorCreator = require('../../objects/error/errorCreator');
const dbConfig = require('../../config/defaults/config').databasePopulation;
const dbAlias = require('./alias');


// Access levels: Lowest / Lower / Middle / Higher / Highest / God
// 1 / 3 / 5 / 7 / 9 / 11

const userSchema = new mongoose.Schema(dbConnector.createSchema({
  username: { type: String, unique: true },
  mailAddress: { type: String, unique: true },
  fullName: String,
  password: String,
  socketId: String,
  lastOnline: Date,
  registerDevice: String,
  isVerified: { type: Boolean, default: false },
  isBanned: { type: Boolean, default: false },
  isOnline: { type: Boolean, default: false },
  isLootable: { type: Boolean, default: false },
  defaultRoomId: { type: String, default: dbConfig.rooms.public.roomId },
  partOfTeams: { type: [String], default: [] },
  hasAliases: { type: [String], default: [] },
  followingRooms: { type: [String], default: [] },
}), { collection: 'users' });

const User = mongoose.model('User', userSchema);

/**
 * Remove private parameters
 * @private
 * @param {Object} params - Parameters
 * @param {Object} params.user - User
 * @param {boolean} params.noClean - Should less parameters be removed before returning object?
 * @returns {Object} Clean user
 */
function modifyUserParameters({ user, noClean }) {
  const modifiedUser = user;

  modifiedUser.password = typeof modifiedUser.password === 'string';

  if (!noClean) {
    modifiedUser.mailAddress = typeof modifiedUser.mailAddress === 'string';
  }

  return modifiedUser;
}

/**
 * Update user
 * @param {Object} params - Parameters
 * @param {string} params.objectId - User ID
 * @param {Object} params.update - Update
 * @param {Function} params.callback Callback
 */
function updateObject({ objectId, update, callback }) {
  dbConnector.updateObject({
    update,
    query: { _id: objectId },
    object: User,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      callback({ data: { user: modifyUserParameters({ user: data.object }) } });
    },
  });
}

/**
 * Get users
 * @private
 * @param {Object} params - Parameters
 * @param {Object} params.query - Query to get users
 * @param {Function} params.callback - Callback
 */
function getUsers({ query, callback }) {
  dbConnector.getObjects({
    query,
    object: User,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      callback({ data: { users: data.objects.map(object => modifyUserParameters({ user: object })) } });
    },
  });
}

/**
 * Get user
 * @private
 * @param {Object} params - Parameters
 * @param {string} params.query - Query to get alias
 * @param {Function} params.callback - Callback
 */
function getUser({ query, callback }) {
  dbConnector.getObject({
    query,
    object: User,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      } else if (!data.object) {
        callback({ error: new errorCreator.DoesNotExist({ name: `user ${query.toString()}` }) });

        return;
      }

      callback({ data: { user: modifyUserParameters({ user: data.object }) } });
    },
  });
}

/**
 * Get user by name
 * @param {Object} params - Parameters
 * @param {string} params.username - Name of the user
 * @param {Function} params.callback - Callback
 */
function getUserByName({ username, callback }) {
  getUser({
    callback,
    query: { username },
  });
}

/**
 * Get user by ID
 * @param {Object} params - Parameters
 * @param {string} params.objectId - ID of the user
 * @param {Function} params.callback - Callback
 */
function getUserById({ objectId, callback }) {
  getUser({
    callback,
    query: { _id: objectId },
  });
}

/**
 * Authorize user
 * @param {Object} params - Parameters
 * @param {string} params.objectId - ID of the user
 * @param {string} params.password - Password of the user
 * @param {Function} params.callback - Callback
 */
function authUser({ objectId, password, callback }) {
  getUser({
    callback,
    query: {
      password,
      _id: objectId,
      isBanned: false,
      isVerified: true,
    },
  });
}

/**
 * Does the user already exist?
 * @param {Object} params - Parameters
 * @param {string} [params.username] - Username to check
 * @param {string} [params.mailAddress] - Mail address connected to the user
 * @param {Function} params.callback - Callback
 */
function doesUserExist({ username, mailAddress, callback }) {
  const query = { $or: [] };

  if (username) { query.$or.push({ username }); }
  if (mailAddress) { query.$or.push({ mailAddress }); }

  dbConnector.doesObjectExist({
    query: { username },
    object: User,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error: new errorCreator.Database({ errorObject: error }) });

        return;
      } else if (data.exists) {
        callback({ data: { exists: true } });

        return;
      }

      dbAlias.doesAliasExist({
        callback,
        aliasName: username,
      });
    },
  });
}

/**
 * Create and save user
 * @param {Object} params - Parameters
 * @param {Object} params.user - New user
 * @param {Function} params.callback - Callback
 */
function createUser({ user, callback }) {
  doesUserExist({
    name: user.username,
    mailAddress: user.mailAddress,
    callback: (nameData) => {
      if (nameData.error) {
        callback({ error: nameData.error });

        return;
      } else if (nameData.data.exists) {
        callback({ error: new errorCreator.AlreadyExists({ name: `username: ${user.username}` }) });
      }

      dbConnector.saveObject({
        object: new User(user),
        objectType: 'user',
        callback: ({ error, data }) => {
          if (error) {
            callback({ error });

            return;
          }

          callback({ data: { user: modifyUserParameters({ user: data.savedObject }) } });
        },
      });
    },
  });
}

/**
 * username: { type: String, unique: true },
 mailAddress: { type: String, unique: true },
 timeCreated: Date,
 lastUpdated: Date,
 fullName: String,
 password: String,
 socketId: String,
 lastOnline: Date,
 registerDevice: String,
 isVerified: { type: Boolean, default: false },
 isBanned: { type: Boolean, default: false },
 isOnline: { type: Boolean, default: false },
 isLootable: { type: Boolean, default: false },
 accessLevel: { type: Number, default: dbConfig.AccessLevels.BASIC },
 visibility: { type: Number, default: dbConfig.AccessLevels.BASIC },
 defaultRoomId: { type: String, default: dbConfig.rooms.public.roomName },
 */

/**
 * Update user
 * @param {Object} params - Parameters
 * @param {Object} params.user - User update
 * @param {Function} params.callback - Callback
 */
function updateUser({ objectId, user, callback }) {
  const {
    mailAddress,
    username,
    fullName,
    visibility,
    accessLevel,
    defaultRoomId,
    isLootable,
    isOnline,
    socketId,
  } = user;
  const now = new Date();
  const update = { $set: {} };

  if (mailAddress) { update.$set.mailAddress = mailAddress; }
  if (username) { update.$set.username = username; }
  if (fullName) { update.$set.fullName = fullName; }
  if (visibility) { update.$set.visibility = visibility; }
  if (accessLevel) { update.$set.accessLevel = accessLevel; }
  if (defaultRoomId) { update.$set.defaultRoomId = defaultRoomId; }
  if (typeof isLootable === 'boolean') { update.$set.isLootable = isLootable; }

  if (typeof isOnline === 'boolean') {
    if (isOnline) {
      update.$set.isOnline = true;
    } else {
      update.$set.isOnline = false;
      update.$unset = { socketId: '' };
    }

    update.$set.lastOnline = now;
  }

  if (socketId) {
    update.$set.socketId = socketId;
    update.$set.isOnline = true;
    update.$set.lastOnline = now;
  }

  if (username || mailAddress) {
    doesUserExist({
      username,
      mailAddress,
      callback: (existsData) => {
        if (existsData.error) {
          callback({ error: existsData.error });

          return;
        } else if (existsData.data.exists) {
          callback({ error: new errorCreator.AlreadyExists({ name: `user mail ${mailAddress} username ${username}` }) });

          return;
        }

        updateObject({
          update,
          callback,
          objectId,
        });
      },
    });
  }

  updateObject({
    update,
    callback,
    objectId,
  });
}

/**
 * Verify user
 * @param {Object} params - Parameters
 * @param {string} params.objectId - ID of the user
 * @param {Function} params.callback - Callback
 */
function verifyUser({ objectId, callback }) {
  updateObject({
    objectId,
    callback,
    update: { isVerified: true },
  });
}

/**
 * Ban or unban user
 * @param {Object} params - Parameters
 * @param {string} params.objectId - ID of the user
 * @param {boolean} params.shouldBan - Should the user be banned?
 * @param {Function} params.callback - Callback
 */
function updateBanUser({ shouldBan, objectId, callback }) {
  const update = {
    $set: { isBanned: shouldBan },
    $unset: { socketId: '' },
  };

  updateObject({
    objectId,
    update,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      callback({ data: { user: data.user } });
    },
  });
}

/**
 * Set new password for user
 * @param {Object} params - Parameters
 * @param {string} params.objectId - ID of the user
 * @param {string} params.password - New password
 * @param {Function} params.callback - Callback
 */
function updateUserPassword({ objectId, password, callback }) {
  const update = { $set: { password } };

  updateObject({
    objectId,
    update,
    callback,
  });
}

/**
 * Get all users
 * @param {Object} params - Parameters
 * @param {Function} params.callback - Callback
 */
function getAllUsers({ callback }) {
  getUsers({
    callback,
  });
}

// FIXME Should it remove messages, rooms, teams, forums, alias and other connected to the user?
/**
 * Remove user
 * @param {Object} params - Parameters
 * @param {string} params.objectId - ID of the user
 * @param {Function} params.callback - Callback
 */
function removeUser({ objectId, callback }) {
  dbConnector.removeObject({
    callback,
    object: User,
    query: { _id: objectId },
  });
}

exports.getUserByName = getUserByName;
exports.authUser = authUser;
exports.createUser = createUser;
exports.updateUser = updateUser;
exports.verifyUser = verifyUser;
exports.updateBanUser = updateBanUser;
exports.getAllUsers = getAllUsers;
exports.updateUserPassword = updateUserPassword;
exports.getUserById = getUserById;
exports.removeUser = removeUser;
exports.doesUserExist = doesUserExist;
