'use strict';

const gameCodeManager = require('../../managers/gameCodes');

/* eslint-disable no-param-reassign */

/**
 * @param {object} socket Socket.Io socket.
 * @param {object} io Socket.Io.
 */
function handle(socket, io) {
  socket.on('createGameCode', (params, callback = () => {
  }) => {
    params.callback = callback;
    params.io = io;
    params.socket = socket;

    gameCodeManager.createGameCode(params);
  });

  socket.on('updateGameCode', (params, callback = () => {
  }) => {
    params.callback = callback;
    params.io = io;
    params.socket = socket;

    gameCodeManager.updateGameCode(params);
  });

  socket.on('removeGameCode', (params, callback = () => {
  }) => {
    params.callback = callback;
    params.io = io;
    params.socket = socket;

    gameCodeManager.removeGameCode(params);
  });

  socket.on('getGameCode', (params, callback = () => {
  }) => {
    params.callback = callback;
    params.io = io;
    params.socket = socket;

    gameCodeManager.getGameCodeById(params);
  });

  socket.on('getGameCodes', (params, callback = () => {
  }) => {
    params.callback = callback;
    params.io = io;
    params.socket = socket;

    gameCodeManager.getGameCodesByUser(params);
  });

  socket.on('useGameCode', (params, callback = () => {
  }) => {
    params.callback = callback;
    params.io = io;
    params.socket = socket;

    gameCodeManager.useGameCode(params);
  });
}

export { handle };
