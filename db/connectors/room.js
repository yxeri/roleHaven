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
const dbUser = require('./user');
const { dbConfig } = require('../../config/defaults/config');

const roomSchema = new mongoose.Schema(dbConnector.createSchema({
  roomName: { type: String, unique: true },
  roomNameLowerCase: { type: String, unique: true },
  password: String,
  participantIds: { type: [String], default: [] },
  nameIsLocked: { type: Boolean, default: false },
  isAnonymous: { type: Boolean, default: false },
  isWhisper: { type: Boolean, default: false },
  followers: { type: [String], default: [] },
  isSystemRoom: { type: Boolean, default: false },
  isUser: { type: Boolean, default: false },
  isTeam: { type: Boolean, default: false },
  topic: { type: String, default: '' },
}), { collection: 'rooms' });

const Room = mongoose.model('Room', roomSchema);

/**
 * Update room.
 * @private
 * @param {Object} params Parameters.
 * @param {string} params.roomId Id of the room to update.
 * @param {Object} params.update Update.
 * @param {Function} params.callback Callback.
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

      callback({ data: { room: data.object } });
    },
  });
}

/**
 * Get a room.
 * @param {Object} params Parameters-
 * @param {string} params.query Query to get room.
 * @param {Function} params.callback Callback.
 */
function getRoom({
  getPassword,
  query,
  callback,
}) {
  dbConnector.getObject({
    query,
    noClean: getPassword,
    object: Room,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      if (!data.object) {
        callback({ error: new errorCreator.DoesNotExist({ name: `room ${JSON.stringify(query, null, 4)}` }) });

        return;
      }

      callback({ data: { room: data.object } });
    },
  });
}

/**
 * Get rooms.
 * @private
 * @param {Object} params Parameters.
 * @param {Object} params.query Query to get rooms.
 * @param {Function} params.callback Callback.
 * @param {Object} [params.filter] Parameters to be filtered from the db result.
 */
function getRooms({
  filter,
  query,
  callback,
}) {
  dbConnector.getObjects({
    query,
    filter,
    object: Room,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      callback({
        data: {
          rooms: data.objects,
        },
      });
    },
  });
}

/**
 * Does the room exist?
 * @param {Object} params Parameters.
 * @param {boolean} [params.skipExistsCheck] Should the exist check be skipped?
 * @param {string} [params.roomName] Name of the room.
 * @param {string} [params.roomId] Id of the room.
 * @param {Function} params.callback Callback.
 */
function doesRoomExist({
  skipExistsCheck,
  roomName,
  roomId,
  callback,
}) {
  if (skipExistsCheck) {
    callback({ data: { exists: false } });

    return;
  }

  if (!roomName && !roomId) {
    callback({ error: new errorCreator.InvalidData({ expected: 'roomName || roomId' }) });

    return;
  }

  const query = { $or: [] };

  if (roomName) {
    query.$or.push({ roomNameLowerCase: roomName.toLowerCase() });
  }

  if (roomId) { query.$or.push({ _id: roomId }); }

  dbConnector.doesObjectExist({
    query,
    callback,
    object: Room,
  });
}

/**
 * Add followers.
 * @param {Object} params Parameters.
 * @param {string[]} params.userIds Id of the users to add.
 * @param {string} params.roomId Id of the room.
 * @param {Function} params.callback Callback.
 * @param {boolean} [params.addParticipants] Should they be added as participants too?
 */
function addFollowers({
  userIds,
  roomId,
  callback,
  addParticipants,
}) {
  const update = {
    $addToSet: {
      followers: { $each: userIds },
    },
  };

  if (addParticipants) {
    update.$addToSet.participantIds = { $each: userIds };
  }

  updateObject({
    roomId,
    callback,
    update,
  });
}

/**
 * Create and save room.
 * @param {Object} params Parameters.
 * @param {Object} params.room New room.
 * @param {Function} params.callback Callback.
 * @param {Object} [params.options] Options.
 * @param {boolean} [params.silentExistsError] Should error be skipped if the room already exists?
 */
function createRoom({
  room,
  silentExistsError,
  callback,
  skipExistsCheck = false,
  options = {},
}) {
  const { setId, isFollower } = options;
  const { roomName, objectId: roomId } = room;

  doesRoomExist({
    roomName,
    skipExistsCheck,
    callback: (existsData) => {
      if (existsData.error) {
        callback({ error: existsData.error });

        return;
      }

      if (existsData.data.exists) {
        if (silentExistsError) {
          callback({ data: { exists: true } });
        } else {
          callback({ error: new errorCreator.AlreadyExists({ name: `room name ${roomName}` }) });
        }

        return;
      }

      const roomToSave = room;
      roomToSave.roomNameLowerCase = roomToSave.roomName.toLowerCase();

      if (setId && roomId) {
        roomToSave._id = mongoose.Types.ObjectId(roomId); // eslint-disable-line no-underscore-dangle
      }

      dbConnector.saveObject({
        object: new Room(roomToSave),
        objectType: 'room',
        callback: ({ error, data }) => {
          if (error) {
            callback({ error });

            return;
          }

          const createdRoom = data.savedObject;

          if (isFollower) {
            addFollowers({
              userIds: [createdRoom.ownerAliasId || createdRoom.ownerId],
              roomId: createdRoom.objectId,
              callback: ({ error: followerError }) => {
                if (followerError) {
                  callback({ error: followerError });

                  return;
                }

                callback({ data: { room: createdRoom } });
              },
            });

            return;
          }

          callback({ data: { room: createdRoom } });
        },
      });
    },
  });
}

/**
 * Remove room.
 * @param {Object} params Parameters.
 * @param {string} params.roomId ID of the room.
 * @param {Function} params.callback Callback.
 * @param {boolean} [params.fullRemoval] Should the room be removed from all users?
 */
function removeRoom({ roomId, fullRemoval, callback }) {
  dbConnector.removeObject({
    object: Room,
    query: { _id: roomId },
    callback: ({ error }) => {
      if (error) {
        callback({ error });

        return;
      }

      if (fullRemoval) {
        dbUser.removeRoomFromAll({
          roomId,
          callback: ({ error: removeError, data: usersData }) => {
            if (removeError) {
              callback({ error: removeError });

              return;
            }

            callback({
              data: {
                userIds: usersData.users.map((user) => user.objectId),
                success: true,
              },
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
 * Remove followers
 * @param {Object} params Parameters
 * @param {string[]} params.userIds ID of the users to remove
 * @param {string} params.roomId ID of the room
 * @param {Function} params.callback Callback
 */
function removeFollowers({ userIds, roomId, callback }) {
  updateObject({
    roomId,
    callback,
    update: {
      $pull: { followers: { $each: userIds } },
    },
  });
}

/**
 * Update access to the file.
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
  accessParams.objectId = params.roomId;
  accessParams.object = Room;
  accessParams.callback = ({ error, data }) => {
    if (error) {
      callback({ error });

      return;
    }

    callback({ data: { room: data.object } });
  };

  if (params.shouldRemove) {
    dbConnector.removeObjectAccess(accessParams);
  } else {
    dbConnector.addObjectAccess(accessParams);
  }
}

/**
 * Update room
 * @param {Object} params Parameters
 * @param {string} params.roomId ID of the room to update
 * @param {Object} params.room Fields to update
 * @param {Object} [params.options] Options
 * @param {Object} params.options.resetOwnerAliasId Should ownerAliasId be removed?
 * @param {Function} params.callback Callback
 */
function updateRoom({
  roomId,
  callback,
  room = {},
  options = {},
}) {
  const {
    resetOwnerAliasId,
    resetPassword,
  } = options;
  const {
    roomName,
    ownerAliasId,
    accessLevel,
    visibility,
    nameIsLocked,
    isAnonymous,
    password,
    topic,
  } = room;
  const update = {};
  const set = {};
  const unset = {};

  if (resetOwnerAliasId) {
    unset.ownerAliasId = '';
  } else if (ownerAliasId) {
    set.ownerAliasId = ownerAliasId;
  }

  if (resetPassword) {
    unset.password = '';
  } else if (password) {
    set.password = password;
  }

  if (typeof nameIsLocked === 'boolean') { set.nameIsLocked = nameIsLocked; }
  if (typeof isAnonymous === 'boolean') { set.isAnonymous = isAnonymous; }
  if (accessLevel) { set.accessLevel = accessLevel; }
  if (visibility) { set.visibility = visibility; }
  if (roomName) {
    set.roomName = roomName;
    set.roomNameLowerCase = roomName.toLowerCase();
  }
  if (topic) { set.topic = topic; }

  if (Object.keys(set).length > 0) { update.$set = set; }
  if (Object.keys(unset).length > 0) { update.$unset = unset; }

  if (roomName) {
    doesRoomExist({
      roomName,
      callback: ({ error, data }) => {
        if (error) {
          callback({ error });

          return;
        }

        if (data.exists) {
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
 * Get room by Id.
 * @param {Object} params Parameters.
 * @param {string} params.roomId Id of the room.
 * @param {Function} params.callback Callback.
 */
function getRoomById({
  roomId,
  roomName,
  callback,
  getPassword,
}) {
  const query = {};

  if (roomId) {
    query._id = roomId;
  } else {
    query.roomName = roomName;
  }

  getRoom({
    callback,
    query,
    getPassword,
  });
}

/**
 * Get rooms by Ids
 * @param {Object} params Parameters.
 * @param {string[]} params.roomIds Ids of the rooms.
 * @param {Function} params.callback Callback.
 */
function getRoomsByIds({ roomIds, callback }) {
  getRooms({
    callback,
    query: { _id: { $in: roomIds } },
  });
}

/**
 * Get rooms that the user has access to.
 * @param {Object} params Parameters.
 * @param {Object} params.user User retrieving the rooms.
 * @param {Function} params.callback Callback.
 */
function getRoomsByUser({
  user,
  callback,
}) {
  const query = dbConnector.createUserQuery({ user });

  query.$or.push({ participantIds: { $in: [user.objectId].concat(user.aliases) } });
  query.$or.push({ isUser: true });

  getRooms({
    callback,
    query,
  });
}

/**
 * Get whisper room.
 * @param {Object} params Parameters.
 * @param {string} params.participantIds Id of the users.
 * @param {Function} params.callback Callback.
 */
function getWhisperRoom({ participantIds, callback }) {
  const query = {
    isWhisper: true,
    participantIds: { $all: participantIds },
  };

  getRoom({
    query,
    callback,
  });
}

/**
 * Does the whisper room exist?
 * @param {Object} params Parameters.
 * @param {string[]} [params.participantIds] Participants in the room.
 * @param {Function} params.callback Callback.
 */
function doesWhisperRoomExist({ participantIds, callback }) {
  const query = {
    isWhisper: true,
    participantIds: { $all: participantIds },
  };

  dbConnector.doesObjectExist({
    query,
    callback,
    object: Room,
  });
}

/**
 * Get all rooms
 * @param {Object} params Parameters.
 * @param {Function} params.callback Callback.
 */
function getAllRooms({ callback }) {
  getRooms({
    callback,
    filter: {
      isWhisper: 1,
      participantIds: 1,
      roomName: 1,
    },
  });
}

/**
 * Add rooms to db.
 * @param {Object} params Parameters.
 * @param {Function} params.callback Callback.
 */
function populateDbRooms({ callback = () => {} }) {
  console.info('Creating default rooms, if needed');

  const { rooms } = dbConfig;

  /**
   * Adds a room to database. Recursive.
   * @param {string[]} roomNames Room names.
   */
  function addRoom(roomNames) {
    const roomName = roomNames.shift();

    if (roomName) {
      createRoom({
        room: rooms[roomName],
        silentExistsError: true,
        options: { setId: true },
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

exports.createRoom = createRoom;
exports.removeRoom = removeRoom;
exports.populateDbRooms = populateDbRooms;
exports.updateAccess = updateAccess;
exports.updateRoom = updateRoom;
exports.getRoomById = getRoomById;
exports.doesRoomExist = doesRoomExist;
exports.getWhisperRoom = getWhisperRoom;
exports.addFollowers = addFollowers;
exports.removeFollowers = removeFollowers;
exports.getRoomsByUser = getRoomsByUser;
exports.getRoomsByIds = getRoomsByIds;
exports.getAllRooms = getAllRooms;
exports.doesWhisperRoomExist = doesWhisperRoomExist;
