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
const deviceManager = require('../../managers/devices');
const restErrorChecker = require('../../helpers/restErrorChecker');
const errorCreator = require('../../objects/error/errorCreator');

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
  router.get('/', (request, response) => {
    deviceManager.getDevices({
      token: request.headers.authorization,
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
   * @api {post} /devices/:deviceId Update device. Will be created if it doesn't exist
   * @apiVersion 6.0.0
   * @apiName UpdateDevices
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
   * @apiSuccess {Object} [data.device.deviceAlias] Device alias
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
  router.post('/:deviceId', (request, response) => {
    if (!objectValidator.isValidData(request.params, { deviceId: true })) {
      restErrorChecker({ response, error: new errorCreator.InvalidData({ expected: '' }), sentData: request.body.data });

      return;
    }

    deviceManager.updateDevice({
      token: request.headers.authorization,
      device: { deviceId: request.params.deviceId },
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
   * @api {post} /devices/:deviceId/alias Update device alias
   * @apiVersion 6.0.0
   * @apiName UpdateDeviceAlias
   * @apiGroup Devices
   *
   * @apiHeader {String} Authorization Your JSON Web Token
   *
   * @apiDescription Update device. It will update lastAlive with current time and lastUser from token, if set
   *
   * @apiParam {String} deviceId Device deviceId
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
  router.post('/:deviceId/alias', (request, response) => {
    if (!objectValidator.isValidData(request.body, { data: { device: { deviceAlias: true } } })) {
      restErrorChecker({ response, error: new errorCreator.InvalidData({ expected: '' }), sentData: request.body.data });

      return;
    } else if (!objectValidator.isValidData(request.params, { deviceId: true })) {
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: '' }), sentData: request.body.data });

      return;
    }

    deviceManager.updateDeviceAlias({
      token: request.headers.authorization,
      device: {
        deviceId: request.params.deviceId,
        deviceAlias: request.body.data.device.deviceAlias,
      },
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
