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
const dbConfig = require('../../config/defaults/config').databasePopulation;
const objectValidator = require('../../utils/objectValidator');
const manager = require('../../helpers/manager');
const errorCreator = require('../../objects/error/errorCreator');
const authenticator = require('../../helpers/authenticator');

const router = new express.Router();

/**
 * @returns {Object} Router
 */
function handle() {
  /**
   * @api {get} /devices Get devices
   * @apiVersion 6.0.0
   * @apiName GetDevices
   * @apiGroup Devices
   *
   * @apiHeader {String} Authorization Your JSON Web Token
   *
   * @apiDescription Get devices
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object[]} data.devices Devices found
   * @apiSuccess {Object} data.devices.deviceId Unique device ID
   * @apiSuccess {Date} data.devices.lastAlive Date when the device was last updated
   * @apiSuccess {string} data.devices.deviceAlias More recognizable identificator than device ID. Defaults to deviceId
   * @apiSuccess {string} [data.devices.lastUser] Name of the last user logged in on device
   * @apiSuccessExample {json} Success-Response:
   *   {
   *    "data": {
   *      "devices": [
   *        {
   *          "deviceId": "LoPGj4i3l1Ac951Y",
   *          "lastAlive": "2016-10-14T11:13:03.555Z",
   *          "deviceAlias": minaDev,
   *          "lastUser": "mina"
   *        },
   *        {
   *          "deviceId": "594lKhgmYwRcZkLp",
   *          "lastAlive": "2016-10-14T11:13:03.555Z",
   *          "deviceAlias": 594lKhgmYwRcZkLp
   *        },
   *      ]
   *    }
   *  }
   */
  router.get('/', (req, res) => {
    authenticator.isUserAllowed({
      commandName: dbConfig.apiCommands.GetDevices.name,
      token: req.headers.authorization,
      callback: ({ error }) => {
        if (error) {
          if (error.type === errorCreator.ErrorTypes.DOESNOTEXIST) {
            res.status(404).json({
              error: {
                status: 404,
                title: 'Command does not exist',
                detail: 'Command does not exist',
              },
            });

            return;
          } else if (error.type === errorCreator.ErrorTypes.NOTALLOWED) {
            res.status(401).json({
              error: {
                status: 401,
                title: 'Unauthorized',
                detail: 'Invalid token',
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

        manager.getDevices({
          callback: ({ error: deviceError, data: deviceData }) => {
            if (deviceError) {
              res.status(500).json({
                error: {
                  status: 500,
                  title: 'Internal Server Error',
                  detail: 'Internal Server Error',
                },
              });

              return;
            }

            res.json({ data: deviceData });
          },
        });
      },
    });
  });

  /**
   * @api {post} /devices/:id Update device
   * @apiVersion 6.0.0
   * @apiName UpdateDevice
   * @apiGroup Devices
   *
   * @apiHeader {String} Authorization Your JSON Web Token
   *
   * @apiDescription Update device. It will update lastAlive with current time and lastUser from token, if set. It is accessible by anonymous users
   *
   * @apiParam {String} id Device id
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object} data.device Updated device
   * @apiSuccess {Object} data.device.deviceId Device id
   * @apiSuccess {Object} data.device.deviceAlias Device alias
   * @apiSuccess {Object} data.device.lastAlive Date when the device was last updated (now)
   * @apiSuccess {string} [data.devices.lastUser] Name of the last user logged in on device
   * @apiSuccessExample {json} Success-Response:
   *   {
   *    "data": {
   *      "device": {
   *        "deviceId": "594lKhgmYwRcZkLp",
   *        "lastAlive": "2016-10-14T11:13:03.555Z",
   *        "deviceAlias": 594lKhgmYwRcZkLp,
   *        "lastUser": "mina
   *      }
   *    }
   *  }
   */
  router.post('/:id', (req, res) => {
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

    authenticator.isUserAllowed({
      commandName: dbConfig.apiCommands.UpdateDevice.name,
      token: req.headers.authorization,
      callback: ({ error, data }) => {
        if (error) {
          if (error.type === errorCreator.ErrorTypes.DOESNOTEXIST) {
            res.status(404).json({
              error: {
                status: 404,
                title: 'Command does not exist',
                detail: 'Command does not exist',
              },
            });

            return;
          } else if (error.type === errorCreator.ErrorTypes.NOTALLOWED) {
            res.status(401).json({
              error: {
                status: 401,
                title: 'Unauthorized',
                detail: 'Invalid token',
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

        manager.updateDevice({
          device: { deviceId: req.params.id },
          user: data.user,
          callback: ({ error: deviceError, data: deviceData }) => {
            if (deviceError) {
              res.status(500).json({
                error: {
                  status: 500,
                  title: 'Internal Server Error',
                  detail: 'Internal Server Error',
                },
              });

              return;
            }

            res.json({ data: deviceData });
          },
        });
      },
    });
  });

  /**
   * @api {post} /devices/:id/alias Update device alias
   * @apiVersion 6.0.0
   * @apiName UpdateDeviceAlias
   * @apiGroup Devices
   *
   * @apiHeader {String} Authorization Your JSON Web Token
   *
   * @apiDescription Update device. It will update lastAlive with current time and lastUser from token, if set
   *
   * @apiParam {String} id Device id
   *
   * @apiParam {Object} data
   * @apiParam {string} data.device Device
   * @apiParam {string} data.device.deviceAlias New device alias
   * @apiParamExample {json} Request-Example:
   *   {
   *    "data": {
   *      "device": {
   *        "deviceAlias": "bananaman",
   *      }
   *    }
   *  }
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object} data.device Updated device
   * @apiSuccess {Object} data.device.deviceId Device id
   * @apiSuccess {Object} data.device.deviceAlias Device alias
   * @apiSuccess {Object} data.device.lastAlive Date when the device was last updated (now)
   * @apiSuccess {string} [data.devices.lastUser] Name of the last user logged in on device
   * @apiSuccessExample {json} Success-Response:
   *   {
   *    "data": {
   *      "device": {
   *        "deviceId": "594lKhgmYwRcZkLp",
   *        "lastAlive": "2016-10-14T11:13:03.555Z",
   *        "deviceAlias": "bananaman"
   *      }
   *    }
   *  }
   */
  router.post('/:id/alias', (req, res) => {
    if (!objectValidator.isValidData(req.body, { data: { device: { deviceAlias: true } } })) {
      res.status(400).json({
        error: {
          status: 400,
          title: 'Missing data',
          detail: 'Unable to parse data',
        },
      });

      return;
    } else if (!objectValidator.isValidData(req.params, { id: true })) {
      res.status(400).json({
        error: {
          status: 400,
          title: 'Missing data',
          detail: 'Unable to parse data',
        },
      });

      return;
    }

    authenticator.isUserAllowed({
      commandName: dbConfig.apiCommands.UpdateDeviceAlias.name,
      token: req.headers.authorization,
      callback: ({ error }) => {
        if (error) {
          if (error.type === errorCreator.ErrorTypes.DOESNOTEXIST) {
            res.status(404).json({
              error: {
                status: 404,
                title: 'Command does not exist',
                detail: 'Command does not exist',
              },
            });

            return;
          } else if (error.type === errorCreator.ErrorTypes.NOTALLOWED) {
            res.status(401).json({
              error: {
                status: 401,
                title: 'Unauthorized',
                detail: 'Invalid token',
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

        manager.updateDeviceAlias({
          device: {
            deviceId: req.params.id,
            deviceAlias: req.body.data.device.deviceAlias,
          },
          callback: ({ error: deviceError, data: deviceData }) => {
            if (deviceError) {
              res.status(500).json({
                error: {
                  status: 500,
                  title: 'Internal Server Error',
                  detail: 'Internal Server Error',
                },
              });

              return;
            }

            res.json({ data: deviceData });
          },
        });
      },
    });
  });

  return router;
}

module.exports = handle;
