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

const mongoose = require('mongoose');
const databaseConnector = require('../databaseConnector');
const errorCreator = require('../../objects/error/errorCreator');
// const GameEvent = require('../../objects/GameEvent');

const timedEventSchema = new mongoose.Schema({
  steps: [{
    unlocks: [
      [{
        unlockType: String,
      }],
    ],
  }],
}, { collection: 'timedEvents' });

const TimedEvent = mongoose.model('TimedEvent', timedEventSchema);

/**
 * Create new timed event
 * @param {Object} params.timedEvent New timed event
 * @param {Function} params.callback Callback
 */
function createTimedEvent({ timedEvent, callback }) {
  const newTimedEvent = new TimedEvent(timedEvent);

  databaseConnector.saveObject({
    callback,
    object: newTimedEvent,
    objectType: 'timedEvent',
  });
}

/**
 * Get timed event
 * @param {string} params.owner User name
 * @param {string} params.id Id of the event
 * @param {Function} params.callback Callback
 */
function getTimedEvent({ owner, id, callback }) {
  const query = { owner, id };

  TimedEvent.findOne(query).lean().exec((error, event) => {
    if (error) {
      callback({ error: new errorCreator.Database({ errorObject: error, name: 'getTimedEvent' }) });

      return;
    } else if (!event) {
      callback({ error: new errorCreator.DoesNotExist({ name: 'getTimedEvent' }) });

      return;
    }

    callback({ data: { event } });
  });
}

/**
 * Get timed events from owner
 * @param {string} params.owner User name
 * @param {Function} params.callback Callback
 */
function getTimedEventsByOwner({ owner, callback }) {
  const now = new Date();
  const query = {
    owner,
    triggerTime: { $lte: now },
  };

  TimedEvent.find(query).lean().exec((error, foundEvents = []) => {
    if (error) {
      callback({ error: new errorCreator.Database({ errorObject: error, name: 'getTimedEventsByOwner' }) });

      return;
    }

    callback({
      data: {
        foundEvents,
        // events: foundEvents.filter((event) => {
        //   const future = new Date();
        //   future.setMinutes(future.getMinutes() + event.duration);
        // }),
      },
    });
  });
}

exports.createTimedEvent = createTimedEvent;
exports.getTimedEvent = getTimedEvent;
exports.getTimedEventsByOwner = getTimedEventsByOwner;
