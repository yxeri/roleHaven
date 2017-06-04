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

const dbWallet = require('../../db/connectors/wallet');
const dbConfig = require('../../config/defaults/config').databasePopulation;
const appConfig = require('../../config/defaults/config').app;
const manager = require('../../socketHelpers/manager');
const objectValidator = require('../../utils/objectValidator');
const errorCreator = require('../../objects/error/errorCreator');

/**
 * @param {object} socket - Socket.IO socket
 * @param {object} io - Socket.io io
 */
function handle(socket, io) {
  socket.on('getWallet', ({ isTeam, token }, callback = () => {}) => {
    manager.userIsAllowed({
      token,
      commandName: dbConfig.commands.getWallet.commandName,
      callback: ({ error, allowedUser }) => {
        if (error) {
          callback({ error });

          return;
        } else if (isTeam && !allowedUser.team) {
          callback({ error: new errorCreator.DoesNotExist({ name: 'not part of team' }) });

          return;
        }

        const walletOwner = isTeam ? allowedUser.team + appConfig.teamAppend : allowedUser.userName;

        dbWallet.getWallet(walletOwner, (err, wallet) => {
          if (err) {
            callback({ error: new errorCreator.Database({}) });

            return;
          }

          callback({ data: { wallet } });
        });
      },
    });
  });

  socket.on('getAllTransactions', ({ isTeam, token }, callback = () => {}) => {
    manager.userIsAllowed({
      token,
      commandName: dbConfig.commands.getWallet.commandName,
      callback: ({ error, allowedUser }) => {
        if (error) {
          callback({ error });

          return;
        } else if (isTeam && !allowedUser.team) {
          callback({ error: new errorCreator.DoesNotExist({ name: 'not part of team' }) });

          return;
        }

        const owner = isTeam ? allowedUser.team + appConfig.teamAppend : allowedUser.userName;

        manager.getAllTransactions({
          owner,
          callback: (params) => {
            callback(params);
          },
        });
      },
    });
  });

  socket.on('createTransaction', ({ transaction, fromTeam, token }, callback = () => {}) => {
    if (!objectValidator.isValidData({ transaction }, { transaction: { to: true, amount: true } })) {
      callback({ error: new errorCreator.InvalidData({ expected: '{ transaction: { to, amount } }' }) });

      return;
    } else if (isNaN(transaction.amount)) {
      callback({ error: new errorCreator.Insufficient({ name: 'wallet' }) });

      return;
    }

    manager.userIsAllowed({
      token,
      socketId: socket.id,
      commandName: dbConfig.commands.getWallet.commandName,
      callback: ({ error, allowedUser }) => {
        if (error) {
          callback({ error });

          return;
        }

        manager.createTransaction({
          fromTeam,
          transaction,
          io,
          user: allowedUser,
          callback: (params) => {
            callback(params);
          },
        });
      },
    });
  });
}

exports.handle = handle;
