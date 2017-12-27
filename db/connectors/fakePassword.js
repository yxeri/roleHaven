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

const fakePasswordSchema = new mongoose.Schema(dbConnector.createSchema({
  passwords: { type: [String], default: [] },
}), { collection: 'fakePasswords' });

const FakePassword = mongoose.model('FakePassword', fakePasswordSchema);

/**
 * Add custom id to the object
 * @param {Object} fakePassword - Fake password object
 * @return {Object} - Fake password object with id
 */
function addCustomId(fakePassword) {
  const updatedFakePasswordId = fakePassword;
  updatedFakePasswordId.passwordId = fakePassword.objectId;

  return updatedFakePasswordId;
}

/**
 * Add new fake passwords. Existing will be ignored
 * @param {Object} params - Parameters
 * @param {string[]} params.passwords - Fake passwords to add
 * @param {Function} params.callback - Callback
 */
function addFakePasswords({ passwords, callback }) {
  dbConnector.updateObject({
    query: {},
    object: FakePassword,
    update: { $addToSet: { passwords: { $each: passwords } } },
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      callback({
        data: {
          passwords: data.object.passwords.map(password => addCustomId(password)),
        },
      });
    },
  });
}

/**
 * Get all fake passwords
 * @param {Object} params - Parameters
 * @param {Function} params.callback - Callback
 */
function getAllFakePasswords({ callback }) {
  dbConnector.getObject({
    object: FakePassword,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const passwords = (data.object ? data.object.passwords : []).map(password => addCustomId(password));

      callback({ data: { passwords } });
    },
  });
}

/**
 * Create fake passsword container
 * @param {Function} callback - Callback
 */
function createFakePasswordsContainer(callback) {
  FakePassword.findOne({}).lean().exec((error, data) => {
    if (error) {
      callback({ error });

      return;
    } else if (!data) {
      dbConnector.saveObject({
        callback,
        object: new FakePassword({}),
        objectType: 'fakePasswords',
      });

      return;
    }

    callback({ data: { exists: true } });
  });
}

/**
 * Remove a fake password.
 * @param {Object} params - Parameters.
 * @param {string} params.password - Password.
 * @param {Function} params.callback - Callback.
 */
function removeFakePassword({ password, callback }) {
  dbConnector.updateObject({
    callback,
    query: {},
    update: { $pull: { passwords: password } },
    object: FakePassword,
  });
}

createFakePasswordsContainer(({ error, data }) => {
  if (error) {
    console.error('Failed to create fake password container');

    return;
  }

  console.log('Created ', data);
});

exports.addFakePasswords = addFakePasswords;
exports.removeFakePassword = removeFakePassword;
exports.getAllFakePasswords = getAllFakePasswords;
exports.createfakePasswordContainer = createFakePasswordsContainer;
