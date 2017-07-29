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
const objectValidator = require('./../utils/objectValidator');
const errorCreator = require('../objects/error/errorCreator');
const winston = require('winston');

const dbPath = `mongodb://${appConfig.dbHost}:${appConfig.dbPort}/${appConfig.dbName}`;

mongoose.connect(dbPath, { useMongoClient: true }, (err) => {
  if (err) {
    winston.emerg('Failed to connect to the database');

    return;
  }

  winston.info('Connection established to database');
});

/**
 * Saves object to database
 * @param {Object} params.object Object to save
 * @param {string} params.objectName Object type name
 * @param {Function} params.callback Callback
 */
function saveObject({ object, objectType, callback }) {
  object.save((saveErr, savedObject) => {
    if (saveErr) {
      callback({ error: new errorCreator.Database({ errorObject: saveErr, name: `saveObject ${objectType} ${object}` }) });

      return;
    }

    callback({ data: { savedObject, objectType } });
  });
}

/**
 * Verifies object
 * @param {Object} params.query Search query
 * @param {Object} params.object Type of object that will be modified
 * @param {Function} params.callback Callback
 */
function verifyObject({ query, object, callback }) {
  const update = { $set: { verified: true } };
  const options = { new: true };

  object.findOneAndUpdate(query, update, options).lean().exec((err, verified) => {
    if (err) {
      callback({ error: new errorCreator.Database({ errorObject: err, name: 'verifyObject' }) });

      return;
    } else if (!verified) {
      callback({ error: new errorCreator.DoesNotExist({ name: 'verify' }) });

      return;
    }

    callback({ data: { verified } });
  });
}

/**
 * Verifies all object
 * @param {Object} params.query Search query
 * @param {Object} params.object Type of object that will be modified
 * @param {Function} params.callback Callback
 */
function verifyAllObjects({ query, object, callback }) {
  const update = { $set: { verified: true } };
  const options = { multi: true, new: true };

  object.update(query, update, options).lean().exec((err, verified = []) => {
    if (err) {
      callback({ error: new errorCreator.Database({ errorObject: err, name: 'verifyAllObjects' }) });

      return;
    }

    callback({ data: { verified } });
  });
}

/**
 * Match partial name
 * @param {Function} params.callback Callback
 * @param {string} params.partialName Partial name
 * @param {Object} params.queryType Database query
 * @param {Object} params.filter Result filter
 * @param {Object} params.sort Result sorting
 * @param {Object} params.user User
 * @param {string} params.type Type of object to match against
 * @param {Function} params.callback - Callback
 */
function matchPartial({ callback, partialName, queryType, filter, sort, user, type }) {
  if (!objectValidator.isValidData({ callback, partialName, queryType, filter, sort, user, type }, { filter: true, sort: true, user: true, queryType: true, callback: true, type: true })) {
    callback({ error: new errorCreator.InvalidData({ expected: '{ callback, partialName, queryType, filter, sort, user, type }' }) });

    return;
  }

  const query = {};
  const regex = { $regex: `^${partialName}.*` };

  if (partialName) {
    if (type === 'userName') {
      query.$and = [
        { banned: false },
        { verified: true },
        { userName: regex },
      ];
    } else if (type === 'roomName') {
      query.$and = [{ roomName: regex }];
    }
  } else {
    query.$and = [];
  }

  query.$and.push({ visibility: { $lte: user.accessLevel } });

  queryType.find(query, filter).sort(sort).lean().exec((err, matched = []) => {
    if (err) {
      callback({ error: new errorCreator.Database({ errorObject: err, name: 'matchPartialName' }) });

      return;
    }

    callback({ data: { matched } });
  });
}

/**
 * Drops database. Used during testing
 * @param {Function} params.callback Callback
 */
function dropDatabase({ callback }) {
  if (appConfig.mode === 'test') {
    mongoose.connection.dropDatabase((error) => {
      if (error) {
        callback({ error: 'Failed to drop test db', errorObject: error });

        return;
      }

      callback({ data: { success: true } });
    });

    return;
  }

  callback({ error: 'Not in testing mode' });
}

exports.matchPartial = matchPartial;
exports.saveObject = saveObject;
exports.verifyObject = verifyObject;
exports.verifyAllObjects = verifyAllObjects;
exports.dropDatabase = dropDatabase;
