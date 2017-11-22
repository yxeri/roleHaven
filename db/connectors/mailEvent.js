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

const mailEventSchema = new mongoose.Schema(dbConnector.createSchema({
  key: { type: String, unique: true },
  ownerId: String,
  eventType: String,
  expiresAt: Date,
}), { collection: 'mailEvents' });
const blockedMailSchema = new mongoose.Schema(dbConnector.createSchema({
  mailDomains: { type: [String], default: [] },
  addresses: { type: [String], default: [] },
}), { collection: 'blockedMailAddresses' });

const MailEvent = mongoose.model('MailEvent', mailEventSchema);
const BlockedMail = mongoose.model('BlockedMailAddress', blockedMailSchema);

/**
 * Add custom id to the object
 * @param {Object} mailEvent - Mail event object
 * @return {Object} - Mail event object with id
 */
function addCustomId(mailEvent) {
  const updatedMailEvent = mailEvent;
  updatedMailEvent.mailEventId = mailEvent.objectId;

  return updatedMailEvent;
}

/**
 * Remove mail event
 * @param {Object} params - Parameters
 * @param {string} params.key - Key to event
 * @param {Function} params.callback - Callback
 */
function removeMailEventByKey({ key, callback }) {
  dbConnector.removeObject({
    callback,
    object: MailEvent,
    query: { key },
  });
}

/**
 * Get mail event
 * @private
 * @param {Object} params - Parameters
 * @param {string} params.query - Query to get mail event
 * @param {Function} params.callback - Callback
 */
function getMailEvent({ query, callback }) {
  dbConnector.getObject({
    query,
    object: MailEvent,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      } else if (!data.object) {
        callback({ error: new errorCreator.DoesNotExist({ name: `mailEvent ${query.toString()}` }) });

        return;
      }

      const mailEvent = addCustomId(data.object);

      if (mailEvent && mailEvent.expiresAt && mailEvent.expiresAt < new Date()) {
        removeMailEventByKey({
          key: mailEvent.key,
          callback: (eventData) => {
            if (eventData.error) {
              callback({ error: eventData.error });

              return;
            }

            callback({ error: new errorCreator.Expired({ name: `${mailEvent.ownerId}`, expiredAt: mailEvent.expiresAt }) });
          },
        });

        return;
      }

      callback({ data: { mailEvent } });
    },
  });
}

/**
 * Add mail addresses and mail domains to block list
 * @param {Object} params - Parameters
 * @param {string[]} [params.mailDomains] - Mail domains to add
 * @param {string[]} [params.addresses] - Mail addresses to add
 * @param {Function} params.callback - Callback
 */
function addBlockedMail({ callback, mailDomains = [], addresses = [] }) {
  const query = {};
  const update = {
    $addToSet: {
      mailDomains: { $each: mailDomains },
      addresses: { $each: addresses },
    },
    $set: { lastUpdated: new Date() },
  };
  const options = { upsert: true };

  BlockedMail.findOneAndUpdate(query, update, options).lean().exec((error) => {
    if (error) {
      callback({ error });

      return;
    }

    callback({ data: { success: true } });
  });
}

/**
 * Checks if the sent mail address or its its mail domain are blocked
 * @param {Object} params - Parameters
 * @param {string} params.address - Mail address
 * @param {Function} params.callback - Callback
 */
function isBlockedMail({ address, callback }) {
  const domain = address.split('@')[1];
  const query = {
    $or: [
      { addresses: { $in: [address] } },
      { mailDomains: { $in: [domain] } },
    ],
  };

  BlockedMail.findOne(query).lean().exec((error, found) => {
    if (error) {
      callback({ error });

      return;
    } else if (!found) {
      callback({ data: { isBlocked: false } });

      return;
    }

    callback({ data: { isBlocked: true } });
  });
}

/**
 * Get mail event
 * @param {Object} params - Parameters
 * @param {string} params.key - Key for the event
 * @param {Function} params.callback - Callback
 */
function getMailEventByKey({ key, callback }) {
  getMailEvent({
    callback,
    query: { key },
  });
}

/**
 * Create new mail event
 * @param {Object} params - Parameters
 * @param {Object} params.mailEvent - New mail event
 * @param {Function} params.callback - Callback
 */
function createMailEvent({ mailEvent, callback }) {
  const query = {
    ownerId: mailEvent.ownerId,
    key: mailEvent.key,
  };

  MailEvent.findOne(query).lean().exec((error, event) => {
    if (error) {
      callback({ error: new errorCreator.Database({ errorObject: error, name: 'createMailEvent' }) });

      return;
    } else if (event) {
      callback({ error: new errorCreator.AlreadyExists({ errorObject: error, name: `mailEvent for ${mailEvent.ownerId}` }) });

      return;
    }

    dbConnector.saveObject({
      object: new MailEvent(mailEvent),
      objectType: 'mailEvent',
      callback: (saveData) => {
        if (saveData.error) {
          callback({ error: saveData.error });

          return;
        }

        callback({ data: { mailEvent: saveData.data.savedObject } });
      },
    });
  });
}

exports.createMailEvent = createMailEvent;
exports.getMailEventByKey = getMailEventByKey;
exports.removeMailEventByKey = removeMailEventByKey;
exports.getMailEvent = getMailEvent;
exports.addBlockedMail = addBlockedMail;
exports.isBlockedMail = isBlockedMail;
