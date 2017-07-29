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

const dbUser = require('../db/connectors/user');
const appConfig = require('../config/defaults/config').app;
const dbConfig = require('../config/defaults/config').databasePopulation;
const errorCreator = require('../objects/error/errorCreator');
const textTools = require('../utils/textTools');
const authenticator = require('../helpers/authenticator');
const roomManager = require('./rooms');

/**
 * Create and add alias to user
 * @param {Object} [params.user] User that will get a new alias. Will default to current user
 * @param {string} params.alias Alias to add
 * @param {Function} params.callback Callback
 */
function createAlias({ token, alias, callback, user = {} }) {
  const newAlias = alias.toLowerCase();

  authenticator.isUserAllowed({
    token,
    matchNameTo: user.userName,
    commandName: dbConfig.apiCommands.CreateAlias.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      } else if (newAlias.length > appConfig.userNameMaxLength) {
        callback({ error: new errorCreator.InvalidCharacters({ name: `User name length: ${appConfig.userNameMaxLength}` }) });

        return;
      } else if (!textTools.isAlphaNumeric(newAlias)) {
        callback({ error: new errorCreator.InvalidCharacters({ name: 'alias name', expected: 'a-z 0-9' }) });

        return;
      }

      const userToUpdate = user || data.user;

      dbUser.createAlias({
        userName: userToUpdate.userName,
        alias: newAlias,
        callback: ({ error: aliasError }) => {
          if (aliasError) {
            callback({ error: aliasError });

            return;
          }

          roomManager.createSpecialRoom({
            user: userToUpdate,
            room: {
              owner: userToUpdate.userName,
              roomName: newAlias + appConfig.whisperAppend,
              accessLevel: dbConfig.AccessLevels.SUPERUSER,
              visibility: dbConfig.AccessLevels.SUPERUSER,
              isWhisper: true,
            },
            callback: (roomData) => {
              if (roomData.error) {
                callback({ error: roomData.error });

                return;
              }

              callback({ data: { alias: newAlias } });
            },
          });
        },
      });
    },
  });
}

/**
 * Get aliases from user
 * @param {Object} params.user User to retrieve aliases from
 * @param {Object} params.token jwt
 * @param {Function} params.callback Callback
 */
function getAliases({ token, callback, user = {} }) {
  authenticator.isUserAllowed({
    token,
    matchNameTo: user.userName,
    commandName: dbConfig.apiCommands.GetAliases.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const userName = user.userName || data.user.userName;

      dbUser.getUser({
        userName,
        callback: ({ error: userError, data: userData }) => {
          if (userError) {
            callback({ error: userError });

            return;
          }

          callback({
            data: {
              aliases: userData.user.aliases,
              userName: userData.user.userName,
            },
          });
        },
      });
    },
  });
}

/**
 * Get aliases from all users
 * @param {string} params.token jwt
 * @param {boolean} params.includeInactive Should it include banned and unverified users
 * @param {Function} params.callback Callback
 */
function getAllAliases({ token, includeInactive, callback }) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.GetAllAliases.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      dbUser.getUsers({
        includeInactive: includeInactive && data.user.accessLevel >= dbConfig.apiCommands.GetInactiveUsers,
        user: data.user,
        callback: (usersData) => {
          if (usersData.error) {
            callback({ error: usersData.error });

            return;
          }

          const aliases = [];

          usersData.data.users.forEach((user) => {
            Array.prototype.push.apply(aliases, user.aliases || []);
          });

          callback({ data: { aliases } });
        },
      });
    },
  });
}

/**
 * Match partial name to user's aliases
 * @param {string} params.partialName Partial alias name
 * @param {string} params.token jwt
 * @param {Function} params.callback Callback
 */
function matchPartialAlias({ partialName, token, callback }) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.GetAliases.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const user = data.user;
      let matches = [];

      if (user.aliases) {
        if (!partialName) {
          matches = user.aliases;
        } else {
          user.aliases.forEach((alias) => {
            const aliasRegex = new RegExp(`^${partialName}.*`);

            if (alias.match(aliasRegex)) {
              matches.push(alias);
            }
          });
        }
      }

      callback({ data: { matches } });
    },
  });
}

exports.createAlias = createAlias;
exports.getAliases = getAliases;
exports.matchPartialAlias = matchPartialAlias;
exports.getAllAliases = getAllAliases;
