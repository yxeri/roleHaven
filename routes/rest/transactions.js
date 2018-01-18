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
const transactionManager = require('../../managers/transactions');
const restErrorChecker = require('../../helpers/restErrorChecker');
const errorCreator = require('../../objects/error/errorCreator');
const helper = require('./helper');

const router = new express.Router();

/**
 * @param {Object} io Socket io
 * @returns {Object} Router
 */
function handle(io) {
  /**
   * @api {post} /transactions Create a transaction
   * @apiVersion 8.0.0
   * @apiName CreateTransaction
   * @apiGroup Transactions
   *
   * @apiHeader {string} Authorization Your JSON Web Token.
   *
   * @apiDescription Create a transaction.
   *
   * @apiParam {Object} data
   * @apiParam {Transaction} data.transaction Transaction to create.
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Transaction} data.transaction Created transaction.
   * @apiSuccess {Wallet} data.wallet Updated sender wallet.
   */
  router.post('/', (request, response) => {
    if (!objectValidator.isValidData(request.body.data, { transaction: { toWalletId: true, fromWalletId: true, amount: true } })) {
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: 'data = { transaction: { toWalletId, fromWalletId, amount }' }), sentData: request.body.data });

      return;
    }

    const { transaction } = request.body.data;
    const { authorization: token } = request.headers;

    transactionManager.createTransactionBasedOnToken({
      io,
      transaction,
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
   * @api {get} /transactions/:transactionId Get a transaction
   * @apiVersion 8.0.0
   * @apiName GetTransaction
   * @apiGroup Transactions
   *
   * @apiHeader {string} Authorization Your JSON Web Token.
   *
   * @apiDescription Get a transaction that the user has access to.
   *
   * @apiParam {string} transactionId [Url] Id of the transaction to retrieve.
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Transaction} data.transaction Found transaction.
   */
  router.get('/:transactionId', (request, response) => {
    if (!objectValidator.isValidData(request.params, { transactionId: true })) {
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: 'params = { transactionId }' }) });

      return;
    }

    const { full } = request.query;
    const { transactionId } = request.params;
    const { authorization: token } = request.headers;

    transactionManager.getTransactionById({
      transactionId,
      token,
      full,
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
   * @api {get} /transactions/ Get transactions
   * @apiVersion 8.0.0
   * @apiName GetTransactions
   * @apiGroup Transactions
   *
   * @apiHeader {string} Authorization Your JSON Web Token.
   *
   * @apiDescription Get transactions. The default is to return all transactions made by the user. Setting walletId will instead retrieve all transactions connected to the wallet.
   *
   * @apiParam {boolean} [full] [Query] Should the complete object be retrieved?
   * @apiParam {string} [walletId] [Query] Id of the wallet to retrieve transactions from.
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Transaction[]} data.transactions Found transactions.
   */
  router.get('/', (request, response) => {
    helper.getTransactions({ request, response });
  });

  /**
   * @api {delete} /transactions/:transactionId Delete a transaction
   * @apiVersion 8.0.0
   * @apiName DeleteTransaction
   * @apiGroup Transactions
   *
   * @apiHeader {string} Authorization Your JSON Web Token.
   *
   * @apiDescription Delete a transaction.
   *
   * @apiParam {string} transactionId Id of the transaction to delete.
   *
   * @apiSuccess {Object} data
   * @apiSuccess {boolean} data.success Was it successfully deleted?
   */
  router.delete('/:transactionId', (request, response) => {
    if (!objectValidator.isValidData(request.params, { transactionId: true })) {
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: 'params = { transactionId }' }) });

      return;
    }

    const { transactionId } = request.params;
    const { authorization: token } = request.headers;

    transactionManager.removeTransaction({
      io,
      transactionId,
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
   * @api {put} /transactions/:transactionId Update a transaction
   * @apiVersion 8.0.0
   * @apiName UpdateTransaction
   * @apiGroup Transactions
   *
   * @apiHeader {string} Authorization Your JSON Web Token.
   *
   * @apiDescription Update a device.
   *
   * @apiParam {string} transactionId Id of the transaction to update.
   *
   * @apiParam {Object} data Body parameters.
   * @apiParam {Transaction} data.transaction Transaction parameters to update.
   * @apiParam {Object} [data.options] Update options.
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Transaction} data.transaction Updated transaction.
   */
  router.put('/:transactionId', (request, response) => {
    if (!objectValidator.isValidData(request.params, { transactionId: true })) {
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: 'params = { transactionId }' }) });

      return;
    } else if (!objectValidator.isValidData(request.body, { data: { transaction: true } })) {
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: 'data = { transaction }' }), sentData: request.body.data });

      return;
    }

    const {
      transaction,
      options,
    } = request.body.data;
    const { transactionId } = request.params;
    const { authorization: token } = request.headers;

    transactionManager.updateTransaction({
      transaction,
      options,
      io,
      transactionId,
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

  return router;
}

module.exports = handle;
