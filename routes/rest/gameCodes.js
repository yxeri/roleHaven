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
   * @api {get} /gameCodes Get game codes
   * @apiVersion 8.0.0
   * @apiName GetGameCodes
   * @apiGroup GameCodes
   *
   * @apiHeader {string} Authorization Your JSON Web Token.
   *
   * @apiDescription Get game codes.
   *
   * @apiParam {Object} [data]
   * @apiParam {string} data.userId Id of the user retrieving the game codes.
   *
   * @apiSuccess {Object} data
   * @apiSuccess {GameCode[]} data.gameCodes Game codes found.
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
   * @api {put} /gameCodes/:code Update a game code
   * @apiVersion 8.0.0
   * @apiName UpdateGameCode
   * @apiGroup GameCodes
   *
   * @apiHeader {string} Authorization Your JSON Web Token.
   *
   * @apiDescription Update a game code.
   *
   * @apiParam {string} code Code of the game code to update.
   *
   * @apiParam {Object} data
   * @apiParam {GameCode} data.gameCode Game code parameters to update.
   * @apiParam {Object} [data.options] Update options.
   *
   * @apiSuccess {Object} data
   * @apiSuccess {GameCode} data.gameCode Updated game code.
   */
  router.put('/:code', (request, response) => {
    if (!objectValidator.isValidData(request.params, { code: true })) {
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: 'params = { code }' }) });

      return;
    } else if (!objectValidator.isValidData(request.body, { data: { gameCode: true } })) {
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: 'data = { gameCode }' }), sentData: request.body.data });

      return;
    }

    const {
      gameCode,
      options,
    } = request.body.data;
    const { code } = request.params;
    const { authorization: token } = request.headers;

    gameCodeManager.updateGameCode({
      gameCode,
      io,
      code,
      token,
      options,
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
   * @api {delete} /gameCodes/:code Delete a game code
   * @apiVersion 8.0.0
   * @apiName DeleteGameCode
   * @apiGroup GameCodes
   *
   * @apiHeader {string} Authorization Your JSON Web Token.
   *
   * @apiDescription Delete the game code.
   *
   * @apiParam {string} gameCodeId Id of the game code to delete.
   *
   * @apiParam {Object} [data]
   * @apiParam {string} [data.userId] Id of the user deleting the game code.
   *
   * @apiSuccess {Object} data
   * @apiSuccess {boolean} data.success Was the game code successfully deleted?
   */
  router.delete('/:code', (request, response) => {
    if (!objectValidator.isValidData(request.params, { code: true })) {
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: 'params = { code }' }) });

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
   * @api {post} /gameCodes/:code/use Use a game code
   * @apiVersion 6.0.0
   * @apiName UseGameCode
   * @apiGroup GameCodes
   *
   * @apiHeader {string} Authorization Your JSON Web Token.
   *
   * @apiDescription Use a game code.
   *
   * @apiParam {string} code Code for game code that will be used up.
   *
   * @apiSuccess {Object} data
   * @apiSuccess {GameCode} data.gameCode Used game code. It includes the content that was unlocked with the code.
   */
  router.post('/:code/use', (request, response) => {
    if (!objectValidator.isValidData(request.params, { code: true })) {
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: 'params = { code }' }) });

      return;
    }

    const { code } = request.params;
    const { authorization: token } = request.headers;

    gameCodeManager.useGameCode({
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
   * @api {post} /gameCodes Create a game code
   * @apiVersion 8.0.0
   * @apiName CreateGameCode
   * @apiGroup GameCodes
   *
   * @apiHeader {string} Authorization Your JSON Web Token.
   *
   * @apiDescription Create a game code.
   *
   * @apiParam {Object} data
   * @apiParam {string} [data.userId] Id of the user trying to create a game code.
   *
   * @apiSuccess {Object} data
   * @apiSuccess {GameCode} data.gameCode Created game code.
   */
  router.post('/', (request, response) => {
    if (!objectValidator.isValidData(request.body.data, { gameCode: true })) {
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: 'data = { gameCode }' }), sentData: request.body.data });

      return;
    }

    const { gameCode } = request.body.data;
    const { authorization: token } = request.headers;

    gameCodeManager.createGameCode({
      gameCode,
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
