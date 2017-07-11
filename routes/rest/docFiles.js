/*
 Copyright 2015 Aleksandar Jankovic

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
const appConfig = require('../../config/defaults/config').app;
const dbConfig = require('../../config/defaults/config').databasePopulation;
const dbDocFile = require('../../db/connectors/docFile');
const jwt = require('jsonwebtoken');
const errorCreator = require('../../objects/error/errorCreator');
const manager = require('../../socketHelpers/manager');

const router = new express.Router();

/**
 * @param {object} io Socket.IO
 * @returns {Object} Router
 */
function handle(io) {
  /**
   * @api {get} /docFiles Retrieve public docFiles
   * @apiVersion 6.0.0
   * @apiName GetPublicDocFiles
   * @apiGroup DocFiles
   *
   * @apiHeader {String} Authorization Your JSON Web Token
   *
   * @apiDescription Retrieve public docFiles
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
  router.get('/', (req, res) => {
    // noinspection JSUnresolvedVariable
    const auth = req.headers.authorization || '';

    jwt.verify(auth, appConfig.jsonKey, (jwtErr, decoded) => {
      if (jwtErr || !decoded || decoded.data.accessLevel < dbConfig.apiCommands.GetDocFile) {
        res.status(401).json({
          error: {
            status: 401,
            title: 'Unauthorized',
            detail: 'Invalid token',
          },
        });

        return;
      }

      dbDocFile.getDocFilesList({
        accessLevel: decoded.data.accessLevel,
        userName: decoded.data.userName,
        callback: ({ error, data }) => {
          if (error) {
            res.status(500).json({
              error: {
                status: 500,
                title: 'Internal Server Error',
                detail: 'Internal Server Error',
              },
            });

            return;
          }

          res.json({ data });
        },
      });
    });
  });

  /**
   * @api {get} /docFiles/:id Retrieve specific docFile
   * @apiVersion 6.0.0
   * @apiName GetDocFile
   * @apiGroup DocFiles
   *
   * @apiHeader {String} Authorization Your JSON Web Token
   *
   * @apiDescription Retrieve a specific docFile based on the sent docFile ID
   *
   * @apiParam {String} id The docFile ID.
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
  router.get('/:id', (req, res) => {
    if (!objectValidator.isValidData(req.params, { id: true })) {
      res.status(400).json({
        error: {
          status: 400,
          title: 'Missing data',
          detail: 'Unable to parse data',
        },
      });

      return;
    }

    // noinspection JSUnresolvedVariable
    const auth = req.headers.authorization || '';

    jwt.verify(auth, appConfig.jsonKey, (jwtErr, decoded) => {
      if (jwtErr || !decoded || decoded.data.accessLevel < dbConfig.apiCommands.GetDocFile) {
        res.status(401).json({
          error: {
            status: 401,
            title: 'Unauthorized',
            detail: 'Invalid token',
          },
        });

        return;
      }

      dbDocFile.getDocFileById({
        docFileId: req.params.id,
        user: decoded.data,
        callback: ({ error, data }) => {
          if (error) {
            if (error.type === errorCreator.ErrorTypes.DOESNOTEXIST) {
              res.status(404).json({
                error: {
                  status: 404,
                  title: 'Not found',
                  detail: 'DocFile not found',
                },
              });

              return;
            }

            res.status(500).json({
              error: {
                status: 500,
                title: 'Internal Server Error',
                detail: 'Internal Server Error',
              },
            });

            return;
          }

          const { docFile } = data;

          res.json({ data: { docFile } });
        },
      });
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
  router.post('/', (req, res) => {
    if (!objectValidator.isValidData(req.body, { data: { docFile: { docFileId: true, text: true, title: true } } })) {
      res.status(400).json({
        error: {
          status: 400,
          title: 'Missing data',
          detail: 'Unable to parse data',
        },
      });

      return;
    }

    // noinspection JSUnresolvedVariable
    const auth = req.headers.authorization || '';

    jwt.verify(auth, appConfig.jsonKey, (jwtErr, decoded) => {
      if (jwtErr || !decoded || decoded.data.accessLevel < dbConfig.apiCommands.CreateDocFile) {
        res.status(401).json({
          error: {
            status: 401,
            title: 'Unauthorized',
            detail: 'Invalid token',
          },
        });

        return;
      }

      const newDocFile = req.body.data.docFile;
      newDocFile.creator = decoded.data.userName;

      manager.createDocFile({
        user: decoded.data,
        docFile: newDocFile,
        callback: ({ error, data }) => {
          if (error) {
            if (error.type === errorCreator.ErrorTypes.INVALIDCHARACTERS) {
              res.status(400).json({
                error: {
                  status: 400,
                  title: 'Invalid data',
                  detail: 'Invalid data',
                },
              });

              return;
            } else if (error.type === errorCreator.ErrorTypes.ALREADYEXISTS) {
              res.status(403).json({
                error: {
                  status: 403,
                  title: 'DocFile already exists',
                  detail: `DocFile with ID ${newDocFile.docFileId} already exists`,
                },
              });

              return;
            }

            res.status(500).json({
              error: {
                status: 500,
                title: 'Internal Server Error',
                detail: 'Internal Server Error',
              },
            });

            return;
          }

          const createdDocFile = data.docFile;

          io.emit('docFile', { docFile: createdDocFile });
          res.json({ data: { docFile: createdDocFile } });
        },
      });
    });
  });

  return router;
}

module.exports = handle;
