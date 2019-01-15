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
const { appConfig, dbConfig } = require('../../config/defaults/config');
const errorCreator = require('../../error/errorCreator');
const dbRoom = require('./room');

const messageSchema = new mongoose.Schema(dbConnector.createSchema({
  messageType: { type: String, default: dbConfig.MessageTypes.CHAT },
  text: { type: [String], default: [] },
  altText: [String],
  roomId: String,
  coordinates: dbConnector.coordinatesSchema,
  intro: [String],
  extro: [String],
  image: dbConnector.createSchema({
    imageName: String,
    fileName: String,
    width: Number,
    height: Number,
  }),
}), { collection: 'messages' });

const Message = mongoose.model('Message', messageSchema);

/**
 * Update message.
 * @private
 * @param {Object} params - Parameters.
 * @param {string} params.messageId - Id of the message.
 * @param {Object} params.update - Update.
 * @param {Function} params.callback Callback.
 */
function updateObject({ messageId, update, callback }) {
  dbConnector.updateObject({
    update,
    query: { _id: messageId },
    object: Message,
    errorNameContent: 'updateMessage',
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      callback({ data: { message: data.object } });
    },
  });
}

/**
 * Get messages.
 * @private
 * @param {Object} params - Parameters.
 * @param {Object} params.query - Query to get messages.
 * @param {Function} params.callback - Callback.
 * @param {string} [params.errorNameContent] - Error text to be printed.
 * @param {Date} [params.startDate] - Date for when to start the span of messages.
 * @param {boolean} [params.shouldGetFuture] - Should messages from the future of the start date be retrieved?
 */
function getMessages({
  query,
  callback,
  errorNameContent,
  filter,
  startDate,
  shouldGetFuture = false,
  limit = appConfig.maxHistoryAmount,
}) {
  const fullQuery = query;

  if (startDate) {
    const customTimeQuery = {
      customTimeCreated: {
        $exists: true,
      },
    };
    const timeQuery = {};

    if (!shouldGetFuture) {
      customTimeQuery.customTimeCreated.$lte = startDate;
      timeQuery.timeCreated = { $lte: startDate };
    } else {
      customTimeQuery.customTimeCreated = { $gte: startDate };
      timeQuery.timeCreated = { $gte: startDate };
    }

    fullQuery.$or = [
      customTimeQuery,
      timeQuery,
    ];
  }

  dbConnector.getObjects({
    filter,
    errorNameContent,
    limit,
    query: fullQuery,
    object: Message,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      callback({
        data: {
          messages: data.objects,
        },
      });
    },
  });
}

/**
 * Get message.
 * @private
 * @param {Object} params - Parameters.
 * @param {string} params.query - Query to get alias.
 * @param {string} params.errorNameContent - Error text to be printed.
 * @param {Function} params.callback - Callback.
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
      }

      if (!data.object) {
        callback({ error: new errorCreator.DoesNotExist({ name: `alias ${JSON.stringify(query, null, 4)}` }) });

        return;
      }

      callback({ data: { message: data.object } });
    },
  });
}

/**
 * Create message.
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
 * Update a message.
 * @param {Object} params - Parameters.
 * @param {string} params.messageId - ID of the message to update.
 * @param {Object} params.message - Message.
 * @param {string[]} [params.message.roomId] - ID of the room.
 * @param {string[]} [params.message.text] - Text in message.
 * @param {string} [params.message.aliasId] - ID of the alias that will be shown as sender.
 * @param {string[]} [params.message.intro] - Text that will be printed before message.text.
 * @param {string[]} [params.message.extro] - Text that will be printed after message.text.
 * @param {string[]} [params.message.customTimeCreated] - A custom date of when the message was created.
 * @param {string[]} [params.message.customlastUpdated] - A custom date of when the message was last updated.
 * @param {Object} [params.options] - Options
 * @param {boolean} [params.options.resetOwnerAliasId] - Should ownerAliasId be reset?
 * @param {Function} params.callback - Callback.
 */
function updateMessage({
  messageId,
  message,
  callback,
  options = {},
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

  const update = {};
  const set = {};
  const unset = {};

  if (resetOwnerAliasId) {
    unset.ownerAliasId = '';
  } else if (ownerAliasId) {
    set.ownerAliasId = ownerAliasId;
  }

  if (coordinates) { set.coordinates = coordinates; }
  if (text) { set.text = text; }
  if (intro) { set.intro = intro; }
  if (extro) { set.extro = extro; }
  if (customTimeCreated) { set.customTimeCreated = customTimeCreated; }
  if (customlastUpdated) { set.customlastUpdated = customlastUpdated; }
  if (roomId) { set.roomId = roomId; }

  if (Object.keys(set).length > 0) { update.$set = set; }
  if (Object.keys(unset).length > 0) { update.$unset = unset; }

  if (roomId) {
    dbRoom.doesRoomExist({
      roomId,
      callback: ({ error, data }) => {
        if (error) {
          callback({ error });

          return;
        }

        if (!data.exists) {
          callback({ error: new errorCreator.DoesNotExist({ name: `room ${roomId}` }) });

          return;
        }

        updateObject({
          messageId,
          update,
          options,
          callback,
        });
      },
    });

    return;
  }

  updateObject({
    messageId,
    update,
    options,
    callback,
  });
}

/**
 * Gets messages by room Id
 * @param {Object} params - Parameters.
 * @param {string} params.roomId - Id of the room.
 * @param {Function} params.callback - Callback.
 * @param {Object} params.user - User retrieving the messages.
 * @param {Date} [params.startDate] - Date for when to start the span of messages.
 * @param {boolean} [params.shouldGetFuture] - Should messages from the future of the start date be retrieved?
 */
function getMessagesByRoom({
  roomId,
  callback,
  startDate,
  shouldGetFuture,
  user,
}) {
  const query = dbConnector.createUserQuery({ user });
  query.roomId = roomId;

  getMessages({
    callback,
    startDate,
    shouldGetFuture,
    query,
    errorNameContent: 'getMessagesByRoom',
  });
}

/**
 * Get messages from all the rooms the user is following.
 * @param {Object} params - Parameters.
 * @param {Object} params.user - User.
 * @param {Function} params.callback - Callback.
 */
function getMessagesByUser({
  user,
  callback,
}) {
  const query = dbConnector.createUserQuery({ user });
  query.roomId = { $in: user.followingRooms };

  getMessages({
    query,
    callback,
  });
}

/**
 * Remove messages by room ID.
 * @param {Object} params - Parameters.
 * @param {string} params.roomId - ID of the room.
 * @param {Function} params.callback - Callback.
 */
function removeMessagesByRoom({ roomId, callback }) {
  dbConnector.removeObjects({
    callback,
    object: Message,
    query: { roomId },
  });
}

/**
 * Remove messages by user ID.
 * @param {Object} params - Parameters.
 * @param {string} params.ownerId - ID of the user.
 * @param {Function} params.callback - Callback.
 */
function removeMessagesByUser({ ownerId, callback }) {
  dbConnector.removeObjects({
    callback,
    object: Message,
    query: { ownerId },
  });
}

/**
 * Remove messages by alias ID.
 * @param {Object} params - Parameters.
 * @param {string} params.ownerAliasId - Alias ID.
 * @param {Function} params.callback - Callback.
 * @param {Date} [params.startDate] - Date for when to start the span of messages.
 * @param {boolean} [params.shouldGetFuture] - Should messages from the future of the start date be retrieved?
 */
function removeMessagesByAlias({ ownerAliasId, callback }) {
  dbConnector.removeObjects({
    callback,
    object: Message,
    query: { ownerAliasId },
  });
}

/**
 * Get message by id.
 * @param {Object} params - Parameters.
 * @param {string} params.messageId - ID of the message.
 * @param {Function} params.callback - Callback.
 */
function getMessageById({ messageId, callback }) {
  getMessage({
    callback,
    query: { _id: messageId },
  });
}

/**
 * Remove message.
 * @param {Object} params - Parameters.
 * @param {string} params.messageId - ID of the message.
 * @param {Function} params.callback - Callback.
 */
function removeMessage({ messageId, callback }) {
  dbConnector.removeObject({
    callback,
    query: { _id: messageId },
    object: Message,
  });
}

/**
 * Get all messages.
 * @param {Object} params - Parameters.
 * @param {Function} params.callback - Callback
 */
function getAllMessages({ callback }) {
  getMessages({
    callback,
    query: {},
  });
}

exports.createMessage = createMessage;
exports.updateMessage = updateMessage;
exports.getMessagesByRoom = getMessagesByRoom;
exports.removeMessagesByRoom = removeMessagesByRoom;
exports.removeMessagesByUser = removeMessagesByUser;
exports.removeMessage = removeMessage;
exports.getMessageById = getMessageById;
exports.removeMessagesByAlias = removeMessagesByAlias;
exports.getMessagesByUser = getMessagesByUser;
exports.getAllMessages = getAllMessages;
