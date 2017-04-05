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
const appConfig = require('../../config/defaults/config').app;
const jwt = require('jsonwebtoken');
const objectValidator = require('../../utils/objectValidator');
const manager = require('../../socketHelpers/manager');

const router = new express.Router();

/**
 * @param {object} io - Socket.IO
 * @returns {Object} Router
 */
function handle(io) {
  /**
   * @api {get} /transactions Retrieve user's transactions
   * @apiVersion 5.0.3
   * @apiName GetTransactions
   * @apiGroup Transactions
   *
   * @apiHeader {String} Authorization Your JSON Web Token
   *
   * @apiDescription Retrieve user's transactions
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
   *          "note":
   *        }
   *      ],
   *      "fromTransactions": [
   *        {
   *          "to": "bas",
   *          "from": "rez",
   *          "time:" "2016-10-28T22:42:06.262Z"
   *        }
   *      ]
   *    }
   *  }
   */
  router.get('/', (req, res) => {
    // noinspection JSUnresolvedVariable
    jwt.verify(req.headers.authorization || '', appConfig.jsonKey, (jwtErr, decoded) => {
      if (jwtErr) {
        res.status(500).json({
          errors: [{
            status: 500,
            title: 'Internal Server Error',
            detail: 'Internal Server Error',
          }],
        });

        return;
      } else if (!decoded) {
        res.status(401).json({
          errors: [{
            status: 401,
            title: 'Unauthorized',
            detail: 'Invalid token',
          }],
        });

        return;
      }

      manager.getAllUserTransactions({
        userName: decoded.data.userName,
        callback: ({ error, data }) => {
          if (error) {
            res.status(500).json({
              errors: [{
                status: 500,
                title: 'Internal Server Error',
                detail: 'Internal Server Error',
              }],
            });

            return;
          }

          res.json({
            data: {
              toTransactions: data.toTransactions,
              fromTransactions: data.fromTransactions,
            },
          });
        },
      });
    });
  });

  /**
   * @api {post} /transactions Create a transaction
   * @apiVersion 5.0.3
   * @apiName CreateTransaction
   * @apiGroup Transactions
   *
   * @apiHeader {String} Authorization Your JSON Web Token
   *
   * @apiDescription Create a transaction
   *
   * @apiParam {Object} data
   * @apiParam {Object} data.transaction Transaction
   * @apiParam {String} data.transaction.to - User name of the receiver
   * @apiParam {String} data.transaction.amount - Amount to transfer
   * @apiParam {String} data.transaction.note - Note to the receiver
   * @apiParam {Object} [data.transaction.coordinates] - GPS coordinates to where the transaction was made
   * @apiParam {number} data.transaction.coordinates.longitude - Longitude
   * @apiParam {number} data.transaction.coordinates.latitude - Latitude
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
  router.post('/', (req, res) => {
    if (!objectValidator.isValidData(req.body, { data: { transaction: { to: true, amount: true } } }) || isNaN(req.body.data.transaction.amount)) {
      res.status(400).json({
        errors: [{
          status: 400,
          title: 'Missing data',
          detail: 'Unable to parse data',
        }],
      });

      return;
    }

    // noinspection JSUnresolvedVariable
    const auth = req.headers.authorization;

    jwt.verify(auth || '', appConfig.jsonKey, (jwtErr, decoded) => {
      if (jwtErr) {
        res.status(500).json({
          errors: [{
            status: 500,
            title: 'Internal Server Error',
            detail: 'Internal Server Error',
          }],
        });

        return;
      } else if (!decoded && auth) {
        res.status(401).json({
          errors: [{
            status: 401,
            title: 'Unauthorized',
            detail: 'Invalid token',
          }],
        });

        return;
      }

      const transaction = req.body.data.transaction;

      manager.createTransaction({
        user: decoded.data,
        transaction,
        io,
        callback: ({ error, data }) => {
          if (error) {
            if (error.type && error.type === 'Missing value') {
              res.status(403).json({
                errors: [{
                  status: 403,
                  title: 'Not enough currency',
                  detail: 'Not enough currency in the wallet',
                }],
              });

              return;
            }

            res.status(500).json({
              errors: [{
                status: 500,
                title: 'Internal Server Error',
                detail: 'Internal Server Error',
              }],
            });

            return;
          }

          res.json({
            data: {
              transaction: data.transaction,
              wallet: {
                amount: data.wallet.amount,
              },
            },
          });
        },
      });
    });
  });

  return router;
}

module.exports = handle;