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

'use strict';

const mongoose = require('mongoose');
const dbConnector = require('../databaseConnector');
const errorCreator = require('../../error/errorCreator');
const { dbConfig } = require('../../config/defaults/config');
const dbAlias = require('./alias');
const dbTeam = require('./team');


// Access levels: Lowest / Lower / Middle / Higher / Highest / God
// 1 / 3 / 5 / 7 / 9 / 11

const userSchema = new mongoose.Schema(dbConnector.createSchema({
  username: { type: String, unique: true },
  mailAddress: { type: String, unique: true, sparse: true },
  fullName: String,
  password: String,
  socketId: String,
  lastOnline: Date,
  registerDevice: String,
  hasFullAccess: { type: Boolean, default: false },
  isVerified: { type: Boolean, default: false },
  isBanned: { type: Boolean, default: false },
  isOnline: { type: Boolean, default: false },
  isLootable: { type: Boolean, default: false },
  defaultRoomId: { type: String, default: dbConfig.rooms.public.objectId },
  partOfTeams: { type: [String], default: [] },
  followingRooms: { type: [String], default: [] },
  aliases: { type: [String], default: [] },
  picture: dbConnector.pictureSchema,
}), { collection: 'users' });

const User = mongoose.model('User', userSchema);

/**
 * Remove private parameters
 * @private
 * @param {Object} user User
 * @param {boolean} [noClean] Should less parameters be removed before returning object?
 * @returns {Object} Clean user
 */
function modifyUserParameters(user, noClean) {
  const modifiedUser = user;

  modifiedUser.password = typeof modifiedUser.password === 'string';

  if (!noClean) {
    modifiedUser.mailAddress = typeof modifiedUser.mailAddress === 'string';
  }

  return modifiedUser;
}

/**
 * Update user
 * @param {Object} params Parameters
 * @param {string} params.userId User ID
 * @param {Object} params.update Update
 * @param {Function} params.callback Callback
 */
function updateObject({
  userSocketId,
  userId,
  update,
  callback,
  suppressError,
}) {
  const query = {};

  if (userId) {
    query._id = userId;
  } else {
    query.socketId = userSocketId;
  }

  dbConnector.updateObject({
    update,
    query,
    suppressError,
    object: User,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      callback({ data: { user: modifyUserParameters(data.object) } });
    },
  });
}

/**
 * Update users
 * @param {Object} params Parameters
 * @param {Object} params.update Database update
 * @param {Function} params.callback Callback
 * @param {string} [params.query] Database query
 */
function updateObjects({ query, update, callback }) {
  dbConnector.updateObjects({
    update,
    query,
    object: User,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      callback({
        data: {
          users: data.objects.map(object => modifyUserParameters(object)),
        },
      });
    },
  });
}

/**
 * Get users.
 * @private
 * @param {Object} params Parameters.
 * @param {Object} [params.filter] Parameters to be filtered from the db result.
 * @param {Object} params.query Query to get users.
 * @param {Function} params.callback Callback.
 */
function getUsers({ filter, query, callback }) {
  dbConnector.getObjects({
    query,
    filter,
    object: User,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      callback({
        data: {
          users: data.objects.map(user => modifyUserParameters(user)),
        },
      });
    },
  });
}

/**
 * Get user
 * @private
 * @param {Object} params Parameters
 * @param {string} params.query Query to get alias
 * @param {Function} params.callback Callback
 */
function getUser({
  filter,
  query,
  callback,
  supressExistError,
}) {
  dbConnector.getObject({
    query,
    filter,
    object: User,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      } else if (!data.object) {
        callback({
          error: new errorCreator.DoesNotExist({
            suppressPrint: supressExistError,
            name: `user ${JSON.stringify(query, null, 4)}`,
          }),
        });

        return;
      }

      callback({ data: { user: modifyUserParameters(data.object) } });
    },
  });
}

/**
 * Get user by Id or name.
 * @param {Object} params Parameters.
 * @param {string} params.userId Id of the user.
 * @param {Function} params.callback Callback.
 */
function getUserById({
  userId,
  username,
  callback,
  supressExistError,
}) {
  const query = userId ?
    { _id: userId } :
    { username };

  getUser({
    query,
    supressExistError,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      callback({ data });
    },
  });
}

/**
 * Get user by socket Id.
 * @param {Object} params Parameters.
 * @param {string} params.socketId Socket Id.
 * @param {Function} params.callback Callback.
 */
function doesUserSocketIdExist({
  socketId,
  callback,
}) {
  const query = { socketId };

  dbConnector.doesObjectExist({
    query,
    object: User,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error: new errorCreator.Database({ errorObject: error }) });

        return;
      }

      callback({ data });
    },
  });
}

/**
 * Authorize user. The user can be found by either the username or user Id.
 * @param {Object} params Parameters.
 * @param {string} params.password Password of the user.
 * @param {Function} params.callback Callback.
 * @param {string} [params.userId] Id of the user.
 * @param {string} [params.username] Name of the user.
 */
function authUser({
  username,
  userId,
  password,
  callback,
}) {
  const query = { password };

  if (userId) {
    query._id = userId;
  } else {
    query.username = username;
  }

  getUser({
    callback,
    query,
  });
}

/**
 * Does the user already exist?
 * @param {Object} params Parameters
 * @param {string} [params.username] Username to check
 * @param {string} [params.mailAddress] Mail address connected to the user
 * @param {Function} params.callback Callback
 */
function doesUserExist({ username, mailAddress, callback }) {
  if (!username && !mailAddress) {
    callback({ error: new errorCreator.InvalidData({ expected: 'username || mailAddress' }) });

    return;
  }

  const query = { $or: [] };

  if (username) { query.$or.push({ username }); }
  if (mailAddress) { query.$or.push({ mailAddress }); }

  dbConnector.doesObjectExist({
    query,
    object: User,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error: new errorCreator.Database({ errorObject: error }) });

        return;
      } else if (data.exists) {
        callback({ data });

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
 * @param {Object} params Parameters
 * @param {Object} params.user New user
 * @param {Function} params.callback Callback
 */
function createUser({
  user,
  callback,
  options = {},
}) {
  doesUserExist({
    username: user.username,
    mailAddress: user.mailAddress,
    callback: (nameData) => {
      if (nameData.error) {
        callback({ error: nameData.error });

        return;
      } else if (nameData.data.exists) {
        callback({ error: new errorCreator.AlreadyExists({ name: `username: ${user.username}` }) });

        return;
      }

      const userToSave = user;

      if (options.setId && userToSave.objectId) {
        userToSave._id = mongoose.Types.ObjectId(userToSave.objectId); // eslint-disable-line no-underscore-dangle
      } else {
        userToSave._id = mongoose.Types.ObjectId(); // eslint-disable-line no-underscore-dangle
      }

      userToSave.ownerId = userToSave._id.toString();

      dbConnector.saveObject({
        object: new User(userToSave),
        objectType: 'user',
        callback: ({ error, data }) => {
          if (error) {
            callback({ error });

            return;
          }

          callback({ data: { user: modifyUserParameters(data.savedObject) } });
        },
      });
    },
  });
}

/**
 * Set user as being online/offline.
 * @param {Object} params Paramters.
 * @param {string} params.userId Id of the user to update.
 * @param {Function} params.callback Callback.
 * @param {boolean} [params.isOnline] Is the user online?
 * @param {string} [params.socketId] Socket ID of the user.
 */
function updateOnline({
  userId,
  isOnline,
  socketId,
  callback,
  suppressError,
}) {
  const update = {};
  const set = {};
  const unset = {};

  if (isOnline) {
    set.isOnline = true;

    if (socketId) {
      set.socketId = socketId;
    }
  } else {
    set.isOnline = false;
    unset.socketId = '';
  }

  set.lastOnline = new Date();

  if (Object.keys(set).length > 0) { update.$set = set; }
  if (Object.keys(unset).length > 0) { update.$unset = unset; }

  updateObject({
    userId,
    socketId,
    update,
    callback,
    suppressError,
  });
}

/**
 * Update a user.
 * @param {Object} params Parameters.
 * @param {Object} params.user User parameters to update.
 * @param {Function} params.callback Callback.
 * @param {string} [params.userId] Id of the user. Will override userSocketId to get and update a device.
 * @param {string} [params.userSocketId] Socket Id. Will be used to get and update a device. Overriden by userId.
 */
function updateUser({
  userSocketId,
  userId,
  callback,
  user = {},
  options = {},
}) {
  const {
    mailAddress,
    username,
    fullName,
    visibility,
    accessLevel,
    defaultRoomId,
    isLootable,
    hasFullAccess,
    socketId,
    aliases,
  } = user;
  const {
    resetSocket,
  } = options;
  const update = {};
  const set = {};
  const unset = {};
  const addToSet = {};

  if (resetSocket) {
    set.socketId = '';
  } else if (socketId) {
    set.socketId = socketId;
  }

  if (mailAddress) { set.mailAddress = mailAddress; }
  if (username) { set.username = username; }
  if (fullName) { set.fullName = fullName; }
  if (visibility) { set.visibility = visibility; }
  if (accessLevel) { set.accessLevel = accessLevel; }
  if (defaultRoomId) { set.defaultRoomId = defaultRoomId; }
  if (typeof isLootable === 'boolean') { set.isLootable = isLootable; }
  if (typeof hasFullAccess === 'boolean') { set.hasFullAccess = hasFullAccess; }
  if (aliases) { addToSet.aliases = { $each: aliases }; }

  if (Object.keys(set).length > 0) { update.$set = set; }
  if (Object.keys(unset).length > 0) { update.$unset = unset; }
  if (Object.keys(addToSet).length > 0) { update.$addToSet = addToSet; }

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
          userSocketId,
          userId,
        });
      },
    });

    return;
  }

  updateObject({
    update,
    callback,
    userId,
  });
}

/**
 * Verify user
 * @param {Object} params Parameters
 * @param {string} params.userId ID of the user
 * @param {Function} params.callback Callback
 */
function verifyUser({ userId, callback }) {
  updateObject({
    userId,
    callback,
    update: { isVerified: true },
  });
}

/**
 * Ban or unban user
 * @param {Object} params Parameters
 * @param {string} params.userId ID of the user
 * @param {boolean} params.shouldBan Should the user be banned?
 * @param {Function} params.callback - Callback
 */
function updateBanUser({ shouldBan, userId, callback }) {
  const update = {
    $set: { isBanned: shouldBan },
    $unset: { socketId: '' },
  };

  updateObject({
    userId,
    update,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      callback({ data: { user: modifyUserParameters(data.user) } });
    },
  });
}

/**
 * Set new password for user
 * @param {Object} params - Parameters
 * @param {string} params.userId - ID of the user
 * @param {string} params.password - New password
 * @param {Function} params.callback - Callback
 */
function updateUserPassword({ userId, password, callback }) {
  const update = { $set: { password } };

  updateObject({
    userId,
    update,
    callback,
  });
}

/**
 * Get users that the user has access to.
 * @param {Object} params - Parameters.
 * @param {Function} params.callback - Callback.
 * @param {boolean} [params.includeInactive] - Should banned and unverified users be retrieved?
 */
function getUsersByUser({
  includeInactive,
  user,
  callback,
}) {
  const query = dbConnector.createUserQuery({ user });

  if (!includeInactive) {
    query.isBanned = false;
    query.isVerified = true;
  }

  getUsers({
    query,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const { users } = data;

      callback({ data: { users } });
    },
  });
}

/**
 * Add a team to users.
 * @param {Object} params - Parameters.
 * @param {string} params.userIds - Ids of the users.
 * @param {string} params.teamId - Id of the team.
 * @param {Function} params.callback - Callback.
 * @param {boolean} [params.isAdmin] - Should the user be set as an admin for the team?
 */
function addToTeam({
  userIds,
  teamId,
  isAdmin,
  callback,
}) {
  updateObjects({
    query: { _id: { $in: userIds } },
    update: { $addToSet: { partOfTeams: teamId } },
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      dbTeam.addTeamMembers({
        teamId,
        memberIds: userIds,
        callback: ({ error: addError }) => {
          if (addError) {
            callback({ error: addError });

            return;
          }

          dbTeam.updateAccess({
            teamId,
            userIds,
            userAdminIds: isAdmin ?
              userIds :
              undefined,
            callback: ({ error: teamError, data: teamData }) => {
              if (teamError) {
                callback({ error: teamError });

                return;
              }

              callback({
                data: {
                  team: teamData.team,
                  users: data.users,
                },
              });
            },
          });
        },
      });
    },
  });
}

/**
 * Add alias to user.
 * @param {Object} params - Parameters.
 * @param {string} params.aliasId - Id of the alias.
 * @param {string} params.userId - Id of the user.
 * @param {Function} params.callback - Callback
 */
function addAlias({
  aliasId,
  userId,
  callback,
}) {
  updateObject({
    userId,
    update: { $addToSet: { aliases: aliasId } },
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      callback({ data });
    },
  });
}

/**
 * Remove alias from user.
 * @param {Object} params - Parameters.
 * @param {string} params.aliasId - Id of the alias.
 * @param {string} params.userId - Id of the user.
 * @param {Function} params.callback - Callback
 */
function removeAlias({
  aliasId,
  userId,
  callback,
}) {
  updateObject({
    userId,
    callback,
    update: { aliases: { $pull: aliasId } },
  });
}

/**
 * Remove alias from all users.
 * @param {Object} params - Parameters.
 * @param {string} params.aliasId - Id of the alias.
 * @param {Function} params.callback - Callback
 */
function removeAliasFromAllUsers({
  aliasId,
  callback,
}) {
  updateObjects({
    callback,
    update: { aliases: { $pull: aliasId } },
  });
}

/**
 * Remove a team from the user
 * @param {Object} params - Parameters
 * @param {string} params.userId - ID of the user
 * @param {string} params.teamId - ID of the team
 * @param {Function} params.callback - Callback
 */
function removeFromTeam({ userId, teamId, callback }) {
  updateObject({
    userId,
    update: { partOfTeams: { $pull: teamId } },
    callback: ({ error }) => {
      if (error) {
        callback({ error });

        return;
      }

      dbTeam.removeTeamMembers({
        teamId,
        memberIds: [userId],
        callback: ({ error: removeError }) => {
          if (removeError) {
            callback({ error: removeError });

            return;
          }

          dbTeam.updateAccess({
            teamId,
            callback,
            shouldRemove: true,
            userIds: [userId],
            userAdminIds: [userId],
          });
        },
      });
    },
  });
}

// TODO Redis would be a good choice to store user id and socket id connection
/**
 * Get all socket ids from users
 * @param {Object} params - Parameters
 * @param {Function} params.callback - Callback
 */
function getAllSocketIds({ callback }) {
  getUsers({
    query: { socketId: { $exists: true } },
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const userSocketIds = {};

      data.users.forEach((user) => {
        userSocketIds[user.objectId] = user.socketId;
      });

      callback({ data: { userSocketIds } });
    },
  });
}

/**
 * Remove room from all users.
 * @param {Object} params - Parameters
 * @param {string} params.roomId - ID of the room
 * @param {Function} params.callback - Callback
 */
function removeRoomFromAll({ roomId, callback }) {
  updateObjects({
    callback,
    update: { $pull: { followingRooms: roomId } },
  });
}

/**
 * Remove team from all users.
 * @param {Object} params - Parameters.
 * @param {string} params.teamId - ID of the team.
 * @param {Function} params.callback - Callback.
 */
function removeTeamFromAll({ teamId, callback }) {
  updateObjects({
    callback,
    update: { $pull: { partOfTeams: teamId } },
  });
}

/**
 * Get banned and unverified users.
 * @param {Object} params - Parameters.
 * @param {Function} params.callback - Callback.
 */
function getInactiveUsers({ callback }) {
  const query = {
    $or: [
      { isBanned: true },
      { isVerified: false },
    ],
  };

  getUsers({
    query,
    callback,
  });
}

/**
 * Add a room to users.
 * @param {Object} params - Parameters.
 * @param {string} params.roomId - Id of the room to add.
 * @param {string[]} params.userIds - Id of the users to update.
 * @param {Function} params.callback - Callback
 */
function followRoom({
  roomId,
  callback,
  userIds = [],
}) {
  updateObjects({
    query: {
      _id: { $in: userIds },
    },
    update: { $addToSet: { followingRooms: roomId } },
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      callback({ data });
    },
  });
}

/**
 * Remove a room from a user.
 * @param {Object} params - Parameters.
 * @param {string} params.roomId - Id of the room to remove.
 * @param {string} params.userId - Id of the user to update.
 * @param {Function} params.callback - Callback
 */
function unfollowRoom({
  roomId,
  userId,
  callback,
}) {
  updateObject({
    userId,
    update: {
      followingRooms: { $pull: roomId },
    },
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      callback({ data });
    },
  });
}

/**
 * Get all users.
 * @param {Object} params - Parameters.
 * @param {Function} params.callback - Callback
 */
function getAllUsers({ callback }) {
  getUsers({
    callback,
    query: {},
  });
}

/**
 * Get users that have access to alias.
 * @param {Object} params - Parameters.
 * @param {string} params.aliasId - Alias Id.
 * @param {Function} params.callback - Callback.
 */
function getUsersByAlias({
  aliasId,
  callback,
}) {
  getUsers({
    callback,
    query: {
      aliases: { $in: [aliasId] },
    },
  });
}

exports.authUser = authUser;
exports.createUser = createUser;
exports.updateUser = updateUser;
exports.verifyUser = verifyUser;
exports.updateBanUser = updateBanUser;
exports.updateUserPassword = updateUserPassword;
exports.getUserById = getUserById;
exports.doesUserExist = doesUserExist;
exports.getAllSocketIds = getAllSocketIds;
exports.addToTeam = addToTeam;
exports.removeFromTeam = removeFromTeam;
exports.removeRoomFromAll = removeRoomFromAll;
exports.removeTeamFromAll = removeTeamFromAll;
exports.updateOnline = updateOnline;
exports.getInactiveUsers = getInactiveUsers;
exports.followRoom = followRoom;
exports.unfollowRoom = unfollowRoom;
exports.getUsersByUser = getUsersByUser;
exports.addAlias = addAlias;
exports.removeAlias = removeAlias;
exports.removeAliasFromAllUsers = removeAliasFromAllUsers;
exports.getAllUsers = getAllUsers;
exports.getUsersByAlias = getUsersByAlias;
exports.doesUserSocketIdExist = doesUserSocketIdExist;
