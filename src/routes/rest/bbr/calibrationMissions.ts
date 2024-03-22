'use strict';

import express from 'express';
import errorCreator from '../../../error/errorCreator';
import restErrorChecker from '../../../helpers/restErrorChecker';
import calibrationMissionsManager from '../../../managers/bbr/calibrationMissions';
import objectValidator from '../../../utils/objectValidator';

const router = new express.Router();

/**
 * @param {Object} io Socket.io
 * @returns {Object} Router
 */
function handle(io) {
  /**
   * @api {get} /calibrationMissions/ Get all calibration missions
   * @apiVersion 6.0.0
   * @apiName GetCalibrationMissions
   * @apiGroup CalibrationMissions
   *
   * @apiHeader {String} Authorization Your JSON Web Token
   *
   * @apiDescription Get all calibration missions
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object[]} data.mission Missions found
   * @apiSuccessExample {json} Success-Response:
   *   {
   *    "data": {
   *      "missions": [{
   *        owner: 'raz',
   *        stationId: 1,
   *        code: 81855211,
   *        completed: false,
   *      }, {
   *        owner: 'mina',
   *        stationId: 2,
   *        code: 81844411,
   *        completed: false,
   *      }]
   *    }
   *  }
   */
  router.get('/', (request, response) => {
    calibrationMissionsManager.getCalibrationMissions({
      token: request.headers.authorization,
      getInactive: true,
      callback: ({
        error: calibrationError,
        data: calibrationData,
      }) => {
        if (calibrationError) {
          restErrorChecker.checkAndSendError({
            response,
            error: calibrationError,
            sentData: request.body.data,
          });

          return;
        }

        response.json({ data: calibrationData });
      },
    });
  });

  /**
   * @api {delete} /calibrationMissions/ Delete all calibration missions for a specific station
   * @apiVersion 6.0.0
   * @apiName RemoveCalibrationMissionsByStationId
   * @apiGroup CalibrationMissions
   *
   * @apiHeader {String} Authorization Your JSON Web Token
   *
   * @apiDescription Delete all calibration missions for a specific station
   *
   * @apiParam {Object} data
   * @apiParam {string} data.alias Alias
   * @apiParamExample {json} Request-Example:
   *   {
   *    "data": {
   *      "stationId": 1
   *    }
   *  }
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object[]} data.mission Missions found
   * @apiSuccessExample {json} Success-Response:
   *   {
   *    "data": {
   *      "success": true
   *    }
   *  }
   */
  router.delete('/', (request, response) => {
    if (!objectValidator.isValidData(request.body, { data: { stationId: true } })) {
      restErrorChecker.checkAndSendError({
        response,
        error: new errorCreator.InvalidData({ expected: '' }),
        sentData: request.body.data,
      });

      return;
    }

    calibrationMissionsManager.removeCalibrationMissionsById({
      io,
      stationId: request.body.data.stationId,
      token: request.headers.authorization,
      callback: ({
        error: calibrationError,
        data: calibrationData,
      }) => {
        if (calibrationError) {
          restErrorChecker.checkAndSendError({
            response,
            error: calibrationError,
            sentData: request.body.data,
          });

          return;
        }

        response.json({ data: calibrationData });
      },
    });
  });

  /**
   * @api {get} /calibrationMissions/active Get all active calibration missions
   * @apiVersion 6.0.0
   * @apiName GetActiveCalibrationMissions
   * @apiGroup CalibrationMissions
   *
   * @apiHeader {String} Authorization Your JSON Web Token
   *
   * @apiDescription Get all active calibration missions
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object[]} data.mission Missions found
   * @apiSuccessExample {json} Success-Response:
   *   {
   *    "data": {
   *      "missions": [{
   *        owner: 'raz',
   *        stationId: 1,
   *        code: 81855211,
   *        completed: false,
   *      }, {
   *        owner: 'mina',
   *        stationId: 2,
   *        code: 81844411,
   *        completed: true,
   *        timeCompleted: "2016-10-28T22:42:06.262Z"
   *      }]
   *    }
   *  }
   */
  router.get('/active', (request, response) => {
    calibrationMissionsManager.getCalibrationMissions({
      token: request.headers.authorization,
      callback: ({
        error: calibrationError,
        data: calibrationData,
      }) => {
        if (calibrationError) {
          restErrorChecker.checkAndSendError({
            response,
            error: calibrationError,
            sentData: request.body.data,
          });

          return;
        }

        response.json({ data: calibrationData });
      },
    });
  });

  /**
   * @api {post} /users/:userName/calibrationMission/complete Complete user's calibration mission
   * @apiVersion 6.0.0
   * @apiName CompleteCalibrationMission
   * @apiGroup Users
   *
   * @apiHeader {string} Authorization Your JSON Web Token
   *
   * @apiDescription Complete the mission. A transaction will be created
   *
   * @apiParam {String} userName Owner of the mission
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object[]} data.mission Mission completed
   * @apiSuccess {Object[]} data.transaction Transaction for completed mission
   * @apiSuccessExample {json} Success-Response:
   *   {
   *    "data": {
   *      "mission": {
   *        "code": 12345678,
   *        "stationId": 1,
   *        "completed": true,
   *        "timeCompleted": "2016-10-14T11:13:03.555Z"
   *      },
   *      "transaction": {
   *        "to": "raz",
   *        "from": "SYSTEM",
   *        "amount": 50
   *        "time": "2016-10-14T11:13:03.555Z"
   *      }
   *    }
   *  }
   */
  router.post('/:userName/calibrationMission/complete', (request, response) => {
    calibrationMissionsManager.completeActiveCalibrationMission({
      io,
      token: request.headers.authorization,
      ownerName: request.params.userName,
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
   * @api {post} /users/:userName/calibrationMission/cancel Cancel user's mission
   * @apiVersion 6.0.0
   * @apiName CancelCalibrationMission
   * @apiGroup Users
   *
   * @apiHeader {String} Authorization Your JSON Web Token
   *
   * @apiDescription Cancel a calibration mission. Mission will still be set to completed, but no transaction will be created
   *
   * @apiParam {String} userName Owner of the mission
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object[]} data.mission Mission completed
   * @apiSuccess {Boolean} data.cancelled Was mission cancelled?
   * @apiSuccessExample {json} Success-Response:
   *   {
   *    "data": {
   *      "mission": {
   *        "code": 12345678,
   *        "stationId": 1,
   *        "completed": true,
   *        "timeCompleted": "2016-10-14T11:13:03.555Z"
   *      },
   *      "cancelled": true
   *    }
   *  }
   */
  router.post('/:userName/calibrationMission/cancel', (request, response) => {
    calibrationMissionsManager.cancelActiveCalibrationMission({
      io,
      token: request.headers.authorization,
      owner: request.params.userName,
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

  return router;
}

export default handle;
