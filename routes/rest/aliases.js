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
const aliasManager = require('../../managers/aliases');
const restErrorChecker = require('../../helpers/restErrorChecker');
const errorCreator = require('../../error/errorCreator');

const router = new express.Router();

/**
 * @param {Object} io Socket.io
 * @returns {Object} Router
 */
function handle(io) {
  /**
   * @api {post} /aliases/ Create an alias.
   * @apiVersion 8.0.0
   * @apiName CreateAlias
   * @apiGroup Aliases
   *
   * @apiHeader {string} Authorization Your JSON Web Token.
   *
   * @apiDescription Create an alias.
   *
   * @apiParam {Object} data Body params.
   * @apiParam {string} data.alias Alias to create.
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Alias} data.alias Created alias.
   */
  router.post('/', (request, response) => {
    if (!objectValidator.isValidData(request.body, { data: { alias: { aliasName: true } } })) {
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: '{ data: { alias: { aliasName }s } }' }), sentData: request.body.data });

      return;
    }

    const { authorization: token } = request.headers;
    const { alias } = request.body.data;

    aliasManager.createAlias({
      io,
      token,
      alias,
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
   * @api {get} /aliases Get aliases.
   * @apiVersion 8.0.0
   * @apiName GetAliases
   * @apiGroup Aliases
   *
   * @apiHeader {string} Authorization Your JSON Web Token
   *
   * @apiDescription Get aliases.
   *
   * @apiParam {boolean} [full] [Query] Should the complete object be retrieved?
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Alias[]} data.aliases Found aliases.
   */
  router.get('/', (request, response) => {
    const { authorization: token } = request.headers;
    const { full } = request.query;

    aliasManager.getAliasesByUser({
      token,
      full,
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
   * @api {get} /aliases/:aliasId Get an alias.
   * @apiVersion 8.0.0
   * @apiName GetAlias
   * @apiGroup Aliases
   *
   * @apiHeader {string} Authorization Your JSON Web Token
   *
   * @apiDescription Get an alias.
   *
   * @apiParam {boolean} [full] [Query] Should the complete object be retrieved?
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Alias} data.alias Found alias.
   */
  router.get('/:aliasId', (request, response) => {
    if (!objectValidator.isValidData(request.params, { aliasId: true })) {
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: '{ aliasId }' }) });

      return;
    }

    const { authorization: token } = request.headers;
    const { full } = request.query;
    const { aliasId } = request.params;

    aliasManager.getAliasById({
      full,
      token,
      aliasId,
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
   * @api {put} /aliases/:aliasId Update an alias.
   * @apiVersion 8.0.0
   * @apiName UpdateAlias
   * @apiGroup Aliases
   *
   * @apiHeader {string} Authorization Your JSON Web Token.
   *
   * @apiDescription Update an alias.
   *
   * @apiParam {string} aliasId [Url] Id of the alias to update.
   *
   * @apiParam {string} data Body params.
   * @apiParam {string} data.alias alias parameters to update.
   * @apiParam {string} [data.options] Update options.
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object} data.alias Updated alias.
   */
  router.put('/:aliasId', (request, response) => {
    if (!objectValidator.isValidData(request.params, { aliasId: true })) {
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: '{ aliasId }' }) });

      return;
    } else if (!objectValidator.isValidData(request.body, { data: { alias: true } })) {
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: '{ data: { alias } }' }), sentData: request.body.data });

      return;
    }

    const {
      alias,
      options,
    } = request.body.data;
    const { aliasId } = request.params;
    const { authorization: token } = request.headers;

    aliasManager.updateAlias({
      alias,
      options,
      io,
      aliasId,
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
