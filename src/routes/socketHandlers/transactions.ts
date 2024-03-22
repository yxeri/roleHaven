'use strict';

const transactionManager = require('../../managers/transactions');

/* eslint-disable no-param-reassign */

/**
 * @param {object} socket Socket.Io socket.
 * @param {object} io Socket.Io.
 */
function handle(socket, io) {
  socket.on('createTransaction', (params, callback = () => {
  }) => {
    params.callback = callback;
    params.io = io;
    params.socket = socket;

    transactionManager.createTransaction(params);
  });

  socket.on('updateTransaction', (params, callback = () => {
  }) => {
    params.callback = callback;
    params.io = io;
    params.socket = socket;

    transactionManager.updateTransaction(params);
  });

  socket.on('removeTransaction', (params, callback = () => {
  }) => {
    params.callback = callback;
    params.io = io;
    params.socket = socket;

    transactionManager.removeTransaction(params);
  });

  socket.on('getTransaction', (params, callback = () => {
  }) => {
    params.callback = callback;
    params.io = io;
    params.socket = socket;

    transactionManager.getTransactionById(params);
  });

  socket.on('getTransactions', (params, callback = () => {
  }) => {
    params.callback = callback;
    params.io = io;
    params.socket = socket;

    transactionManager.getTransactionsByUser(params);
  });

  socket.on('getTransactionsByWallet', (params, callback = () => {
  }) => {
    params.callback = callback;
    params.io = io;
    params.socket = socket;

    transactionManager.getTransactionsByWallet(params);
  });
}

export { handle };
