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
const logger = require('../../utils/logger');

const chatHistorySchema = new mongoose.Schema({
  roomName: { type: String, unique: true },
  messages: [{
    text: [String],
    time: Date,
    userName: String,
    roomName: String,
    extraClass: String,
    customSender: String,
    morseCode: String,
  }],
}, { collection: 'chatHistories' });

const ChatHistory = mongoose.model('ChatHistory', chatHistorySchema);

/**
 * Add message to room history
 * @param {string} roomName - Name of the room
 * @param {object} message - Message to add
 * @param {Function} callback - Callback
 */
function addMsgToHistory(roomName, message, callback) {
  const query = { roomName };
  const update = { $push: { messages: message } };
  const options = { upsert: true, new: true };

  ChatHistory.findOneAndUpdate(query, update, options).lean().exec((err, history) => {
    if (err) {
      logger.sendErrorMsg({
        code: logger.ErrorCodes.db,
        text: ['Failed to add message to history'],
        err,
      });
    }

    callback(err, history);
  });
}

/**
 * Get room history
 * @param {string} roomName - Name of the room
 * @param {Function} callback - Callback
 */
function getHistoryFromRoom(roomName, callback) {
  const query = { roomName };
  const filter = { 'messages._id': 0, _id: 0 };

  ChatHistory.find(query, filter).lean().exec((err, history) => {
    if (err) {
      logger.sendErrorMsg({
        code: logger.ErrorCodes.db,
        text: ['Failed to get history'],
        err,
      });
    }

    callback(err, history);
  });
}

/**
 * Get room history from multiple rooms
 * @param {string[]} rooms - Name of the rooms
 * @param {Function} callback - Callback
 */
function getHistoryFromRooms(rooms, callback) {
  const query = { roomName: { $in: rooms } };
  const filter = { 'messages._id': 0, _id: 0 };

  ChatHistory.find(query, filter).lean().exec((err, history) => {
    if (err) {
      logger.sendErrorMsg({
        code: logger.ErrorCodes.db,
        text: ['Failed to retrieve all history from rooms'],
        err,
      });
    }

    callback(err, history);
  });
}

/**
 * Create and save room history
 * @param {string} roomName - Name of the room
 * @param {Function} callback - Callback
 */
function createHistory(roomName, callback) {
  const query = { roomName };

  // Checks if history for room already exists
  ChatHistory.findOne(query).lean().exec((histErr, history) => {
    if (histErr) {
      logger.sendErrorMsg({
        code: logger.ErrorCodes.db,
        text: [`Failed to find if history for ${roomName} already exists`],
        err: histErr,
      });

      callback(histErr, history);
      // History doesn't exist in the collection, so let's add it and the room!
    } else if (history === null) {
      const newHistory = new ChatHistory({ roomName });

      newHistory.save(callback);
    } else {
      logger.sendErrorMsg({
        code: logger.ErrorCodes.db,
        text: [`History for room ${roomName} already exists`],
        err: histErr,
      });

      callback(histErr, history);
    }
  });
}

/**
 * Remove room history
 * @param {string} roomName - Name of the room
 * @param {Function} callback - Callback
 */
function removeHistory(roomName, callback) {
  ChatHistory.findOneAndRemove({ roomName }).lean().exec(callback);
}

exports.addMsgToHistory = addMsgToHistory;
exports.getHistoryFromRoom = getHistoryFromRoom;
exports.getHistoryFromRooms = getHistoryFromRooms;
exports.createHistory = createHistory;
exports.removeHistory = removeHistory;
