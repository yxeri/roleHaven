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

const router = new express.Router();

/**
 * @param {object} io Socket.IO
 * @returns {Object} Router
 */
function handle(io) {
  /**
   * @api {get} /docFiles Get docFiles
   * @apiVersion 6.0.0
   * @apiName GetDocFiles
   * @apiGroup DocFiles
   *
   * @apiHeader {String} Authorization Your JSON Web Token
   *
   * @apiDescription Retrieve docFiles
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object[]} data.docFiles All public docFiles. Empty if no match was found
   * @apiSuccessExample {json} Success-Response:
   *  {
   *    "data": {
   *      "docFiles": [
   *        {
   *          "title": "Hello",
   *          "docFileId": "hello",
   *          "creator": "rez5",
   *          "text": [
   *            "Hello world!",
   *            "This is great"
   *          ],
   *          "isPublic": true,
   *        }
   *      ]
   *    }
   *  }
   */
  router.get('/', (request, response) => {
    docFileManager.getDocFiles({
      token: request.headers.authorization,
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
   * @api {get} /docFiles/:docFileId Get specific docFile
   * @apiVersion 6.0.0
   * @apiName GetDocFile
   * @apiGroup DocFiles
   *
   * @apiHeader {String} Authorization Your JSON Web Token
   *
   * @apiDescription Retrieve a specific docFile based on the sent docFile ID
   *
   * @apiParam {String} docFileId The docFile ID.
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object[]} data.docFiles Found docFile with sent docFile ID. Empty if no match was found
   * @apiSuccessExample {json} Success-Response:
   *  {
   *    "data": {
   *      "docFiles": [
   *        {
   *          "_id": "58093459d3b44c3400858273",
   *          "title": "Hello",
   *          "docFileId": "hello",
   *          "creator": "rez5",
   *          "text": [
   *            "Hello world!",
   *            "This is great"
   *          ],
   *          "isPublic": true,
   *          "visibility": 0
   *        }
   *      ]
   *    }
   *  }
   */
  router.get('/:docFileId', (request, response) => {
    if (!objectValidator.isValidData(request.params, { docFileId: true })) {
      response.status(400).json({
        error: {
          status: 400,
          title: 'Missing data',
          detail: 'Unable to parse data',
        },
      });

      return;
    }

    docFileManager.getDocFile({
      docFile: { docFileId: request.params.docFileId },
      token: request.headers.authorization,
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
   * @api {post} /docFiles Create an docFile
   * @apiVersion 6.0.0
   * @apiName CreateDocFile
   * @apiGroup DocFiles
   *
   * @apiHeader {String} Authorization Your JSON Web Token
   *
   * @apiDescription Create an docFile
   *
   * @apiParam {Object} data
   * @apiParam {Object} data.docFile DocFile
   * @apiParam {String} data.docFile.title Title for the docFile
   * @apiParam {String} data.docFile.docFileId ID of the docFile. Will be used to retrieve this specific docFile
   * @apiParam {String[]} data.docFile.text Content of the docFile
   * @apiParam {Boolean} data.docFile.isPublic Should the docFile be public? Non-public docFiles can only be retrieved with its docFile ID
   * @apiParamExample {json} Request-Example:
   *   {
   *    "data": {
   *      "docFiles": [
   *        {
   *          "title": "Hello",
   *          "docFileId": "hello",
   *          "text": [
   *            "Hello world!",
   *            "This is great"
   *          ],
   *          "isPublic": true
   *        }
   *      ]
   *    }
   *  }
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object[]} data.docFiles Found docFile with sent docFile ID. Empty if no match was found
   * @apiSuccessExample {json} Success-Response:
   *  {
   *    "data": {
   *      "docFile": {
   *        "title": "Hello",
   *        "docFileId": "hello",
   *        "creator": "rez5",
   *        "text": [
   *          "Hello world!",
   *          "This is great"
   *        ],
   *        "isPublic": true,
   *        "visibility": 0
   *      }
   *    }
   *  }
   */
  router.post('/', (request, response) => {
    if (!objectValidator.isValidData(request.body, { data: { docFile: { docFileId: true, text: true, title: true } } })) {
      response.status(400).json({
        error: {
          status: 400,
          title: 'Missing data',
          detail: 'Unable to parse data',
        },
      });

      return;
    }

    docFileManager.createDocFile({
      io,
      token: request.headers.authorization,
      docFile: request.body.data.docFile,
      callback: ({ error, data }) => {
        if (error) {
          restErrorChecker.checkAndSendError({ response, error });

          return;
        }

        response.json({ data });
      },
    });
  });

  return router;
}

module.exports = handle;
