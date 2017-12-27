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
const restErrorChecker = require('../../helpers/restErrorChecker');
const gameCodeManager = require('../../managers/gameCodes');
const errorCreator = require('../../objects/error/errorCreator');
const objectValidator = require('../../utils/objectValidator');

const router = new express.Router();

/**
 * @param {Object} io Socket.io
 * @returns {Object} Router
 */
function handle(io) {
  /**
   * @api {get} /gameCodes Get game codes.
   * @apiVersion 8.0.0
   * @apiName GetGameCodes
   * @apiGroup GameCodes
   *
   * @apiHeader {String} Authorization - Your JSON Web Token.
   *
   * @apiDescription Get game codes that the user has access to.
   *
   * @apiParam {Object} [data]
   * @apiParam {Object} data.userId - Id of the user retrieving the game codes.
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object[]} data.gameCodes - Game codes found.
   */
  router.get('/', (request, response) => {
    const { userId } = request.body.data;
    const { authorization: token } = request.headers;

    gameCodeManager.getGameCodesByOwner({
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
   * @api {put} /gameCodes/:gameCodeId Update a game code.
   * @apiVersion 8.0.0
   * @apiName UpdateGameCode
   * @apiGroup GameCodes
   *
   * @apiHeader {String} Authorization - Your JSON Web Token.
   *
   * @apiDescription Update a game code.
   *
   * @apiParam {String} code - Code of the game code to update.
   *
   * @apiParam {String} data
   * @apiParam {String} data.gameCode - Game code parameters to update.
   * @apiParam {String} [data.options] - Update options.
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object} data.gameCode - Updated game code.
   */
  router.put('/:code', (request, response) => {
    if (!objectValidator.isValidData(request.params, { code: true })) {
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: '{ code }' }), sentData: request.params });

      return;
    } else if (!objectValidator.isValidData(request.body, { data: { gameCode: true } })) {
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: '{ gameCode }' }), sentData: request.body.data });

      return;
    }

    const {
      gameCode,
    } = request.body.data;
    const { code } = request.params;
    const { authorization: token } = request.headers;

    gameCodeManager.updateGameCode({
      gameCode,
      io,
      code,
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
   * @api {delete} /gameCodes/:code Delete a game code.
   * @apiVersion 8.0.0
   * @apiName DeleteGameCode
   * @apiGroup GameCodes
   *
   * @apiHeader {String} Authorization - Your JSON Web Token.
   *
   * @apiDescription Delete the game code.
   *
   * @apiParam {Object} gameCodeId - Id of the game code to delete.
   *
   * @apiParam {Object} [data]
   * @apiParam {Object} [data.userId] - Id of the user deleting the game code.
   *
   * @apiSuccess {Object} data
   * @apiSuccess {boolean} data.success - Was the game code successfully deleted?
   */
  router.delete('/:code', (request, response) => {
    if (!objectValidator.isValidData(request.params, { code: true })) {
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: '{ code }' }), sentData: request.params });

      return;
    }

    const { userId } = request.body.data;
    const { code } = request.params;
    const { authorization: token } = request.headers;

    gameCodeManager.removeGameCode({
      userId,
      io,
      code,
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
   * @api {post} /gameCodes/:code/use Use a game code.
   * @apiVersion 6.0.0
   * @apiName UseGameCode
   * @apiGroup GameCodes
   *
   * @apiHeader {String} Authorization - Your JSON Web Token.
   *
   * @apiDescription Use game code
   *
   * @apiParam {string} code - Code for game code that will be used up.
   *
   * @apiParam {Object} data
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object[]} data.gameCode - Used game code. It will include the content that was unlocked with the code.
   */
  router.post('/:code/use', (request, response) => {
    if (!objectValidator.isValidData(request.params, { code: true })) {
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: 'params: { code }' }), sentData: request.body.data });

      return;
    }

    gameCodeManager.useGameCode({
      io,
      code: request.params.code,
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
