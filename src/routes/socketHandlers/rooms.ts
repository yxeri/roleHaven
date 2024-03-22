'use strict';

import roomManager from '../../managers/rooms';

/* eslint-disable no-param-reassign */

/**
 * @param {object} socket Socket.Io socket.
 * @param {object} io Socket.Io.
 */
function handle(socket, io) {
  socket.on('createRoom', (params, callback = () => {
  }) => {
    params.callback = callback;
    params.io = io;
    params.socket = socket;

    roomManager.createRoom(params);
  });

  socket.on('removeRoom', (params, callback = () => {
  }) => {
    params.callback = callback;
    params.io = io;
    params.socket = socket;

    roomManager.removeRoom(params);
  });

  socket.on('updateRoom', (params, callback = () => {
  }) => {
    params.callback = callback;
    params.io = io;
    params.socket = socket;

    roomManager.updateRoom(params);
  });

  socket.on('followRoom', (params, callback = () => {
  }) => {
    params.callback = callback;
    params.io = io;
    params.socket = socket;

    roomManager.followRoom(params);
  });

  socket.on('unfollowRoom', (params, callback = () => {
  }) => {
    params.callback = callback;
    params.io = io;
    params.socket = socket;

    roomManager.unfollowRoom(params);
  });

  socket.on('getRoom', (params, callback = () => {
  }) => {
    params.callback = callback;
    params.io = io;
    params.socket = socket;

    roomManager.getRoomById(params);
  });

  socket.on('getRooms', (params, callback = () => {
  }) => {
    params.callback = callback;
    params.io = io;
    params.socket = socket;

    roomManager.getRoomsByUser(params);
  });

  socket.on('sendInvitationToRoom', (params, callback = () => {
  }) => {
    params.callback = callback;
    params.io = io;
    params.socket = socket;

    roomManager.sendInvitationToRoom(params);
  });

  socket.on('acceptRoomInvitation', (params, callback = () => {
  }) => {
    params.callback = callback;
    params.io = io;
    params.socket = socket;

    roomManager.acceptRoomInvitation(params);
  });

  socket.on('inviteToRoom', (params, callback = () => {
  }) => {
    params.callback = callback;
    params.io = io;
    params.socket = socket;

    roomManager.inviteToRoom(params);
  });
}

export { handle };
