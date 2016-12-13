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
const dbUser = require('../../db/connectors/user');
const jwt = require('jsonwebtoken');
const dbLocation = require('../../db/connectors/location');

const router = new express.Router();

/**
 * @param {object} io - Socket.IO
 * @returns {Object} Router
 */
function handle(io) {
  /**
   * @api {get} /positions/users Retrieve all user positions
   * @apiVersion 5.0.1
   * @apiName GetUserPositions
   * @apiGroup Positions
   *
   * @apiHeader {String} Authorization Your JSON Web Token
   *
   * @apiDescription Retrieve the positions from all users
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object[]} data.positions Found user positions
   * @apiSuccessExample {json} Success-Response:
   *   {
   *    "data": {
   *      "positions": [
   *        {
   *          "_id": "580cd329720ed46986af64f9",
   *          "positionName": "rez",
   *          "lastUpdated": "2016-10-25T16:55:34.309Z",
   *          "type": "user",
   *          "position": {
   *            "latitude": "42.3625069",
   *            "longitude": "22.0114096",
   *            "speed": null,
   *            "accuracy": "1889",
   *            "heading": null,
   *            "timestamp": "1477414497796"
   *          }
   *        }
   *      ]
   *    }
   *  }
   */
  router.get('/users', (req, res) => {
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

      dbUser.getAllUserPositions(decoded.data, (posErr, positions) => {
        if (posErr) {
          res.status(500).json({
            errors: [{
              status: 500,
              title: 'Internal Server Error',
              detail: 'Internal Server Error',
            }],
          });

          return;
        }

        res.json({ data: { positions } });
      });
    });
  });

  /**
   * @api {get} /positions/users Retrieve specific user position
   * @apiVersion 5.0.1
   * @apiName GetUserPosition
   * @apiGroup Positions
   *
   * @apiHeader {String} Authorization Your JSON Web Token
   *
   * @apiDescription Retrieve the position for a specific user
   *
   * @apiParam {String} id Name of the user
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object[]} data.positions Found user position
   * @apiSuccessExample {json} Success-Response:
   *   {
   *    "data": {
   *      "positions": [
   *        {
   *          "_id": "580cd329720ed46986af64f9",
   *          "positionName": "rez",
   *          "lastUpdated": "2016-10-25T16:55:34.309Z",
   *          "type": "user",
   *          "position": {
   *            "latitude": "42.3625069",
   *            "longitude": "22.0114096",
   *            "speed": null,
   *            "accuracy": "1889",
   *            "heading": null,
   *            "timestamp": "1477414497796"
   *          }
   *        }
   *      ]
   *    }
   *  }
   */
  router.get('/users/:id', (req, res) => {
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

      dbUser.getUserPosition(decoded.data, req.params.id, (posErr, position) => {
        if (posErr) {
          res.status(500).json({
            errors: [{
              status: 500,
              title: 'Internal Server Error',
              detail: 'Internal Server Error',
            }],
          });

          return;
        }

        res.json({ data: { positions: [position] } });
      });
    });
  });

  /**
   * @api {post} /positions/users Set position
   * @apiVersion 5.0.1
   * @apiName SetPosition
   * @apiGroup Positions
   *
   * @apiHeader {String} Authorization Your JSON Web Token
   *
   * @apiDescription Set a new position for the user, based on the authorization token
   *
   * @apiParam {Object} data
   * @apiParam {Object} data.position
   * @apiParam {Object} data.position.position
   * @apiParam {Number} data.position.position.longitude
   * @apiParam {Number} data.position.position.latitude
   * @apiParamExample {json} Request-Example:
   *   {
   *    "data": {
   *      "position": {
   *        "position": {
   *          "longitude": 55.401,
   *          "latitude": 12.0041
   *        }
   *      }
   *    }
   *  }
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object} data.positions New position for the user
   * @apiSuccessExample {json} Success-Response:
   *   {
   *    "data": {
   *      "positions": [
   *        {}
   *      ]
   *    }
   *  }
   */
  router.post('/users', (req, res) => {
    if (!objectValidator.isValidData(req.body, { data: { position: { position: { longitude: true, latitude: true } } } })) {
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

      dbLocation.updatePosition({
        positionName: decoded.data.userName,
        position: req.body.data.position.position,
        type: 'user',
        // TODO group: user.team
        callback: (posErr, position) => {
          if (posErr) {
            res.status(500).json({
              errors: [{
                status: 500,
                title: 'Internal Server Error',
                detail: 'Internal Server Error',
              }],
            });

            return;
          }

          // TODO Only to users that have tracking on?
          io.emit('mapPositions', {
            positions: [position],
            currentTime: (new Date()),
          });

          res.json({ data: { positions: [position] } });
        },
      });
    });
  });

  return router;
}

module.exports = handle;
