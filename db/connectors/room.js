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
const chatHistoryConnector = require('./chatHistory');
const dbUser = require('./user');
const errorCreator = require('../../objects/error/errorCreator');
const dbConfig = require('../../config/defaults/config').databasePopulation;
const winston = require('winston');
const appConfig = require('../../config/defaults/config').app;

const roomSchema = new mongoose.Schema({
  accessLevel: { type: Number, default: dbConfig.AccessLevels.BASIC },
  visibility: { type: Number, default: dbConfig.AccessLevels.BASIC },
  anonymous: { type: Boolean, default: false },
  roomName: { type: String, unique: true },
  isWhisper: { type: Boolean, default: false },
  password: String,
  admins: [String],
  bannedUsers: [String],
  owner: String,
  team: String,
  accessUsers: { type: [String], default: [] },
}, { collection: 'rooms' });

const Room = mongoose.model('Room', roomSchema);

/**
 * Remove private parameters from room
 * @param {Object} params.room Room
 * @returns {Object} Clean room
 */
function cleanRoomParameters({ room }) {
  const cleanRoom = room;

  cleanRoom.password = typeof room.password === 'string';

  return cleanRoom;
}

/**
 * Authorize the user to the room
 * Checks if the user is the owner, if the user has the same team and high enough access level or if user is in accessUsers
 * @param {Object} params.user User to authorize
 * @param {string} params.roomName Name of the room
 * @param {string} [params.password] Password of the room
 * @param {Function} params.callback Callback
 */
function authUserToRoom({ user, roomName, callback, password }) {
  const query = {
    roomName,
  };

  if (roomName.indexOf(appConfig.teamAppend) > -1) {
    query.team = user.team;
  } else {
    query.$or = [
      { owner: user.userName },
      { accessUsers: { $in: [user.userName] } },
      { password, accessLevel: { $lte: user.accessLevel } },
      { password: { $exists: false }, accessLevel: { $lte: user.accessLevel } },
    ];
  }

  Room.findOne(query).lean().exec((err, foundRoom) => {
    if (err) {
      callback({ error: new errorCreator.Database({ errorObject: err, name: 'authUserToRoom' }) });

      return;
    }

    console.log('sent user', user);
    console.log('sent roomname', roomName);
    console.log('sent password', password);
    console.log('found', foundRoom);

    if (!foundRoom) {
      callback({ data: { isAllowed: false } });

      return;
    }

    callback({ data: { room: foundRoom, isAllowed: true } });
  });
}

/**
 * Create and save room
 * @param {Object} params.room New room
 * @param {boolean} params.silentOnExists Should error on exists be skipped?
 * @param {Function} params.callback Callback
 */
function createRoom({ room, silentOnExists, callback }) {
  const newRoom = new Room(room);
  const query = { roomName: room.roomName };

  Room.findOne(query).lean().exec((err, foundRoom) => {
    if (err) {
      callback({ error: new errorCreator.Database({ errorObject: err, name: 'createRoom' }) });

      return;
    } else if (foundRoom) {
      if (!silentOnExists) {
        callback({ error: new errorCreator.AlreadyExists({ name: `room ${room.roomName}` }) });
      } else {
        callback({ data: { alreadyExists: true } });
      }

      return;
    }

    chatHistoryConnector.createHistory({
      roomName: room.roomName,
      anonymous: room.anonymous,
      isWhisper: room.isWhisper,
      callback: ({ error }) => {
        if (error) {
          callback({ error });

          return;
        }

        databaseConnector.saveObject({
          object: newRoom,
          objectType: 'room',
          callback: (savedData) => {
            if (savedData.error) {
              callback({ error: savedData.error });

              return;
            }

            callback({ data: { room: cleanRoomParameters({ room: savedData.data.savedObject }) } });
          },
        });
      },
    });
  });
}

/**
 * Get room
 * @param {string} params.roomName Name of the room
 * @param {Function} params.callback Callback
 */
function getRoom({ roomName, callback }) {
  const query = { roomName };

  Room.findOne(query).lean().exec((err, room) => {
    if (err) {
      callback({ error: new errorCreator.Database({ errorObject: err, name: 'getRoom' }) });

      return;
    } else if (!room) {
      callback({ error: new errorCreator.DoesNotExist({ name: `room ${roomName}` }) });

      return;
    }

    callback({ data: { room: cleanRoomParameters({ room }) } });
  });
}

/**
 * Get rooms owned by user
 * @param {Object} params.user Owner
 * @param {Function} params.callback Callback
 */
function getOwnedRooms({ user, callback }) {
  const query = { owner: user.userName };
  const sort = { roomName: 1 };

  Room.find(query).sort(sort).lean().exec((err, rooms = []) => {
    if (err) {
      callback({ error: new errorCreator.Database({ errorObject: err, name: 'getOwnedRooms' }) });

      return;
    }

    callback({ data: { rooms: rooms.map(room => cleanRoomParameters({ room })) } });
  });
}

/**
 * Get all rooms, based on user's access level
 * @param {Object} params.user User retrieving the rooms
 * @param {Function} params.callback Callback
 */
function getAllRooms({ user, callback }) {
  const query = { visibility: { $lte: user.accessLevel } };
  const sort = { roomName: 1 };

  Room.find(query).sort(sort).lean().exec((err, foundRooms = []) => {
    if (err) {
      callback({ error: new errorCreator.Database({ errorObject: err, name: 'getAllRooms' }) });

      return;
    }

    const whisperRooms = [];
    const rooms = foundRooms.filter((room) => {
      const cleanRoom = cleanRoomParameters({ room });

      if (cleanRoom.isWhisper) {
        whisperRooms.push(cleanRoom);

        return false;
      }

      return true;
    });

    callback({
      data: {
        rooms,
        whisperRooms,
      },
    });
  });
}

/**
 * Ban user from room
 * @param {string} params.userName Name of the user
 * @param {string} params.roomName Name of the room
 * @param {Function} params.callback Callback
 */
function banUserFromRoom({ userName, roomName, callback }) {
  const query = { roomName };
  const update = { $addToSet: { bannedUsers: userName } };

  Room.findOneAndUpdate(query, update).lean().exec((err, room) => {
    if (err) {
      callback({ error: new errorCreator.Database({ errorObject: err, name: 'banUserFromRoom' }) });

      return;
    } else if (!room) {
      callback({ error: new errorCreator.DoesNotExist({ name: `room ${roomName}` }) });

      return;
    }

    callback({ data: { room: cleanRoomParameters({ room }) } });
  });
}

/**
 * Unban user from room
 * @param {string} params.userName Name of the user
 * @param {string} params.roomName Name of the room
 * @param {Function} params.callback Callback
 */
function unbanUserFromRoom({ userName, roomName, callback }) {
  const query = { roomName };
  const update = { $pull: { bannedUsers: userName } };

  Room.findOneAndUpdate(query, update).lean().exec((err, room) => {
    if (err) {
      callback({ error: new errorCreator.Database({ errorObject: err, name: 'unbanuserFromRoom' }) });

      return;
    } else if (!room) {
      callback({ error: new errorCreator.DoesNotExist({ name: `room ${roomName}` }) });

      return;
    }

    callback({ data: { room: cleanRoomParameters({ room }) } });
  });
}

/**
 * Remove room
 * @param {string} params.roomName Name of the room
 * @param {Function} params.callback Callback
 */
function removeRoom({ roomName, callback }) {
  const query = { roomName };

  Room.findOneAndRemove(query).lean().exec((err) => {
    if (err) {
      callback({ error: new errorCreator.Database({ errorObject: err, name: 'removeRoom' }) });

      return;
    }

    chatHistoryConnector.removeHistory({
      roomName,
      callback: ({ error }) => {
        if (error) {
          callback({ error });

          return;
        }

        dbUser.removeRoomFromAllUsers({
          roomName,
          callback: ({ error: userError }) => {
            if (userError) {
              callback({ error: userError });

              return;
            }

            callback({ data: { success: true } });
          },
        });
      },
    });
  });
}

/**
 * Match partial room name
 * @param {string} params.partialName Partial room name
 * @param {Object} params.user User
 * @param {Function} params.callback Callback
 */
function matchPartialRoom({ partialName, user, callback }) {
  const filter = { _id: 0, roomName: 1 };
  const sort = { roomName: 1 };

  databaseConnector.matchPartial({
    filter,
    sort,
    partialName,
    user,
    callback,
    queryType: Room,
    type: 'roomName',
  });
}

/**
 * Add rooms to db
 * @param {Object} params.rooms Rooms to be added
 * @param {Function} params.callback Callback
 */
function populateDbRooms({ rooms, callback = () => {} }) {
  winston.info('Creating default rooms, if needed');

  /**
   * Adds a room to database. Recursive
   * @param {string[]} roomNames Room names
   */
  function addRoom(roomNames) {
    const roomName = roomNames.shift();

    if (roomName) {
      createRoom({
        room: rooms[roomName],
        silentOnExists: true,
        callback: ({ error }) => {
          if (error) {
            callback({ error });

            return;
          }

          addRoom(roomNames);
        },
      });
    } else {
      callback({ data: { success: true } });
    }
  }

  addRoom(Object.keys(rooms));
}

/**
 * Set new room visibiity
 * @param {string} params.roomName Name of the room
 * @param {number} params.visibility New visibility
 * @param {Function} params.callback Callback
 */
function updateRoomVisibility({ roomName, visibility, callback }) {
  const query = { roomName };
  const update = { $set: { visibility } };
  const options = { new: true };

  Room.findOneAndUpdate(query, update, options).lean().exec((err, room) => {
    if (err) {
      callback({ error: new errorCreator.Database({ errorObject: err, name: 'updateRoomVisibility' }) });

      return;
    }

    callback({ data: { room: cleanRoomParameters({ room }) } });
  });
}

/**
 * Set new room access level
 * @param {string} params.roomName Name of the room
 * @param {number} params.accessLevel New access level
 * @param {Function} params.callback Callback
 */
function updateRoomAccessLevel({ roomName, accessLevel, callback }) {
  const query = { roomName };
  const update = { $set: { accessLevel } };
  const options = { new: true };

  Room.findOneAndUpdate(query, update, options).lean().exec((err, room) => {
    if (err) {
      callback({ error: new errorCreator.Database({ errorObject: err, name: 'updateRoomAccessLevel' }) });

      return;
    }

    callback({ data: { room: cleanRoomParameters({ room }) } });
  });
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
exports.updateRoomVisibility = updateRoomVisibility;
exports.updateRoomAccessLevel = updateRoomAccessLevel;
