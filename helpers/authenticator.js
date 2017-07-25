const dbUser = require('../db/connectors/user');
const jwt = require('jsonwebtoken');
const appConfig = require('../config/defaults/config').app;
const errorCreator = require('../objects/error/errorCreator');
const dbConfig = require('../config/defaults/config').databasePopulation;

/**
 * Create json web token
 * @param {string} params.userName User name of user to auth
 * @param {string} params.password Password of user to auth
 * @param {Function} params.callback Callback
 */
function createToken({ userName, password, callback }) {
  dbUser.authUser({
    userName,
    password,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const { user } = data;

      const jwtUser = {
        _id: user._id, // eslint-disable-line no-underscore-dangle
        userName: user.userName,
        accessLevel: user.accessLevel,
        visibility: user.visibility,
        verified: user.verified,
        banned: user.banned,
      };

      jwt.sign({ data: jwtUser }, appConfig.jsonKey, (err, token) => {
        if (err) {
          callback({ error: new errorCreator.Internal({ name: 'jwt', errorObject: err }) });

          return;
        }

        callback({ data: { token } });
      });
    },
  });
}

/**
 * Checks if the user is allowed to use the command
 * @param {string} params.token Json web token
 * @param {string} params.commandName Name of the command
 * @param {string} [params.matchUserNameTo] Checks if sent user name is the same as authenticated. Used for current user get, as they need less permission than get from other users
 * @param {Function} params.callback callback
 */
function isUserAllowed({ commandName, token, matchUserNameTo = '', callback = () => {} }) {
  const commandUsed = dbConfig.apiCommands[commandName];
  const anonUser = dbConfig.anonymousUser;

  if (!commandUsed) {
    callback({ error: new errorCreator.DoesNotExist({ name: commandName }) });

    return;
  }

  if (!token) {
    if (commandUsed.accessLevel > anonUser.accessLevel) {
      callback({ error: new errorCreator.NotAllowed({ name: commandName }) });

      return;
    }

    callback({ data: { user: anonUser } });
  } else {
    jwt.verify(token, appConfig.jsonKey, (err, decoded) => {
      if (err || !decoded) {
        callback({ error: new errorCreator.NotAllowed({ name: commandName }) });

        return;
      }

      const commandAccessLevel = decoded.data.userName === matchUserNameTo ? commandUsed.selfAccessLevel : commandUsed.accessLevel;

      dbUser.getUserByAlias({
        alias: decoded.data.userName,
        callback: ({ error, data }) => {
          if (error) {
            callback({ error });

            return;
          } else if (commandAccessLevel > data.user.accessLevel) {
            callback({ error: new errorCreator.NotAllowed({ name: commandName }) });

            return;
          }

          callback({ data: { user: data.user, matchedUserName: decoded.data.userName === matchUserNameTo } });
        },
      });
    });
  }
}

exports.isUserAllowed = isUserAllowed;
exports.createToken = createToken;
