/*
 Copyright 2017 Carmilla Mina Jankovic

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
const errorCreator = require('../../error/errorCreator');

const router = new express.Router();

/**
 * @api {OBJECT DEFINITION} DocFile 1. DocFile definition
 * @apiGroup DocFiles
 * @apiVersion 8.0.0
 *
 * @apiDescription The DocFile object.
 *
 * @apiParam {string} docFileId [Unique, immutable] Id of the DocFile. It is used to target this specific object.
 * @apiParam {string} code [Unique, mutable] Human-readable code to find and/or unlock the document for a user.
 * @apiParam {string} title [Unique, mutable] Title of the document.
 * @apiParam {string[]} text Text content in the document.
 */

/**
 * @param {object} io Socket.IO
 * @returns {Object} Router
 */
function handle(io) {
  /**
   * @api {get} /docFiles Get documents
   * @apiVersion 8.0.0
   * @apiName GetDocFiles
   * @apiGroup DocFiles
   *
   * @apiHeader {string} Authorization Your JSON Web Token.
   *
   * @apiDescription Retrieve documents.
   *
   * @apiSuccess {Object} data
   * @apiSuccess {DocFile[]} data.docFiles Found documents.
   */
  router.get('/', (request, response) => {
    const { authorization: token } = request.headers;

    docFileManager.getDocFilesByUser({
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
   * @api {get} /docFiles/:docFileId Get a document
   * @apiVersion 8.0.0
   * @apiName GetDocFile
   * @apiGroup DocFiles
   *
   * @apiHeader {string} Authorization Your JSON Web Token.
   *
   * @apiDescription Retrieve a document.
   *
   * @apiParam {string} docFileId [Url] The Id of the document to retrieve.
   *
   * @apiSuccess {Object} data
   * @apiSuccess {DocFile} data.docFile Found document.
   */
  router.get('/:docFileId', (request, response) => {
    if (!objectValidator.isValidData(request.params, { docFileId: true })) {
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: 'params = { docFileId }' }) });

      return;
    }

    const { docFileId } = request.params;
    const { authorization: token } = request.headers;

    docFileManager.getDocFileById({
      docFileId,
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
   * @api {post} /docFiles Create a document
   * @apiVersion 8.0.0
   * @apiName CreateDocFile
   * @apiGroup DocFiles
   *
   * @apiHeader {string} Authorization Your JSON Web Token.
   *
   * @apiDescription Create a document.
   *
   * @apiParam {Object} data Body parameters.
   * @apiParam {DocFile} data.docFile Document to create.
   *
   * @apiSuccess {Object} data
   * @apiSuccess {DocFile[]} data.docFile Created document.
   */
  router.post('/', (request, response) => {
    const sentData = request.body.data;

    if (!objectValidator.isValidData(request.body, { data: { docFile: { code: true, text: true, title: true } } })) {
      sentData.docFile.code = typeof sentData.docFile.code !== 'undefined';

      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: 'data = { docFile: { text, title } }' }), sentData });

      return;
    }

    const { docFile } = request.body.data;
    const { authorization: token } = request.headers;

    docFileManager.createDocFile({
      io,
      token,
      docFile,
      callback: ({ error, data }) => {
        if (error) {
          sentData.docFile.code = typeof sentData.docFile.code !== 'undefined';

          restErrorChecker.checkAndSendError({ response, error, sentData });

          return;
        }

        response.json({ data });
      },
    });
  });

  /**
   * @api {delete} /docFiles/:docFileId Delete a document
   * @apiVersion 8.0.0
   * @apiName RemoveDocFile
   * @apiGroup DocFiles
   *
   * @apiHeader {string} Authorization Your JSON Web Token.
   *
   * @apiDescription Delete a document.
   *
   * @apiParam {string} docFileId [Url] Id of the document to remove.
   *
   * @apiSuccess {Object} data
   * @apiSuccess {DocFile} data.success Was the document successfully removed?
   */
  router.delete('/:docFileId', (request, response) => {
    if (!objectValidator.isValidData(request.params, { docFileId: true })) {
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: 'params = { docFileId }' }) });

      return;
    }

    const { docFileId } = request.params;
    const { authorization: token } = request.headers;

    docFileManager.removeDocFile({
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
   * @api {put} /docFiles/:docFileId Update a document
   * @apiVersion 8.0.0
   * @apiName UpdateDocFile
   * @apiGroup DocFiles
   *
   * @apiHeader {string} Authorization Your JSON Web Token.
   *
   * @apiDescription Update a document.
   *
   * @apiParam {string} docFileId Id of the document to update.
   *
   * @apiParam {Object} data
   * @apiParam {DocFile} data.docFile File parameters to update.
   * @apiParam {Object} [data.options] Update options.
   * @apiParam {boolean} [data.options.resetOwnerAliasId] Should the owner alias Id be removed?
   *
   * @apiSuccess {Object} data
   * @apiSuccess {DocFile} data.docFile Updated document.
   */
  router.put('/:docFileId', (request, response) => {
    if (!objectValidator.isValidData(request.params, { docFileId: true })) {
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: 'params = { docFileId }' }) });

      return;
    }

    if (!objectValidator.isValidData(request.body, { data: { docFile: true } })) {
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: 'data = { docFile }' }), sentData: request.body.data });

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
