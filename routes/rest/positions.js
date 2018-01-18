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
const positionManager = require('../../managers/positions');
const restErrorChecker = require('../../helpers/restErrorChecker');
const errorCreator = require('../../objects/error/errorCreator');

const router = new express.Router();

/**
 * @param {object} io Socket.IO
 * @returns {Object} Router
 */
function handle(io) {
  /**
   * @api {post} /positions/ Create a position
   * @apiVersion 8.0.0
   * @apiName CreatePosition
   * @apiGroup Positions
   *
   * @apiHeader {string} Authorization Your JSON Web Token.
   *
   * @apiDescription Create a position.
   *
   * @apiParam {Object} data Body parameters.
   * @apiParam {Position} data.position Position to create.
   * @apiParam {string} [data.userId] Id of the user that is creating the position.
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Position} data.position Created position.
   */
  router.post('/', (request, response) => {
    if (!objectValidator.isValidData(request.body, { data: { position: true } })) {
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: 'data = { position }' }), sentData: request.body.data });
    }

    const { position } = request.body.data;
    const { authorization: token } = request.headers;

    positionManager.createPosition({
      io,
      position,
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
   * @api {get} /positions Get positions
   * @apiVersion 8.0.0
   * @apiName GetPositions
   * @apiGroup Positions
   *
   * @apiHeader {string} Authorization Your JSON Web Token.
   *
   * @apiDescription Gets positions.
   *
   * @apiParam {boolean} [full] [Query]
   * @apiParam {string} [type] [Query] Type of positions to retrieve. Default is WORLD.
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Position[]} data.positions Found positions.
   */
  router.get('/', (request, response) => {
    const { type, full } = request.query;
    const { authorization: token } = request.headers;

    const params = {
      token,
      full,
      callback: ({ error, data }) => {
        if (error) {
          restErrorChecker.checkAndSendError({ response, error });

          return;
        }

        response.json({ data });
      },
    };

    if (type) { params.positionTypes = [type]; }

    positionManager.getPositions(params);
  });

  /**
   * @api {get} /position/:positionId Get a position
   * @apiVersion 8.0.0
   * @apiName GetPosition
   * @apiGroup Positions
   *
   * @apiHeader {string} Authorization Your JSON Web Token.
   *
   * @apiDescription Gets a position.
   *
   * @apiParam {string} positionId [Url] Id of the position to update.
   *
   * @apiParam {boolean} full [Query]
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Position} data.position Found position.
   */
  router.get('/:positionId', (request, response) => {
    if (!objectValidator.isValidData(request.params, { positionId: true })) {
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: 'params = { positionId }' }) });

      return;
    }

    const { authorization: token } = request.headers;
    const { positionId } = request.params;
    const { full } = request.query;

    positionManager.getPositionById({
      token,
      full,
      positionId,
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
   * @api {delete} /positions/:positionId Delete a position
   * @apiVersion 8.0.0
   * @apiName DeletePosition
   * @apiGroup Positions
   *
   * @apiHeader {string} Authorization Your JSON Web Token.
   *
   * @apiDescription Delete a position.
   *
   * @apiParam {string} positionId [Url] Id of the position to delete.
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object} data.success Was it successfully deleted?
   */
  router.delete('/:positionId', (request, response) => {
    if (!objectValidator.isValidData(request.params, { positionId: true })) {
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: 'params = { positionId }' }) });

      return;
    }

    const { positionId } = request.params;
    const { authorization: token } = request.headers;

    positionManager.removePosition({
      io,
      positionId,
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
   * @api {put} /positions/:positionId Update a position
   * @apiVersion 8.0.0
   * @apiName UpdatePosition
   * @apiGroup Positions
   *
   * @apiHeader {string} Authorization Your JSON Web Token.
   *
   * @apiDescription Update a position.
   *
   * @apiParam {string} positionId [Url] Id of the position to update
   *
   * @apiParam {Object} data Body parameters.
   * @apiParam {Position} data.position Position parameters to update.
   * @apiParam {Object} [data.options] Update options.
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Position} data.position Updated position.
   */
  router.put('/:positionId', (request, response) => {
    if (!objectValidator.isValidData(request.params, { positionId: true })) {
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: 'params = { positionId }' }) });

      return;
    } else if (!objectValidator.isValidData(request.body, { data: { position: true } })) {
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: 'data = { position }' }), sentData: request.body.data });

      return;
    }

    const {
      position,
      options,
    } = request.body.data;
    const { positionId } = request.params;
    const { authorization: token } = request.headers;

    positionManager.updatePosition({
      position,
      options,
      io,
      positionId,
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
