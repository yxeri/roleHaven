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
   * @apiVersion 6.0.0
   * @apiName GetWallets
   * @apiGroup Wallets
   *
   * @apiHeader {String} Authorization Your JSON Web Token
   *
   * @apiDescription Get wallets that is owned by the user ot their team
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object} data.wallet Found wallets
   * @apiSuccessExample {json} Success-Response:
   *   {
   *    "data": {
   *      "wallets": [{
   *        "owner": "abc",
   *        "amount": 10,
   *        "isProtected": false,
   *        "accessLevel": 1
   *      }, {
   *        "owner": "qwer",
   *        "amount": 13,
   *        "isProtected": false,
   *        "accessLevel": 1
   *      }]
   *    }
   *  }
   */
  router.get('/', (request, response) => {
    walletManager.getWallets({
      token: request.headers.authorization,
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
   * @api {get} /wallets/:owner Get wallet by owner
   * @apiVersion 6.0.0
   * @apiName GetWallet
   * @apiGroup Wallets
   *
   * @apiHeader {String} Authorization Your JSON Web Token
   *
   * @apiDescription Get wallet by owner
   *
   * @apiParam {string} owner Name of the owner of the wallet
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object} data.wallet Found wallet
   * @apiSuccessExample {json} Success-Response:
   *   {
   *    "data": {
   *      "wallet": {
   *        "owner": "",
   *        "amount": 10,
   *        "isProtected": false,
   *        "accessLevel": 1
   *      }
   *    }
   *  }
   */
  router.get('/:owner', (request, response) => {
    if (!objectValidator.isValidData(request.params, { owner: true })) {
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: '' }), sentData: request.body.data });

      return;
    }

    walletManager.getWallet({
      owner: request.params.owner,
      token: request.headers.authorization,
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
   * @api {post} /wallets/:owner/increase Increase wallet amount
   * @apiVersion 6.0.0
   * @apiName IncreaseWalletAmount
   * @apiGroup Wallets
   *
   * @apiHeader {String} Authorization Your JSON Web Token
   *
   * @apiDescription Increase wallet amount
   *
   * @apiParam {String} owner Name of the owner of the wallet
   *
   * @apiParam {Object} data
   * @apiParam {Object} data.amount Amount to increase
   * @apiParamExample {json} Request-Example:
   *   {
   *    "data": {
   *      "amount": 8
   *    }
   *  }
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object} data.wallet Updated wallet
   * @apiSuccessExample {json} Success-Response:
   *   {
   *    "data": {
   *      "wallet": {
   *        "owner": "abc",
   *        "amount": 18,
   *        "isProtected": false,
   *        "accessLevel": 1
   *      }
   *    }
   *  }
   */
  router.post('/:owner/increase', (request, response) => {
    if (!objectValidator.isValidData(request.params, { owner: true })) {
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: '' }), sentData: request.body.data });

      return;
    } else if (!objectValidator.isValidData(request.body, { data: { amount: true } })) {
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: '' }), sentData: request.body.data });

      return;
    }

    walletManager.increaseWalletAmount({
      token: request.headers.authorization,
      amount: request.body.data.amount,
      owner: request.params.owner,
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
   * @api {post} /wallets/:owner/decrease Decrease wallet amount
   * @apiVersion 6.0.0
   * @apiName DecreaseWalletAmount
   * @apiGroup Wallets
   *
   * @apiHeader {String} Authorization Your JSON Web Token
   *
   * @apiDescription Decrease wallet amount
   *
   * @apiParam {String} owner Name of the owner of the wallet
   *
   * @apiParam {Object} data
   * @apiParam {Object} data.amount Amount to decrease
   * @apiParamExample {json} Request-Example:
   *   {
   *    "data": {
   *      "amount": 8
   *    }
   *  }
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object} data.wallet Updated wallet
   * @apiSuccessExample {json} Success-Response:
   *   {
   *    "data": {
   *      "wallet": {
   *        "owner": "abc",
   *        "amount": 2,
   *        "isProtected": false,
   *        "accessLevel": 1
   *      }
   *    }
   *  }
   */
  router.post('/:owner/decrease', (request, response) => {
    if (!objectValidator.isValidData(request.params, { owner: true })) {
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: '' }), sentData: request.body.data });

      return;
    } else if (!objectValidator.isValidData(request.body, { data: { amount: true } })) {
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: '' }), sentData: request.body.data });

      return;
    }

    walletManager.decreaseWalletAmount({
      owner: request.params.owner,
      amount: request.body.data.amount,
      token: request.headers.authorization,
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
   * @api {post} /wallets/:owner/empty Reset wallet amount to 0
   * @apiVersion 6.0.0
   * @apiName EmptyWallet
   * @apiGroup Wallets
   *
   * @apiHeader {String} Authorization Your JSON Web Token
   *
   * @apiDescription Reset wallet amount to 0
   *
   * @apiParam {String} owner Name of the owner of the wallet
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object} data.wallet Updated wallet
   * @apiSuccessExample {json} Success-Response:
   *   {
   *    "data": {
   *      "wallet": {
   *        "owner": "abc",
   *        "amount": 0,
   *        "isProtected": false,
   *        "accessLevel": 1
   *      }
   *    }
   *  }
   */
  router.post('/:owner/empty', (request, response) => {
    if (!objectValidator.isValidData(request.params, { owner: true })) {
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: '' }), sentData: request.body.data });

      return;
    }

    walletManager.emptyWallet({
      owner: request.params.owner,
      token: request.headers.authorization,
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
   * @api {get} /wallets/:owner/transactions Get transactions
   * @apiVersion 6.0.0
   * @apiName GetTransactions
   * @apiGroup Transactions
   *
   * @apiHeader {string} Authorization Your JSON Web Token
   *
   * @apiDescription Get transactions
   *
   * @apiParam {string} owner Name of the owner of the wallet
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object[]} data.toTransactions Transactions with the user being the receiver
   * @apiSuccess {Object[]} data.fromTransactions Transactions with the user being the sender
   * @apiSuccessExample {json} Success-Response:
   *   {
   *    "data": {
   *      "toTransactions": [
   *        {
   *          "to": "rez",
   *          "from": "n4",
   *          "time": "2016-11-28T22:42:06.262Z",
   *          "note": "Bounty payment",
   *          "amount": 10
   *        }
   *      ],
   *      "fromTransactions": [
   *        {
   *          "to": "bas",
   *          "from": "rez",
   *          "time:" "2016-10-28T22:42:06.262Z"
   *          "amount:" 5
   *        }
   *      ]
   *    }
   *  }
   */
  router.get('/:owner/transactions', (request, response) => {
    if (!objectValidator.isValidData(request.params, { owner: true })) {
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: '' }), sentData: request.body.data });

      return;
    }

    transactionManager.getTransactions({
      owner: request.params.owner,
      token: request.headers.authorization,
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
   * @api {post} /wallets/:owner/transactions Create a transaction
   * @apiVersion 6.0.0
   * @apiName CreateTransaction
   * @apiGroup Wallets
   *
   * @apiHeader {String} Authorization Your JSON Web Token
   *
   * @apiDescription Create a transaction
   *
   * @apiParam {Object} data
   * @apiParam {Object} data.transaction Transaction
   * @apiParam {string} data.transaction.to User or team name of the receiver
   * @apiParam {string} data.transaction.amount Amount to transfer
   * @apiParam {string} [data.transaction.note] Note to the receiver
   * @apiParam {Object} [data.transaction.coordinates] GPS coordinates to where the transaction was made
   * @apiParam {number} data.transaction.coordinates.longitude Longitude
   * @apiParam {number} data.transaction.coordinates.latitude Latitude
   * @apiParam {number} [data.isTeamWallet] Should the transaction be created on the user's team?
   * @apiParamExample {json} Request-Example:
   *   {
   *    "data": {
   *      "transaction": {
   *        "to": "baz",
   *        "amount": 10,
   *        "note": "Bounty payment",
   *        "coordinates": {
   *          "longitude": 10.11,
   *          "latitude": 12.4443
   *        }
   *      }
   *    }
   *  }
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object} data.transaction Transaction created
   * @apiSuccess {Object} data.wallet Wallet with new amount after transfer
   * @apiSuccessExample {json} Success-Response:
   *   {
   *    "data": {
   *      "transaction": {
   *        "to": "baz",
   *        "amount": 10,
   *        "note": "Bounty payment",
   *        "coordinates": {
   *          "longitude": 10.11,
   *          "latitude": 12.4443
   *        }
   *      },
   *      "wallet": {
   *        "amount": 23
   *      }
   *    }
   *  }
   */
  router.post('/:owner/transactions', (request, response) => {
    if (!objectValidator.isValidData(request.body, { data: { transaction: { to: true, amount: true } } }) || isNaN(request.body.data.transaction.amount)) {
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: '' }), sentData: request.body.data });

      return;
    }

    transactionManager.createTransactionBasedOnToken({
      io,
      transaction: request.body.data.transaction,
      fromTeam: request.body.data.isTeamWallet,
      token: request.headers.authorization,
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
