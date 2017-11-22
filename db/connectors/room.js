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

const roomSchema = new mongoose.Schema(dbConnector.createSchema({
  roomName: { type: String, unique: true },
  password: String,
  participantIds: { type: [String], default: [] },
  nameIsLocked: { type: Boolean, default: false },
  isAnonymous: { type: Boolean, default: false },
  isWhisper: { type: Boolean, default: false },
  followers: { type: [String], default: [] },
}), { collection: 'rooms' });

const Room = mongoose.model('Room', roomSchema);

/**
 * Add custom id to the object.
 * @param {Object} room - Room object.
 * @return {Object} - Room object with id.
 */
function addCustomId(room) {
  const updatedRoom = room;
  updatedRoom.roomId = room.objectId;

  return updatedRoom;
}

/**
 * Remove private parameters from room.
 * @private
 * @param {Object} room - Room.
 * @return {Object} - Room with cleaned parameters
 */
function cleanParameters(room) {
  const modifiedRoom = room;

  modifiedRoom.password = typeof room.password === 'string';

  return modifiedRoom;
}

/**
 * Update room
 * @private
 * @param {Object} params - Parameters
 * @param {string} params.roomId - ID of the room to update
 * @param {Object} params.update - Update
 * @param {Function} params.callback - Callback
 */
function updateObject({ update, roomId, callback }) {
  dbConnector.updateObject({
    update,
    query: { _id: roomId },
    object: Room,
    errorNameContent: 'updateRoom',
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      callback({ data: { room: addCustomId(cleanParameters(data.object)) } });
    },
  });
}

/**
 * Get room
 * @private
 * @param {Object} params - Parameters
 * @param {string} params.query - Query to get room
 * @param {Function} params.callback - Callback
 */
function getRoom({ query, callback }) {
  dbConnector.getObject({
    query,
    object: Room,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      } else if (!data.object) {
        callback({ error: new errorCreator.DoesNotExist({ name: `room ${query.toString()}` }) });

        return;
      }

      callback({ room: addCustomId(cleanParameters(data.object)) });
    },
  });
}

/**
 * Get rooms
 * @private
 * @param {Object} params - Parameters
 * @param {Object} params.query - Query to get rooms
 * @param {Function} params.callback - Callback
 */
function getRooms({ query, callback }) {
  dbConnector.getObjects({
    query,
    object: Room,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      callback({ rooms: data.objects.map(room => addCustomId(cleanParameters(room))) });
    },
  });
}

/**
 * Does the room exist?
 * @param {Object} params - Parameters
 * @param {string} params.roomName - Name of the room
 * @param {Function} params.callback - Callback
 */
function doesRoomExist({ roomName, callback }) {
  const query = {
    $or: [
      { roomName },
      { _id: roomName },
    ],
  };

  dbConnector.doesObjectExist({
    query,
    callback,
    object: Room,
  });
}

/**
 * Create and save room
 * @param {Object} params - Parameters
 * @param {Object} params.room - New room
 * @param {Object} [params.options] - Options
 * @param {boolean} [params.silentExistsError] - Should error be skipped if the room already exists?
 * @param {Function} params.callback - Callback
 */
function createRoom({
  room,
  silentExistsError,
  callback,
  options = {},
}) {
  const { shouldSetIdToName } = options;

  doesRoomExist({
    roomName: room.roomName,
    callback: (existsData) => {
      if (existsData.error) {
        callback({ error: existsData.error });

        return;
      } else if (existsData.data.exists) {
        if (silentExistsError) {
          callback({ data: { exists: true } });
        } else {
          callback({ error: new errorCreator.AlreadyExists({ name: `room name ${room.roomName}` }) });
        }

        return;
      }

      const roomToSave = room;

      if (shouldSetIdToName) { roomToSave._id = roomToSave.roomName; } // eslint-disable-line no-underscore-dangle

      dbConnector.saveObject({
        object: new Room(roomToSave),
        objectType: 'room',
        callback: ({ error, data }) => {
          if (error) {
            callback({ error });

            return;
          }

          callback({ data: { room: addCustomId(cleanParameters(data.savedObject)) } });
        },
      });
    },
  });
}

/**
 * Remove room
 * @param {Object} params - Parameters
 * @param {string} params.roomId - ID of the room
 * @param {Function} params.callback - Callback
 */
function removeRoom({ roomId, callback }) {
  dbConnector.removeObject({
    callback,
    object: Room,
    query: { _id: roomId },
  });
}

/**
 * Get all rooms
 * @param {Object} params - Parameters
 * @param {Function} params.callback - Callback
 */
function getAllRooms({ callback }) {
  getRooms({ callback });
}


/**
 * Add followers
 * @param {Object} params - Parameters
 * @param {string[]} params.userIds - ID of the users to add
 * @param {string} params.roomId - ID of the room
 * @param {Function} params.callback - Callback
 */
function addFollowers({ userIds, roomId, callback }) {
  updateObject({
    update: {
      $addToSet: { followers: { $each: userIds } },
    },
    roomId,
    callback,
  });
}

/**
 * Remove followers
 * @param {Object} params - Parameters
 * @param {string[]} params.userIds - ID of the users to remove
 * @param {string} params.roomId - ID of the room
 * @param {Function} params.callback - Callback
 */
function removeFollowers({ userIds, roomId, callback }) {
  updateObject({
    update: {
      $pull: { followers: { $each: userIds } },
    },
    roomId,
    callback,
  });
}

/**
 * Add access to the room for users and/or teams
 * @param {Object} params - Parameters
 * @param {string} params.roomId - ID of the room
 * @param {string[]} [params.userIds] - ID of the users
 * @param {string[]} [params.teamIds] - ID of the teams
 * @param {string[]} [params.bannedIds] - ID of the blocked users
 * @param {boolean} [params.isAdmin] - Should teams and users get admin access?
 * @param {Function} params.callback - Callback
 */
function addAccess({
  userIds,
  teamIds,
  bannedIds,
  isAdmin,
  roomId,
  callback,
}) {
  dbConnector.addObjectAccess({
    userIds,
    teamIds,
    bannedIds,
    isAdmin,
    objectId: roomId,
    object: Room,
    callback: ({ error }) => {
      if (error) {
        callback({ error });

        return;
      }

      addFollowers({
        roomId,
        userIds,
        callback: (roomData) => {
          if (roomData.error) {
            callback({ error: roomData.error });

            return;
          }

          callback({ room: addCustomId(cleanParameters(roomData.data.object)) });
        },
      });
    },
  });
}

/**
 * Remove access to the room for users and/or teams
 * @param {Object} params - Parameters
 * @param {string} params.roomId - ID of the room
 * @param {string[]} [params.userIds] - ID of the users
 * @param {string[]} [params.teamIds] - ID of the teams
 * @param {string[]} [params.bannedIds] - ID of the blocked users
 * @param {boolean} [params.isAdmin] - Should the teams and/or users be removed from admins?
 * @param {Function} params.callback - Callback
 */
function removeAccess({
  userIds,
  teamIds,
  bannedIds,
  roomId,
  isAdmin,
  callback,
}) {
  dbConnector.removeObjectAccess({
    isAdmin,
    userIds,
    teamIds,
    bannedIds,
    objectId: roomId,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      removeFollowers({
        roomId,
        userIds,
        callback: (roomData) => {
          if (roomData.error) {
            callback({ error: roomData.error });

            return;
          }

          callback({ room: addCustomId(cleanParameters(roomData.data.object)) });
        },
      });
    },
  });
}

/**
 * Update room
 * @param {Object} params - Parameters
 * @param {string} params.roomId - ID of the room to update
 * @param {Object} params.room - Fields to update
 * @param {Object} [params.options] - Options
 * @param {Object} params.options.resetOwnerAliasId - Should ownerAliasId be removed?
 * @param {Function} params.callback - Callback
 */
function updateRoom({
  room,
  roomId,
  callback,
  options = {},
}) {
  const { resetOwnerAliasId } = options;
  const {
    roomName,
    ownerAliasId,
    accessLevel,
    visibility,
    nameIsLocked,
    isAnonymous,
  } = room;
  const update = { $set: {} };

  if (resetOwnerAliasId) {
    update.$unset = { ownerAliasId: '' };
  } else if (ownerAliasId) {
    update.$set.ownerAliasId = ownerAliasId;
  }

  if (typeof nameIsLocked === 'boolean') { update.$set.nameIsLocked = nameIsLocked; }
  if (typeof isAnonymous === 'boolean') { update.$set.isAnonymous = isAnonymous; }
  if (accessLevel) { update.$set.accessLevel = accessLevel; }
  if (visibility) { update.$set.visibility = visibility; }

  if (roomName) {
    update.$set.roomName = roomName;

    doesRoomExist({
      roomName,
      callback: ({ error, data }) => {
        if (error) {
          callback({ error });

          return;
        } else if (data.exists) {
          callback({ error: new errorCreator.AlreadyExists({ name: `roomName ${roomName}` }) });

          return;
        }

        updateObject({
          update,
          roomId,
          callback,
        });
      },
    });

    return;
  }

  updateObject({
    update,
    roomId,
    callback,
  });
}

/**
 * Get room by ID
 * @param {Object} params - Parameters
 * @param {string} params.roomId - ID of the room
 * @param {Function} params.callback - Callback
 */
function getRoomById({ roomId, callback }) {
  getRoom({
    callback,
    query: { _id: roomId },
  });
}

/**
 * Get whisper room
 * @param {Object} params - Parameters
 * @param {string} params.participantIds - ID of the users
 * @param {Function} params.callback - Callback
 */
function getWhisperRoom({ participantIds, callback }) {
  const query = {
    isWhisper: true,
    participantIds: { $all: participantIds },
  };

  dbConnector.getObject({
    query,
    object: Room,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      callback({ data: { room: addCustomId(cleanParameters(data.object)) } });
    },
  });
}

/**
 * Add rooms to db
 * @param {Object} params - Parameters
 * @param {Object} params.rooms Rooms to be added
 * @param {Function} params.callback Callback
 */
function populateDbRooms({ rooms, callback = () => {} }) {
  console.info('Creating default rooms, if needed');

  /**
   * Adds a room to database. Recursive
   * @param {string[]} roomNames Room names
   */
  function addRoom(roomNames) {
    const roomName = roomNames.shift();

    if (roomName) {
      createRoom({
        room: rooms[roomName],
        silentExistsError: true,
        options: { shouldSetIdToName: true },
        callback: ({ error }) => {
          if (error) {
            callback({ error });

            return;
          }

          addRoom(roomNames);
        },
      });

      return;
    }

    callback({ data: { success: true } });
  }

  addRoom(Object.keys(rooms));
}

exports.getAllRooms = getAllRooms;
exports.createRoom = createRoom;
exports.removeRoom = removeRoom;
exports.populateDbRooms = populateDbRooms;
exports.addAccess = addAccess;
exports.removeAccess = removeAccess;
exports.updateRoom = updateRoom;
exports.getRoomById = getRoomById;
exports.doesRoomExist = doesRoomExist;
exports.getWhisperRoom = getWhisperRoom;
exports.addFollowers = addFollowers;
exports.removeFollowers = removeFollowers;
