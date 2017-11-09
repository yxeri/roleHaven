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
const dbConfig = require('../../config/defaults/config').databasePopulation;
const errorCreator = require('../../objects/error/errorCreator');
const dbRoom = require('./room');

const messageSchema = new mongoose.Schema(dbConnector.createSchema({
  messageType: { type: String, default: dbConfig.MessageTypes.CHAT },
  text: { type: [String], default: [] },
  roomId: String,
  coordinates: dbConnector.createSchema({
    longitude: Number,
    latitude: Number,
    speed: Number,
    accuracy: Number,
    heading: Number,
  }),
  intro: { type: [String], default: [] },
  extro: { type: [String], default: [] },
  image: dbConnector.createSchema({
    imageName: String,
    fileName: String,
    width: Number,
    height: Number,
  }),
}), { collection: 'messages' });

const Message = mongoose.model('Message', messageSchema);

/**
 * Update message
 * @private
 * @param {Object} params - Parameters
 * @param {string} params.objectId - ID of the message
 * @param {Object} params.update - Update
 * @param {Function} params.callback Callback
 */
function updateObject({ objectId, update, callback }) {
  dbConnector.updateObject({
    update,
    query: { _id: objectId },
    object: Message,
    errorNameContent: 'updateMessage',
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      callback({ data: { message: data.savedObject } });
    },
  });
}

/**
 * Get messages
 * @private
 * @param {Object} params - Parameters
 * @param {Object} params.query - Query to get messages
 * @param {string} params.errorNameContent - Error text to be printed
 * @param {Function} params.callback - Callback
 */
function getMessages({
  query,
  callback,
  errorNameContent,
}) {
  dbConnector.getObjects({
    query,
    errorNameContent,
    object: Message,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      callback({ data: { messages: data.objects } });
    },
  });
}

/**
 * Get message
 * @private
 * @param {Object} params - Parameters
 * @param {string} params.query - Query to get alias
 * @param {string} params.errorNameContent - Error text to be printed
 * @param {Function} params.callback - Callback
 */
function getMessage({
  query,
  callback,
  errorNameContent,
}) {
  dbConnector.getObject({
    query,
    errorNameContent,
    object: Message,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      } else if (!data.object) {
        callback({ error: new errorCreator.DoesNotExist({ name: `alias ${query.toString()}` }) });

        return;
      }

      callback({ data: { message: data.object } });
    },
  });
}

/**
 * Get all messages
 * @param {Object} params - Parameters
 * @param {boolean} [params.lite] - Should parameters with a large amount of data be filtered out?
 * @param {Function} params.callback - Callback
 */
function getAllMessages({ callback, lite = true }) {
  getMessages({
    lite,
    callback,
    errorNameContent: 'getAllMessages',
  });
}

/**
 * Create message
 * @param {Object} params - Parameters
 * @param {Object} params.message - Message to create
 * @param {Function} params.callback - Callback
 */
function createMessage({ message, callback }) {
  dbConnector.saveObject({
    object: new Message(message),
    objectType: 'Message',
    callback: (saveData) => {
      if (saveData.error) {
        callback({ error: saveData.error });

        return;
      }

      callback({ data: { message: saveData.data.savedObject } });
    },
  });
}

/**
 * Update a message
 * @param {Object} params - Parameters
 * @param {string} params.objectId - ID of the message to update
 * @param {Object} params.message - Message
 * @param {string[]} [params.message.roomId] - ID of the room
 * @param {string[]} [params.message.text] - Text in message
 * @param {string} [params.message.aliasId] - ID of the alias that will be shown as sender
 * @param {string[]} [params.message.intro] - Text that will be printed before message.text
 * @param {string[]} [params.message.extro] - Text that will be printed after message.text
 * @param {string[]} [params.message.customTimeCreated] - A custom date of when the message was created
 * @param {string[]} [params.message.customlastUpdated] - A custom date of when the message was last updated
 * @param {Object} [params.options] - Options
 * @param {boolean} [params.options.resetOwnerAliasId] - Should ownerAliasId be reset?
 * @param {Function} params.callback - Callback
 */
function updateMessage({
  objectId,
  message,
  options,
  callback,
}) {
  const { resetOwnerAliasId = false } = options;
  const {
    roomId,
    coordinates,
    text,
    ownerAliasId,
    intro,
    extro,
    customTimeCreated,
    customlastUpdated,
  } = message;

  const update = {
    $set: {},
    $unset: {},
  };

  if (resetOwnerAliasId) {
    update.$unset.ownerAliasId = '';
  } else if (ownerAliasId) {
    update.$set.ownerAliasId = ownerAliasId;
  }

  if (coordinates) { update.$set.coordinates = coordinates; }
  if (text) { update.$set.text = text; }
  if (intro) { update.$set.intro = intro; }
  if (extro) { update.$set.extro = extro; }
  if (customTimeCreated) { update.$set.customTimeCreated = customTimeCreated; }
  if (customlastUpdated) { update.$set.customlastUpdated = customlastUpdated; }

  if (roomId) {
    update.$set.roomId = roomId;

    dbRoom.getRoomById({
      objectId: roomId,
      callback: ({ error }) => {
        if (error) {
          callback({ error });

          return;
        }

        updateObject({
          objectId,
          update,
          options,
          callback,
        });
      },
    });

    return;
  }

  updateObject({
    objectId,
    update,
    options,
    callback,
  });
}

/**
 * Gets messages by room ID
 * @param {Object} params - Parameters
 * @param {string} params.roomId - ID of the room
 * @param {Function} params.callback - Callback
 * @param {boolean} [params.lite] - Should parameters with a large amount of data be filtered out?
 */
function getMessagesByRoom({ roomId, lite, callback }) {
  getMessages({
    callback,
    lite,
    query: { roomId },
    errorNameContent: 'getMessagesByRoom',
  });
}

/**
 * Get messages by message type
 * @param {Object} params - Parameters
 * @param {string} params.messageType - Message type
 * @param {Function} params.callback - Callback
 * @param {boolean} [params.lite] - Should parameters with a large amount of data be filtered out?
 */
function getMessagesByType({ messageType, lite, callback }) {
  getMessages({
    callback,
    lite,
    query: { messageType },
    errorNameContent: 'getMessagesByType',
  });
}

/**
 * Get messages by user ID
 * @param {Object} params - Parameters
 * @param {string} params.ownerId - ID of the user
 * @param {Function} params.callback - Callback
 * @param {boolean} [params.lite] - Should parameters with a large amount of data be filtered out?
 */
function getMessagesByUser({ ownerId, callback, lite }) {
  getMessages({
    callback,
    lite,
    query: { ownerId },
    errorNameContent: 'getMessagesByUser',
  });
}

/**
 * Get messages by alias ID
 * @param {Object} params - Parameters
 * @param {string} params.ownerAliasId - Alias ID
 * @param {Function} params.callback - Callback
 * @param {boolean} [params.lite] - Should parameters with a large amount of data be filtered out?
 */
function getMessagesByAlias({ ownerAliasId, callback, lite }) {
  getMessages({
    callback,
    lite,
    query: { ownerAliasId },
    errorNameContent: 'getMessagesByUserAlias',
  });
}

/**
 * Get messages by Team IDs
 * @param {Object} params - Parameters
 * @param {string} params.teamIds - ID of the teams
 * @param {Function} params.callback - Callback
 * @param {boolean} [params.lite] - Should parameters with a large amount of data be filtered out?
 */
function getMessagesByTeams({ teamIds, callback, lite }) {
  getMessages({
    callback,
    lite,
    query: { teamIds: { $in: teamIds } },
    errorNameContent: 'getMessagesByTeam',
  });
}

/**
 * Remove messages by room ID
 * @param {Object} params - Parameters
 * @param {string} params.roomId - ID of the room
 * @param {Function} params.callback - Callback
 */
function removeMessagesByRoom({ roomId, callback }) {
  dbConnector.removeObjects({
    callback,
    object: Message,
    query: { roomId },
  });
}

/**
 * Remove messages by user ID
 * @param {Object} params - Parameters
 * @param {string} params.ownerId - ID of the user
 * @param {Function} params.callback - Callback
 */
function removeMessagesByUser({ ownerId, callback }) {
  dbConnector.removeObjects({
    callback,
    object: Message,
    query: { ownerId },
  });
}

/**
 * Remove messages by alias ID
 * @param {Object} params - Parameters
 * @param {string} params.ownerAliasId - Alias ID
 * @param {Function} params.callback - Callback
 */
function removeMessagesByAlias({ ownerAliasId, callback }) {
  dbConnector.removeObjects({
    callback,
    object: Message,
    query: { ownerAliasId },
  });
}

/**
 * Get message by id
 * @param {Object} params - Parameters
 * @param {string} params.objectId - ID of the message
 * @param {Function} params.callback - Callback
 */
function getMessageById({ objectId, callback }) {
  getMessage({
    callback,
    query: { _id: objectId },
  });
}

/**
 * Remove message
 * @param {Object} params - Parameters
 * @param {string} params.objectId - ID of the message
 * @param {Function} params.callback - Callback
 */
function removeMessage({ objectId, callback }) {
  dbConnector.removeObject({
    callback,
    query: { _id: objectId },
    object: Message,
  });
}

exports.createMessage = createMessage;
exports.updateMessage = updateMessage;
exports.getMessagesByRoom = getMessagesByRoom;
exports.getMessagesByType = getMessagesByType;
exports.getMessagesByUser = getMessagesByUser;
exports.removeMessagesByRoom = removeMessagesByRoom;
exports.removeMessagesByUser = removeMessagesByUser;
exports.removeMessage = removeMessage;
exports.getAllMessages = getAllMessages;
exports.getMessagesByTeams = getMessagesByTeams;
exports.getMessageById = getMessageById;
exports.getMessagesByAlias = getMessagesByAlias;
exports.removeMessagesByAlias = removeMessagesByAlias;
