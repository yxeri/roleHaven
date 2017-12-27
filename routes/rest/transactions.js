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
   * @api {post} /wallets/:walletId/transactions Create a transaction
   * @apiVersion 8.0.0
   * @apiName CreateTransaction
   * @apiGroup Wallets
   *
   * @apiHeader {String} Authorization - Your JSON Web Token
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
