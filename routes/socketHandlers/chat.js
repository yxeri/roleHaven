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

const roomManager = require('../../managers/rooms');
const messenger = require('../../helpers/messenger');
const authenticator = require('../../helpers/authenticator');
const dbConfig = require('../../config/defaults/config').databasePopulation;

/**
 * @param {object} socket - Socket.IO socket
 * @param {object} io - Socket.IO
 */
function handle(socket, io) {
  socket.on('chatMsg', ({ message, image, token }, callback = () => {}) => {
    messenger.sendChatMsg({
      callback,
      io,
      socket,
      image,
      message,
      token,
    });
  });
  socket.on('whisperMsg', ({ message, token }, callback = () => {}) => {
    messenger.sendWhisperMsg({
      socket,
      callback,
      io,
      message,
      token,
    });
  });
  socket.on('broadcastMsg', ({ message, token }, callback = () => {}) => {
    messenger.sendBroadcastMsg({
      token,
      socket,
      io,
      callback,
      message,
    });
  });
  socket.on('createRoom', ({ room, token }, callback = () => {}) => {
    roomManager.createRoom({
      room,
      token,
      socket,
      io,
      callback,
    });
  });
  socket.on('authUserToRoom', ({ room, token }, callback = () => {}) => {
    authenticator.isUserAllowed({
      token,
      commandName: dbConfig.apiCommands.GetRoom.name,
      callback: ({ error, data }) => {
        if (error) {
          callback({ error });

          return;
        }

        roomManager.authUserToRoom({
          room,
          callback,
          user: data.user,
        });
      },
    });
  });
  socket.on('follow', ({ room, token }, callback = () => {}) => {
    roomManager.followRoom({
      token,
      socket,
      io,
      room,
      callback,
    });
  });
  socket.on('unfollow', ({ room, isWhisperRoom, token }, callback = () => {}) => {
    roomManager.unfollowRoom({
      token,
      room,
      isWhisperRoom,
      socket,
      io,
      callback,
    });
  });
  socket.on('getRooms', ({ token }, callback = () => {}) => {
    roomManager.getRooms({
      token,
      socket,
      callback,
    });
  });
  socket.on('getHistory', ({ room, token }, callback = () => {}) => {
    roomManager.getHistory({
      token,
      callback,
      socket,
      io,
      rooms: [room.roomName],
    });
  });
  socket.on('removeRoom', ({ room, token }, callback = () => {}) => {
    roomManager.removeRoom({
      room,
      token,
      socket,
      io,
      callback,
    });
  });
  socket.on('matchPartialMyRoom', ({ partialName, token }, callback = () => {}) => {
    roomManager.matchMyPartialRoomName({
      token,
      callback,
      partialName,
    });
  });
  socket.on('matchPartialRoom', ({ partialName, token }, callback = () => {}) => {
    roomManager.matchMyPartialRoomName({
      token,
      partialName,
      callback,
    });
  });
  socket.on('getRoom', ({ roomName, token }, callback = () => {}) => {
    roomManager.getRoom({
      token,
      roomName,
      callback,
    });
  });
}

exports.handle = handle;
