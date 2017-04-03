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

const dbTransaction = require('../../db/connectors/transaction');
const dbWallet = require('../../db/connectors/wallet');
const databasePopulation = require('../../config/defaults/config').databasePopulation;
const manager = require('../../socketHelpers/manager');
const objectValidator = require('../../utils/objectValidator');
const errorCreator = require('../../objects/error/errorCreator');
const dbUser = require('../../db/connectors/user');

/**
 * @param {object} socket - Socket.IO socket
 * @param {object} io - Socket.io io
 */
function handle(socket, io) {
  socket.on('getWallet', (params, callback = () => {}) => {
    manager.userIsAllowed(socket.id, databasePopulation.commands.getWallet.commandName, (allowErr, allowed, user) => {
      if (allowErr || !allowed || !user) {
        callback({ err: new errorCreator.Database() });

        return;
      }

      dbWallet.getWallet(user.userName, (err, wallet) => {
        if (err) {
          callback({ err: new errorCreator.Database() });

          return;
        }

        callback({ data: { wallet } });
      });
    });
  });

  socket.on('getAllTransactions', (params, callback = () => {}) => {
    manager.userIsAllowed(socket.id, databasePopulation.commands.getWallet.commandName, (allowErr, allowed, user) => {
      if (allowErr || !allowed || !user) {
        callback({ err: new errorCreator.Database() });

        return;
      }

      dbTransaction.getAllUserTransactions(user.userName, (err, transactions) => {
        if (err) {
          callback({ err: new errorCreator.Database() });

          return;
        }

        const data = {};

        if (transactions && transactions.length > 0) {
          data.toTransactions = transactions.filter(transaction => transaction.to === user.userName);
          data.fromTransactions = transactions.filter(transaction => transaction.from === user.userName);
        } else {
          data.toTransactions = [];
          data.fromTransactions = [];
        }

        callback({ data });
      });
    });
  });

  socket.on('createTransaction', ({ transaction }, callback = () => {}) => {
    if (!objectValidator.isValidData({ transaction }, { transaction: { to: true, amount: true } })) {
      callback({ error: {} });

      return;
    }

    manager.userIsAllowed(socket.id, databasePopulation.commands.getWallet.commandName, (allowErr, allowed, user) => {
      if (allowErr || !allowed || !user) {
        callback({ error: new errorCreator.Database() });

        return;
      }

      transaction.from = user.userName;
      transaction.time = new Date();

      dbTransaction.createTransaction(transaction, (transErr) => {
        if (transErr) {
          callback({ error: new errorCreator.Database() });

          return;
        }

        dbWallet.decreaseAmount(user.userName, user.accessLevel, transaction.from, transaction.amount, (errDecrease) => {
          if (errDecrease) {
            callback({ error: new errorCreator.Database() });

            return;
          }

          dbWallet.increaseAmount(transaction.to, transaction.amount, (err) => {
            if (err) {
              callback({ error: new errorCreator.Database() });

              return;
            }

            callback({ data: { transaction } });

            dbUser.getUserByAlias(transaction.to, (aliasErr, receiver) => {
              if (aliasErr) {
                return;
              }

              if (receiver.socketId !== '') {
                io.to(receiver.socketId).emit('transaction', { transaction });
              }
            });
          });
        });
      });
    });
  });
}

exports.handle = handle;
