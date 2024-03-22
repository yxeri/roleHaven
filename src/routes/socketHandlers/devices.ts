'use strict';

const deviceManager = require('../../managers/devices');

/* eslint-disable no-param-reassign */

/**
 * @param {object} socket Socket.Io socket.
 * @param {object} io Socket.Io.
 */
function handle(socket, io) {
  socket.on('createDevice', (params, callback = () => {
  }) => {
    params.callback = callback;
    params.io = io;
    params.socket = socket;
    deviceManager.createDevice(params);
  });

  socket.on('updateDevice', (params, callback = () => {
  }) => {
    params.callback = callback;
    params.io = io;
    params.socket = socket;
    deviceManager.updateDevice(params);
  });

  socket.on('removeDevice', (params, callback = () => {
  }) => {
    params.callback = callback;
    params.io = io;
    params.socket = socket;
    deviceManager.removeDevice(params);
  });

  socket.on('getDevice', (params, callback = () => {
  }) => {
    params.callback = callback;
    params.io = io;
    params.socket = socket;
    deviceManager.getDeviceById(params);
  });

  socket.on('getDevices', (params, callback = () => {
  }) => {
    params.callback = callback;
    params.io = io;
    params.socket = socket;
    deviceManager.getDevicesByUser(params);
  });
}

export { handle };
