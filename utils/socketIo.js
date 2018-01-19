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

/**
 * Get user's socket by socket ID.
 * @param {Object} params - Parameters.
 * @param {Object} params.io - Socket.io.
 * @param {string} params.socketId - ID of the socket.
 * @return {Object} - Socket.
 */
function getUserSocket({ io, socketId }) {
  return socketId ? io.sockets.connected[socketId] : undefined;
}

/**
 * Get all sockets from a room.
 * @return {Object[]} - All sockets in the room.
 */
function getSocketsByRoom({ io, roomId }) {
  const room = io.sockets.adapter.rooms[roomId];

  return room ? room.sockets : [];
}

/**
 * Join socket rooms.
 * @param {Object} params - Parameters.
 * @param {string[]} params.roomIds - ID of the rooms to join.
 * @param {Object} params.io - Socket.io.
 * @param {string} params.socketId - ID of the socket.
 * @return {Object} Socket.
 */
function joinRooms({ roomIds, io, socketId }) {
  const userSocket = getUserSocket({ io, socketId });

  if (userSocket) {
    roomIds.forEach(roomId => userSocket.join(roomId));
  }

  return userSocket;
}

/**
 * Leave socket rooms.
 * @param {Object} params - Parameters.
 * @param {string[]} params.roomIds - ID of the rooms to leave.
 * @param {Object} params.io - Socket.io.
 * @param {string} params.socketId - ID of the socket.
 * @return {Object} Socket.
 */
function leaveRooms({ roomIds, io, socketId }) {
  const userSocket = getUserSocket({ io, socketId });

  if (userSocket) {
    roomIds.forEach(roomId => userSocket.join(roomId));
  }

  return userSocket;
}

exports.getUserSocket = getUserSocket;
exports.getSocketsByRoom = getSocketsByRoom;
exports.joinRooms = joinRooms;
exports.leaveRooms = leaveRooms;
