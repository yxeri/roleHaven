/*
 Copyright 2019 Carmilla Mina Jankovic

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
const triggerEventManager = require('../../managers/triggerEvents');
const restErrorChecker = require('../../helpers/restErrorChecker');
const errorCreator = require('../../error/errorCreator');

const router = new express.Router();

/**
 * @param {Object} io Socket io
 * @returns {Object} Router
 */
function handle(io) {
  /**
   * @api {post} /triggerEvents Create a trigger event
   * @apiVersion 8.0.0
   * @apiName CreateTriggerEvent
   * @apiGroup TriggerEvents
   *
   * @apiHeader {string} Authorization Your JSON Web Token.
   *
   * @apiDescription Create a trigger event.
   *
   * @apiParam {Object} data
   * @apiParam {Transaction} data.triggerEvent Trigger event to create.
   *
   * @apiSuccess {Object} data
   * @apiSuccess {TriggerEvent} data.triggerEvent Created trigger event.
   */
  router.post('/', (request, response) => {
    if (!objectValidator.isValidData(request.body.data, { triggerEvent: { eventType: true, content: true } })) {
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: 'data = { triggerEvent: { content, eventType ' }), sentData: request.body.data });

      return;
    }

    const { triggerEvent } = request.body.data;
    const { authorization: token } = request.headers;

    triggerEventManager.createTriggerEvent({
      io,
      triggerEvent,
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
   * @api {get} /triggerEvents/:eventIdId Get a trigger event
   * @apiVersion 8.0.0
   * @apiName GetTriggerEvent
   * @apiGroup TriggerEvents
   *
   * @apiHeader {string} Authorization Your JSON Web Token.
   *
   * @apiDescription Get a trigger event that the user has access to.
   *
   * @apiParam {string} eventId [Url] Id of the event to retrieve.
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Transaction} data.triggerEvent Found trigger event.
   */
  router.get('/:eventId', (request, response) => {
    if (!objectValidator.isValidData(request.params, { eventId: true })) {
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: 'params = { eventId }' }) });

      return;
    }

    const { eventId } = request.params;
    const { authorization: token } = request.headers;

    triggerEventManager.getTriggerEventById({
      eventId,
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
   * @api {get} /triggerEvents/ Get trigger events
   * @apiVersion 8.0.0
   * @apiName GetTriggerEvents
   * @apiGroup TriggerEvents
   *
   * @apiHeader {string} Authorization Your JSON Web Token.
   *
   * @apiDescription Get trigger events that the user has access to.
   *
   * @apiSuccess {Object} data
   * @apiSuccess {TriggerEvents[]} data.triggerEvents Found trigger events.
   */
  router.get('/', (request, response) => {
    const { authorization: token } = request.headers;

    triggerEventManager.getTriggerEventsByOwner({
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
   * @api {delete} /triggerEvents/:eventId Delete an event
   * @apiVersion 8.0.0
   * @apiName DeleteTriggerEvent
   * @apiGroup TriggerEvents
   *
   * @apiHeader {string} Authorization Your JSON Web Token.
   *
   * @apiDescription Delete an event.
   *
   * @apiParam {string} eventId Id of the event to delete.
   *
   * @apiSuccess {Object} data
   * @apiSuccess {boolean} data.success Was it successfully deleted?
   */
  router.delete('/:eventId', (request, response) => {
    if (!objectValidator.isValidData(request.params, { eventId: true })) {
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: 'params = { eventId }' }) });

      return;
    }

    const { eventId } = request.params;
    const { authorization: token } = request.headers;

    triggerEventManager.removeTriggerEvent({
      io,
      eventId,
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
   * @api {put} /triggerEvents/:eventId Update an event
   * @apiVersion 8.0.0
   * @apiName UpdateTriggerEvent
   * @apiGroup TriggerEvents
   *
   * @apiHeader {string} Authorization Your JSON Web Token.
   *
   * @apiDescription Update an event.
   *
   * @apiParam {string} eventId Id of the event to update.
   *
   * @apiParam {Object} data Body parameters.
   * @apiParam {TriggerEvent} data.triggerEvent Trigger event parameters to update.
   * @apiParam {Object} [data.options] Update options.
   *
   * @apiSuccess {Object} data
   * @apiSuccess {TriggerEvent} data.triggerEvent Updated event.
   */
  router.put('/:eventId', (request, response) => {
    if (!objectValidator.isValidData(request.params, { eventId: true })) {
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: 'params = { eventId }' }) });

      return;
    }

    if (!objectValidator.isValidData(request.body, { data: { triggerEvent: true } })) {
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: 'data = { triggerEvent }' }), sentData: request.body.data });

      return;
    }

    const {
      triggerEvent,
      options,
    } = request.body.data;
    const { eventId } = request.params;
    const { authorization: token } = request.headers;

    triggerEventManager.updateTriggerEvent({
      triggerEvent,
      options,
      io,
      eventId,
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
   * @api {post} /triggerEvents/:eventId/run Run an event
   * @apiVersion 8.0.0
   * @apiName RunTriggerEvent
   * @apiGroup TriggerEvents
   *
   * @apiHeader {string} Authorization Your JSON Web Token.
   *
   * @apiDescription Immediately run an event, instead of waiting for the trigger to happen.
   *
   * @apiParam {string} eventId Id of the event to run.
   *
   * @apiSuccess {Object} data
   * @apiSuccess {TriggerEvent} data.triggerEvent Event that was run.
   */
  router.post('/:eventId/run', (request, response) => {
    if (!objectValidator.isValidData(request.params, { eventId: true })) {
      restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: 'params = { eventId }' }) });

      return;
    }

    const { eventId } = request.params;
    const { authorization: token } = request.headers;

    triggerEventManager.runEvent({
      io,
      eventId,
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
