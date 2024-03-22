'use strict';

const walletManager = require('../../managers/wallets');

/* eslint-disable no-param-reassign */

/**
 * @param {object} socket Socket.Io socket.
 * @param {object} io Socket.Io.
 */
function handle(socket, io) {
  socket.on('updateWallet', (params, callback = () => {
  }) => {
    params.callback = callback;
    params.io = io;
    params.socket = socket;

    walletManager.updateWallet(params);
  });

  socket.on('getWallet', (params, callback = () => {
  }) => {
    params.callback = callback;
    params.io = io;
    params.socket = socket;

    walletManager.getWalletById(params);
  });

  socket.on('getWallets', (params, callback = () => {
  }) => {
    params.callback = callback;
    params.io = io;
    params.socket = socket;

    walletManager.getWalletsByUser(params);
  });
}

export { handle };
