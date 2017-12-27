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
const messageManager = require('../../managers/messages');

/**
 * @param {object} socket - Socket.Io socket.
 * @param {object} io - Socket.Io.
 */
function handle(socket, io) {
  socket.on('chatMsg', ({
    message,
    image,
    token,
  }, callback = () => {}) => {
    messageManager.sendChatMsg({
      callback,
      image,
      io,
      socket,
      message,
      token,
    });
  });

  socket.on('whisperMsg', ({
    participantIds,
    message,
    token,
    image,
  }, callback = () => {}) => {
    messageManager.sendWhisperMsg({
      socket,
      callback,
      io,
      message,
      token,
      image,
      participantIds,
    });
  });

  socket.on('broadcastMsg', ({
    message,
    image,
    token,
  }, callback = () => {}) => {
    messageManager.sendBroadcastMsg({
      token,
      image,
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

  socket.on('follow', ({ user, room, token }, callback = () => {}) => {
    roomManager.followRoom({
      token,
      socket,
      io,
      room,
      user,
      callback,
    });
  });

  socket.on('unfollow', ({
    userId,
    roomId,
    token,
  }, callback = () => {}) => {
    roomManager.unfollowRoom({
      token,
      userId,
      roomId,
      socket,
      io,
      callback,
    });
  });

  socket.on('getRooms', ({ userId, token }, callback = () => {}) => {
    roomManager.getRoomsByUser({
      token,
      socket,
      userId,
      callback,
    });
  });

  socket.on('getHistory', ({
    roomId,
    token,
    startDate,
    shouldGetFuture,
  }, callback = () => {}) => {
    messageManager.getMessagesByRoom({
      token,
      callback,
      roomId,
      startDate,
      shouldGetFuture,
    });
  });

  socket.on('removeRoom', ({
    roomId,
    token,
    userId,
  }, callback = () => {}) => {
    roomManager.removeRoom({
      roomId,
      userId,
      token,
      socket,
      io,
      callback,
    });
  });

  socket.on('getRoom', ({
    userId,
    roomId,
    token,
  }, callback = () => {}) => {
    roomManager.getRoom({
      token,
      roomId,
      userId,
      callback,
    });
  });
}

exports.handle = handle;
