'use strict';

const dbLanternHack = require('../../db/connectors/bbr/lanternHack');
const authenticator = require('../../helpers/authenticator');
const { dbConfig } = require('../../config/defaults/config');

/**
 * Create game users
 * @param {Object[]} params.gameUsers Game users to add
 * @param {string} params.token jwt
 * @param {Function} params.callback Callback
 */
function createGameUsers({
  gameUsers,
  token,
  callback,
}) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.CreateGameItems.name,
    callback: ({ error }) => {
      if (error) {
        callback({ error });

        return;
      }

      dbLanternHack.createGameUsers({ gameUsers });
      callback({ data: { message: 'Action done' } });
    },
  });
}

/**
 * Create fake passwords
 * @param {string[]} params.passwords Passwords to create
 * @param {string} params.token Jwt
 * @param {Function} params.callback Callback
 */
function createFakePasswords({
  passwords,
  token,
  callback,
}) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.CreateGameItems.name,
    callback: ({ error }) => {
      if (error) {
        callback({ error });

        return;
      }

      dbLanternHack.addFakePasswords({
        passwords,
        callback: ({
          error: passwordError,
          data: passwordData,
        }) => {
          if (passwordError) {
            callback({ error: passwordError });

            return;
          }

          callback({ data: passwordData });
        },
      });
    },
  });
}

/**
 * Get game users by station id
 * @param {number} params.stationId Station id
 * @param {string} params.token jwt
 * @param {Function} params.callback Callback
 */
function getGameUsers({
  stationId,
  token,
  callback,
}) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.GetGameItems.name,
    callback: ({ error }) => {
      if (error) {
        callback({ error });

        return;
      }

      dbLanternHack.getGameUsers({
        stationId,
        callback: ({
          error: usersError,
          data: usersData,
        }) => {
          if (usersError) {
            callback({ error: usersError });

            return;
          }

          callback({ data: usersData });
        },
      });
    },
  });
}

/**
 * Get fake passwords
 * @param {string} params.token jwt
 * @param {Function} params.callback Callback
 */
function getFakePasswords({
  token,
  callback,
}) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.GetGameItems.name,
    callback: ({ error }) => {
      if (error) {
        callback({ error });

        return;
      }

      dbLanternHack.getAllFakePasswords({
        callback: ({
          error: passwordError,
          data: passwordData,
        }) => {
          if (passwordError) {
            callback({ error: passwordError });

            return;
          }

          callback({ data: passwordData });
        },
      });
    },
  });
}

export { createGameUsers };
export { createFakePasswords };
export { getGameUsers };
export { getFakePasswords };
