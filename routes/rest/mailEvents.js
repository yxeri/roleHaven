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
const userManager = require('../../managers/users');
const restErrorChecker = require('../../helpers/restErrorChecker');
const errorCreator = require('../../objects/error/errorCreator');

const router = new express.Router();

/**
 * @param {Object} io Socket.io
 * @returns {Object} Router
 */
function handle() {
  /**
   * @api {post} /mailEvents/bannedMail
   * @apiVersion 6.0.0
   * @apiName AddBannedMail
   * @apiGroup MailEvents
   *
   * @apiHeader {String} Authorization Your JSON Web Token
   *
   * @apiDescription Adds mail domains or mail addresses to blacklist. These will not be allowed to use during user registration
   *
   * @apiParam {Object} data
   * @apiParam {string[]} [data.mailDomains] Mail domains to ban
   * @apiParam {string[]} [data.addresses] Mail addresses to ban
   * @apiParamExample {json} Request-Example:
   *   {
   *    "data": {
   *      "addresses": [
   *        "banana@harakiri.com",
   *      ],
   *      "mailDomains": [
   *        "0paq.com"
   *      ]
   *    }
   *  }
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object[]} data.success Were the mails sent?
   * @apiSuccessExample {json} Success-Response:
   *   {
   *    "data": {
   *      "success": true
   *    }
   *  }
   */
  router.post('/bannedMail', (request, response) => {
    if (!objectValidator.isValidData(request.body, { data: true })) {
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({}), sentData: request.body.data });

      return;
    }

    userManager.addBlockedMail({
      mailDomains: request.body.data.mailDomains,
      addresses: request.body.data.addresses,
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
   * @api {post} /mailEvents/verifications Resend verification mail to all unverified users
   * @apiVersion 6.0.0
   * @apiName ResendAllVerificationMail
   * @apiGroup MailEvents
   *
   * @apiHeader {String} Authorization Your JSON Web Token
   *
   * @apiDescription Resend verification mail to all unverified users
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object[]} data.success Were the mails sent?
   * @apiSuccessExample {json} Success-Response:
   *   {
   *    "data": {
   *      "success": true
   *    }
   *  }
   */
  router.post('/verifications', (request, response) => {
    userManager.sendAllVerificationMails({
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
   * @api {post} /mailEvents/:mail/password Request user password reset
   * @apiVersion 6.0.0
   * @apiName RequestPasswordRecovery
   * @apiGroup MailEvents
   *
   * @apiHeader {String} Authorization Your JSON Web Token
   *
   * @apiDescription Request user password reset. A mail will be sent to the user's registered mail address
   *
   * @apiParam {String} username User name of the user that will receive a password recovery mail
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object[]} data.success Was the reset mail properly sent?
   * @apiSuccessExample {json} Success-Response:
   *   {
   *    "data": {
   *      "success": true
   *    }
   *  }
   */
  router.post('/:mail/password', (request, response) => {
    if (!objectValidator.isValidData(request.params, { mail: true })) {
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: 'params: { mail }' }), sentData: request.body.data });

      return;
    }

    userManager.sendPasswordReset({
      mail: request.params.mail,
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
