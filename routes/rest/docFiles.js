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
const docFileManager = require('../../managers/docFiles');
const restErrorChecker = require('../../helpers/restErrorChecker');
const errorCreator = require('../../objects/error/errorCreator');

const router = new express.Router();

/**
 * @param {object} io Socket.IO
 * @returns {Object} Router
 */
function handle(io) {
  /**
   * @api {get} /docFiles Get files.
   * @apiVersion 8.0.0
   * @apiName GetDocFiles
   * @apiGroup DocFiles
   *
   * @apiHeader {String} Authorization - Your JSON Web Token.
   *
   * @apiDescription Retrieve files.
   *
   * @apiParam {Object} [data]
   * @apiParam {Object} data.userId - Id of the user retrieving the files.
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object[]} data.docFiles - Retrieved Files.
   */
  router.get('/', (request, response) => {
    const { userId } = request.body.data;
    const { authorization: token } = request.headers;

    docFileManager.getDocFilesByUser({
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
   * @api {get} /docFiles/:docFileId Get a file.
   * @apiVersion 8.0.0
   * @apiName GetDocFile
   * @apiGroup DocFiles
   *
   * @apiHeader {String} Authorization - Your JSON Web Token.
   *
   * @apiDescription Retrieve a specific docFile based on the sent docFile ID.
   *
   * @apiParam {String} docFileId - The docFile ID.
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object} data.docFile - Found file.
   */
  router.get('/:docFileId', (request, response) => {
    if (!objectValidator.isValidData(request.params, { docFileId: true })) {
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: '' }), sentData: request.params });

      return;
    }

    const { docFileId } = request.params;
    const { authorization: token } = request.headers;

    docFileManager.getDocFileById({
      docFileId,
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
   * @api {post} /docFiles Create a docFile.
   * @apiVersion 8.0.0
   * @apiName CreateDocFile
   * @apiGroup DocFiles
   *
   * @apiHeader {String} Authorization - Your JSON Web Token.
   *
   * @apiDescription Create a file.
   *
   * @apiParam {Object} data
   * @apiParam {Object} data.docFile - File to create.
   * @apiParam {Object} [data.userId] - Id of the user creating the file. It will default to the token owner.
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object[]} data.docFile - The created file.
   */
  router.post('/', (request, response) => {
    if (!objectValidator.isValidData(request.body, { data: { docFile: { docFileId: true, text: true, title: true } } })) {
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: '' }), sentData: request.body.data });

      return;
    }

    const { docFile, userId } = request.body.data;
    const { authorization: token } = request.headers;

    docFileManager.createDocFile({
      io,
      userId,
      token,
      docFile,
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
   * @api {delete} /docFiles/:docFileId Delete a file.
   * @apiVersion 8.0.0
   * @apiName RemoveDocFile
   * @apiGroup DocFiles
   *
   * @apiHeader {String} Authorization - Your JSON Web Token.
   *
   * @apiDescription Get files that the user has access to.
   *
   * @apiParam {Object} docFileId - Id of the file to retrieve.
   *
   * @apiParam {Object} [data]
   * @apiParam {Object} [data.userId] - Id of the user retrieving the file.
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object} data.docFile - File found.
   */
  router.delete('/:docFileId', (request, response) => {
    if (!objectValidator.isValidData(request.params, { docFileId: true })) {
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: '' }), sentData: request.params });

      return;
    }

    const { userId } = request.body.data;
    const { docFileId } = request.params;
    const { authorization: token } = request.headers;

    docFileManager.removeDocFile({
      userId,
      io,
      docFileId,
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
   * @api {put} /docFiles/:docFileId Update a file.
   * @apiVersion 8.0.0
   * @apiName UpdateDocFile
   * @apiGroup DocFiles
   *
   * @apiHeader {String} Authorization - Your JSON Web Token.
   *
   * @apiDescription Update a file.
   *
   * @apiParam {String} docFileId - Id of the file to update.
   *
   * @apiParam {String} data
   * @apiParam {String} data.docFile - File parameters to update.
   * @apiParam {String} [data.options] - Update options.
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object} data.docFile - Updated file.
   */
  router.put('/:docFileId', (request, response) => {
    if (!objectValidator.isValidData(request.params, { docFileId: true })) {
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: '' }), sentData: request.params });

      return;
    } else if (!objectValidator.isValidData(request.body, { data: { docFile: true } })) {
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: '' }), sentData: request.body.data });

      return;
    }

    const {
      docFile,
      options,
    } = request.body.data;
    const { docFileId } = request.params;
    const { authorization: token } = request.headers;

    docFileManager.updateDocFile({
      docFile,
      options,
      io,
      docFileId,
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
