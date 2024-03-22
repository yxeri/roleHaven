'use strict';

const aliasManager = require('../../managers/aliases');

/* eslint-disable no-param-reassign */

/**
 * @param {object} socket Socket.Io socket.
 * @param {object} io Socket.Io.
 */
function handle(socket, io) {
  socket.on('createAlias', (params, callback = () => {
  }) => {
    params.callback = callback;
    params.io = io;
    params.socket = socket;
    aliasManager.createAlias(params);
  });

  socket.on('updateAlias', (params, callback = () => {
  }) => {
    params.callback = callback;
    params.io = io;
    params.socket = socket;
    aliasManager.updateAlias(params);
  });

  socket.on('getAlias', (params, callback = () => {
  }) => {
    params.callback = callback;
    params.io = io;
    params.socket = socket;

    aliasManager.getAliasById(params);
  });

  socket.on('getAliases', (params, callback = () => {
  }) => {
    params.callback = callback;
    params.io = io;
    params.socket = socket;
    aliasManager.getAliasesByUser(params);
  });
}

export { handle };
