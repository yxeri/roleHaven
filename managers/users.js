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
const dbWallet = require('../db/connectors/wallet');
const appConfig = require('../config/defaults/config').app;
const dbConfig = require('../config/defaults/config').databasePopulation;
const errorCreator = require('../objects/error/errorCreator');
const dbInvitation = require('../db/connectors/invitationList');
const mailer = require('../helpers/mailer');
const textTools = require('../utils/textTools');
const objectValidator = require('../utils/objectValidator');
const authenticator = require('../helpers/authenticator');
const roomManager = require('./rooms');
const dbMailEvent = require('../db/connectors/mailEvent');
const deviceManager = require('../managers/devices');

/**
 * Create a user and all other objects needed for it
 * @param {Object} params.user User to create
 * @param {string} params.origin Name of the caller origin. Allowed: "socket"
 * @param {Function} params.callback Callback
 */
function createUser({ token, user, callback, origin = '' }) {
  authenticator.isUserAllowed({
    token,
    commandName: origin === 'socket' && !appConfig.disallowSocketUserRegister ? dbConfig.apiCommands.CreateUserThroughSocket.name : dbConfig.apiCommands.CreateUser.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      } else if (!objectValidator.isValidData({ user }, { user: { userName: true, registerDevice: true, password: true, mail: true } })) {
        callback({ error: new errorCreator.InvalidData({ expected: '{ user: { userName, registerDevice, password, mail } }' }) });

        return;
      } else if (!textTools.isAllowedFull(user.userName.toLowerCase())) {
        callback({ error: new errorCreator.InvalidCharacters({ name: `User name: ${user.userName}` }) });

        return;
      } else if (user.userName.length > appConfig.userNameMaxLength || user.password.length > appConfig.passwordMaxLength || user.registerDevice.length > appConfig.deviceIdLength) {
        callback({ error: new errorCreator.InvalidCharacters({ name: `User name length: ${appConfig.userNameMaxLength} Password length: ${appConfig.userNameMaxLength} Device length: ${appConfig.deviceIdLength}` }) });

        return;
      } else if ((user.visibility || user.accessLevel) && dbConfig.apiCommands.ChangeUserLevels.accessLevel > data.user.accessLevel) {
        callback({ error: new errorCreator.NotAllowed({ name: 'set access or visibility level' }) });

        return;
      } else if (dbConfig.protectedNames.indexOf(user.userName.toLowerCase()) > -1) {
        callback({ error: new errorCreator.InvalidCharacters({ name: `protected name ${user.userName}` }) });

        return;
      }

      const { userName, fullName, password, registerDevice, mail, banned, verified, accessLevel, visibility } = user;
      const lowerCaseUserName = userName.toLowerCase();

      const newUser = {
        userName: lowerCaseUserName,
        password,
        registerDevice,
        mail,
        banned,
        verified,
        accessLevel,
        visibility,
        registeredAt: new Date(),
        fullName: fullName || lowerCaseUserName,
        rooms: [
          dbConfig.rooms.public.roomName,
          dbConfig.rooms.bcast.roomName,
          dbConfig.rooms.important.roomName,
          dbConfig.rooms.user.roomName,
          dbConfig.rooms.news.roomName,
          dbConfig.rooms.schedule.roomName,
        ],
      };

      dbUser.createUser({
        user: newUser,
        callback: (userData) => {
          if (userData.error) {
            callback({ error: userData.error });

            return;
          }

          const createdUser = userData.data.user;

          roomManager.createSpecialRoom({
            room: {
              owner: createdUser.userName,
              roomName: createdUser.userName + appConfig.whisperAppend,
              visibility: dbConfig.AccessLevels.SUPERUSER,
              accessLevel: dbConfig.AccessLevels.SUPERUSER,
              isWhisper: true,
            },
            user: createdUser,
            callback: ({ error: roomError }) => {
              if (roomError) {
                callback({ error: roomError });

                return;
              }

              const wallet = {
                accessLevel: createdUser.accessLevel,
                owner: createdUser.userName,
                amount: appConfig.defaultWalletAmount,
              };

              dbWallet.createWallet({
                wallet,
                callback: ({ error: walletError, data: walletData }) => {
                  if (walletError) {
                    callback({ error: walletError });

                    return;
                  }

                  dbInvitation.createInvitationList({
                    userName: createdUser.userName,
                    callback: ({ error: listError }) => {
                      if (listError) {
                        callback({ error: listError });

                        return;
                      }

                      mailer.sendVerification({
                        address: createdUser.mail,
                        userName: createdUser.userName,
                        callback: ({ error: mailError }) => {
                          if (mailError) {
                            callback({ error: mailError });

                            return;
                          }

                          callback({
                            data: {
                              user: createdUser,
                              wallet: walletData.wallet,
                            },
                          });
                        },
                      });
                    },
                  });
                },
              });
            },
          });
        },
      });
    },
  });
}

/**
 * List users
 * @param {boolean} params.includeInactive Should banned and verified users be retrieved?
 * @param {Object} params.token jwt
 * @param {Function} params.callback Callback
 * @param {Object} [params.team] Team
 * @param {string} params.team.teamName Team name that will be checked against users
 * @param {boolean} params.team.shouldEqual Should the team name sent be the same as retrieved users?
 */
function listUsers({ includeInactive, token, callback, team = {} }) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.GetUser.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const user = data.user;

      dbUser.getUsers({
        user,
        includeInactive: includeInactive && user.accessLevel >= dbConfig.apiCommands.GetInactiveUsers,
        callback: (usersData) => {
          if (usersData.error) {
            callback({ error: usersData.error });

            return;
          }

          const users = usersData.data.users;
          // Should the team name on the retrived user be checked against the sent team name?
          const { teamName, shouldEqual } = team;
          const usersToSend = [];

          users.filter((currentUser) => {
            if (teamName) {
              if (shouldEqual && currentUser.team && currentUser.team === user.team) {
                return true;
              } else if (!shouldEqual && ((!currentUser.team && user.team) || currentUser.team !== user.team)) {
                return true;
              }

              return false;
            }

            return true;
          }).forEach((currentUser) => {
            if (includeInactive || (currentUser.verified && !currentUser.banned)) {
              const aliases = currentUser.aliases.map((alias) => {
                return { userName: alias };
              });
              const filteredUser = {
                userName: currentUser.userName,
                online: currentUser.online,
                team: currentUser.team,
              };

              if (user.accessLevel >= dbConfig.apiCommands.GetUserDetails.accessLevel) {
                filteredUser.verified = currentUser.verified;
                filteredUser.banned = currentUser.banned;
                filteredUser.fullName = currentUser.fullName;
                filteredUser.warnings = currentUser.warnings;
              }

              usersToSend.push(filteredUser);

              if (!teamName && aliases && aliases.length > 0) {
                Array.prototype.push.apply(filteredUser, aliases);
              }
            }
          });

          callback({
            data: {
              users: usersToSend,
            },
          });
        },
      });
    },
  });
}

/**
 * Change password
 * @param {string} params.key Password request key
 * @param {string} params.password Password
 * @param {string} params.userName Name of the user changing password
 * @param {Function} params.callback Callback
 */
function changePassword({ key, password, userName, callback }) {
  if (!objectValidator.isValidData({ key, password, userName }, { key: true, password: true, userName: true })) {
    callback({ error: new errorCreator.InvalidData({ expected: '{ key, password, userName }' }) });

    return;
  }

  dbMailEvent.getMailEventByKey({
    key,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      } else if (data.event.owner !== userName) {
        callback({ error: new errorCreator.NotAllowed({ name: `Change password for ${userName}` }) });

        return;
      }

      dbUser.updateUserPassword({
        password,
        userName: data.event.owner,
        callback: ({ error: updateError }) => {
          if (updateError) {
            callback({ error: updateError });

            return;
          }

          callback({ data: { success: true } });
        },
      });
    },
  });
}

/**
 * Send password reset mail
 * @param {string} params.userName User name of the user receiving a password recovery mail
 * @param {Function} params.callback Callback
 */
function sendPasswordReset({ token, userName, callback }) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.RequestPasswordReset.name,
    callback: ({ error }) => {
      if (error) {
        callback({ error });

        return;
      } else if (!objectValidator.isValidData({ token, userName, callback }, { token: true, userName: true, callback: true })) {
        callback({ error: new errorCreator.InvalidData({ expected: '{ token, userName, callback }' }) });
      }

      dbUser.getUser({
        userName,
        callback: ({ error: userError, data: userData }) => {
          if (userError) {
            callback({ error: userError });

            return;
          }

          mailer.sendPasswordReset({
            address: userData.user.mail,
            userName: userData.user.userName,
            callback: ({ error: resetError }) => {
              if (resetError) {
                callback({ error: resetError });

                return;
              }

              callback({ data: { success: true } });
            },
          });
        },
      });
    },
  });
}

/**
 * Get user by name
 * @param {string} params.userName User to retrieve
 * @param {Object} params.user User retrieving the user
 * @param {Function} params.callback Callback
 */
function getUser({ token, userName, callback }) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.GetUser.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const allowedUser = data.user;

      dbUser.getUser({
        userName: userName.toLowerCase(),
        callback: ({ error: userError, data: userData }) => {
          if (userError) {
            callback({ error: userError });

            return;
          } else if (userData.user.userName !== allowedUser.userName && (userData.user.accessLevel > allowedUser.accessLevel || userData.user.accessLevel > allowedUser.visibility)) {
            callback({ error: new errorCreator.NotAllowed({ name: `user ${userName}` }) });

            return;
          }

          callback({ data });
        },
      });
    },
  });
}

/**
 * Login user through socket client side
 * @param {Object} params.user User logging in
 * @param {Object} params.device Device logged in on
 * @param {Object} params.socket Socket io
 * @param {Object} params.io Socket io
 * @param {Function} params.callback Callback
 */
function login({ user, device, socket, io, callback }) {
  if (!objectValidator.isValidData({ user, device }, { user: { userName: true, password: true }, device: { deviceId: true } })) {
    callback({ error: new errorCreator.InvalidData({ expected: '{ user: { userName, password } }' }) });

    return;
  }

  authenticator.createToken({
    userName: user.userName,
    password: user.password,
    callback: ({ error, data: tokenData }) => {
      if (error) {
        callback({ error });

        return;
      }

      dbUser.getUser({
        userName: user.userName,
        callback: ({ error: userError, data: userData }) => {
          if (userError) {
            callback({ error: userError });

            return;
          }

          const authUser = userData.user;

          dbUser.updateUserSocketId({
            userName: authUser.userName,
            socketId: socket.id,
            callback: (socketData) => {
              if (socketData.error) {
                callback({ error: socketData.error });

                return;
              }

              const newDevice = device;
              newDevice.lastUser = authUser.userName;
              newDevice.socketId = socket.id;

              deviceManager.updateDevice({
                device: newDevice,
                callback: ({ error: deviceError }) => {
                  if (deviceError) {
                    callback({ error: deviceError });

                    return;
                  }

                  const oldSocket = io.sockets.connected[authUser.socketId];

                  if (oldSocket) {
                    roomManager.leaveSocketRooms({ socket });
                    oldSocket.emit('logout');
                  }

                  roomManager.joinRooms({ rooms: authUser.rooms, socket });

                  dbUser.setUserLastOnline({
                    userName: authUser.userName,
                    date: new Date(),
                    callback: ({ error: onlineError }) => {
                      if (onlineError) {
                        callback({ error: onlineError });

                        return;
                      }

                      callback({
                        data: {
                          token: tokenData.token,
                          user: authUser,
                        },
                      });
                    },
                  });
                },
              });
            },
          });
        },
      });
    },
  });
}

/**
 * Logout user from socket client
 * @param {Object} params.device Device that is logging out
 * @param {string} params.token jwt
 * @param {Object} params.socket Socket io
 * @param {Function} params.callback Callback
 */
function logout({ device, token, socket, callback }) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.Logout.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      } else if (!objectValidator.isValidData({ device }, { device: { deviceId: true } })) {
        callback({ error: new errorCreator.InvalidData({ expected: '{ device: { deviceId } }' }) });

        return;
      }

      const user = data.user;

      dbUser.updateUserSocketId({
        userName: user.userName,
        callback: ({ error: socketError }) => {
          if (socketError) {
            callback({ error: socketError });

            return;
          }

          const deviceToUpdate = device;
          deviceToUpdate.lastUser = user.userName;
          deviceToUpdate.socketId = '';

          deviceManager.updateDevice({
            device: deviceToUpdate,
            callback: ({ error: deviceError }) => {
              if (deviceError) {
                callback({ error: deviceError });

                return;
              }

              dbUser.updateUserOnline({
                userName: user.userName,
                online: false,
                callback: (onlineData) => {
                  if (onlineData.error) {
                    callback({ error: onlineData.error });

                    return;
                  }

                  roomManager.leaveSocketRooms({ socket });
                  callback({ data: { success: true } });

                  dbUser.getUserPosition({
                    user,
                    userName: user.userName,
                    callback: (positionData) => {
                      if (positionData.error) {
                        callback({ error: positionData.error });

                        return;
                      }

                      socket.broadcast.to(dbConfig.rooms.public.roomName).emit('mapPositions', {
                        data: {
                          positions: [positionData.data.position],
                          currentTime: new Date(),
                          shouldRemove: true,
                        },
                      });
                    },
                  });
                },
              });
            },
          });
        },
      });
    },
  });
}

/**
 * Get banned user names
 * @param {string} params.token jwt
 * @param {Function} params.callback Callback
 */
function getBannedUsers({ token, callback }) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.GetInactiveUsers.name,
    callback: ({ error }) => {
      if (error) {
        callback({ error });

        return;
      }

      dbUser.getBannedUsers({
        callback: (usersData) => {
          if (usersData.error) {
            callback({ error: usersData.error });

            return;
          }

          const { users } = usersData.data;

          callback({
            data: { users: users.map(user => user.userName) },
          });
        },
      });
    },
  });
}

/**
 * Match partial user name
 * @param {string} param.partialName Partial user name to match against
 * @param {string} params.token jwt
 * @param {Function} params.callback Callback
 */
function matchPartialUserName({ partialName, token, callback }) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.GetUser.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      dbUser.matchPartialUser({
        partialName,
        user: data.user,
        callback: (usersData) => {
          if (usersData.error) {
            callback({ error: usersData.error });

            return;
          }

          const { users } = usersData.data;

          callback({ matches: Object.keys(users).map(userKey => users[userKey].userName) });
        },
      });
    },
  });
}

/**
 * Ban user
 * @param {Object} params.user User to ban
 * @param {Object} params.io socket io
 * @param {string} params.token jwt
 * @param {Function} params.callback Callback
 */
function banUser({ user, io, token, callback }) {
  authenticator.userIsAllowed({
    token,
    commandName: dbConfig.apiCommands.BanUser.name,
    callback: ({ error }) => {
      if (error) {
        callback({ error });

        return;
      } else if (!objectValidator.isValidData({ user }, { user: { userName: true } })) {
        callback({ error: new errorCreator.InvalidData({ expected: '{ user: { userName } }' }) });

        return;
      }

      const userName = user.userName.toLowerCase();

      dbUser.banUser({
        userName,
        noClean: true,
        callback: ({ error: banError, data: banData }) => {
          if (banError) {
            callback({ error: banError });

            return;
          }

          // TODO Send mail to user

          const bannedSocketId = banData.user.socketId;

          dbUser.updateUserSocketId({
            userName,
            callback: ({ error: updateError }) => {
              if (updateError) {
                if (updateError.type === errorCreator.ErrorTypes.DOESNOTEXIST) {
                  callback({ data: { success: true } });

                  return;
                }

                callback({ error: updateError });

                return;
              }

              const bannedSocket = io.sockets.connected[bannedSocketId];

              if (bannedSocket) {
                io.to(bannedSocketId).emit('ban');
                roomManager.leaveSocketRooms({ socket: bannedSocket });
              }

              callback({ data: { success: true } });
            },
          });
        },
      });
    },
  });
}

/**
 * Verify user
 * @param {string} params.key Verification key
 * @param {Object} params.callback Callback
 * @param {Object} params.socket Socket.io
 * @param {Object} params.io Socket io. Will be used if socket is not set
 */
function verifyUser({ key, callback, socket, io }) {
  if (!objectValidator.isValidData({ key }, { key: true })) {
    callback({ error: new errorCreator.InvalidData({ expected: '{ key }' }) });

    return;
  }

  dbMailEvent.getMailEventByKey({
    key,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      dbUser.verifyUser({
        userName: data.event.owner,
        callback: (verifyData) => {
          if (verifyData.error) {
            callback({ error: verifyData.error });

            return;
          }

          const user = verifyData.data.verified;

          dbMailEvent.removeMailEvent({ key, callback: () => {} });
          callback({ data: { userName: user.userName } });

          if (socket) {
            socket.broadcast.emit('user', { user: { userName: user.userName } });
          } else {
            io.emit('user', { user: { userName: user.userName } });
          }
        },
      });
    },
  });
}

exports.createUser = createUser;
exports.getUsers = listUsers;
exports.sendPasswordReset = sendPasswordReset;
exports.getUser = getUser;
exports.changePassword = changePassword;
exports.login = login;
exports.logout = logout;
exports.getBannedUsers = getBannedUsers;
exports.matchPartialUserName = matchPartialUserName;
exports.listUsers = listUsers;
exports.banUser = banUser;
exports.verifyUser = verifyUser;