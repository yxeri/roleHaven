'use strict';

import simpleMsgManager from '../../managers/simpleMsgs';

/* eslint-disable no-param-reassign */

/**
 * @param {object} socket Socket.Io socket.
 * @param {object} io Socket.Io.
 */
function handle(socket, io) {
  socket.on('sendSimpleMsg', (params, callback = () => {
  }) => {
    params.callback = callback;
    params.io = io;
    params.socket = socket;

    simpleMsgManager.sendSimpleMsg(params);
  });

  socket.on('updateSimpleMsg', (params, callback = () => {
  }) => {
    params.callback = callback;
    params.io = io;
    params.socket = socket;

    simpleMsgManager.updateSimpleMsg(params);
  });

  socket.on('removeSimpleMsg', (params, callback = () => {
  }) => {
    params.callback = callback;
    params.io = io;
    params.socket = socket;

    simpleMsgManager.removeSimpleMsg(params);
  });

  socket.on('getSimpleMsg', (params, callback = () => {
  }) => {
    params.callback = callback;
    params.io = io;
    params.socket = socket;

    simpleMsgManager.getSimpleMsgById(params);
  });

  socket.on('getSimpleMsgs', (params, callback = () => {
  }) => {
    params.callback = callback;
    params.io = io;
    params.socket = socket;

    simpleMsgManager.getSimpleMsgsByUser(params);
  });
}

export { handle };
