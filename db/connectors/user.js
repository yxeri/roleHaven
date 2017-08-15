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
const databaseConnector = require('../databaseConnector');
const deviceConnector = require('./device');
const positionConnector = require('./position');
const errorCreator = require('../../objects/error/errorCreator');
const dbConfig = require('../../config/defaults/config').databasePopulation;

// Access levels: Lowest / Lower / Middle / Higher / Highest / God
// 1 / 3 / 5 / 7 / 9 / 11

const userSchema = new mongoose.Schema({
  userName: { type: String, unique: true },
  verified: { type: Boolean, default: false },
  banned: { type: Boolean, default: false },
  online: { type: Boolean, default: false },
  lootable: { type: Boolean, default: false },
  accessLevel: { type: Number, default: dbConfig.AccessLevels.BASIC },
  visibility: { type: Number, default: dbConfig.AccessLevels.BASIC },
  warnings: { type: Number, default: 0 },
  rooms: { type: [String], default: [] },
  whisperRooms: { type: [String], default: [] },
  mail: { type: String, unique: true },
  registeredAt: { type: Date, default: new Date() },
  fullName: String,
  password: String,
  socketId: String,
  lastOnline: Date,
  registerDevice: String,
  team: String,
  shortTeam: String,
  authGroups: [String],
  isTracked: Boolean,
  aliases: [String],
  blockedBy: String,
}, { collection: 'users' });

const User = mongoose.model('User', userSchema);

/**
 * Remove private parameters from user
 * @param {Object} params.user User
 * @param {boolean} params.noClean Should less parameters be removed before returning object?
 * @returns {Object} Clean user
 */
function cleanUserParameters({ user, noClean }) {
  const cleanUser = user;

  if (cleanUser.password) {
    cleanUser.password = typeof cleanUser.password === 'string';
  }

  if (!noClean) {
    cleanUser.mail = typeof cleanUser.mail === 'string';
  }

  return cleanUser;
}

/**
 * Update user field
 * @param {string} params.userName Name of the user
 * @param {Object} params.update Update
 * @param {Function} params.callback Callback
 */
function updateUserValue({ userName, update, callback }) {
  const query = { userName };
  const options = { new: true };

  User.findOneAndUpdate(query, update, options).lean().exec((err, user) => {
    if (err) {
      callback({ error: new errorCreator.Database({ errorObject: err, name: 'updateuserValue' }) });

      return;
    } else if (!user) {
      callback({ error: new errorCreator.DoesNotExist({ name: `user ${userName} to change value for` }) });

      return;
    }

    callback({ data: { user: cleanUserParameters({ user }) } });
  });
}

/**
 * Update if user is tracked
 * @param {string} params.userName Name of the user
 * @param {boolean} params.isTracked Is the user being tracked?
 * @param {Function} params.callback Callback
 */
function updateUserIsTracked({ userName, isTracked, callback }) {
  const update = { $set: { isTracked } };

  updateUserValue({ userName, update, callback });
}

/**
 * Update user's team
 * @param {string} params.userName Name of the user
 * @param {string} params.team Name of the team
 * @param {string} params.shortTeam Short name of the team
 * @param {Function} params.callback Callback
 */
function updateUserTeam({ userName, team, shortTeam, callback }) {
  const update = { $set: { team, shortTeam } };

  updateUserValue({ userName, update, callback });
}

/**
 * Remove team from user
 * @param {string} params.userName Name of the user
 * @param {Function} params.callback Callback
 */
function removeUserTeam({ userName, callback }) {
  const query = { userName };
  const update = { $unset: { team: '', shortTeam: '' } };
  const options = { multi: true };

  User.update(query, update, options).lean().exec((err) => {
    if (err) {
      callback({ error: new errorCreator.Database({ errorObject: err, name: 'removeUserTeam' }) });

      return;
    }

    callback({ data: { success: true } });
  });
}

/**
 * Remove team from all users
 * @param {string} params.team Name of the team
 * @param {string} params.shortTeam Short name of the team
 * @param {Function} params.callback Callback
 */
function removeAllUserTeam({ team, callback }) {
  const query = { team };
  const update = { $unset: { team: '', shortTeam: '' } };
  const options = { multi: true, new: true };

  User.update(query, update, options).lean().exec((err) => {
    if (err) {
      callback({ error: new errorCreator.Database({ errorObject: err, name: 'removeAllUserTeam' }) });

      return;
    }

    callback({ data: { success: true } });
  });
}

/**
 * Set new group to user
 * @param {string} params.userName Name of the user
 * @param {string} params.group Name of the group
 * @param {Function} params.callback Callback
 */
function addGroupToUser({ userName, group, callback }) {
  const query = { userName };
  const update = { $push: { group } };
  const options = { new: true };

  User.findOneAndUpdate(query, update, options).lean().exec((err, user) => {
    if (err) {
      callback({ error: new errorCreator.Database({ errorObject: err, name: 'addGroupTouser' }) });

      return;
    } else if (!user) {
      callback({ error: new errorCreator.DoesNotExist({ name: `user ${userName} to add group` }) });

      return;
    }

    callback({ data: { user: cleanUserParameters({ user }) } });
  });
}

/**
 * Get user by device ID or device alias
 * @param {string} params.deviceCode Device ID OR device alias
 * @param {Function} params.callback Callback
 */
function getUserByDevice({ deviceCode, callback }) {
  deviceConnector.getDevice({
    deviceCode,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      } else if (!data.device) {
        callback({ error: new errorCreator.DoesNotExist({ name: `device ${deviceCode}` }) });

        return;
      }

      const { device } = data;
      const userQuery = {
        banned: false,
        socketId: device.socketId,
        verified: true,
      };

      User.findOne(userQuery).lean().exec((userErr, user) => {
        if (userErr) {
          callback({ error: new errorCreator.Database({ errorObject: userErr, name: 'getUserByDevice' }) });

          return;
        } else if (!user) {
          callback({ error: new errorCreator.DoesNotExist({ name: `${deviceCode} user` }) });

          return;
        }

        callback({ data: { user: cleanUserParameters({ user }) } });
      });
    },
  });
}

/**
 * Get user by socket ID
 * @param {string} params.socketId Socket ID
 * @param {Function} params.callback Callback
 */
function getUserById({ socketId, callback }) {
  const query = { socketId, banned: false, verify: true };
  const filter = { _id: 0 };

  User.findOne(query, filter).lean().exec((err, user) => {
    if (err) {
      callback({ error: new errorCreator.Database({ errorObject: err, name: 'getUserById' }) });

      return;
    } else if (!user) {
      callback({ error: new errorCreator.DoesNotExist({ name: `user by socket ${socketId}` }) });

      return;
    }

    callback({ data: { user: cleanUserParameters({ user }) } });
  });
}

/**
 * Authorize user
 * @param {string} params.userName Name of the user
 * @param {string} params.password Password of the user
 * @param {Function} params.callback Callback
 */
function authUser({ userName, password, callback }) {
  const query = { userName, password, banned: false, verified: true };

  User.findOne(query).lean().exec((err, user) => {
    if (err) {
      callback({ error: new errorCreator.Database({ errorObject: err, name: 'authuser' }) });

      return;
    } else if (!user) {
      callback({ error: new errorCreator.DoesNotExist({ name: `auth user ${userName}` }) });

      return;
    }

    callback({ data: { user: cleanUserParameters({ user }) } });
  });
}

/**
 * Get user
 * @param {string} params.userName User name
 * @param {Function} params.callback Callback
 */
function getUser({ userName, callback }) {
  const query = { userName, banned: false, verified: true };

  User.findOne(query).lean().exec((err, foundUser) => {
    if (err) {
      callback({ error: new errorCreator.Database({ errorObject: err, name: 'getUser' }) });

      return;
    } else if (!foundUser) {
      callback({ error: new errorCreator.DoesNotExist({ name: `user ${userName}` }) });

      return;
    }

    callback({ data: { user: cleanUserParameters({ user: foundUser }) } });
  });
}

/**
 * Create and save user
 * @param {Object} params.user New user
 * @param {boolean} params.silentOnExists Should error on exists be skipped?
 * @param {Function} params.callback Callback
 */
function createUser({ user, silentOnExists, callback }) {
  const newUser = new User(user);
  const query = {
    $or: [
      { userName: user.userName },
      { mail: user.mail },
    ],
  };

  User.findOne(query).lean().exec((err, foundUser) => {
    if (err) {
      callback({ error: new errorCreator.Database({ errorObject: err, name: 'createUser' }) });

      return;
    } else if (foundUser) {
      if (!silentOnExists) {
        callback({ error: new errorCreator.AlreadyExists({ name: `user ${user.userName}` }) });
      } else {
        callback({ data: { alreadyExists: true } });
      }

      return;
    }

    databaseConnector.saveObject({
      object: newUser,
      objectType: 'user',
      callback: ({ error, data }) => {
        if (error) {
          callback({ error });

          return;
        }

        callback({ data: { user: cleanUserParameters({ user: data.savedObject }) } });
      },
    });
  });
}

/**
 * Update user's socket ID
 * @param {string} params.userName Name of the user
 * @param {string} [params.socketId] New socket ID or undefined. Will unset socketId in database if undefined
 * @param {Function} params.callback Callback
 */
function updateUserSocketId({ userName, socketId, callback }) {
  const query = { banned: false, userName, verified: true };
  const update = { $set: { online: true } };
  const options = { new: true };

  if (socketId) {
    update.$set.socketId = socketId;
  } else {
    update.$unset = { socketId: '' };
  }

  User.findOneAndUpdate(query, update, options).lean().exec((err, user) => {
    if (err) {
      callback({ error: new errorCreator.Database({ errorObject: err, name: 'updateUserSocketId' }) });

      return;
    } else if (!user) {
      callback({ error: new errorCreator.DoesNotExist({ name: `user ${userName}` }) });

      return;
    }

    callback({ data: { user: cleanUserParameters({ user }) } });
  });
}

/**
 * Set user online
 * @param {string} params.userName - Name of the user
 * @param {boolean} params.online Is the user online?
 * @param {Function} params.callback Callback
 */
function updateUserOnline({ userName, online, callback }) {
  const update = { $set: { online } };

  updateUserValue({ userName, update, callback });
}

/**
 * Verify user
 * @param {string} params.userName Name of the user
 * @param {Function} params.callback Callback
 */
function verifyUser({ userName, callback }) {
  const query = { userName };

  databaseConnector.verifyObject({
    query,
    object: User,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      callback({ data: { user: cleanUserParameters({ user: data.verified }) } });
    },
  });
}

/**
 * Verify all users
 * @param {Function} params.callback Callback
 */
function verifyAllUsers({ callback }) {
  const query = { verified: false };

  databaseConnector.verifyAllObjects({
    query,
    object: User,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      callback({ data: { users: data.verified.map(user => cleanUserParameters({ user })) } });
    },
  });
}

/**
 * Gets all user
 * @param {Object} params.user User that is retrieving all users
 * @param {boolean} params.includeInactive Include users that are banned or unverified
 * @param {Function} params.callback Function to be called on completion
 */
function getUsers({ user, includeInactive, callback }) {
  const query = { visibility: { $lte: user.accessLevel } };
  const sort = { userName: 1 };
  const filter = { _id: 0, password: 0, socketId: 0 };

  if (!includeInactive) {
    query.banned = false;
    query.verified = true;
  }

  User.find(query, filter).sort(sort).lean().exec((err, users = []) => {
    if (err) {
      callback({ error: new errorCreator.Database({ errorObject: err, name: 'getAllUsers' }) });

      return;
    }

    callback({ data: { users: users.map(userToClean => cleanUserParameters({ user: userToClean })) } });
  });
}

/**
 * Gets all users in a team
 * @param {Object} params.user User that is retrieving all users
 * @param {Function} params.callback Function to be called on completion
 */
function getTeamUsers({ user, callback }) {
  const query = {
    team: user.team || '',
    banned: false,
    verified: true,
  };
  const sort = { userName: 1 };
  const filter = { userName: 1, fullName: 1, online: 1, team: 1, isTracked: 1, _id: 0 };

  User.find(query, filter).sort(sort).lean().exec((err, users = []) => {
    if (err) {
      callback({ error: new errorCreator.Database({ errorObject: err, name: 'getTeamusers' }) });

      return;
    }

    callback({ data: { users: users.map(userToClean => cleanUserParameters({ user: userToClean })) } });
  });
}

/**
 * Get positions for all users, based on user's access level
 * @param {Object} params.user User who is retrieving positions
 * @param {Function} params.callback Callback
 */
function getAllUserPositions({ user, callback }) {
  const query = { visibility: { $lte: user.accessLevel }, banned: false, verified: true };
  const sort = { userName: 1 };
  const filter = { _id: 0, userName: 1 };

  User.find(query, filter).sort(sort).lean().exec((err, users = []) => {
    if (err) {
      callback({ error: new errorCreator.Database({ errorObject: err, name: 'getAllUserPositions' }) });

      return;
    }

    const userNames = users.map(userObj => userObj.userName);

    positionConnector.getPositions({
      userNames,
      callback: ({ error, data }) => {
        if (error) {
          callback({ error });

          return;
        }

        callback({ data: { positions: data.positions } });
      },
    });
  });
}

/**
 * Get position for a user
 * @param {Object} params.user User retrieving the positions
 * @param {string} params.userName Name of the user
 * @param {Function} params.callback Callback
 */
function getUserPosition({ user, userName, callback }) {
  const query = { visibility: { $lte: user.accessLevel }, userName };
  const filter = { _id: 0 };

  User.findOne(query, filter).lean().exec((err, foundUser) => {
    if (err) {
      callback({ error: new errorCreator.Database({ errorObject: err, name: 'getUserPosition' }) });

      return;
    } else if (!foundUser) {
      callback({ error: new errorCreator.DoesNotExist({ name: `user ${userName}` }) });

      return;
    }

    positionConnector.getUserPosition({
      userName,
      callback: ({ error, data }) => {
        if (error) {
          callback({ error });

          return;
        }

        callback({ data });
      },
    });
  });
}

/**
 * Get all users following a room
 * @param {string} params.roomName Name of the room
 * @param {Function} params.callback Callback
 */
function getUsersFollowingRoom({ roomName, callback }) {
  const query = { rooms: { $in: [roomName] }, banned: false, verified: true };
  const filter = { rooms: 1, socketId: 1 };

  User.find(query, filter).lean().exec((err, users = []) => {
    if (err) {
      callback({ error: new errorCreator.Database({ errorObject: err, name: 'getUsersFollowingRoom' }) });

      return;
    }

    callback({ data: { users: users.map(user => cleanUserParameters({ user })) } });
  });
}

/**
 * Add room to user
 * @param {string} params.userName Name of the user
 * @param {string} params.roomName Name of the room
 * @param {Function} params.callback Callback
 */
function addRoomToUser({ userName, roomName, callback }) {
  const query = { userName };
  const update = { $addToSet: { rooms: roomName } };

  User.findOneAndUpdate(query, update).lean().exec((err, user) => {
    if (err) {
      callback({ error: new errorCreator.Database({ errorObject: err, name: 'addRoomToUser' }) });

      return;
    } else if (!user) {
      callback({ error: new errorCreator.DoesNotExist({ name: `add room ${roomName} user ${userName}` }) });

      return;
    }

    callback({ data: { user: cleanUserParameters({ user }) } });
  });
}

/**
 * Remove room from user
 * @param {string} params.userName Name of the user
 * @param {string} params.roomName Name of the room
 * @param {boolean} params.isWhisperRoom Is the room being removed a whisper room?
 * @param {Function} params.callback Callback
 */
function removeRoomFromUser({ userName, roomName, isWhisperRoom, callback }) {
  const query = { userName };
  const update = {};
  const options = { new: true };

  if (isWhisperRoom) {
    query.whisperRooms = { $in: [roomName] };
    update.$pull = { whisperRooms: roomName };
  } else {
    query.rooms = { $in: [roomName] };
    update.$pull = { rooms: roomName };
  }

  User.findOneAndUpdate(query, update, options).lean().exec((err, user) => {
    if (err) {
      callback({ error: new errorCreator.Database({ errorObject: err, name: 'removeRoomFromuser' }) });

      return;
    } else if (!user) {
      callback({ error: new errorCreator.DoesNotExist({ name: `remove room ${roomName} user ${userName}` }) });

      return;
    }

    callback({ data: { user: cleanUserParameters({ user }) } });
  });
}

/**
 * Add whisper room to user
 * @param {string} params.userName Name of the user
 * @param {string} params.roomName Name of the room
 * @param {Function} params.callback Callback
 */
function addWhisperRoomToUser({ userName, roomName, callback }) {
  const query = { userName };
  const update = { $addToSet: { whisperRooms: roomName } };
  const options = { new: true };

  User.findOneAndUpdate(query, update, options).lean().exec((err, user) => {
    if (err) {
      callback({ error: new errorCreator.Database({ errorObject: err, name: 'addWhisperRoomToUser' }) });

      return;
    } else if (!user) {
      callback({ error: new errorCreator.DoesNotExist({ name: `add whisper ${userName}` }) });

      return;
    }

    callback({ data: { user: cleanUserParameters({ user }) } });
  });
}

/**
 * Remove room from all users following it
 * @param {string} params.roomName Name of the room
 * @param {Function} params.callback Callback
 */
function removeRoomFromAllUsers({ roomName, callback }) {
  const query = { rooms: { $in: [roomName] } };
  const update = { $pull: { rooms: roomName } };
  const options = { multi: true, new: true };

  User.update(query, update, options).lean().exec((err) => {
    if (err) {
      callback({ error: new errorCreator.Database({ errorObject: err, name: 'removeRoomFromAllUsers' }) });

      return;
    }

    callback({ data: { success: true } });
  });
}

/**
 * Set user last seen
 * @param {string} params.userName Name of the user
 * @param {Date} params.date Last seen
 * @param {Function} params.callback Callback
 */
function setUserLastOnline({ userName, date, callback }) {
  const query = { userName };
  const update = { $set: { lastOnline: date } };
  const options = { new: true };

  User.findOneAndUpdate(query, update, options).lean().exec((err, user) => {
    if (err) {
      callback({ error: new errorCreator.Database({ errorObject: err, name: 'setUserLastOnline' }) });

      return;
    } else if (!user) {
      callback({ error: new errorCreator.DoesNotExist({ name: `last seen ${userName}` }) });

      return;
    }

    callback({ data: { user: cleanUserParameters({ user }) } });
  });
}

/**
 * Ban user
 * @param {string} params.userName Name of the user
 * @param {boolean} params.noClean Should less parameters be removed before returning object?
 * @param {Function} params.callback Callback
 */
function banUser({ userName, noClean, callback }) {
  const query = { userName };
  const update = {
    $set: { banned: true },
    $unset: { socketId: '' },
  };
  const options = { new: true };

  User.findOneAndUpdate(query, update, options).lean().exec((err, user) => {
    if (err) {
      callback({ error: new errorCreator.Database({ errorObject: err, name: 'banUser' }) });

      return;
    } else if (!user) {
      callback({ error: new errorCreator.DoesNotExist({ name: `ban ${userName}` }) });

      return;
    }

    callback({ data: { user: cleanUserParameters({ user, noClean }) } });
  });
}

/**
 * Unban user
 * @param {string} params.userName Name of the user
 * @param {Function} params.callback Callback
 */
function unbanUser({ userName, callback }) {
  const query = { userName };
  const update = { $set: { banned: false } };
  const options = { new: true };

  User.findOneAndUpdate(query, update, options).lean().exec((err, user) => {
    if (err) {
      callback({ error: new errorCreator.Database({ errorObject: err, name: 'unbanUser' }) });

      return;
    } else if (!user) {
      callback({ error: new errorCreator.DoesNotExist({ name: `unban ${userName}` }) });

      return;
    }

    callback({ data: { user: cleanUserParameters({ user }) } });
  });
}

/**
 * Get all banned users
 * @param {Function} params.callback Callback
 */
function getBannedUsers({ callback }) {
  const query = { banned: true };
  const filter = { userName: 1, _id: 0 };
  const sort = { userName: 1 };

  User.find(query, filter).sort(sort).lean().exec((err, users = []) => {
    if (err) {
      callback({ error: new errorCreator.Database({ errorObject: err, name: 'getBannedUsers' }) });

      return;
    }

    callback({ data: { users: users.map(user => cleanUserParameters({ user })) } });
  });
}

/**
 * Set new user visibility
 * @param {string} params.userName - Name of the user
 * @param {number} params.visibility New visibility
 * @param {Function} params.callback Callback
 */
function updateUserVisibility({ userName, visibility, callback }) {
  const update = { $set: { visibility } };

  updateUserValue({ userName, update, callback });
}

/**
 * Set new user access level
 * @param {string} params.userName Name of the user
 * @param {number} params.accessLevel New access level
 * @param {Function} params.callback Callback
 */
function updateUserAccessLevel({ userName, accessLevel, callback }) {
  const update = { $set: { accessLevel } };

  updateUserValue({ userName, update, callback });
}

/**
 * Set new password for user
 * @param {string} params.userName Name of the user
 * @param {string} params.password New password
 * @param {Function} params.callback Callback
 */
function updateUserPassword({ userName, password, callback }) {
  const update = { $set: { password } };

  updateUserValue({ userName, update, callback });
}

/**
 * Set blocked by blocker
 * @param {string} params.userName Name of the user
 * @param {string} params.blockedBy User name blocking
 * @param {Function} params.callback Callback
 */
function updateUserBlockedBy({ userName, blockedBy, callback }) {
  const update = { $set: { blockedBy } };

  updateUserValue({ userName, update, callback });
}

/**
 * Set blocked by blocker
 * @param {Function} params.callback Callback
 */
function removeAllUserBlockedBy({ callback }) {
  const query = { blockedBy: { $exists: true } };
  const update = { $unset: { blockedBy: '' } };
  const options = { multi: true, new: true };

  User.update(query, update, options).lean().exec((err) => {
    if (err) {
      callback({ error: new errorCreator.Database({ errorObject: err, name: 'removeAllUserBlockedBy' }) });

      return;
    }

    callback({ data: { success: true } });
  });
}

/**
 * Remove blockedBy from user
 * @param {string} params.userName User name
 * @param {Function} params.callback Callback
 */
function removeUserBlockedBy({ userName, callback }) {
  const query = { userName };
  const update = { $unset: { blockedBy: '' } };
  const options = { new: true };

  User.findOneAndUpdate(query, update, options).lean().exec((err, user) => {
    if (err) {
      callback({ error: new errorCreator.Database({ errorObject: err, name: 'removeUserBlockedBy' }) });

      return;
    } else if (!user) {
      callback({ error: new errorCreator.DoesNotExist({ name: `blockedBy on ${userName}` }) });

      return;
    }

    callback({ data: { user: cleanUserParameters({ user }) } });
  });
}

/**
 * Match partial user name
 * @param {string} params.partialName Partial user name
 * @param {Object} params.user User doing the matching
 * @param {Function} params.callback Callback
 */
function matchPartialUser({ partialName, user, callback }) {
  const filter = { _id: 0, userName: 1 };
  const sort = { userName: 1 };

  databaseConnector.matchPartial({
    filter,
    sort,
    partialName,
    user,
    callback,
    type: 'userName',
    queryType: User,
  });
}

/**
 * Get user by alias
 * @param {string} params.alias User alias
 * @param {Function} params.callback Callback
 */
function getUserByAlias({ alias, callback }) {
  const query = {
    banned: false,
    verified: true,
    $or: [
      { userName: alias },
      { aliases: { $in: [alias] } },
    ],
  };
  const filter = { _id: 0, password: 0, socketId: 0 };

  User.findOne(query, filter).lean().exec((err, user) => {
    if (err) {
      callback({ error: new errorCreator.Database({ errorObject: err, name: 'getUserByAlias' }) });

      return;
    } else if (!user) {
      callback({ error: new errorCreator.DoesNotExist({ name: `alias ${alias}` }) });

      return;
    }

    callback({ data: { user: cleanUserParameters({ user }) } });
  });
}

/**
 * Add an alias to the user, if a user with the alias or a matching user name doesn't already exist
 * @param {string} params.userName Name of the user to update
 * @param {string} params.alias User alias
 * @param {Function} params.callback Callback
 */
function addAlias({ userName, alias, callback }) {
  const query = {
    $or: [
      { userName: alias },
      { aliases: { $in: [alias] } },
    ],
  };

  User.findOne(query).lean().exec((err, user) => {
    if (err) {
      callback({ error: new errorCreator.Database({ errorObject: err }) });

      return;
    } else if (user) {
      callback({ error: new errorCreator.AlreadyExists({ name: `alias ${alias}` }) });

      return;
    }

    const update = { $push: { aliases: alias } };

    updateUserValue({ userName, update, callback });
  });
}

/**
 * Get user by its mail
 * @param {string} params.mail Mail address
 * @param {Function} params.callback Callback
 */
function getUserByMail({ mail, callback }) {
  const query = { mail };

  User.findOne(query).lean().exec((error, user) => {
    if (error) {
      callback({ error: new errorCreator.Database({ errorObject: error }) });

      return;
    } else if (!user) {
      callback({ error: new errorCreator.DoesNotExist({ name: `user mail ${mail}` }) });

      return;
    }

    callback({ data: { user: cleanUserParameters({ user, noClean: true }) } });
  });
}

/**
 * Get user that is following all of the sent rooms
 * @param {string} params.userName User name of user to check
 * @param {string[]} params.rooms Rooms to check
 * @param {Function} params.callback Callback
 */
function getUserFollowingRooms({ userName, rooms, callback }) {
  const query = { userName, rooms: { $all: rooms } };

  User.findOne(query).lean().exec((error, user) => {
    if (error) {
      callback({ error: new errorCreator.Database({ errorObject: error }) });

      return;
    } else if (!user) {
      callback({ error: new errorCreator.DoesNotExist({ name: `user following ${rooms}` }) });

      return;
    }

    callback({ data: { user: cleanUserParameters({ user }) } });
  });
}

exports.getUserById = getUserById;
exports.authUser = authUser;
exports.createUser = createUser;
exports.updateUserSocketId = updateUserSocketId;
exports.getUsers = getUsers;
exports.getAllUserPositions = getAllUserPositions;
exports.getUserPosition = getUserPosition;
exports.addRoomToUser = addRoomToUser;
exports.removeRoomFromUser = removeRoomFromUser;
exports.addWhisperRoomToUser = addWhisperRoomToUser;
exports.setUserLastOnline = setUserLastOnline;
exports.updateUserPassword = updateUserPassword;
exports.verifyUser = verifyUser;
exports.verifyAllUsers = verifyAllUsers;
exports.banUser = banUser;
exports.unbanUser = unbanUser;
exports.getBannedUsers = getBannedUsers;
exports.updateUserVisibility = updateUserVisibility;
exports.updateUserAccessLevel = updateUserAccessLevel;
exports.addGroupToUser = addGroupToUser;
exports.updateUserOnline = updateUserOnline;
exports.getUserByDevice = getUserByDevice;
exports.getUser = getUser;
exports.updateUserTeam = updateUserTeam;
exports.matchPartialUser = matchPartialUser;
exports.getUsersFollowingRoom = getUsersFollowingRoom;
exports.removeRoomFromAllUsers = removeRoomFromAllUsers;
exports.updateUserIsTracked = updateUserIsTracked;
exports.getUserByAlias = getUserByAlias;
exports.createAlias = addAlias;
exports.getTeamUsers = getTeamUsers;
exports.updateUserBlockedBy = updateUserBlockedBy;
exports.removeAllUserBlockedBy = removeAllUserBlockedBy;
exports.removeUserBlockedBy = removeUserBlockedBy;
exports.removeAllUserTeam = removeAllUserTeam;
exports.removeUserTeam = removeUserTeam;
exports.getUserByMail = getUserByMail;
exports.getUserFollowingRooms = getUserFollowingRooms;
