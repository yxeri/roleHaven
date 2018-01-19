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
const appConfig = require('../config/defaults/config').app;
const dbConfig = require('../config/defaults/config').databasePopulation;
const errorCreator = require('../objects/error/errorCreator');

const dbPath = `mongodb://${appConfig.dbHost}:${appConfig.dbPort}/${appConfig.dbName}`;

const baseSchema = {
  ownerId: String,
  ownerAliasId: String,
  lastUpdated: Date,
  timeCreated: Date,
  customLastUpdated: Date,
  customTimeCreated: Date,
  visibility: { type: Number, default: dbConfig.AccessLevels.ANONYMOUS },
  accessLevel: { type: Number, default: dbConfig.AccessLevels.ANONYMOUS },
  teamAdminIds: { type: [String], default: [] },
  userAdminIds: { type: [String], default: [] },
  userIds: { type: [String], default: [] },
  teamIds: { type: [String], default: [] },
  bannedIds: { type: [String], default: [] },
  isPublic: { type: Boolean, default: true },
};

const coordinatesSchema = {
  longitude: Number,
  latitude: Number,
  speed: Number,
  accuracy: Number,
  heading: Number,
};

mongoose.connect(dbPath, {}, (err) => {
  if (err) {
    console.error('Failed to connect to the database');

    return;
  }

  console.info('Connection established to database');
});

/**
 * Create and return full schema.
 * @param {Object} schema - Schema to expand.
 * @return {Object} - Schema.
 */
function createSchema(schema) {
  const fullSchema = schema;

  Object.keys(baseSchema).forEach((parameterKey) => {
    fullSchema[parameterKey] = baseSchema[parameterKey];
  });

  return fullSchema;
}

/**
 * Add object identifier.
 * @private
 * @param {Object} params - Parameters.
 * @param {Object} params.object - Object to add an Id to.
 * @returns {Object} Updated object.
 */
function addObjectId({ object }) {
  const modifiedObject = object;

  modifiedObject.objectId = object._id.toString(); // eslint-disable-line no-underscore-dangle

  return modifiedObject;
}

/**
 * Saves object to database
 * @param {Object} params - Parameters
 * @param {Object} params.object - Object to save
 * @param {Function} params.callback - Callback
 */
function saveObject({
  object,
  objectType,
  callback,
}) {
  const now = new Date();
  const newObject = object;

  newObject.lastUpdated = newObject.lastUpdated || now;
  newObject.timeCreated = newObject.timeCreated || now;

  object.save((saveErr, result) => {
    if (saveErr) {
      callback({ error: new errorCreator.Database({ errorObject: saveErr, name: `saveObject ${objectType} ${object}` }) });

      return;
    }

    const objectToSend = newObject.toObject();
    objectToSend.objectId = result._id.toString();

    callback({
      data: {
        objectType,
        savedObject: objectToSend,
      },
    });
  });
}

/**
 * Verifies object
 * @param {Object} params - Parameters
 * @param {Object} params.query - Search query
 * @param {Object} params.object - Type of object that will be modified
 * @param {Function} params.callback - Callback
 */
function verifyObject({
  query,
  object,
  callback,
}) {
  const update = {
    $set: {
      isVerified: true,
      lastUpdated: new Date(),
    },
  };
  const options = { new: true };

  object.findOneAndUpdate(query, update, options).lean().exec((err, verified) => {
    if (err) {
      callback({ error: new errorCreator.Database({ errorObject: err, name: 'verifyObject' }) });

      return;
    } else if (!verified) {
      callback({ error: new errorCreator.DoesNotExist({ name: 'verify' }) });

      return;
    }

    callback({ data: { verified: addObjectId({ object: verified }) } });
  });
}

/**
 * Verifies all object
 * @param {Object} params - Parameters
 * @param {Object} params.query - Search query
 * @param {Object} params.object - Type of object that will be modified
 * @param {Function} params.callback - Callback
 */
function verifyAllObjects({
  query,
  object,
  callback,
}) {
  const update = {
    $set: {
      isVerified: true,
      lastUpdated: new Date(),
    },
  };
  const options = { multi: true, new: true };

  object.update(query, update, options).lean().exec((err, verified = []) => {
    if (err) {
      callback({ error: new errorCreator.Database({ errorObject: err, name: 'verifyAllObjects' }) });

      return;
    }

    callback({ data: { verified: verified.map(verifiedObject => addObjectId({ object: verifiedObject })) } });
  });
}

/**
 * Drops database. Used during testing
 * @param {Object} params - Parameters
 * @param {Function} params.callback - Callback
 */
function dropDatabase({ callback }) {
  if (appConfig.mode !== appConfig.Modes.TEST && appConfig.mode !== appConfig.Modes.DEV) {
    callback({ error: new errorCreator.Internal({ name: 'not in dev/test mode' }) });

    return;
  }

  mongoose.connection.dropDatabase((error) => {
    if (error) {
      callback({ error: 'Failed to drop test db', errorObject: error });

      return;
    }

    callback({ data: { success: true } });
  });
}

/**
 * Retrieves and returns object
 * @param {Object} params - Parameters
 * @param {Function} params.callback - Callback
 * @param {Object} params.object - Object to call and get
 * @param {string} [params.query] - Database query
 * @param {string} [params.errorNameContent] - Content that will be sent with error
 * @param {Object} [params.filter] - Parameter filter
 */
function getObject({
  object,
  callback,
  errorNameContent = 'getObject',
  query = {},
  filter = {},
}) {
  object.findOne(query, filter).lean().exec((error, foundObject) => {
    if (error) {
      callback({ error: new errorCreator.Database({ errorObject: error, name: errorNameContent }) });

      return;
    } else if (!foundObject) {
      callback({ data: { exists: false } });

      return;
    }

    callback({
      data: {
        exists: true,
        object: addObjectId({ object: foundObject }),
      },
    });
  });
}

/**
 * Does the object exist?
 * @param {Object} params - Parameters.
 * @param {Function} params.callback - Callback.
 * @param {Object} params.object - Object to call and get.
 * @param {string} params.query - Database query.
 */
function doesObjectExist({
  object,
  callback,
  query,
}) {
  object.findOne(query).lean().exec((error, foundObject) => {
    if (error) {
      callback({ error: new errorCreator.Database({ errorObject: error, name: 'doesObjectExist' }) });

      return;
    }

    callback({ data: { exists: typeof foundObject !== 'undefined' && foundObject !== null } });
  });
}

/**
 * Retrieves and returns objects
 * @param {Object} params - Parameters
 * @param {Function} params.callback - Callback
 * @param {Object} params.object - Object to call and get
 * @param {Object} [params.query] - Database query
 * @param {Object} [params.sort] - Sorting instructions
 * @param {string} [params.errorNameContent] - Content that will be sent with error
 * @param {Object} [params.filter] - Parameter filter
 */
function getObjects({
  object,
  callback,
  errorNameContent = 'getObjects',
  sort,
  query = {},
  filter = {},
}) {
  const findCallback = (error, objects = []) => {
    if (error) {
      callback({ error: new errorCreator.Database({ errorObject: error, name: errorNameContent }) });

      return;
    }

    callback({ data: { objects: objects.map(foundObject => addObjectId({ object: foundObject })) } });
  };

  if (sort) {
    object.find(query, filter).sort(sort).lean().exec(findCallback);
  } else {
    object.find(query, filter).lean().exec(findCallback);
  }
}

/**
 * Update object.
 * @param {Object} params - Parameters.
 * @param {Function} params.callback - Callback.
 * @param {Object} params.object - Object to call and get.
 * @param {string} params.query - Database query.
 * @param {string} [params.errorNameContent] - Content that will be sent with error.
 */
function updateObject({
  object,
  update,
  callback,
  query,
  errorNameContent = 'updateObject',
}) {
  const options = { new: true };
  const toUpdate = {
    $set: update.$set || {},
  };

  toUpdate.$set.lastUpdated = new Date();

  if (update.$unset && Object.keys(update.$unset).length > 0) { toUpdate.$unset = update.$unset; }

  object.findOneAndUpdate(query, toUpdate, options).lean().exec((err, foundObject) => {
    if (err) {
      callback({ error: new errorCreator.Database({ errorObject: err, name: errorNameContent }) });

      return;
    } else if (!foundObject) {
      callback({ error: new errorCreator.DoesNotExist({ name: `${object.toString()} update` }) });

      return;
    }

    callback({ data: { object: addObjectId({ object: foundObject }) } });
  });
}

/**
 * Update objects.
 * @param {Object} params - Parameters.
 * @param {Function} params.callback - Callback.
 * @param {Object} params.object - Object to call and get.
 * @param {string} [params.query] - Database query.
 * @param {string} [params.errorNameContent] - Content that will be sent with error.
 */
function updateObjects({
  object,
  update,
  callback,
  query = {},
  errorNameContent = 'updateObjects',
}) {
  const options = {
    new: true,
    multi: true,
  };
  const toUpdate = update;
  const now = new Date();
  toUpdate.$set = toUpdate.$set || {};
  toUpdate.$set.lastUpdated = now;

  object.update(query, toUpdate, options).lean().exec((err) => {
    if (err) {
      callback({ error: new errorCreator.Database({ errorObject: err, name: errorNameContent }) });

      return;
    }

    getObjects({
      object,
      query: { lastUpdated: now },
      callback: ({ error: errorGet, data: updatedData }) => {
        if (errorGet) {
          callback({ error: errorGet });

          return;
        }

        const { objects } = updatedData;

        callback({
          data: {
            objects: objects.map(foundObject => addObjectId({ object: foundObject })),
          },
        });
      },
    });
  });
}

/**
 * Remove object
 * @param {Object} params - Parameters
 * @param {Object} params.object - Type of object to remove
 * @param {string} params.query - Database query
 * @param {Function} params.callback - Callback
 */
function removeObject({
  object,
  query,
  callback,
}) {
  const options = { justOne: true };

  object.findOneAndRemove(query, options).lean().exec((err) => {
    if (err) {
      callback({ error: new errorCreator.Database({ errorObject: err, name: 'removeObject' }) });

      return;
    }

    callback({ data: { success: true } });
  });
}

/**
 * Remove objects
 * @param {Object} params - Parameters
 * @param {Object} params.object - Type of objects to remove
 * @param {string} params.query - Database query
 * @param {Function} params.callback - Callback
 */
function removeObjects({
  object,
  query,
  callback,
}) {
  object.deleteMany(query).lean().exec((err) => {
    if (err) {
      callback({ error: new errorCreator.Database({ errorObject: err, name: 'removeObjects' }) });

      return;
    }

    callback({ data: { success: true } });
  });
}

/**
 * Add object access for users or teams.
 * @param {Object} params - Parameters.
 * @param {string} params.objectId - Id of the device to update.
 * @param {Function} params.callback - Callback.
 * @param {string[]} [params.userIds] - Id of the users to add.
 * @param {string[]} [params.teamIds] - Id of the teams to add.
 * @param {string[]} [params.bannedIds] - Id of the banned user/teams to add.
 * @param {string[]} [params.teamAdminIds] - Id of the team admins to remove.
 * @param {string[]} [params.userAdminIds] - Id of the user admins to remove.
 */
function addObjectAccess({
  objectId,
  object,
  userIds,
  teamIds,
  bannedIds,
  teamAdminIds,
  userAdminIds,
  callback,
}) {
  if (!userIds && !teamIds && !bannedIds && !teamAdminIds && !userAdminIds) {
    callback({ error: new errorCreator.InvalidData({ expected: 'teamIds || userIds || bannedIds || userAdminIds || teamAdminIds' }) });

    return;
  }

  const update = {
    $addToSet: {
      teamIds: [],
      userIds: [],
    },
    $pull: {},
  };

  if (teamIds) { update.$addToSet.teamIds = update.$addToSet.teamIds.concat(teamIds); }
  if (userIds) { update.$addToSet.userIds = update.$addToSet.userIds.concat(userIds); }
  if (bannedIds) {
    update.$addToSet.bannedIds = bannedIds;
    update.$pull.teamAdminIds = { $each: bannedIds };
    update.$pull.userAdminIds = { $each: bannedIds };
    update.$pull.userIds = { $each: bannedIds };
    update.$pull.teamIds = { $each: bannedIds };
  }

  if (teamAdminIds) { update.$addToSet.teamAdminIds = teamAdminIds; }

  if (userAdminIds) { update.$addToSet.userAdminIds = userAdminIds; }

  updateObject({
    update,
    callback,
    object,
    query: { _id: objectId },
  });
}

/**
 * Remove object access for users or teams.
 * @param {Object} params - Parameters.
 * @param {string} params.objectId - Id of the device to update.
 * @param {Function} params.callback - Callback.
 * @param {string[]} [params.userIds] - Id of the users to remove.
 * @param {string[]} [params.teamIds] - Id of the teams to remove.
 * @param {string[]} [params.bannedIds] - Id of the banned users/teams to remove.
 * @param {string[]} [params.teamAdminIds] - Id of the team admins to remove.
 * @param {string[]} [params.userAdminIds] - Id of the user admins to remove.
 */
function removeObjectAccess({
  objectId,
  object,
  userIds,
  teamIds,
  bannedIds,
  teamAdminIds,
  userAdminIds,
  callback,
}) {
  if (!userIds && !teamIds && !bannedIds && !teamAdminIds && !userAdminIds) {
    callback({ error: new errorCreator.InvalidData({ expected: 'teamIds || userIds || bannedIds || userAdminIds || teamAdminIds' }) });

    return;
  }

  const update = { $pull: {} };

  if (userIds) { update.$pull.userIds = { $in: userIds }; }
  if (teamAdminIds) { update.$pull.teamAdminIds = { $in: teamAdminIds }; }
  if (userAdminIds) { update.$pull.userAdminIds = { $in: userAdminIds }; }
  if (teamIds) { update.$pull.teamIds = { $in: teamIds }; }
  if (bannedIds) { update.$pull.bannedIds = { $in: bannedIds }; }

  updateObject({
    update,
    callback,
    object,
    query: { _id: objectId },
  });
}

/**
 * Create base query to check if the user has access to the object
 * @param {Object} params - Parameters.
 * @param {Object} params.user - User running a query.
 * @return {Object} Query.
 */
function createUserQuery({ user }) {
  return {
    bannedIds: { $nin: [user.objectId] },
    $or: [
      { isPublic: true },
      { ownerId: user.objectId },
      { userIds: { $in: [user.objectId] } },
      { visibility: { $lte: user.accessLevel } },
      { teamIds: { $in: user.partOfTeams } },
    ],
  };
}

exports.coordinatesSchema = coordinatesSchema;

exports.saveObject = saveObject;
exports.verifyObject = verifyObject;
exports.verifyAllObjects = verifyAllObjects;
exports.dropDatabase = dropDatabase;
exports.getObjects = getObjects;
exports.getObject = getObject;
exports.updateObject = updateObject;
exports.removeObject = removeObject;
exports.removeObjects = removeObjects;
exports.createSchema = createSchema;
exports.removeObjectAccess = removeObjectAccess;
exports.addObjectAccess = addObjectAccess;
exports.doesObjectExist = doesObjectExist;
exports.updateObjects = updateObjects;
exports.createUserQuery = createUserQuery;
