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
const errorCreator = require('../../error/errorCreator');
const dbConnector = require('../databaseConnector');

const imageSchema = new mongoose.Schema(dbConnector.createSchema({
  imageName: String,
  fileName: String,
  width: Number,
  height: Number,
}), { collection: 'images' });

const Image = mongoose.model('Image', imageSchema);

/**
 * Update image.
 * @param {Object} params - Parameters.
 * @param {string} params.imageId - ID of the device to update.
 * @param {Object} params.update - Update.
 * @param {Function} params.callback - Callback.
 */
function updateObject({ imageId, update, callback }) {
  dbConnector.updateObject({
    update,
    object: Image,
    query: { _id: imageId },
    errorNameContent: 'updateImageObject',
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      callback({ data: { image: data.object } });
    },
  });
}

/**
 * Update a image.
 * @param {Object} params - Parameters.
 * @param {string} params.imageId - Id of the image to update.
 * @param {Object} params.image - Image parameters to update.
 * @param {Function} params.callback - Callback.
 * @param {Object} [params.options] - Update options.
 */
function updateImage({
  imageId,
  image,
  callback,
  options = {},
}) {
  const { resetOwnerAliasId } = options;
  const {
    imageName,
    width,
    height,
    ownerAliasId,
    isPublic,
  } = image;
  const update = {
    $set: {
      imageName,
      width,
      height,
    },
  };
  const unset = {};

  if (resetOwnerAliasId) {
    unset.ownerAliasId = '';
  } else if (ownerAliasId) {
    update.$set.ownerAliasId = ownerAliasId;
  }

  if (typeof isPublic === 'boolean') { update.$set.isPublic = isPublic; }

  if (Object.keys(unset).length > 0) { update.$unset = unset; }

  updateObject({
    update,
    imageId,
    callback,
  });
}

/**
 * Get images.
 * @param {Object} params - Parameters.
 * @param {Object} params.query - Query to get images.
 * @param {Function} params.callback - Callback.
 */
function getImages({ query, callback }) {
  dbConnector.getObjects({
    query,
    object: Image,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      callback({
        data: {
          images: data.objects,
        },
      });
    },
  });
}

/**
 * Get image.
 * @param {Object} params - Parameters.
 * @param {string} params.query - Query to get image.
 * @param {Function} params.callback - Callback.
 */
function getImage({ query, callback }) {
  dbConnector.getObject({
    query,
    object: Image,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      } else if (!data.object) {
        callback({ error: new errorCreator.DoesNotExist({ name: `image ${JSON.stringify(query, null, 4)}` }) });

        return;
      }

      callback({ data: { image: data.object } });
    },
  });
}

/**
 * Create and save image.
 * @param {Object} params - Parameters.
 * @param {Object} params.image - New image.
 * @param {Function} params.callback - Callback.
 */
function createImage({ image, callback }) {
  dbConnector.saveObject({
    object: new Image(image),
    objectType: 'image',
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      callback({ data: { image: data.savedObject } });
    },
  });
}

/**
 * Update access to the image.
 * @param {Object} params - Parameters.
 * @param {Function} params.callback - Callback.
 * @param {boolean} [params.shouldRemove] - Should access be removed?
 * @param {string[]} [params.userIds] - Id of the users to update.
 * @param {string[]} [params.teamIds] - Id of the teams to update.
 * @param {string[]} [params.bannedIds] - Id of the blocked Ids to update.
 * @param {string[]} [params.teamAdminIds] - Id of the teams to update admin access for.
 * @param {string[]} [params.userAdminIds] - Id of the users to update admin access for.
 */
function updateAccess(params) {
  const accessParams = params;
  accessParams.objectId = params.imageId;
  accessParams.object = Image;
  accessParams.callback = ({ error, data }) => {
    if (error) {
      accessParams.callback({ error });

      return;
    }

    accessParams.callback({ data: { image: data.object } });
  };

  if (params.shouldRemove) {
    dbConnector.removeObjectAccess(params);
  } else {
    dbConnector.addObjectAccess(params);
  }
}

/**
 * Get all image.
 * @param {Object} params - Parameters.
 * @param {Function} params.callback - Callback.
 */
function getAllImages({ callback }) {
  getImages({ callback });
}

/**
 * Get images by user.
 * @param {Object} params - Parameters.
 * @param {Object} params.userId - ID of the user retrieving the images.
 * @param {Function} params.callback - Callback.
 */
function getImagesByUser({ userId, callback }) {
  const query = {
    $or: [
      { ownerId: userId },
      { userIds: { $in: [userId] } },
    ],
  };

  getImages({
    query,
    callback,
  });
}

/**
 * Get image by id.
 * @param {Object} params - Parameters.
 * @param {string} params.imageId - ID of the image.
 * @param {Function} params.callback - Callback.
 */
function getImageById({ imageId, callback }) {
  getImage({
    callback,
    query: { _id: imageId },
  });
}

/**
 * Remove image.
 * @param {Object} params - Parameters.
 * @param {string} params.imageId - ID of the image.
 * @param {Function} params.callback - Callback.
 */
function removeImage({ imageId, callback }) {
  dbConnector.removeObject({
    callback,
    object: Image,
    query: { _id: imageId },
  });
}

exports.updateAccess = updateAccess;
exports.updateImage = updateImage;
exports.getAllDevices = getAllImages;
exports.createDevice = createImage;
exports.getImagesByUser = getImagesByUser;
exports.getDeviceById = getImageById;
exports.removeImage = removeImage;
