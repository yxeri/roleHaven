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
const errorCreator = require('../../error/errorCreator');
const dbUser = require('./user');

const roomSchema = new mongoose.Schema(dbConnector.createSchema({
  roomName: { type: String, unique: true },
  password: String,
  participantIds: { type: [String], default: [] },
  nameIsLocked: { type: Boolean, default: false },
  isAnonymous: { type: Boolean, default: false },
  isWhisper: { type: Boolean, default: false },
  followers: { type: [String], default: [] },
  isSystemRoom: { type: Boolean, default: false },
  isUser: { type: Boolean, default: false },
}), { collection: 'rooms' });

const Room = mongoose.model('Room', roomSchema);

const roomFilter = dbConnector.createFilter({
  roomName: 1,
  isAnonymous: 1,
  followers: 1,
  isWhisper: 1,
  participantIds: 1,
  isUser: 1,
});

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
 * Update room.
 * @private
 * @param {Object} params - Parameters.
 * @param {string} params.roomId - Id of the room to update.
 * @param {Object} params.update - Update.
 * @param {Function} params.callback - Callback.
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

      callback({ data: { room: cleanParameters(data.object) } });
    },
  });
}

/**
 * Get a room.
 * @param {Object} params - Parameters-
 * @param {string} params.query - Query to get room.
 * @param {Function} params.callback - Callback.
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
        callback({ error: new errorCreator.DoesNotExist({ name: `room ${JSON.stringify(query, null, 4)}` }) });

        return;
      }

      callback({ data: { room: cleanParameters(data.object) } });
    },
  });
}

/**
 * Get rooms.
 * @private
 * @param {Object} params - Parameters.
 * @param {Object} params.query - Query to get rooms.
 * @param {Function} params.callback - Callback.
 * @param {Object} [params.filter] - Parameters to be filtered from the db result.
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
          rooms: data.objects.map(room => cleanParameters(room)),
        },
      });
    },
  });
}

/**
 * Does the room exist?
 * @param {Object} params - Parameters.
 * @param {string} [params.roomName] - Name of the room.
 * @param {string} [params.roomId] - Id of the room.
 * @param {Function} params.callback - Callback.
 */
function doesRoomExist({ roomName, roomId, callback }) {
  if (!roomName && !roomId) {
    callback({ error: new errorCreator.InvalidData({ expected: 'roomName || roomId' }) });

    return;
  }

  const query = { $or: [] };

  if (roomName) { query.$or.push({ roomName }); }
  if (roomId) { query.$or.push({ _id: roomId }); }

  dbConnector.doesObjectExist({
    query,
    callback,
    object: Room,
  });
}

/**
 * Add followers.
 * @param {Object} params - Parameters.
 * @param {string[]} params.userIds - Id of the users to add.
 * @param {string} params.roomId - Id of the room.
 * @param {Function} params.callback - Callback.
 */
function addFollowers({ userIds, roomId, callback }) {
  const update = {
    $addToSet: {
      followers: { $each: userIds },
    },
  };

  updateObject({
    roomId,
    callback,
    update,
  });
}

/**
 * Create and save room.
 * @param {Object} params - Parameters.
 * @param {Object} params.room - New room.
 * @param {Function} params.callback - Callback.
 * @param {Object} [params.options] - Options.
 * @param {boolean} [params.silentExistsError] - Should error be skipped if the room already exists?
 */
function createRoom({
  room,
  silentExistsError,
  callback,
  options = {},
}) {
  const { setId, isFollower } = options;

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

      if (setId && roomToSave.objectId) {
        roomToSave._id = mongoose.Types.ObjectId(roomToSave.objectId); // eslint-disable-line no-underscore-dangle
      }

      dbConnector.saveObject({
        object: new Room(roomToSave),
        objectType: 'room',
        callback: ({ error, data }) => {
          if (error) {
            callback({ error });

            return;
          }

          const createdRoom = cleanParameters(data.savedObject);

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
 * @param {Object} params - Parameters.
 * @param {string} params.roomId - ID of the room.
 * @param {Function} params.callback - Callback.
 * @param {boolean} [params.fullRemoval] - Should the room be removed from all users?
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
                userIds: usersData.users.map(user => user.objectId),
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
 * @param {Object} params - Parameters
 * @param {string[]} params.userIds - ID of the users to remove
 * @param {string} params.roomId - ID of the room
 * @param {Function} params.callback - Callback
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
 * Add access to the room for users and/or teams.
 * @param {Object} params - Parameters.
 * @param {string} params.roomId - ID of the room.
 * @param {Function} params.callback - Callback.
 * @param {string[]} [params.userIds] - ID of the users
 * @param {string[]} [params.teamIds] - ID of the teams
 * @param {string[]} [params.bannedIds] - ID of the blocked users
 * @param {string[]} [params.teamAdminIds] - Id of the teams to give admin access to. They will also be added to teamIds.
 * @param {string[]} [params.userAdminIds] - Id of the users to give admin access to. They will also be added to userIds.
 * @param {boolean} [params.isFollower] - Should the users be added to the follower list?
 */
function addAccess({
  userIds,
  teamIds,
  bannedIds,
  teamAdminIds,
  userAdminIds,
  roomId,
  callback,
  isFollower,
}) {
  dbConnector.addObjectAccess({
    userIds,
    teamIds,
    bannedIds,
    teamAdminIds,
    userAdminIds,
    objectId: roomId,
    object: Room,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      if (isFollower && userIds && userIds.length > 0) {
        addFollowers({
          roomId,
          userIds,
          callback: (roomData) => {
            if (roomData.error) {
              callback({ error: roomData.error });

              return;
            }

            callback({ room: cleanParameters(roomData.data.object) });
          },
        });

        return;
      }

      callback({ room: cleanParameters(data.object) });
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
 * @param {string[]} [params.teamAdminIds] - Id of the teams to give admin access to. They will also be added to teamIds.
 * @param {string[]} [params.userAdminIds] - Id of the users to give admin access to. They will also be added to userIds.
 * @param {Function} params.callback - Callback
 */
function removeAccess({
  userIds,
  teamIds,
  bannedIds,
  roomId,
  teamAdminIds,
  userAdminIds,
  callback,
}) {
  dbConnector.removeObjectAccess({
    teamAdminIds,
    userAdminIds,
    userIds,
    teamIds,
    bannedIds,
    objectId: roomId,
    callback: ({ error }) => {
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

          callback({
            data: {
              room: cleanParameters(roomData.data.object),
            },
          });
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
 * Get room by Id.
 * @param {Object} params - Parameters.
 * @param {string} params.roomId - I of the room.
 * @param {Function} params.callback - Callback.
 */
function getRoomById({ roomId, callback }) {
  getRoom({
    callback,
    query: { _id: roomId },
  });
}

/**
 * Get rooms by Ids
 * @param {Object} params - Parameters.
 * @param {string[]} params.roomIds - Ids of the rooms.
 * @param {Function} params.callback - Callback.
 */
function getRoomsByIds({ roomIds, callback }) {
  getRooms({
    callback,
    query: { _id: { $in: roomIds } },
  });
}

/**
 * Get rooms that the user has access to.
 * @param {Object} params - Parameters.
 * @param {Object} params.user - User retrieving the rooms.
 * @param {Function} params.callback - Callback.
 * @param {boolean} [params.full] - Should access information be retrieved?
 */
function getRoomsByUser({
  user,
  callback,
  full,
}) {
  const query = dbConnector.createUserQuery({ user });
  const filter = !full ? roomFilter : {};

  getRooms({
    filter,
    callback,
    query,
  });
}

/**
 * Get whisper room.
 * @param {Object} params - Parameters.
 * @param {string} params.participantIds - Id of the users.
 * @param {Function} params.callback - Callback.
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
 * Get all rooms
 * @param {Object} params - Parameters.
 * @param {Function} params.callback - Callback.
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
 * @param {Object} params - Parameters.
 * @param {Object} params.rooms - Rooms to be added.
 * @param {Function} params.callback - Callback.
 */
function populateDbRooms({ rooms, callback = () => {} }) {
  console.info('Creating default rooms, if needed');

  /**
   * Adds a room to database. Recursive.
   * @param {string[]} roomNames - Room names.
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
exports.addAccess = addAccess;
exports.removeAccess = removeAccess;
exports.updateRoom = updateRoom;
exports.getRoomById = getRoomById;
exports.doesRoomExist = doesRoomExist;
exports.getWhisperRoom = getWhisperRoom;
exports.addFollowers = addFollowers;
exports.removeFollowers = removeFollowers;
exports.getRoomsByUser = getRoomsByUser;
exports.getRoomsByIds = getRoomsByIds;
exports.getAllRooms = getAllRooms;
