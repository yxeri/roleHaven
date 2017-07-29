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
const errorCreator = require('../../objects/error/errorCreator');
const dbConnector = require('../databaseConnector');

const simpleMsgSchema = new mongoose.Schema({
  text: String,
  time: Date,
  userName: String,
}, { collection: 'simpleMsgs' });

const SimpleMsgs = mongoose.model('SimpleMsg', simpleMsgSchema);

/**
 * Create and save a simple message
 * @param {Object} params.simpleMsg Simple message
 * @param {string} params.simpleMsg.userName Name of the sender
 * @param {Date} params.simpleMsg.time Date when the message was sent
 * @param {string[]} params.simpleMsg.text Text in the simple message
 * @param {Function} params.callback Callback
 */
function createSimpleMsg({ simpleMsg, callback }) {
  const newSimpleMsg = new SimpleMsgs(simpleMsg);

  dbConnector.saveObject({
    object: newSimpleMsg,
    objectType: 'Simple smsg',
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
 * Remove simple messages based on user name
 * @param {string} params.userName Owner of the messages that will be deleted
 * @param {Function} params.callback Callback
 */
function removeSimpleMsgs({ userName, callback }) {
  const query = { userName };

  SimpleMsgs.remove(query).lean().exec((err, simpleMsgs = []) => {
    if (err) {
      callback({ error: new errorCreator.Database({ errorObject: err }) });

      return;
    }

    callback({ data: { simpleMsgs } });
  });
}

/**
 * Get all simple messages
 * @param {Function} params.callback Callback
 */
function getAllSimpleMsgs({ callback }) {
  const filter = { _id: 0 };

  SimpleMsgs.find({}, filter).lean().exec((err, simpleMsgs = []) => {
    if (err) {
      callback({ error: new errorCreator.Database({ errorObject: err }) });

      return;
    }

    callback({ data: { simpleMsgs } });
  });
}

exports.createSimpleMsg = createSimpleMsg;
exports.removeSimpleMsgs = removeSimpleMsgs;
exports.getAllSimpleMsgs = getAllSimpleMsgs;
