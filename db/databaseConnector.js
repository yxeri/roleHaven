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
  customLastUpdate: Date,
  customTimeCreated: Date,
  visibility: { type: Number, default: dbConfig.AccessLevels.ANONYMOUS },
  accessLevel: { type: Number, default: dbConfig.AccessLevels.ANONYMOUS },
  adminIds: { type: [String], default: [] },
  userIds: { type: [String], default: [] },
  teamIds: { type: [String], default: [] },
  bannedIds: { type: [String], default: [] },
  isPublic: { type: Boolean, default: true },
};

mongoose.connect(dbPath, { useMongoClient: true }, (err) => {
  if (err) {
    console.error('Failed to connect to the database');

    return;
  }

  console.info('Connection established to database');
});

/**
 * Create and return db schema
 * @param {Object} schemaParameters - Parameters to add to the schema
 * @return {Object} - Schema
 */
function createSchema(schemaParameters) {
  const schema = baseSchema;

  Object.keys(schemaParameters).forEach((parameterKey) => {
    schema[parameterKey] = schemaParameters[parameterKey];
  });

  return schema;
}

/**
 * Add object identifier
 * @private
 * @param {Object} params - Parameters
 * @param {Object} params.object - Object to add an ID to
 * @returns {Object} Updated object
 */
function addObjectId({ object }) {
  const modifiedObject = object;

  modifiedObject.objectId = object._id; // eslint-disable-line no-underscore-dangle

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
  const objectToSave = object;

  objectToSave.lastUpdated = objectToSave.lastUpdated || now;
  objectToSave.timeCreated = objectToSave.timeCreated || now;

  object.save((saveErr, savedObject) => {
    if (saveErr) {
      callback({ error: new errorCreator.Database({ errorObject: saveErr, name: `saveObject ${objectType} ${object}` }) });

      return;
    }

    callback({ data: { savedObject: addObjectId({ object: savedObject }), objectType } });
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
    }

    callback({ data: { object: addObjectId({ object: foundObject }) } });
  });
}

/**
 * Does the object exist?
 * @param {Object} params - Parameters
 * @param {Function} params.callback - Callback
 * @param {Object} params.object - Object to call and get
 * @param {string} params.query - Database query
 */
function doesObjectExist({
  object,
  callback,
  query,
}) {
  object.findOne(query, { _id: 1 }).lean().exec((error, foundObject) => {
    if (error) {
      callback({ error: new errorCreator.Database({ errorObject: error, name: 'doesObjectExist' }) });

      return;
    }

    callback({ data: { exists: typeof foundObject !== 'undefined' } });
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
 * Update object
 * @param {Object} params - Parameters
 * @param {Function} params.callback - Callback
 * @param {Object} params.object - Object to call and get
 * @param {string} params.query - Database query
 * @param {string} [params.errorNameContent] - Content that will be sent with error
 */
function updateObject({
  object,
  update,
  callback,
  query,
  errorNameContent = 'updateObject',
}) {
  const options = { new: true };
  const toUpdate = update;
  toUpdate.$set.lastUpdated = new Date();

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

  object.findOneAndDelete(query, options).lean().exec((err) => {
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
 * Add object access for users or teams
 * @param {Object} params - Parameters
 * @param {string} params.objectId - ID of the device to update
 * @param {Function} params.callback - Callback
 * @param {string[]} [params.userIds] - ID of the users to add
 * @param {string[]} [params.teamIds] - ID of the teams to add
 * @param {string[]} [params.bannedIds] - ID of the banned user/teams to add
 * @param {string[]} [params.teamAdminIds] - ID of the team admins to remove
 * @param {string[]} [params.userAdminIds] - ID of the user admins to remove
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

  const update = { $addToSet: {} };

  if (teamIds) { update.$addToSet.teamIds = teamIds; }
  if (userIds) { update.$addToSet.userIds = userIds; }
  if (bannedIds) { update.$addToSet.bannedIds = bannedIds; }
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
 * Remove object access for users or teams
 * @param {Object} params - Parameters
 * @param {string} params.objectId - ID of the device to update
 * @param {Function} params.callback - Callback
 * @param {string[]} [params.userIds] - ID of the users to remove
 * @param {string[]} [params.teamIds] - ID of the teams to remove
 * @param {string[]} [params.bannedIds] - ID of the banned users/teams to remove
 * @param {string[]} [params.teamAdminIds] - ID of the team admins to remove
 * @param {string[]} [params.userAdminIds] - ID of the user admins to remove
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
