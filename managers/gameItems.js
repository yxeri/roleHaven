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

const dbFakePassword = require('../db/connectors/fakePassword');
const dbGameUser = require('../db/connectors/lanternGameUser');
const authenticator = require('../helpers/authenticator');
const dbConfig = require('../config/defaults/config').databasePopulation;

/**
 * Create game users.
 * @param {Object} params - Parameters.
 * @param {Object[]} params.gameUsers - Game users to add.
 * @param {string} params.token - jwt.
 * @param {Function} params.callback - Callback.
 */
function createGameUsers({ gameUsers, token, callback }) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.CreateGameItems.name,
    callback: ({ error }) => {
      if (error) {
        callback({ error });

        return;
      }

      dbGameUser.createGameUsers({
        gameUsers,
        callback,
      });
    },
  });
}

/**
 * Create fake passwords.
 * @param {Object} params - Parameters.
 * @param {string[]} params.passwords - Passwords to create.
 * @param {string} params.token - Jwt.
 * @param {Function} params.callback - Callback.
 */
function createFakePasswords({ passwords, token, callback }) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.CreateGameItems.name,
    callback: ({ error }) => {
      if (error) {
        callback({ error });

        return;
      }

      dbFakePassword.addFakePasswords({
        passwords,
        callback,
      });
    },
  });
}

/**
 * Get game users by station id.
 * @param {Object} params - Parameters.
 * @param {string} params.token - jwt.
 * @param {Function} params.callback - Callback.
 */
function getGameUsers({ token, callback }) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.GetAll.name,
    callback: ({ error }) => {
      if (error) {
        callback({ error });

        return;
      }

      dbGameUser.getGameUsers({ callback });
    },
  });
}

/**
 * Get fake passwords.
 * @param {Object} params - Parameters.
 * @param {string} params.token - jwt.
 * @param {Function} params.callback - Callback.
 */
function getFakePasswords({ token, callback }) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.GetAll.name,
    callback: ({ error }) => {
      if (error) {
        callback({ error });

        return;
      }

      dbFakePassword.getAllFakePasswords({ callback });
    },
  });
}

/**
 * Remove fake password
 * @param {Object} params - Parameters
 * @param {string} params.password - Password value
 * @param {Object} params.token - jwt
 * @param {Function} params.callback - Callback
 */
function removeFakePassword({ password, token, callback }) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.RemoveGameItem.name,
    callback: ({ error }) => {
      if (error) {
        callback({ error });

        return;
      }

      dbFakePassword.removeFakePassword({
        password,
        callback,
      });
    },
  });
}

exports.createGameUsers = createGameUsers;
exports.createFakePasswords = createFakePasswords;
exports.removeFakePassword = removeFakePassword;
exports.getGameUsers = getGameUsers;
exports.getFakePasswords = getFakePasswords;
