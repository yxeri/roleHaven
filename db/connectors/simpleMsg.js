/*
 Copyright 2017 Carmilla Mina Jankovic

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
const errorCreator = require('../../error/errorCreator');

const simpleMsgSchema = new mongoose.Schema(dbConnector.createSchema({
  text: String,
}), { collection: 'simpleMsgs' });

const SimpleMsg = mongoose.model('SimpleMsg', simpleMsgSchema);

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

      callback({ data: { simpleMsg: data.object } });
    },
  });
}

/**
 * Create and save a simple message
 * @param {Object} params - Parameters.
 * @param {Object} params.simpleMsg - Simple message.
 * @param {Function} params.callback - Callback.
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

      callback({ data: { simpleMsg: data.savedObject } });
    },
  });
}


/**
 * Get simple msgs
 * @private
 * @param {Object} params - Parameters.
 * @param {Function} params.callback - Callback.
 * @param {Object} [params.query] - Query to get simple msgs.
 * @param {Object} [params.filter] - Parameters to filter out from the result.
 */
function getSimpleMsgs({ query, callback, filter }) {
  dbConnector.getObjects({
    query,
    filter,
    object: SimpleMsg,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      callback({
        data: {
          simpleMsgs: data.objects,
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
        callback({ error: new errorCreator.DoesNotExist({ name: `simpleMsg ${JSON.stringify(query, null, 4)}` }) });

        return;
      }

      callback({ data: { simpleMsg: data.object } });
    },
  });
}

/**
 * Remove simple messages based on user ID
 * @param {Object} params - Parameters
 * @param {string} params.userId - Owner ID of the messages that will be deleted
 * @param {Function} params.callback - Callback
 */
function removeSimpleMsgsByUser({ userId, callback }) {
  dbConnector.removeObjects({
    callback,
    object: SimpleMsg,
    query: { userId },
  });
}

/**
 * Remove a simple msg
 * @param {Object} params - Parameters
 * @param {string} params.simpleMsgId - ID of the message
 * @param {Function} params.callback - Callback
 */
function removeSimpleMsg({ simpleMsgId, callback }) {
  dbConnector.removeObject({
    callback,
    object: SimpleMsg,
    query: { _id: simpleMsgId },
  });
}

/**
 * Get simple messages
 * @param {Object} params - Parameters.
 * @param {Function} params.callback - Callback.
 */
function getAllSimpleMsgs({
  callback,
}) {
  getSimpleMsgs({
    callback,
    query: {},
  });
}

/**
 * Update simple msg
 * @param {Object} params - Parameters.
 * @param {string} params.simpleMsgId - Id of the message to update.
 * @param {Object} params.simpleMsg - Simple msg.
 * @param {Function} params.callback - Callback.
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

/**
 * Get a simple msg by its Id.
 * @param {Object} params - Parameters.
 * @param {string} params.simpleMsgId - Id of the message.
 * @param {Function} params.callback - Callback.
 */
function getSimpleMsgById({ simpleMsgId, callback }) {
  getSimpleMsg({
    callback,
    query: { _id: simpleMsgId },
  });
}

exports.createSimpleMsg = createSimpleMsg;
exports.removeSimpleMsgsByUser = removeSimpleMsgsByUser;
exports.getAllSimpleMsgs = getAllSimpleMsgs;
exports.updateSimpleMsg = updateSimpleMsg;
exports.getSimpleMsgById = getSimpleMsgById;
exports.removeSimpleMsg = removeSimpleMsg;
