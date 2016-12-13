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
const dbArchive = require('../../db/connectors/archive');
const jwt = require('jsonwebtoken');

const router = new express.Router();

/**
 * @returns {Object} Router
 */
function handle() {
  /**
   * @api {get} /archives Retrieve all public archives
   * @apiVersion 5.0.1
   * @apiName GetPublicArchives
   * @apiGroup Archives
   *
   * @apiHeader {String} Authorization Your JSON Web Token
   *
   * @apiDescription Retrieve all public archives
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object[]} data.archives All public archives. Empty if no match was found
   * @apiSuccessExample {json} Success-Response:
   *  {
   *    "data": {
   *      "archives": [
   *        {
   *          "_id": "58093459d3b44c3400858273",
   *          "title": "Hello",
   *          "archiveId": "hello",
   *          "creator": "rez5",
   *          "text": [
   *            "Hello world!",
   *            "This is great"
   *          ],
   *          "public": true,
   *          "visibility": "0"
   *        }
   *      ]
   *    }
   *  }
   */
  router.get('/', (req, res) => {
    // noinspection JSUnresolvedVariable
    jwt.verify(req.headers.authorization || '', appConfig.jsonKey, (jwtErr, decoded) => {
      if (jwtErr) {
        res.status(500).json({
          errors: [{
            status: 500,
            title: 'Internal Server Error',
            detail: 'Internal Server Error',
          }],
        });

        return;
      } else if (!decoded) {
        res.status(401).json({
          errors: [{
            status: 401,
            title: 'Unauthorized',
            detail: 'Invalid token',
          }],
        });

        return;
      }

      dbArchive.getArchivesList(decoded.data.accessLevel, (archiveErr, archives) => {
        if (archiveErr) {
          res.status(500).json({
            errors: [{
              status: 500,
              title: 'Internal Server Error',
              detail: 'Internal Server Error',
            }],
          });

          return;
        }

        res.json({ data: { archives } });
      });
    });
  });

  /**
   * @api {get} /archives/:id Retrieve specific archive
   * @apiVersion 5.0.1
   * @apiName GetArchive
   * @apiGroup Archives
   *
   * @apiHeader {String} Authorization Your JSON Web Token
   *
   * @apiDescription Retrieve a specific archive based on the sent archive ID
   *
   * @apiParam {String} id The archive ID.
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object[]} data.archives Found archive with sent archive ID. Empty if no match was found
   * @apiSuccessExample {json} Success-Response:
   *  {
   *    "data": {
   *      "archives": [
   *        {
   *          "_id": "58093459d3b44c3400858273",
   *          "title": "Hello",
   *          "archiveId": "hello",
   *          "creator": "rez5",
   *          "text": [
   *            "Hello world!",
   *            "This is great"
   *          ],
   *          "public": true,
   *          "visibility": "0"
   *        }
   *      ]
   *    }
   *  }
   */
  router.get('/:id', (req, res) => {
    // noinspection JSUnresolvedVariable
    jwt.verify(req.headers.authorization || '', appConfig.jsonKey, (jwtErr, decoded) => {
      if (jwtErr) {
        res.status(500).json({
          errors: [{
            status: 500,
            title: 'Internal Server Error',
            detail: 'Internal Server Error',
          }],
        });

        return;
      } else if (!decoded) {
        res.status(401).json({
          errors: [{
            status: 401,
            title: 'Unauthorized',
            detail: 'Invalid token',
          }],
        });

        return;
      }

      dbArchive.getArchive(req.params.id, decoded.data.accessLevel, (archiveErr, archive) => {
        if (archiveErr) {
          res.status(500).json({
            errors: [{
              status: 500,
              title: 'Internal Server Error',
              detail: 'Internal Server Error',
            }],
          });

          return;
        }

        res.json({ data: { archives: [archive] } });
      });
    });
  });

  /**
   * @api {post} /archives Create an archive
   * @apiVersion 5.0.1
   * @apiName CreateArchive
   * @apiGroup Archives
   *
   * @apiHeader {String} Authorization Your JSON Web Token
   *
   * @apiDescription Create an archive
   *
   * @apiParam {Object} data
   * @apiParam {Object} data.archive Archive
   * @apiParam {String} data.archive.title Title for the archive
   * @apiParam {String} data.archive.archiveId ID of the archive. Will be used to retrieve this specific archive
   * @apiParam {String[]} data.archive.text Content of the archive
   * @apiParam {Boolean} data.archive.public Should the archive be public? Non-public archives can only be retrieved with its archive ID
   * @apiParamExample {json} Request-Example:
   *   {
   *    "data": {
   *      "archives": [
   *        {
   *          "title": "Hello",
   *          "archiveId": "hello",
   *          "text": [
   *            "Hello world!",
   *            "This is great"
   *          ],
   *          "public": true
   *        }
   *      ]
   *    }
   *  }
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object[]} data.archives Found archive with sent archive ID. Empty if no match was found
   * @apiSuccessExample {json} Success-Response:
   *  {
   *    "data": {
   *      "archives": [
   *        {
   *          "_id": "58093459d3b44c3400858273",
   *          "title": "Hello",
   *          "archiveId": "hello",
   *          "creator": "rez5",
   *          "text": [
   *            "Hello world!",
   *            "This is great"
   *          ],
   *          "public": true,
   *          "visibility": "0"
   *        }
   *      ]
   *    }
   *  }
   */
  router.post('/', (req, res) => {
    if (!objectValidator.isValidData(req.body, { data: { archive: { archiveId: true, text: true, title: true } } })) {
      res.status(400).json({
        errors: [{
          status: 400,
          title: 'Missing data',
          detail: 'Unable to parse data',
        }],
      });

      return;
    }

    // noinspection JSUnresolvedVariable
    jwt.verify(req.headers.authorization || '', appConfig.jsonKey, (jwtErr, decoded) => {
      if (jwtErr) {
        res.status(500).json({
          errors: [{
            status: 500,
            title: 'Internal Server Error',
            detail: 'Internal Server Error',
          }],
        });

        return;
      } else if (!decoded) {
        res.status(401).json({
          errors: [{
            status: 401,
            title: 'Unauthorized',
            detail: 'Invalid token',
          }],
        });

        return;
      }

      const newArchive = req.body.data.archive;
      newArchive.creator = decoded.data.userName;
      newArchive.archiveId = newArchive.archiveId.toLowerCase();

      dbArchive.createArchive(newArchive, (archiveErr, archive) => {
        if (archiveErr) {
          res.status(500).json({
            errors: [{
              status: 500,
              title: 'Internal Server Error',
              detail: 'Internal Server Error',
            }],
          });

          return;
        } else if (archive === null) {
          res.status(402).json({
            errors: [{
              status: 402,
              title: 'Archive already exists',
              detail: `Archive with ID ${newArchive.archiveId} already exists`,
            }],
          });

          return;
        }

        res.json({ data: { archives: [archive] } });
      });
    });
  });

  return router;
}

module.exports = handle;
