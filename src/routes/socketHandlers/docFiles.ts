'use strict';

const docFileManager = require('../../managers/docFiles');

/* eslint-disable no-param-reassign */

/**
 * @param {object} socket Socket.Io socket.
 * @param {object} io Socket.Io.
 */
function handle(socket, io) {
  socket.on('createDocFile', (params, callback = () => {
  }) => {
    params.callback = callback;
    params.io = io;
    params.socket = socket;
    docFileManager.createDocFile(params);
  });

  socket.on('updateDocFile', (params, callback = () => {
  }) => {
    params.callback = callback;
    params.io = io;
    params.socket = socket;
    docFileManager.updateDocFile(params);
  });

  socket.on('removeDocFile', (params, callback = () => {
  }) => {
    params.callback = callback;
    params.io = io;
    params.socket = socket;
    docFileManager.removeDocFile(params);
  });

  socket.on('getDocFile', (params, callback = () => {
  }) => {
    params.callback = callback;
    params.io = io;
    params.socket = socket;
    docFileManager.getDocFile(params);
  });

  socket.on('getDocFiles', (params, callback = () => {
  }) => {
    params.callback = callback;
    params.io = io;
    params.socket = socket;
    docFileManager.getDocFilesByUser(params);
  });

  socket.on('unlockDocFile', (params, callback = () => {
  }) => {
    params.callback = callback;
    params.io = io;
    params.socket = socket;
    docFileManager.unlockDocFile(params);
  });
}

export { handle };
