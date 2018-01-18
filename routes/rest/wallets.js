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

const express = require('express');
const objectValidator = require('../../utils/objectValidator');
const walletManager = require('../../managers/wallets');
const transactionManager = require('../../managers/transactions');
const restErrorChecker = require('../../helpers/restErrorChecker');
const errorCreator = require('../../objects/error/errorCreator');

const router = new express.Router();

/**
 * @param {Object} io Socket io
 * @returns {Object} Router
 */
function handle(io) {
  /**
   * @api {get} /wallets/ Get wallets
   * @apiVersion 8.0.0
   * @apiName GetWallets
   * @apiGroup Wallets
   *
   * @apiHeader {string} Authorization Your JSON Web Token.
   *
   * @apiDescription Get wallets by user.
   *
   * @apiParam {Object} data
   * @apiParam {string} data.userId Id of the user retrieving the wallets.
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object[]} data.wallets Found wallets.
   */
  router.get('/', (request, response) => {
    if (!objectValidator.isValidData(request.body, { data: { userId: true } })) {
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: 'params = { userId }' }) });

      return;
    }

    const { authorization: token } = request.params;
    const userId = request.body.data;

    walletManager.getWalletsByUser({
      userId,
      token,
      callback: ({ error, data }) => {
        if (error) {
          restErrorChecker.checkAndSendError({ response, error, sentData: request.body.data });

          return;
        }

        response.json({ data });
      },
    });
  });

  /**
   * @api {put} /wallets/:walletId/ Update a wallet.
   * @apiVersion 8.0.0
   * @apiName UpdateWallet
   * @apiGroup Wallets
   *
   * @apiHeader {string} Authorization Your JSON Web Token
   *
   * @apiDescription Update a wallet.
   *
   * @apiParam {string} walletId Id of the wallet to update.
   *
   * @apiParam {Object} data
   * @apiParam {number} data.amount Amount to increase or decrease with.
   * @apiParam {Object} data.options Update options.
   * @apiParam {boolean} data.options.shouldDecreaseAmount Should the wallet be decreased by the amount sent.
   * @apiParam {boolean} data.options.resetAmount Should the wallet amount be set to 0?
   * @apiParam {boolean} params.options.resetOwnerAliasId Should owner alias Id be removed?
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object} data.wallet Updated wallet.
   */
  router.post('/:walletId', (request, response) => {
    if (!objectValidator.isValidData(request.params, { walletId: true })) {
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: 'params = { walletId }' }) });

      return;
    }

    const { walletId } = request.params;
    const { wallet } = request.body.data;
    const { authorization: token } = request.headers;

    walletManager.updateWallet({
      wallet,
      walletId,
      token,
      io,
      callback: ({ error, data }) => {
        if (error) {
          restErrorChecker.checkAndSendError({ response, error, sentData: request.body.data });

          return;
        }

        response.json({ data });
      },
    });
  });

  /**
   * @api {get} /wallets/:walletId/transactions Get transactions from wallet.
   * @apiVersion 8.0.0
   * @apiName GetTransactions
   * @apiGroup Transactions
   *
   * @apiHeader {string} Authorization Your JSON Web Token.
   *
   * @apiDescription Get transactions from wallet
   *
   * @apiParam {string} walletId [Url] Id of the wallet to retrieve transactions from.
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Transaction[]} data.toTransactions Transactions with the retrieved wallet being the receiver.
   * @apiSuccess {Transaction[]} data.fromTransactions Transactions made from other wallets to the retrieved one.
   */
  router.get('/:walletId/transactions', (request, response) => {
    if (!objectValidator.isValidData(request.params, { walletId: true })) {
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: 'params = { walletId }' }) });

      return;
    }

    const { walletId } = request.params;
    const { userId } = request.body.data;
    const { authorization: token } = request.headers;

    transactionManager.getTransactionsByWallet({
      walletId,
      token,
      userId,
      callback: ({ error, data }) => {
        if (error) {
          restErrorChecker.checkAndSendError({ response, error, sentData: request.body.data });

          return;
        }

        response.json({ data });
      },
    });
  });

  return router;
}

module.exports = handle;
