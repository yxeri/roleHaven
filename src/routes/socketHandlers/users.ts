'use strict';

import userManager from '../../managers/users';

/* eslint-disable no-param-reassign */

/**
 * @param {object} socket Socket.Io socket.
 * @param {object} io Socket.Io.
 */
function handle(socket, io) {
  socket.on('createUser', (params, callback = () => {
  }) => {
    params.callback = callback;
    params.io = io;
    params.socket = socket;
    userManager.createUser(params);
  });

  socket.on('updateUser', (params, callback = () => {
  }) => {
    params.callback = callback;
    params.io = io;
    params.socket = socket;
    userManager.updateUser(params);
  });

  socket.on('getUser', (params, callback = () => {
  }) => {
    params.callback = callback;
    params.io = io;
    params.socket = socket;
    userManager.getUserById(params);
  });

  socket.on('getUsers', (params, callback = () => {
  }) => {
    params.callback = callback;
    params.io = io;
    params.socket = socket;
    userManager.getUsersByUser(params);
  });

  socket.on('updateId', (params, callback = () => {
  }) => {
    params.callback = callback;
    params.io = io;
    params.socket = socket;

    userManager.updateId(params);
  });

  socket.on('banUser', (params, callback = () => {
  }) => {
    params.callback = callback;
    params.io = io;
    params.socket = socket;

    userManager.banUser(params);
  });

  socket.on('unbanUser', (params, callback = () => {
  }) => {
    params.callback = callback;
    params.io = io;
    params.socket = socket;

    userManager.unbanUser(params);
  });

  socket.on('verifyUser', (params, callback = () => {
  }) => {
    params.callback = callback;
    params.io = io;
    params.socket = socket;

    userManager.verifyUser(params);
  });

  socket.on('changePassword', (params, callback = () => {
  }) => {
    params.callback = callback;
    params.io = io;
    params.socket = socket;

    userManager.changePassword(params);
  });
}

export { handle };
