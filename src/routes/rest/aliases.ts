'use strict';

import express from 'express';
import objectValidator from '../../utils/objectValidator';
import aliasManager from '../../managers/aliases';
import restErrorChecker from '../../helpers/restErrorChecker';
import errorCreator from '../../error/errorCreator';

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
      restErrorChecker.checkAndSendError({
        response,
        error: new errorCreator.InvalidData({ expected: '{ data: { alias: { aliasName }s } }' }),
        sentData: request.body.data,
      });

      return;
    }

    const { authorization: token } = request.headers;
    const { alias } = request.body.data;

    aliasManager.createAlias({
      io,
      token,
      alias,
      callback: ({
        error,
        data,
      }) => {
        if (error) {
          restErrorChecker.checkAndSendError({
            response,
            error,
            sentData: request.body.data,
          });

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
   * @apiSuccess {Object} data
   * @apiSuccess {Alias[]} data.aliases Found aliases.
   */
  router.get('/', (request, response) => {
    const { authorization: token } = request.headers;

    aliasManager.getAliasesByUser({
      token,
      callback: ({
        error,
        data,
      }) => {
        if (error) {
          restErrorChecker.checkAndSendError({
            response,
            error,
          });

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
   * @apiSuccess {Object} data
   * @apiSuccess {Alias} data.alias Found alias.
   */
  router.get('/:aliasId', (request, response) => {
    if (!objectValidator.isValidData(request.params, { aliasId: true })) {
      restErrorChecker.checkAndSendError({
        response,
        error: new errorCreator.InvalidData({ expected: '{ aliasId }' }),
      });

      return;
    }

    const { authorization: token } = request.headers;
    const { aliasId } = request.params;

    aliasManager.getAliasById({
      token,
      aliasId,
      callback: ({
        error,
        data,
      }) => {
        if (error) {
          restErrorChecker.checkAndSendError({
            response,
            error,
          });

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
      restErrorChecker.checkAndSendError({
        response,
        error: new errorCreator.InvalidData({ expected: '{ aliasId }' }),
      });

      return;
    }

    if (!objectValidator.isValidData(request.body, { data: { alias: true } })) {
      restErrorChecker.checkAndSendError({
        response,
        error: new errorCreator.InvalidData({ expected: '{ data: { alias } }' }),
        sentData: request.body.data,
      });

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
      callback: ({
        error,
        data,
      }) => {
        if (error) {
          restErrorChecker.checkAndSendError({
            response,
            error,
            sentData: request.body.data,
          });

          return;
        }

        response.json({ data });
      },
    });
  });

  return router;
}

export default handle;
