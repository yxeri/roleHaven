/*
 Copyright 2015 Aleksandar Jankovic

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
const errorCreator = require('../../objects/error/errorCreator');
const dbConnector = require('../databaseConnector');

const chatHistorySchema = new mongoose.Schema({
  roomName: { type: String, unique: true },
  anonymous: { type: Boolean, default: false },
  messages: [{
    text: [String],
    time: Date,
    userName: String,
    roomName: String,
    extraClass: String,
    customSender: String,
    team: String,
    shortTeam: String,
    coordinates: {
      longitude: Number,
      latitude: Number,
    },
    image: {
      imageName: String,
      fileName: String,
      width: Number,
      height: Number,
    },
  }],
}, { collection: 'chatHistories' });

const ChatHistory = mongoose.model('ChatHistory', chatHistorySchema);

/**
 * Add message to room history
 * @param {string} params.roomName Name of the room
 * @param {object} params.message Message to add
 * @param {Function} params.callback Callback
 */
function addMsgToHistory({ roomName, message, callback }) {
  const query = { roomName };
  const update = { $push: { messages: message } };
  const options = { upsert: true, new: true };

  ChatHistory.findOneAndUpdate(query, update, options).lean().exec((err, history) => {
    if (err) {
      callback({ error: new errorCreator.Database({ errorObject: err, name: 'addMsgToHistory' }) });

      return;
    } else if (!history) {
      callback({ error: new errorCreator.DoesNotExist({ name: `history ${roomName}` }) });

      return;
    }

    callback({ data: { history } });
  });
}

/**
 * Get room history from multiple rooms
 * @param {string[]} params.rooms Name of the rooms
 * @param {Function} params.callback Callback
 */
function getHistories({ rooms, callback }) {
  const query = { roomName: { $in: rooms } };
  const filter = { 'messages._id': 0, _id: 0 };

  ChatHistory.find(query, filter).lean().exec((err, histories = []) => {
    if (err) {
      callback({ error: new errorCreator.Database({ errorObject: err, name: 'getHistories' }) });

      return;
    }

    callback({ data: { histories } });
  });
}

/**
 * Create and save room history
 * @param {string} params.roomName Name of the room
 * @param {boolean} params.anonymous Should retrieved messages be anonymous?
 * @param {Function} params.callback Callback
 */
function createHistory({ roomName, anonymous, callback }) {
  const newHistory = new ChatHistory({ roomName, anonymous });
  const query = { roomName };

  ChatHistory.findOne(query).lean().exec((histErr, history) => {
    if (histErr) {
      callback({ error: new errorCreator.Database({ errorObject: histErr, name: 'createHistory' }) });

      return;
    } else if (history) {
      callback({ error: new errorCreator.AlreadyExists({ name: `history ${roomName}` }) });

      return;
    }

    dbConnector.saveObject({
      object: newHistory,
      objectType: 'ChatHistory',
      callback: ({ error, data }) => {
        if (error) {
          callback({ error });

          return;
        }

        callback({ data: { history: data.savedObject } });
      },
    });
  });
}

/**
 * Remove room history
 * @param {string} params.roomName Name of the room
 * @param {Function} params.callback Callback
 */
function removeHistory({ roomName, callback }) {
  const query = { roomName };

  ChatHistory.findOneAndRemove(query).lean().exec((err) => {
    if (err) {
      callback({ error: new errorCreator.Database({ errorObject: err, name: 'removeHistory' }) });

      return;
    }

    callback({ success: true });
  });
}

exports.addMsgToHistory = addMsgToHistory;
exports.getHistories = getHistories;
exports.createHistory = createHistory;
exports.removeHistory = removeHistory;
