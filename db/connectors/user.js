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
const deviceConnector = require('./device');
const locationConnector = require('./location');

// Access levels: Lowest / Lower / Middle / Higher / Highest / God
// 1 / 3 / 5 / 7 / 9 / 11

const userSchema = new mongoose.Schema({
  userName: { type: String, unique: true },
  password: String,
  socketId: String,
  accessLevel: { type: Number, default: 1 },
  visibility: { type: Number, default: 1 },
  rooms: [{ type: String, unique: true }],
  lastOnline: Date,
  verified: { type: Boolean, default: false },
  banned: { type: Boolean, default: false },
  online: { type: Boolean, default: false },
  registerDevice: String,
  team: String,
  authGroups: [{ type: String, unique: true }],
  mode: String,
  isTracked: Boolean,
  aliases: [{ type: String, unique: true }],
}, { collection: 'users' });

const User = mongoose.model('User', userSchema);

/**
 * Update user field
 * @param {string} userName - Name of the user
 * @param {Object} update - Update
 * @param {Function} callback - Callback
 */
function updateUserValue(userName, update, callback) {
  const query = { userName };

  User.findOneAndUpdate(query, update).lean().exec((err, user) => {
    if (err) {
      logger.sendErrorMsg({
        code: logger.ErrorCodes.db,
        text: ['Failed to update user'],
        err,
      });
    }

    callback(err, user);
  });
}

/**
 * Update if user is tracked
 * @param {string} userName - Name of the user
 * @param {boolean} value - Is the user being tracked?
 * @param {Function} callback - Callback
 */
function updateUserIsTracked(userName, value, callback) {
  const update = { $set: { isTracked: value } };

  updateUserValue(userName, update, callback);
}

/**
 * Update user's team
 * @param {string} userName - Name of the user
 * @param {string} value - Name of the team
 * @param {Function} callback - Callback
 */
function updateUserTeam(userName, value, callback) {
  const update = { $set: { team: value } };

  updateUserValue(userName, update, callback);
}

/**
 * Set new group to user
 * @param {string} userName - Name of the user
 * @param {string} group - Name of the group
 * @param {Function} callback - Callback
 */
function addGroupToUser(userName, group, callback) {
  const query = { userName };
  const update = { $push: { group } };

  User.findOneAndUpdate(query, update).lean().exec((err, user) => {
    if (err) {
      logger.sendErrorMsg({
        code: logger.ErrorCodes.db,
        text: ['Failed to update user'],
        err,
      });
    }

    callback(err, user);
  });
}

/**
 * Get user by device ID or device alias
 * @param {string} deviceCode - Device ID OR device alias
 * @param {Function} callback - Callback
 */
function getUserByDevice(deviceCode, callback) {
  deviceConnector.getDevice(deviceCode, (err, device) => {
    if (err || device === null) {
      logger.sendErrorMsg({
        code: logger.ErrorCodes.db,
        text: ['Failed to get device'],
        err,
      });
      callback(err, null);
    } else {
      const userQuery = { socketId: device.socketId };

      User.findOne(userQuery).lean().exec((userErr, user) => {
        if (userErr || user === null) {
          logger.sendErrorMsg({
            code: logger.ErrorCodes.db,
            text: ['Failed to get user by device'],
            err: userErr,
          });
        }

        callback(userErr, user);
      });
    }
  });
}

/**
 * Get user by socket ID
 * @param {string} sentSocketId - Socket ID
 * @param {Function} callback - Callback
 */
function getUserById(sentSocketId, callback) {
  const query = { socketId: sentSocketId };
  const filter = { _id: 0 };

  User.findOne(query, filter).lean().exec((err, user) => {
    if (err) {
      logger.sendErrorMsg({
        code: logger.ErrorCodes.db,
        text: ['Failed to get user'],
        err,
      });
    }

    callback(err, user);
  });
}

/**
 * Authorize user
 * @param {string} userName - Name of the user
 * @param {string} password - Password of the user
 * @param {Function} callback - Callback
 */
function authUser(userName, password, callback) {
  const query = {
    $and: [{ userName }, { password }],
  };
  const filter = { password: 0 };

  User.findOne(query, filter).lean().exec((err, user) => {
    if (err) {
      logger.sendErrorMsg({
        code: logger.ErrorCodes.db,
        text: ['Failed to login'],
        err,
      });
    }

    callback(err, user);
  });
}

/**
 * Get user
 * @param {string} userName - User name
 * @param {Function} callback - Callback
 */
function getUser(userName, callback) {
  const query = { userName };
  const filter = { password: 0 };

  User.findOne(query, filter).lean().exec((err, foundUser) => {
    if (err) {
      logger.sendErrorMsg({
        code: logger.ErrorCodes.db,
        text: ['Failed to find user'],
        err,
      });
    }

    callback(err, foundUser);
  });
}

/**
 * Create and save user
 * @param {Object} user - New user
 * @param {Function} callback - Callback
 */
function createUser(user, callback) {
  const newUser = new User(user);

  getUser(user.userName, (err, foundUser) => {
    if (err) {
      logger.sendErrorMsg({
        code: logger.ErrorCodes.db,
        text: ['Failed to check if user exists'],
        err,
      });
    } else if (foundUser === null) {
      databaseConnector.saveObject(newUser, 'user', callback);
    } else {
      callback(err, null);
    }
  });
}

/**
 * Update user's socket ID
 * @param {string} userName - Name of the user
 * @param {string} value - New socket ID
 * @param {Function} callback - Callback
 */
function updateUserSocketId(userName, value, callback) {
  const update = { socketId: value, online: true };

  updateUserValue(userName, update, callback);
}

/**
 * Set user online
 * @param {string} userName - Name of the user
 * @param {boolean} value Is the user online?
 * @param {Function} callback - Callback
 */
function updateUserOnline(userName, value, callback) {
  const update = { online: value };

  updateUserValue(userName, update, callback);
}

/**
 * Update user's mode
 * @param {string} userName - Name of the user
 * @param {string} mode - New input mode
 * @param {Function} callback - Callback
 */
function updateUserMode(userName, mode, callback) {
  const update = { mode };

  updateUserValue(userName, update, callback);
}

/**
 * Verify user
 * @param {string} userName - Name of the user
 * @param {Function} callback - Callback
 */
function verifyUser(userName, callback) {
  const query = { userName };

  databaseConnector.verifyObject(query, User, 'user', callback);
}

/**
 * Verify all users
 * @param {Function} callback - Callback
 */
function verifyAllUsers(callback) {
  const query = { verified: false };

  databaseConnector.verifyAllObjects(query, User, 'users', callback);
}

/**
 * Gets all user
 * @param {Object} sentUser - User that is retrieving all users
 * @param {Function} callback - Function to be called on completion
 */
function getAllUsers(sentUser, callback) {
  const query = { visibility: { $lte: sentUser.accessLevel } };
  const sort = { userName: 1 };
  const filter = { _id: 0, password: 0 };

  User.find(query, filter).sort(sort).lean().exec((err, users) => {
    if (err) {
      logger.sendErrorMsg({
        code: logger.ErrorCodes.db,
        text: ['Failed to list users'],
        err,
      });
    }

    callback(err, users);
  });
}

/**
 * Get positions for all users, based on user's access level
 * @param {Object} sentUser - User who is retrieving positions
 * @param {Function} callback - Callback
 */
function getAllUserPositions(sentUser, callback) {
  const query = { visibility: { $lte: sentUser.accessLevel } };
  const sort = { userName: 1 };
  const filter = { _id: 0, userName: 1 };

  User.find(query, filter).sort(sort).lean().exec((err, users) => {
    if (err) {
      logger.sendErrorMsg({
        code: logger.ErrorCodes.db,
        text: ['Failed to get all users and positions'],
        err,
      });
    } else if (users !== null) {
      const userNames = users.map(user => user.userName);

      locationConnector.getPositions(userNames, (mapErr, userPositions) => {
        if (mapErr) {
          logger.sendErrorMsg({
            code: logger.ErrorCodes.db,
            text: ['Failed to get all user positions'],
            err,
          });
        }

        callback(err, userPositions);
      });
    } else {
      callback(err, null);
    }
  });
}

/**
 * Get positions for a user, based on the access level of the user retrieving the positions
 * @param {Object} sentUser - User retrieving the positions
 * @param {string} sentUserName - Name of the user
 * @param {Function} callback - Callback
 */
function getUserPositions(sentUser, sentUserName, callback) {
  const query = {
    $and: [
      { visibility: { $lte: sentUser.accessLevel } },
      { userName: sentUserName },
    ],
  };
  const filter = { _id: 0 };

  User.findOne(query, filter).lean().exec((err, user) => {
    if (err) {
      logger.sendErrorMsg({
        code: logger.ErrorCodes.db,
        text: ['Failed to get user and positions'],
        err,
      });
    } else if (user !== null) {
      locationConnector.getPosition(sentUserName, (mapErr, mapPosition) => {
        if (mapErr) {
          logger.sendErrorMsg({
            code: logger.ErrorCodes.db,
            text: ['Failed to get user positions'],
            err,
          });
        }

        callback(mapErr, mapPosition);
      });
    } else {
      callback(err, null);
    }
  });
}

/**
 * Get all users following a room
 * @param {string} roomName - Name of the room
 * @param {Function} callback - Callback
 */
function getUsersFollowingRoom(roomName, callback) {
  const query = { rooms: { $in: [roomName] } };
  const filter = { rooms: 1, socketId: 1 };

  User.find(query, filter).lean().exec((err, users) => {
    if (err) {
      logger.sendErrorMsg({
        code: logger.ErrorCodes.db,
        text: [`Failed to get users following room ${roomName}`],
        err,
      });
    }

    callback(err, users);
  });
}

/**
 * Add room to user
 * @param {string} userName - Name of the user
 * @param {string} roomName - Name of the room
 * @param {Function} callback - Callback
 */
function addRoomToUser(userName, roomName, callback) {
  const query = { userName };
  const update = { $addToSet: { rooms: roomName } };

  User.findOneAndUpdate(query, update).lean().exec((err, user) => {
    if (err || user === null) {
      logger.sendErrorMsg({
        code: logger.ErrorCodes.db,
        text: ['Failed to add room to user'],
        err,
      });
    }

    callback(err, user);
  });
}

/**
 * Remove room from user
 * @param {string} userName - Name of the user
 * @param {string} roomName - Name of the room
 * @param {Function} callback - Callback
 */
function removeRoomFromUser(userName, roomName, callback) {
  const query = { userName };
  const update = { $pull: { rooms: roomName } };

  User.findOneAndUpdate(query, update).lean().exec((err, user) => {
    if (err) {
      logger.sendErrorMsg({
        code: logger.ErrorCodes.db,
        text: [`Failed to remove room ${roomName} from user`],
        err,
      });
    }

    callback(err, user);
  });
}

/**
 * Remove room from all users following it
 * @param {string} roomName - Name of the room
 * @param {Function} callback - Callback
 */
function removeRoomFromAllUsers(roomName, callback) {
  const query = { rooms: { $in: [roomName] } };
  const update = { $pull: { rooms: roomName } };
  const options = { multi: true };

  User.update(query, update, options).lean().exec((err, users) => {
    if (err) {
      logger.sendErrorMsg({
        code: logger.ErrorCodes.db,
        text: [`Failed to remove room ${roomName} from all users`],
        err,
      });
    }

    callback(err, users);
  });
}

/**
 * Set user last seen
 * @param {string} userName - Name of the user
 * @param {Date} date - Last seen
 * @param {Function} callback - Callback
 */
function setUserLastOnline(userName, date, callback) {
  const query = { userName };
  const update = { lastOnline: date };

  User.findOneAndUpdate(query, update).lean().exec((err, user) => {
    if (err) {
      logger.sendErrorMsg({
        code: logger.ErrorCodes.db,
        text: [`Failed to update last online on ${userName}`],
        err,
      });
    }

    callback(err, user);
  });
}

/**
 * Get all unverified users
 * @param {Function} callback - Callback
 */
function getUnverifiedUsers(callback) {
  const query = { verified: false };
  const filter = { _id: 0 };
  const sort = { userName: 1 };

  User.find(query, filter).sort(sort).lean().exec((err, users) => {
    if (err) {
      logger.sendErrorMsg({
        code: logger.ErrorCodes.db,
        text: ['Failed to get unverified users'],
        err,
      });
    }

    callback(err, users);
  });
}

/**
 * Ban user
 * @param {string} userName - Name of the user
 * @param {Function} callback - Callback
 */
function banUser(userName, callback) {
  const query = { userName };
  const update = { banned: true, socketId: '' };

  User.findOneAndUpdate(query, update).lean().exec((err, user) => {
    if (err) {
      logger.sendErrorMsg({
        code: logger.ErrorCodes.db,
        text: ['Failed to ban user'],
        err,
      });
    }

    callback(err, user);
  });
}

/**
 * Unban user
 * @param {string} userName - Name of the user
 * @param {Function} callback - Callback
 */
function unbanUser(userName, callback) {
  const query = { userName };
  const update = { banned: false };

  User.findOneAndUpdate(query, update).lean().exec((err, user) => {
    if (err) {
      logger.sendErrorMsg({
        code: logger.ErrorCodes.db,
        text: ['Failed to unban user'],
        err,
      });
    }

    callback(err, user);
  });
}

/**
 * Get all banned users
 * @param {Function} callback - Callback
 */
function getBannedUsers(callback) {
  const query = { banned: true };
  const filter = { userName: 1, _id: 0 };
  const sort = { userName: 1 };

  User.find(query, filter).sort(sort).lean().exec((err, users) => {
    if (err) {
      logger.sendErrorMsg({
        code: logger.ErrorCodes.db,
        text: ['Failed to get banned users'],
        err,
      });
    }

    callback(err, users);
  });
}

/**
 * Add users to the db
 * @param {Object} users - New users
 */
function populateDbUsers(users) {
  User.count({}).exec((err, userCount) => {
    if (err) {
      logger.sendErrorMsg({
        code: logger.ErrorCodes.db,
        text: ['PopulateDb: [failure] Failed to count users'],
        err,
      });
    } else if (userCount < 1) {
      const userKeys = Object.keys(users);
      const callback = (userErr, user) => {
        if (userErr || user === null) {
          logger.sendErrorMsg({
            code: logger.ErrorCodes.db,
            text: ['PopulateDb: [failure] Failed to create user'],
            err: userErr,
          });
        } else {
          logger.sendInfoMsg('PopulateDb: [success] Created user', user.userName, user.password);
        }
      };

      logger.sendErrorMsg({
        code: logger.ErrorCodes.db,
        text: ['PopulateDb: [failure] There are no users'],
      });
      logger.sendInfoMsg('PopulateDb: Creating users from defaults');

      for (let i = 0; i < userKeys.length; i += 1) {
        const user = users[userKeys[i]];

        createUser(user, callback);
      }
    } else {
      logger.sendInfoMsg('PopulateDb: [success] DB has at least one user');
    }
  });
}

/**
 * Set new user visibility
 * @param {string} userName - Name of the user
 * @param {number} value - New visibility
 * @param {Function} callback - Callback
 */
function updateUserVisibility(userName, value, callback) {
  const update = { visibility: value };

  updateUserValue(userName, update, callback);
}

/**
 * Set new user access level
 * @param {string} userName - Name of the user
 * @param {number} value - New access level
 * @param {Function} callback - Callback
 */
function updateUserAccessLevel(userName, value, callback) {
  const query = { userName };
  const update = { accessLevel: value };

  User.findOneAndUpdate(query, update).lean().exec((err, user) => {
    if (err) {
      logger.sendErrorMsg({
        code: logger.ErrorCodes.db,
        text: ['Failed to update user'],
        err,
      });
    }

    callback(err, user);
  });
}

/**
 * Set new room visibiity
 * @param {string} roomName - Name of the room
 * @param {number} value - New visibility
 * @param {Function} callback - Callback
 */
function updateRoomVisibility(roomName, value, callback) {
  const query = { roomName };
  const update = { visibility: value };

  User.findOneAndUpdate(query, update).lean().exec((err, user) => {
    if (err) {
      logger.sendErrorMsg({
        code: logger.ErrorCodes.db,
        text: ['Failed to update room'],
        err,
      });
    }

    callback(err, user);
  });
}

/**
 * Set new room access level
 * @param {string} roomName - Name of the room
 * @param {number} value - New access level
 * @param {Function} callback - Callback
 */
function updateRoomAccessLevel(roomName, value, callback) {
  const query = { roomName };
  const update = { accessLevel: value };

  User.findOneAndUpdate(query, update).lean().exec((err, user) => {
    if (err) {
      logger.sendErrorMsg({
        code: logger.ErrorCodes.db,
        text: ['Failed to update room'],
        err,
      });
    }

    callback(err, user);
  });
}

/**
 * Set new password for user
 * @param {string} userName - Name of the user
 * @param {string} value - New password
 * @param {Function} callback - Callback
 */
function updateUserPassword(userName, value, callback) {
  const update = { password: value };

  updateUserValue(userName, update, callback);
}

/**
 * Match partial use rname
 * @param {string} partialName - Partial user name
 * @param {Object} user - User doing the matching
 * @param {Function} callback - Callback
 */
function matchPartialUser(partialName, user, callback) {
  const filter = { _id: 0, userName: 1 };
  const sort = { userName: 1 };

  databaseConnector.matchPartial({
    filter,
    sort,
    partialName,
    user,
    queryType: User,
    callback,
    type: 'userName',
  });
}

/**
 * Get user by alias
 * @param {string} alias - User alias
 * @param {Function} callback - Callback
 */
function getUserByAlias(alias, callback) {
  const query = {
    $or: [
      { userName: alias },
      { aliases: { $in: [alias] } },
    ],
  };
  const filter = { _id: 0, password: 0 };

  User.findOne(query, filter).lean().exec((err, user) => {
    if (err) {
      logger.sendErrorMsg({
        code: logger.ErrorCodes.db,
        text: ['Failed to get user by alias'],
        err,
      });
    }

    callback(err, user);
  });
}

/**
 * Add an alias to the user, if a user with the alias or a matching user name doesn't already exist
 * @param {string} userName - Name of the user to update
 * @param {string} alias - User alias
 * @param {Function} callback - Callback
 */
function addAlias(userName, alias, callback) {
  getUser(alias, (err, user) => {
    if (err || user === null) {
      callback(err, null);
    } else {
      getUserByAlias(alias, (aliasErr, aliasUser) => {
        if (aliasErr || aliasUser === null) {
          callback(aliasErr, null);
        } else {
          const update = { $push: { aliases: alias } };

          updateUserValue(userName, update, callback);
        }
      });
    }
  });
}

exports.getUserById = getUserById;
exports.authUser = authUser;
exports.createUser = createUser;
exports.updateUserSocketId = updateUserSocketId;
exports.getAllUsers = getAllUsers;
exports.getAllUserPositions = getAllUserPositions;
exports.getUserPosition = getUserPositions;
exports.addRoomToUser = addRoomToUser;
exports.removeRoomFromUser = removeRoomFromUser;
exports.setUserLastOnline = setUserLastOnline;
exports.updateUserPassword = updateUserPassword;
exports.verifyUser = verifyUser;
exports.getUnverifiedUsers = getUnverifiedUsers;
exports.verifyAllUsers = verifyAllUsers;
exports.banUser = banUser;
exports.unbanUser = unbanUser;
exports.getBannedUsers = getBannedUsers;
exports.populateDbUsers = populateDbUsers;
exports.updateUserVisibility = updateUserVisibility;
exports.updateUserAccessLevel = updateUserAccessLevel;
exports.updateRoomVisibility = updateRoomVisibility;
exports.updateRoomAccessLevel = updateRoomAccessLevel;
exports.addGroupToUser = addGroupToUser;
exports.updateUserOnline = updateUserOnline;
exports.getUserByDevice = getUserByDevice;
exports.updateUserMode = updateUserMode;
exports.getUser = getUser;
exports.updateUserTeam = updateUserTeam;
exports.matchPartialUser = matchPartialUser;
exports.getUsersFollowingRoom = getUsersFollowingRoom;
exports.removeRoomFromAllUsers = removeRoomFromAllUsers;
exports.updateUserIsTracked = updateUserIsTracked;
exports.getUserByAlias = getUserByAlias;
exports.addAlias = addAlias;
