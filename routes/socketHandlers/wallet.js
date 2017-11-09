/*
 Copyright 2017 Aleksandar Jankovic

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

'use strict';

const walletManager = require('../../managers/wallets');
const transactionManager = require('../../managers/transactions');

/**
 * @param {object} socket - Socket.IO socket
 * @param {object} io - Socket.io io
 */
function handle(socket, io) {
  socket.on('getWallets', ({ username, token }, callback = () => {}) => {
    walletManager.getWallets({
      username,
      token,
      callback,
    });
  });

  socket.on('getTransactions', ({ owner, token }, callback = () => {}) => {
    transactionManager.getTransactions({
      owner,
      token,
      callback,
    });
  });

  socket.on('createTransaction', ({ transaction, fromTeam, toTeam, token }, callback = () => {}) => {
    transactionManager.createTransactionBasedOnToken({
      transaction,
      io,
      fromTeam,
      toTeam,
      token,
      socket,
      callback,
    });
  });
}

exports.handle = handle;
