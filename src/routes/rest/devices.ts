'use strict';

import express from 'express';
import objectValidator from '../../utils/objectValidator';
import deviceManager from '../../managers/devices';
import restErrorChecker from '../../helpers/restErrorChecker';
import errorCreator from '../../error/errorCreator';

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
   * @apiParam {Object} data Body params.
   * @apiParam {Device} data.device Device to create.
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Device[]} data.device Created device.
   */
  router.post('/', (request, response) => {
    if (!objectValidator.isValidData(request.body, { data: { device: { deviceName: true } } })) {
      restErrorChecker.checkAndSendError({
        response,
        error: new errorCreator.InvalidData({ expected: 'data = { device: { deviceName } }' }),
        sentData: request.body.data,
      });

      return;
    }

    const { device } = request.body.data;
    const { authorization: token } = request.headers;

    deviceManager.createDevice({
      io,
      token,
      device,
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
   * @api {get} /devices Get devices
   * @apiVersion 8.0.0
   * @apiName GetDevices
   * @apiGroup Devices
   *
   * @apiHeader {string} Authorization Your JSON Web Token.
   *
   * @apiDescription Get devices that the user has access to.
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Device[]} data.devices Found devices.
   */
  router.get('/', (request, response) => {
    const { authorization: token } = request.headers;

    deviceManager.getDevicesByUser({
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
   * @api {get} /devices/:deviceId Get a device
   * @apiVersion 8.0.0
   * @apiName GetDevice
   * @apiGroup Devices
   *
   * @apiHeader {string} Authorization Your JSON Web Token.
   *
   * @apiDescription Get a device that the user has access to.
   *
   * @apiParam {string} deviceId [Url] Id of the device to retrieve.
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Device} data.device Found device.
   */
  router.get('/:deviceId', (request, response) => {
    if (!objectValidator.isValidData(request.params, { deviceId: true })) {
      restErrorChecker.checkAndSendError({
        response,
        error: new errorCreator.InvalidData({ expected: 'params = { deviceId }' }),
      });

      return;
    }

    const { deviceId } = request.params;
    const { authorization: token } = request.headers;

    deviceManager.getDeviceById({
      deviceId,
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
   * @api {put} /devices/:deviceId Update a device
   * @apiVersion 8.0.0
   * @apiName UpdateDevice
   * @apiGroup Devices
   *
   * @apiHeader {string} Authorization Your JSON Web Token.
   *
   * @apiDescription Update a device.
   *
   * @apiParam {string} deviceId [Url] Id of the device to update.
   *
   * @apiParam {Object} data Body params.
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
      restErrorChecker.checkAndSendError({
        response,
        error: new errorCreator.InvalidData({ expected: 'params = { deviceId }' }),
      });

      return;
    }

    if (!objectValidator.isValidData(request.body, { data: { device: true } })) {
      restErrorChecker.checkAndSendError({
        response,
        error: new errorCreator.InvalidData({ expected: 'data = { device }' }),
        sentData: request.body.data,
      });

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
   * @api {delete} /devices/:deviceId Delete a device
   * @apiVersion 8.0.0
   * @apiName DeleteDevice
   * @apiGroup Devices
   *
   * @apiHeader {string} Authorization Your JSON Web Token.
   *
   * @apiDescription Delete a device.
   *
   * @apiParam {string} deviceId [Url] Id of the device to delete.
   *
   * @apiSuccess {Object} data
   * @apiSuccess {boolean} data.success Was it successfully deleted?
   */
  router.delete('/:deviceId', (request, response) => {
    if (!objectValidator.isValidData(request.params, { deviceId: true })) {
      restErrorChecker.checkAndSendError({
        response,
        error: new errorCreator.InvalidData({ expected: 'params = { deviceId }' }),
      });

      return;
    }

    const { deviceId } = request.params;
    const { authorization: token } = request.headers;

    deviceManager.removeDevice({
      io,
      deviceId,
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

  return router;
}

export default handle;
