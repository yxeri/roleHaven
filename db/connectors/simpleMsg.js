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

const mongoose = require('mongoose');
const dbConnector = require('../databaseConnector');
const errorCreator = require('../../objects/error/errorCreator');

const simpleMsgSchema = new mongoose.Schema(dbConnector.createSchema({
  text: String,
}), { collection: 'simpleMsgs' });

const SimpleMsg = mongoose.model('SimpleMsg', simpleMsgSchema);

/**
 * Add custom id to the object
 * @param {Object} simpleMsg - Simple message object
 * @return {Object} - Simple message object with id
 */
function addCustomId(simpleMsg) {
  const updatedSimpleMsg = simpleMsg;
  updatedSimpleMsg.simpleMsgId = simpleMsg.objectId;

  return updatedSimpleMsg;
}

/**
 * Update simple msg
 * @private
 * @param {Object} params - Parameters
 * @param {string} params.simpleMsgId - ID of the simple msg to update
 * @param {Function} params.callback - Callback
 */
function updateObject({ update, simpleMsgId, callback }) {
  dbConnector.updateObject({
    update,
    query: { _id: simpleMsgId },
    object: SimpleMsg,
    errorNameContent: 'updateSimpleMsg',
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      callback({ simpleMsg: addCustomId(data.object) });
    },
  });
}

/**
 * Create and save a simple message
 * @param {Object} params - Parameters
 * @param {Object} params.simpleMsg - Simple message
 * @param {Function} params.callback - Callback
 */
function createSimpleMsg({ simpleMsg, callback }) {
  dbConnector.saveObject({
    object: new SimpleMsg(simpleMsg),
    objectType: 'Simple msg',
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      callback({ data: { simpleMsg: addCustomId(data.savedObject) } });
    },
  });
}


/**
 * Get simple msgs
 * @private
 * @param {Object} params - Parameters
 * @param {Object} params.query - Query to get simple msgs
 * @param {Function} params.callback - Callback
 */
function getSimpleMsgs({ query, callback }) {
  dbConnector.getObjects({
    query,
    object: SimpleMsg,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      callback({
        data: {
          simpleMsgs: data.objects.map(simpleMsg => addCustomId(simpleMsg)),
        },
      });
    },
  });
}

/**
 * Get simple msg
 * @private
 * @param {Object} params - Parameters
 * @param {string} params.query - Query to get simple msg
 * @param {Function} params.callback - Callback
 */
function getSimpleMsg({ query, callback }) {
  dbConnector.getObject({
    query,
    object: SimpleMsg,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      } else if (!data.object) {
        callback({ error: new errorCreator.DoesNotExist({ name: `simpleMsg ${query.toString()}` }) });

        return;
      }

      callback({ data: { simpleMsg: addCustomId(data.object) } });
    },
  });
}

/**
 * Remove simple messages based on user ID
 * @param {Object} params - Parameters
 * @param {string} params.userId - Owner ID of the messages that will be deleted
 * @param {Function} params.callback - Callback
 */
function removeSimpleMsgs({ userId, callback }) {
  dbConnector.removeObjects({
    callback,
    object: SimpleMsg,
    query: { userId },
  });
}

/**
 * Get all simple messages
 * @param {Object} params - Parameters
 * @param {Function} params.callback - Callback
 */
function getAllSimpleMsgs({ callback }) {
  getSimpleMsgs({ callback });
}

/**
 * Update simple msg
 * @param {Object} params - Parameters
 * @param {Object} params.simpleMsg - Simple msg
 * @param {string} params.simpleMsg.simpleMsgId - ID of the message to update
 * @param {string[]} [params.simpleMsg.text] - Message text
 * @param {Function} params.callback - Callback
 */
function updateSimpleMsg({ simpleMsgId, simpleMsg, callback }) {
  const { text } = simpleMsg;
  const update = { $set: {} };

  if (text) { update.$set.text = text; }

  updateObject({
    update,
    simpleMsgId,
    callback,
  });
}

exports.createSimpleMsg = createSimpleMsg;
exports.removeSimpleMsgs = removeSimpleMsgs;
exports.getAllSimpleMsgs = getAllSimpleMsgs;
exports.updateSimpleMsg = updateSimpleMsg;
exports.getSimpleMsg = getSimpleMsg;
