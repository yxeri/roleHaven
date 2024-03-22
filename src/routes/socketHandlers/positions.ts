'use strict';

import positionManager from '../../managers/positions';

/* eslint-disable no-param-reassign */

/**
 * @param {object} socket Socket.Io socket.
 * @param {object} io Socket.Io.
 */
function handle(socket, io) {
  socket.on('createPosition', (params, callback = () => {
  }) => {
    params.callback = callback;
    params.io = io;
    params.socket = socket;

    positionManager.createPosition(params);
  });

  socket.on('updatePosition', (params, callback = () => {
  }) => {
    params.callback = callback;
    params.io = io;
    params.socket = socket;

    positionManager.updatePosition(params);
  });

  socket.on('removePosition', (params, callback = () => {
  }) => {
    params.callback = callback;
    params.io = io;
    params.socket = socket;

    positionManager.removePosition(params);
  });

  socket.on('getPosition', (params, callback = () => {
  }) => {
    params.callback = callback;
    params.io = io;
    params.socket = socket;

    positionManager.getPositionById(params);
  });

  socket.on('getPositions', (params, callback = () => {
  }) => {
    params.callback = callback;
    params.io = io;
    params.socket = socket;

    positionManager.getPositionsByUser(params);
  });

  socket.on('getAndStoreGooglePositions', (params, callback = () => {
  }) => {
    params.callback = callback;
    params.io = io;
    params.socket = socket;

    positionManager.getAndStoreGooglePositions(params);
  });
}

export { handle };
