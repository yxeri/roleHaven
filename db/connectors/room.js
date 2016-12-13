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
const chatHistoryConnector = require('./chatHistory');

const roomSchema = new mongoose.Schema({
  roomName: { type: String, unique: true },
  password: { type: String, default: '' },
  accessLevel: { type: Number, default: 1 },
  visibility: { type: Number, default: 1 },
  writeLevel: Number,
  commands: [{
    commandName: String,
    accessLevel: Number,
    requireAdmin: Boolean,
  }],
  admins: [{ type: String, unique: true }],
  bannedUsers: [{ type: String, unique: true }],
  owner: String,
  team: String,
}, { collection: 'rooms' });

const Room = mongoose.model('Room', roomSchema);

/**
 * Authorize the user to the room, by checking if the password is correct and the user has high enough access level
 * @param {Object} user - User to authorize
 * @param {string} roomName - Name of the room
 * @param {string} password - Password of the room
 * @param {Function} callback - Callback
 */
function authUserToRoom(user, roomName, password, callback) {
  const query = {
    $and: [
      { accessLevel: { $lte: user.accessLevel } },
      { roomName },
      { password },
    ],
  };
  const filter = { password: 0 };

  Room.findOne(query, filter).lean().exec((err, room) => {
    if (err) {
      logger.sendErrorMsg({
        code: logger.ErrorCodes.db,
        text: ['Failed to check auth against room'],
        err,
      });
    }

    callback(err, room);
  });
}

/**
 * Create and save room
 * @param {Object} sentRoom - New room
 * @param {Object} sentUser - User that created the room
 * @param {Function} callback - Callback
 */
function createRoom(sentRoom, sentUser, callback) {
  const newRoom = new Room(sentRoom);
  let query;

  // TODO Remove user check. All users should be able to create multiple rooms
  if (sentUser && sentUser.accessLevel < 11) {
    query = {
      $or: [
        { roomName: sentRoom.roomName },
        { owner: sentRoom.owner },
      ],
    };
  } else {
    query = { roomName: sentRoom.roomName };
  }

  // Checks if room already exists
  Room.findOne(query).lean().exec((err, room) => {
    if (err) {
      logger.sendErrorMsg({
        code: logger.ErrorCodes.db,
        text: ['Failed to find if room already exists'],
        err,
      });
      // Room doesn't exist in the collection, so let's add it!
    } else if (room === null) {
      chatHistoryConnector.createHistory(sentRoom.roomName, (saveErr, saveHistory) => {
        if (saveErr || saveHistory === null) {
          logger.sendErrorMsg({
            code: logger.ErrorCodes.db,
            text: ['Failed to save history'],
            err: saveErr,
          });
        } else {
          databaseConnector.saveObject(newRoom, 'room', callback);
        }
      });
    } else {
      callback(err, null);
    }
  });
}

/**
 * Get room
 * @param {string} roomName - Name of the room
 * @param {Object} user - User retrieving the room
 * @param {Function} callback - Callback
 */
function getRoom(roomName, user, callback) {
  const query = { roomName, accessLevel: { $lte: user.accessLevel } };
  const filter = { password: 0 };

  Room.findOne(query, filter).lean().exec((err, room) => {
    if (err) {
      logger.sendErrorMsg({
        code: logger.ErrorCodes.db,
        text: [`Failed to get room ${roomName}`],
        err,
      });
    }

    callback(err, room);
  });
}

/**
 * Get rooms owned by user
 * @param {Object} user - Owner
 * @param {Function} callback - Callback
 */
function getOwnedRooms(user, callback) {
  const query = { owner: user.userName };
  const sort = { roomName: 1 };
  const filter = { password: 0 };

  Room.find(query, filter).sort(sort).lean().exec((err, rooms) => {
    if (err) {
      logger.sendErrorMsg({
        code: logger.ErrorCodes.db,
        text: ['Failed to get owned rooms'],
        err,
      });
    }

    callback(err, rooms);
  });
}

/**
 * Get all rooms, based on user's access level
 * @param {Object} user - User
 * @param {Function} callback - Callback
 */
function getAllRooms(user, callback) {
  const query = { visibility: { $lte: user.accessLevel } };
  const sort = { roomName: 1 };
  const filter = { password: 0 };

  Room.find(query, filter).sort(sort).lean().exec((err, rooms) => {
    if (err) {
      logger.sendErrorMsg({
        code: logger.ErrorCodes.db,
        text: ['Failed to list rooms'],
        err,
      });
    }

    callback(err, rooms);
  });
}

/**
 * Ban user from room
 * @param {string} userName - Name of the user
 * @param {string} roomName - Name of the room
 * @param {Function} callback - Callback
 */
function banUserFromRoom(userName, roomName, callback) {
  const query = { roomName };
  const update = { $addToSet: { bannedUsers: userName } };

  Room.findOneAndUpdate(query, update).lean().exec((err, room) => {
    if (err) {
      logger.sendErrorMsg({
        code: logger.ErrorCodes.db,
        text: [`Failed to ban user ${userName} from room ${roomName}`],
        err,
      });
    }

    callback(err, room);
  });
}

/**
 * Unban user from room
 * @param {string} userName - Name of the user
 * @param {string} roomName - Name of the room
 * @param {Function} callback - Callback
 */
function unbanUserFromRoom(userName, roomName, callback) {
  const query = { roomName };
  const update = { $pull: { bannedUsers: userName } };

  Room.findOneAndUpdate(query, update).lean().exec((err, room) => {
    if (err) {
      logger.sendErrorMsg({
        code: logger.ErrorCodes.db,
        text: [`Failed to unban user ${userName} from room ${roomName}`],
        err,
      });
    }

    callback(err, room);
  });
}

/**
 * Remove room
 * @param {string} roomName - Name of the room
 * @param {Object} user - User who is trying to remove the room
 * @param {Function} callback - Callback
 */
function removeRoom(roomName, user, callback) {
  let query;

  if (user.accessLevel >= 11) {
    query = { roomName };
  } else {
    query = {
      $and: [
        { owner: user.userName },
        { roomName },
      ],
    };
  }

  Room.findOneAndRemove(query).lean().exec((err, room) => {
    if (err) {
      logger.sendErrorMsg({
        code: logger.ErrorCodes.db,
        text: ['Failed to remove room'],
        err,
      });
    } else if (room !== null) {
      chatHistoryConnector.removeHistory(roomName, (histErr, history) => {
        if (histErr) {
          logger.sendErrorMsg({
            code: logger.ErrorCodes.db,
            text: ['Failed to remove history'],
            err: histErr,
          });
        } else if (history !== null) {
          callback(histErr, history);
        } else {
          callback(histErr, null);
        }
      });
    } else {
      callback(err, null);
    }
  });
}

/**
 * Match partial room name
 * @param {string} partialName - Partial room name
 * @param {Object} user - User
 * @param {Function} callback - Callback
 */
function matchPartialRoom(partialName, user, callback) {
  const filter = { _id: 0, roomName: 1 };
  const sort = { roomName: 1 };

  databaseConnector.matchPartial({
    filter,
    sort,
    partialName,
    user,
    queryType: Room,
    callback,
    type: 'roomName',
  });
}

/**
 * Add rooms to db
 * @param {Object} rooms - Rooms to be added
 * @param {Object} user - User that will be the owner
 */
function populateDbRooms(rooms, user) {
  const roomCallback = (err, room) => {
    if (err) {
      logger.sendErrorMsg({
        code: logger.ErrorCodes.db,
        text: ['PopulateDb: [failure] Failed to create room'],
        err,
      });
    } else if (room !== null) {
      logger.sendInfoMsg(`PopulateDb: [success] Created room ${room.roomName}`);
    }
  };

  const roomKeys = Object.keys(rooms);

  logger.sendInfoMsg('PopulateDb: Creating rooms from defaults, if needed');

  for (let i = 0; i < roomKeys.length; i += 1) {
    const room = rooms[roomKeys[i]];

    createRoom(room, user, roomCallback);
  }
}

exports.authUserToRoom = authUserToRoom;
exports.createRoom = createRoom;
exports.getAllRooms = getAllRooms;
exports.getRoom = getRoom;
exports.banUserFromRoom = banUserFromRoom;
exports.unbanUserFromRoom = unbanUserFromRoom;
exports.getOwnedRooms = getOwnedRooms;
exports.removeRoom = removeRoom;
exports.matchPartialRoom = matchPartialRoom;
exports.populateDbRooms = populateDbRooms;
