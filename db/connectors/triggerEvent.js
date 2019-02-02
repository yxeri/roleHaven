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

const mongoose = require('mongoose');
const errorCreator = require('../../error/errorCreator');
const { dbConfig } = require('../../config/defaults/config');
const dbConnector = require('../databaseConnector');

const triggerEventSchema = new mongoose.Schema(dbConnector.createSchema({
  startTime: Date,
  terminationTime: Date,
  duration: Number,
  eventType: String,
  content: Object,
  iterations: Number,
  isRecurring: { type: Boolean, default: false },
  isActive: { type: Boolean, default: false },
  changeType: { type: String, default: dbConfig.TriggerChangeTypes.CREATE },
  triggeredBy: { type: [String], default: [] },
  shouldTargetSingle: { type: Boolean, default: false },
  singleUse: { type: Boolean, default: true },
  triggerType: { type: String, default: dbConfig.TriggerTypes.MANUAL },
  coordinates: {
    positionId: String,
    longitude: Number,
    latitude: Number,
    radius: Number,
  },
}), { collection: 'triggerEvents' });

const TriggerEvent = mongoose.model('TriggerEvent', triggerEventSchema);

/**
 * Update a trigger event object.
 * @param {Object} params Parameters.
 * @param {string} params.eventId Id of the event to update.
 * @param {Object} params.update Update.
 * @param {Function} params.callback Callback.
 */
function updateObject({
  eventId,
  update,
  callback,
  suppressError,
}) {
  const query = { _id: eventId };

  dbConnector.updateObject({
    update,
    query,
    suppressError,
    object: TriggerEvent,
    errorNameContent: 'updateTriggerEventObject',
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      callback({ data: { triggerEvent: data.object } });
    },
  });
}

/**
 * Get trigger events.
 * @private
 * @param {Object} params Parameters.
 * @param {Object} params.query Query to get events.
 * @param {Function} params.callback Callback.
 */
function getTriggerEvents({
  query,
  callback,
  filter,
}) {
  dbConnector.getObjects({
    query,
    filter,
    object: TriggerEvent,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      callback({ data: { triggerEvents: data.objects } });
    },
  });
}

/**
 * Get a trigger event.
 * @private
 * @param {Object} params Parameters.
 * @param {string} params.query Query to get an event.
 * @param {Function} params.callback Callback.
 */
function getTriggerEvent({ query, callback }) {
  dbConnector.getObject({
    query,
    object: TriggerEvent,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      if (!data.object) {
        callback({ error: new errorCreator.DoesNotExist({ name: `triggerEvent ${JSON.stringify(query, null, 4)}` }) });

        return;
      }

      callback({ data: { triggerEvent: data.object } });
    },
  });
}

/**
 * Create and save a trigger event.
 * @param {Object} params Parameters.
 * @param {Object} params.triggerEvent New triggerEvent.
 * @param {Function} params.callback Callback.
 */
function createTriggerEvent({ triggerEvent, callback }) {
  dbConnector.saveObject({
    object: new TriggerEvent(triggerEvent),
    objectType: 'triggerEvent',
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      callback({ data: { triggerEvent: data.savedObject } });
    },
  });
}

/**
 * Update event properties.
 * @param {Object} params Parameters.
 * @param {Function} params.callback Callback.
 * @param {Object} params.triggerEvent Properties to update in the event.
 */
function updateTriggerEvent({
  eventId,
  triggerEvent,
  callback,
  options = {},
}) {
  const {
    startTime,
    terminationTime,
    duration,
    isRecurring,
    eventType,
    content,
    isActive,
    iterations,
  } = triggerEvent;
  const {
    resetTerminatonTime,
    resetDuration,
  } = options;
  const update = {};
  const set = {};
  const unset = {};

  if (resetDuration) {
    unset.duration = '';
  } else if (duration) {
    set.duration = duration;
  }

  if (resetTerminatonTime) {
    unset.terminationTime = '';
  } else if (terminationTime) {
    set.terminationTime = terminationTime;
  }

  if (startTime) { set.startTime = startTime; }
  if (eventType) { set.eventType = eventType; }
  if (content) { set.content = content; }
  if (isRecurring) { set.isRecurring = isRecurring; }
  if (isActive) { set.isActive = isActive; }
  if (iterations) { set.iterations = iterations; }

  if (Object.keys(set).length > 0) { update.$set = set; }
  if (Object.keys(unset).length > 0) { update.$unset = unset; }

  updateObject({
    eventId,
    update,
    callback,
  });
}

/**
 * Update access to the trigger event.
 * @param {Object} params Parameters.
 * @param {Function} params.callback Callback.
 * @param {boolean} [params.shouldRemove] Should access be removed?
 * @param {string[]} [params.userIds] Id of the users to update.
 * @param {string[]} [params.teamIds] Id of the teams to update.
 * @param {string[]} [params.bannedIds] Id of the blocked Ids to update.
 * @param {string[]} [params.teamAdminIds] Id of the teams to update admin access for.
 * @param {string[]} [params.userAdminIds] Id of the users to update admin access for.
 */
function updateAccess(params) {
  const accessParams = params;
  const { callback } = params;
  accessParams.objectId = params.eventId;
  accessParams.object = TriggerEvent;
  accessParams.callback = ({ error, data }) => {
    if (error) {
      callback({ error });

      return;
    }

    callback({ data: { device: data.object } });
  };

  if (params.shouldRemove) {
    dbConnector.removeObjectAccess(params);
  } else {
    dbConnector.addObjectAccess(params);
  }
}

/**
 * Remove a trigger event.
 * @param {Object} params Parameters.
 * @param {string} params.eventId Id of the event.
 * @param {Function} params.callback Callback.
 */
function removeTriggerEvent({ eventId, callback }) {
  dbConnector.removeObject({
    callback,
    object: TriggerEvent,
    query: { _id: eventId },
  });
}

/**
 * Get a trigger event by its Id.
 * @param {Object} params Parameters.
 * @param {string} params.eventId Id of the event.
 * @param {Function} params.callback Callback.
 */
function getTriggerEventById({ eventId, callback }) {
  getTriggerEvent({
    callback,
    query: { _id: eventId },
  });
}

/**
 * Get files by the owner.
 * @param {Object} params Parameters.
 * @param {string} params.ownerId Id of the owner.
 * @param {Function} params.callback Callback.
 */
function getTriggerEventsByOwner({
  ownerId,
  callback,
}) {
  const query = { ownerId };

  getTriggerEvents({
    query,
    callback,
  });
}

/**
 * Get timed events.
 * @param {Object} params Parameters.
 * @param {Function} params.callback Callback.
 */
function getTimedTriggerEvents({ callback }) {
  const query = {
    $or: [
      { isRecurring: true },
      { startTime: { $exists: true } },
      { terminationTime: { $exists: true } },
    ],
  };

  getTriggerEvents({
    query,
    callback,
  });
}

exports.getTriggerEventById = getTriggerEventById;
exports.removeTriggerEvent = removeTriggerEvent;
exports.updateAccess = updateAccess;
exports.createTriggerEvent = createTriggerEvent;
exports.updateTriggerEvent = updateTriggerEvent;
exports.getTriggerEventsByOwner = getTriggerEventsByOwner;
exports.getTimedTriggerEvents = getTimedTriggerEvents;
