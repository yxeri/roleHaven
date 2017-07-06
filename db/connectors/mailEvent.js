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
const dbConnector = require('../databaseConnector');
const errorCreator = require('../../objects/error/errorCreator');

const mailEventSchema = new mongoose.Schema({
  owner: String,
  key: String,
  eventType: String,
  expiresAt: Date,
}, { collection: 'mailEvents' });

const MailEvent = mongoose.model('MailEvent', mailEventSchema);

/**
 * Remove mail event
 * @param {string} params.key Key to event
 * @param {Function} params.callback Callback
 */
function removeMailEventByKey({ key, callback }) {
  const query = { key };

  MailEvent.deleteOne(query).lean().exec((error) => {
    if (error) {
      callback({ error: new errorCreator.Database({ errorObject: error, name: 'removeMailEventByKey' }) });

      return;
    }

    callback({ data: { success: true } });
  });
}

/**
 * Remove mail event
 * @param {string} params.owner User name
 * @param {string} params.eventType Type of event
 * @param {Function} callback Callback
 */
function removeMailEvent({ owner, eventType, callback }) {
  const query = { owner, eventType };

  MailEvent.deleteOne(query).lean().exec((error) => {
    if (error) {
      callback({ error: new errorCreator.Database({ errorObject: error, name: 'removeMailEvent' }) });

      return;
    }

    callback({ data: { success: true } });
  });
}

/**
 * Get mail event
 * @param {string} params.key Key for the event
 * @param {Function} params.callback Callback
 */
function getMailEventByKey({ key, callback }) {
  const query = { key };

  MailEvent.findOne(query).lean().exec((error, event) => {
    if (error) {
      callback({ error: new errorCreator.Database({ errorObject: error, name: 'getMailEventByKey' }) });

      return;
    } else if (!event) {
      callback({ error: new errorCreator.DoesNotExist({ name: 'getMailEventByKey' }) });

      return;
    } else if (event.expiresAt < new Date()) {
      removeMailEventByKey({
        key,
        callback: () => {
          callback({ error: new errorCreator.Expired({ name: `${event.owner}`, expiredAt: event.expiresAt }) });
        },
      });

      return;
    }

    callback({ data: { event } });
  });
}

/**
 * Get mail event
 * @param {string} params.owner User name
 * @param {string} params.eventType Type of event
 * @param {Function} params.callback Callback
 */
function getMailEvent({ owner, eventType, callback }) {
  const query = { owner, eventType };

  MailEvent.findOne(query).lean().exec((error, event) => {
    if (error) {
      callback({ error: new errorCreator.Database({ errorObject: error, name: 'getMailEvent' }) });

      return;
    } else if (!event) {
      callback({ error: new errorCreator.DoesNotExist({ name: 'getMailEvent' }) });

      return;
    } else if (event.expiresAt < new Date()) {
      removeMailEvent({
        owner,
        eventType,
        callback: () => {
          callback({ error: new errorCreator.Expired({ name: `${event.owner}`, expiredAt: event.expiresAt }) });
        },
      });

      return;
    }

    callback({ data: { event } });
  });
}

/**
 * Create new timed event
 * @param {Object} params.timedEvent New mail event
 * @param {Function} params.callback Callback
 */
function createMailEvent({ mailEvent, callback }) {
  const newMailEvent = new MailEvent(mailEvent);
  const query = { owner: mailEvent.owner, key: mailEvent.key };

  MailEvent.findOne(query).lean().exec((error, event) => {
    if (error) {
      callback({ error: new errorCreator.Database({ errorObject: error, name: 'createMailEvent' }) });

      return;
    } else if (event) {
      callback({ error: new errorCreator.AlreadyExists({ errorObject: error, name: `mailEvent for ${mailEvent.owner}` }) });

      return;
    }

    dbConnector.saveObject({
      callback,
      object: newMailEvent,
      objectType: 'mailEvent',
    });
  });
}

exports.createMailEvent = createMailEvent;
exports.getMailEventByKey = getMailEventByKey;
exports.removeMailEvent = removeMailEventByKey;
exports.getMailEvent = getMailEvent;
exports.removeMailEvent = removeMailEvent;
