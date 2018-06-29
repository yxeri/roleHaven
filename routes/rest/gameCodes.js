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
const errorCreator = require('../../error/errorCreator');
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
   * @apiSuccess {Object} data
   * @apiSuccess {GameCode[]} data.gameCodes Found game codes.
   */
  router.get('/', (request, response) => {
    const { authorization: token } = request.headers;

    gameCodeManager.getGameCodesByUser({
      token,
      callback: ({ error, data }) => {
        if (error) {
          restErrorChecker.checkAndSendError({ response, error });

          return;
        }

        response.json({ data });
      },
    });
  });

  /**
   * @api {get} /gameCodes/:gameCodeId Get game code
   * @apiVersion 8.0.0
   * @apiName GetGameCodes
   * @apiGroup GameCodes
   *
   * @apiHeader {string} Authorization Your JSON Web Token.
   *
   * @apiDescription Get game code.
   *
   * @apiParam {string} gameCodeId Id of the game code to retrieve.
   *
   * @apiSuccess {Object} data
   * @apiSuccess {GameCode} data.gameCode Found game code.
   */
  router.get('/:gameCodeId', (request, response) => {
    if (!objectValidator.isValidData(request.params, { gameCodeId: true })) {
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: 'params = { gameCodeId }' }) });

      return;
    }

    const { authorization: token } = request.headers;
    const { gameCodeId } = request.params;

    gameCodeManager.getGameCodeById({
      token,
      gameCodeId,
      callback: ({ error, data }) => {
        if (error) {
          restErrorChecker.checkAndSendError({ response, error });

          return;
        }

        response.json({ data });
      },
    });
  });

  /**
   * @api {put} /gameCodes/:gameCodeId Update a game code
   * @apiVersion 8.0.0
   * @apiName UpdateGameCode
   * @apiGroup GameCodes
   *
   * @apiHeader {string} Authorization Your JSON Web Token.
   *
   * @apiDescription Update a game code.
   *
   * @apiParam {string} gameCodeId [Url] Id of the game code to update.
   *
   * @apiParam {Object} data Body parameters
   * @apiParam {GameCode} data.gameCode Game code parameters to update.
   * @apiParam {Object} [data.options] Update options.
   *
   * @apiSuccess {Object} data
   * @apiSuccess {GameCode} data.gameCode Updated game code.
   */
  router.put('/:gameCodeId', (request, response) => {
    if (!objectValidator.isValidData(request.params, { gameCodeId: true })) {
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: 'params = { gameCodeId }' }) });

      return;
    } else if (!objectValidator.isValidData(request.body, { data: { gameCode: true } })) {
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: 'data = { gameCode }' }), sentData: request.body.data });

      return;
    }

    const {
      gameCode,
      options,
    } = request.body.data;
    const { gameCodeId } = request.params;
    const { authorization: token } = request.headers;

    gameCodeManager.updateGameCode({
      gameCode,
      io,
      gameCodeId,
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
   * @api {delete} /gameCodes/:gameCodeId Delete a game code
   * @apiVersion 8.0.0
   * @apiName DeleteGameCode
   * @apiGroup GameCodes
   *
   * @apiHeader {string} Authorization Your JSON Web Token.
   *
   * @apiDescription Delete a game code.
   *
   * @apiParam {string} gameCodeId Id of the game code to delete.
   *
   * @apiSuccess {Object} data
   * @apiSuccess {boolean} data.success Was the game code successfully deleted?
   */
  router.delete('/:gameCodeId', (request, response) => {
    if (!objectValidator.isValidData(request.params, { gameCodeId: true })) {
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: 'params = { gameCodeId }' }) });

      return;
    }

    const { gameCodeId } = request.params;
    const { authorization: token } = request.headers;

    gameCodeManager.removeGameCode({
      io,
      gameCodeId,
      token,
      callback: ({ error, data }) => {
        if (error) {
          restErrorChecker.checkAndSendError({ response, error });

          return;
        }

        response.json({ data });
      },
    });
  });

  /**
   * @api {post} /gameCodes/:code/use Use a game code
   * @apiVersion 8.0.0
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
   * @apiParam {string} [userId] [Query] Id of the user trying to create a game code. It will default to the owner of the token.
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
    const { userId } = request.query;

    gameCodeManager.createGameCode({
      gameCode,
      token,
      userId,
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

  return router;
}

module.exports = handle;
