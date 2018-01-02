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
 * @param {Object} io Socket.io.
 * @returns {Object} Router
 */
function handle(io) {
  /**
   * @api {post} /devices Create a device
   * @apiVersion 8.0.0
   * @apiName CreateDevice
   * @apiGroup Devices
   *
   * @apiHeader {string} Authorization Your JSON Web Token.
   *
   * @apiDescription Create a device.
   *
   * @apiParam {Object} data
   * @apiParam {Device} data.device Device to create.
   * @apiParam {string} [data.userId] Id of the user creating the file. It will default to the token owner.
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Device[]} data.device Created device.
   */
  router.post('/', (request, response) => {
    if (!objectValidator.isValidData(request.body, { data: { device: { deviceName: true } } })) {
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: 'data = { device: { deviceName } }' }), sentData: request.body.data });

      return;
    }

    const { device, userId } = request.body.data;
    const { authorization: token } = request.headers;

    deviceManager.createDevice({
      io,
      userId,
      token,
      device,
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
   * @api {get} /devices Get devices
   * @apiVersion 8.0.0
   * @apiName GetDevices
   * @apiGroup Devices
   *
   * @apiHeader {string} Authorization Your JSON Web Token.
   *
   * @apiDescription Get devices that the user has access to.
   *
   * @apiParam {Object} [data]
   * @apiParam {string} data.userId Id of the user retrieving the devices.
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Device[]} data.devices Found devices.
   */
  router.get('/', (request, response) => {
    const { userId } = request.body.data;
    const { authorization: token } = request.headers;

    deviceManager.getDevicesByUser({
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
   * @api {get} /devices/:deviceId Get a device
   * @apiVersion 8.0.0
   * @apiName GetDevice
   * @apiGroup Devices
   *
   * @apiHeader {string} Authorization Your JSON Web Token.
   *
   * @apiDescription Get a device that the user has access to.
   *
   * @apiParam {string} deviceId Id of the device to retrieve.
   *
   * @apiParam {Object} [data]
   * @apiParam {string} [data.userId] Id of the user retrieving the device.
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Device} data.device Device found.
   */
  router.get('/:deviceId', (request, response) => {
    if (!objectValidator.isValidData(request.params, { deviceId: true })) {
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: 'params = { deviceId }' }), sentData: request.params });

      return;
    }

    const { userId } = request.body.data;
    const { deviceId } = request.params;
    const { authorization: token } = request.headers;

    deviceManager.getDevice({
      userId,
      deviceId,
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
   * @api {put} /devices/:deviceId Update a device
   * @apiVersion 8.0.0
   * @apiName UpdateDevice
   * @apiGroup Devices
   *
   * @apiHeader {string} Authorization Your JSON Web Token.
   *
   * @apiDescription Update a device.
   *
   * @apiParam {string} deviceId Id of the device to update.
   *
   * @apiParam {Object} data
   * @apiParam {Device} data.device Device parameters to update.
   * @apiParam {Object} [data.options] Update options.
   * @apiParam {Object} [data.options.resetSocket] Should the socket Id be removed from the device?
   * @apiParam {Object} [data.options.resetOwnerAliasId] Should the owner alias Id be removed from the device?
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Device} data.device Updated device.
   */
  router.put('/:deviceId', (request, response) => {
    if (!objectValidator.isValidData(request.params, { deviceId: true })) {
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: 'params = { deviceId }' }) });

      return;
    } else if (!objectValidator.isValidData(request.body, { data: { device: true } })) {
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: 'data = { device }' }), sentData: request.body.data });

      return;
    }

    const {
      device,
      options,
    } = request.body.data;
    const { deviceId } = request.params;
    const { authorization: token } = request.headers;

    deviceManager.updateDevice({
      device,
      options,
      io,
      deviceId,
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
   * @api {delete} /devices/:deviceId Delete a device
   * @apiVersion 8.0.0
   * @apiName DeleteDevice
   * @apiGroup Devices
   *
   * @apiHeader {string} Authorization Your JSON Web Token.
   *
   * @apiDescription Delete a device.
   *
   * @apiParam {string} deviceId Id of the device to delete.
   *
   * @apiParam {Object} [data]
   * @apiParam {string} [data.userId] Id of the user deleting the device.
   *
   * @apiSuccess {Object} data
   * @apiSuccess {boolean} data.success Was it successfully deleted?
   */
  router.delete('/:deviceId', (request, response) => {
    if (!objectValidator.isValidData(request.params, { deviceId: true })) {
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: 'params = { deviceId }' }), sentData: request.params });

      return;
    }

    const { userId } = request.body.data;
    const { deviceId } = request.params;
    const { authorization: token } = request.headers;

    deviceManager.removeDevice({
      userId,
      io,
      deviceId,
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
