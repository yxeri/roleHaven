'use strict';

import express from 'express';
import errorCreator from '../../../error/errorCreator';
import restErrorChecker from '../../../helpers/restErrorChecker';
import lanternStationManager from '../../../managers/bbr/lanternStations';
import objectValidator from '../../../utils/objectValidator';

const router = new express.Router();

/**
 * @param {Object} io Socket io
 * @returns {Object} Router
 */
function handle(io) {
  /**
   * @api {delete} /lanternTeams/:teamId Delete existing lantern station
   * @apiVersion 6.0.0
   * @apiName DeleteLanternStation
   * @apiGroup LanternStations
   *
   * @apiHeader {String} Authorization Your JSON Web Token
   *
   * @apiDescription Delete existing lantern team
   *
   * @apiParam {number} teamId Team id
   *
   * @apiSuccess {Object} data
   * @apiSuccessExample {json} Success-Response:
   *   {
   *    "data": {
   *      "success": true
   *    }
   *  }
   */
  router.delete('/:stationId', (request, response) => {
    if (!objectValidator.isValidData(request.params, { stationId: true })) {
      restErrorChecker.checkAndSendError({
        response,
        error: new errorCreator.InvalidData({ expected: '' }),
        sentData: request.body.data,
      });

      return;
    }

    lanternStationManager.deleteLanternStation({
      token: request.headers.authorization,
      stationId: request.params.stationId,
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
   * @api {get} /lanternStations Get lantern stations
   * @apiVersion 6.0.0
   * @apiName GetLanternStations
   * @apiGroup LanternStations
   *
   * @apiHeader {String} Authorization Your JSON Web Token
   *
   * @apiDescription Get lantern stations
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object} data.stations Lantern stations found
   * @apiSuccessExample {json} Success-Response:
   *   {
   *    "data": {
   *      "stations": [{
   *        "stationId": 1,
   *        "owner": 1,
   *        "isActive": true,
   *        "stationName:" "North forest",
   *        "signalValue": 137
   *      }, {
   *        "stationId": 2,
   *        "owner": 3,
   *        "isActive": fale,
   *        "stationName:" "West bunker",
   *        "signalValue": 66
   *      }
   *    }
   *  }
   */
  router.get('/', (request, response) => {
    lanternStationManager.getLanternStations({
      token: request.headers.authorization,
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
   * @api {get} /lanternStations/:stationId Get lantern station
   * @apiVersion 6.0.0
   * @apiName GetLanternStation
   * @apiGroup LanternStations
   *
   * @apiHeader {String} Authorization Your JSON Web Token
   *
   * @apiDescription Get lantern station
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object} data.stations Lantern stations found
   * @apiSuccessExample {json} Success-Response:
   *   {
   *    "data": {
   *      "stations": [{
   *        "stationId": 1,
   *        "owner": 3
   *        "isActive": true,
   *        "stationName:" "North forest",
   *        "signalValue": 137
   *      }, {
   *        "stationId": 2,
   *        "owner": 1
   *        "isActive": fale,
   *        "stationName:" "West bunker",
   *        "signalValue": 66
   *      }
   *    }
   *  }
   */
  router.get('/:stationId', (request, response) => {
    lanternStationManager.getLanternStation({
      stationId: request.params.stationId,
      token: request.headers.authorization,
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
   * @api {post} /lanternStations Create a lantern station
   * @apiVersion 6.0.0
   * @apiName CreateLanternStation
   * @apiGroup LanternStations
   *
   * @apiHeader {String} Authorization Your JSON Web Token
   *
   * @apiDescription Create a lantern station
   *
   * @apiParam {Object} data
   * @apiParam {string} data.station New station
   * @apiParam {number} data.station.stationId Station id
   * @apiParam {string} data.station.stationName Location name of the station
   * @apiParam {boolean} [data.station.isActive] Is the station active? Defaults to false
   * @apiParam {number} [data.station.calibrationReward] Amount of digital currency sent to user
   * @apiParamExample {json} Request-Example:
   *   {
   *    "data": {
   *      "station": {
   *        "stationId": 1,
   *        "stationName": "North forest",
   *        "isActive": true
   *      }
   *    }
   *  }
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object[]} data.station Lantern station created
   * @apiSuccessExample {json} Success-Response:
   *   {
   *    "data": {
   *      "station": {
   *        "stationId": 1,
   *        "stationName": "North forest,
   *        "isActive": true,
   *        "signalValue": 100,
   *        "calibrationReward": 10
   *      }
   *    }
   *  }
   */
  router.post('/', (request, response) => {
    if (!objectValidator.isValidData(request.body, {
      data: {
        station: {
          stationId: true,
          stationName: true,
        },
      },
    })) {
      restErrorChecker.checkAndSendError({
        response,
        error: new errorCreator.InvalidData({ expected: '' }),
        sentData: request.body.data,
      });

      return;
    }

    lanternStationManager.createLanternStation({
      io,
      station: request.body.data.station,
      token: request.headers.authorization,
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
   * @api {post} /lanternStations/:stationId Update an existing lantern station
   * @apiVersion 6.0.0
   * @apiName UpdateLanternStation
   * @apiGroup LanternStations
   *
   * @apiHeader {String} Authorization Your JSON Web Token
   *
   * @apiDescription Update an existing lantern station
   *
   * @apiParam {Object} stationId Lantern station id
   *
   * @apiParam {Object} data
   * @apiParam {string} data.station Station
   * @apiParam {string} [data.station.stationName] Location name of the station.
   * @apiParam {boolean} [data.station.isActive] Is the station active?
   * @apiParam {number} [data.station.owner] Team id of the owner. Will be ignored if resetOwner is set. owner === -1 act the same as setting resetOwner to true.
   * @apiParam {number} [data.station.resetOwner] Should the owner be removed? Will also set isUnderAttack to false.
   * @apiParam {Object} [data.station.isUnderAttack] Is the station under attack? Will be ignored if resetOwner or owner === -1 is set.
   * @apiParam {number} [data.station.calibrationReward] Amount of digital currency sent to user.
   * @apiParamExample {json} Request-Example:
   *   {
   *    "data": {
   *      "station": {
   *        "stationName": "North forest",
   *        "isActive": true,
   *        "isUnderAttack": true
   *      }
   *    }
   *  }
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object[]} data.station Updated lantern station
   * @apiSuccessExample {json} Success-Response:
   *   {
   *    "data": {
   *      "station": {
   *        "stationId": 1,
   *        "stationName": "North forest",
   *        "isActive": true,
   *        "signalValue": 0,
   *        "isUnderAttack": true,
   *        "calibrationReward": 5
   *      }
   *    }
   *  }
   */
  router.post('/:stationId', (request, response) => {
    if (!objectValidator.isValidData(request.params, { stationId: true })) {
      restErrorChecker.checkAndSendError({
        response,
        error: new errorCreator.InvalidData({ expected: '' }),
        sentData: request.body.data,
      });

      return;
    }

    if (!objectValidator.isValidData(request.body, { data: { station: true } })) {
      restErrorChecker.checkAndSendError({
        response,
        error: new errorCreator.InvalidData({ expected: '' }),
        sentData: request.body.data,
      });

      return;
    }

    lanternStationManager.updateLanternStation({
      io,
      stationId: request.params.stationId,
      station: request.body.data.station,
      token: request.headers.authorization,
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
