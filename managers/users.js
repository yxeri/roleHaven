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
const textTools = require('../utils/textTools');
const authenticator = require('../helpers/authenticator');
const roomManager = require('./rooms');
const deviceManager = require('../managers/devices');
const dbRoom = require('../db/connectors/room');
const dbDevice = require('../db/connectors/device');
const socketUtils = require('../utils/socketIo');

/**
 * Create a user.
 * @param {Object} params - Parameters.
 * @param {Object} params.user - User to create.
 * @param {string} params.origin - Name of the caller origin.
 * @param {Function} params.callback - Callback.
 * @param {Object} params.io - Socket.io. Used if socket is not set.
 * @param {Object} [params.socket] - Socket.io.
 */
function createUser({
  token,
  user,
  callback,
  socket,
  io,
  origin = dbConfig.OriginTypes.NONE,
}) {
  authenticator.isUserAllowed({
    token,
    commandName: origin === dbConfig.OriginTypes.SOCKET && !appConfig.disallowSocketUserRegister ? dbConfig.apiCommands.CreateUserThroughSocket.name : dbConfig.apiCommands.CreateUser.name,
    callback: ({ error }) => {
      if (error) {
        callback({ error });

        return;
      } else if (!textTools.isAllowedFull(user.username)) {
        callback({ error: new errorCreator.InvalidCharacters({ name: `User name: ${user.username}` }) });

        return;
      } else if (user.username.length > appConfig.usernameMaxLength || user.password.length > appConfig.passwordMaxLength || user.registerDevice.length > appConfig.deviceIdLength) {
        callback({ error: new errorCreator.InvalidCharacters({ name: `User name length: ${appConfig.usernameMaxLength} Password length: ${appConfig.usernameMaxLength} Device length: ${appConfig.deviceIdLength}` }) });

        return;
      } else if (dbConfig.protectedNames.includes(user.username.toLowerCase())) {
        callback({ error: new errorCreator.InvalidCharacters({ name: `protected name ${user.username}` }) });

        return;
      }

      const newUser = user;
      newUser.isVerified = appConfig.userVerify;
      newUser.rooms = [
        dbConfig.rooms.public.roomId,
        dbConfig.rooms.bcast.roomId,
        dbConfig.rooms.important.roomId,
        dbConfig.rooms.user.roomId,
        dbConfig.rooms.news.roomId,
        dbConfig.rooms.schedule.roomId,
      ];

      dbUser.createUser({
        user: newUser,
        callback: ({ error: userError, data: userData }) => {
          if (userError) {
            callback({ error: userError });

            return;
          }

          const createdUser = userData.user;

          dbRoom.createRoom({
            room: {
              ownerId: createdUser.userId,
              roomName: createdUser.userId,
              visibility: dbConfig.AccessLevels.SUPERUSER,
              accessLevel: dbConfig.AccessLevels.SUPERUSER,
            },
            options: {
              shouldSetIdToName: true,
              isFollower: true,
            },
            callback: ({ error: roomError }) => {
              if (roomError) {
                callback({ error: roomError });

                return;
              }

              const wallet = {
                walletId: createdUser.userId,
                accessLevel: createdUser.accessLevel,
                ownerId: createdUser.userId,
                amount: appConfig.defaultWalletAmount,
              };
              const walletOptions = { setId: true };

              dbWallet.createWallet({
                wallet,
                options: walletOptions,
                callback: ({ error: walletError, data: walletData }) => {
                  if (walletError) {
                    callback({ error: walletError });

                    return;
                  }

                  const dataToSend = {
                    data: {
                      user: {
                        userId: createdUser.userId,
                        username: createdUser.username,
                      },
                      changeType: dbConfig.ChangeTypes.CREATE,
                    },
                  };

                  if (socket) {
                    socket.broadcast.emit(dbConfig.EmitTypes.USER, dataToSend);
                  } else {
                    io.emit(dbConfig.EmitTypes.USER, dataToSend);
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
}

/**
 * List users.
 * @param {Object} params - Parameters.
 * @param {boolean} params.includeInactive - Should banned and verified users be retrieved?
 * @param {Object} params.token - jwt.
 * @param {Function} params.callback - Callback.
 */
function listUsers({
  includeInactive,
  token,
  callback,
}) {
  authenticator.isUserAllowed({
    token,
    commandName: includeInactive ? dbConfig.apiCommands.GetInactiveUsers : dbConfig.apiCommands.GetUsers.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      dbUser.getUsersListByUser({
        callback,
        user: data.user,
      });
    },
  });
}

/**
 * Change password.
 * @param {Object} params - Parameters.
 * @param {string} params.password - Password.
 * @param {Function} params.callback - Callback.
 * @param {string} params.userId - Id of the user changing the password.
 */
function changePassword({
  token,
  userId,
  password,
  callback,
}) {
  authenticator.isUserAllowed({
    token,
    matchToId: userId,
    commandName: dbConfig.apiCommands.ChangePassword.name,
    callback: ({ error }) => {
      if (error) {
        callback({ error });

        return;
      }

      dbUser.updateUserPassword({
        password,
        userId,
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
 * Get user by name.
 * @param {Object} params - Parameters.
 * @param {string} params.username - Name of the user to retrieve.
 * @param {Object} params.userId - ID of the user retrieving the user.
 * @param {Function} params.callback - Callback.
 */
function getUserByName({
  token,
  username,
  userId,
  callback,
}) {
  authenticator.isUserAllowed({
    token,
    matchToId: userId,
    commandName: dbConfig.apiCommands.GetUser.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      if (username === data.user.username) {
        callback({ data });

        return;
      }

      dbUser.getUserByName({
        username,
        callback: ({ error: userError, data: userData }) => {
          if (userError) {
            callback({ error: userError });

            return;
          } else if (userData.user.accessLevel >= data.user.accessLevel) {
            callback({ error: new errorCreator.NotAllowed({ name: 'retrieved user too high access' }) });

            return;
          }

          callback({ data: userData });
        },
      });
    },
  });
}

/**
 * Login user through socket client side.
 * @param {Object} params - Parameters.
 * @param {Object} params.user - User logging in.
 * @param {Object} params.device - Device logged in on.
 * @param {Object} params.io - Socket.io. Will be used if socket is not set.
 * @param {Function} params.callback - Callback.
 * @param {Object} [params.socket] - Socket.io.
 */
function login({
  user,
  device,
  socket,
  io,
  callback,
}) {
  dbUser.getUserByName({
    username: user.username,
    includeInactive: true,
    callback: ({ error: userError, data: userData }) => {
      if (userError) {
        callback({ error: userError });

        return;
      } else if (userData.user.isBanned) {
        callback({ error: new errorCreator.Banned({}) });

        return;
      } else if (!userData.user.isVerified) {
        callback({ error: new errorCreator.NeedsVerification({}) });

        return;
      }

      const authUser = userData.user;

      authenticator.createToken({
        userId: authUser.userId,
        password: user.password,
        callback: ({ error, data: tokenData }) => {
          if (error) {
            callback({ error });

            return;
          }

          dbUser.updateOnline({
            userId: authUser.userId,
            socketId: socket.id,
            isOnline: true,
            callback: (socketData) => {
              if (socketData.error) {
                callback({ error: socketData.error });

                return;
              }

              const newDevice = device;
              newDevice.lastUserId = authUser.userId;
              newDevice.socketId = socket.id;

              dbDevice.updateDevice({
                deviceId: newDevice.deviceId,
                device: newDevice,
                callback: ({ error: deviceError }) => {
                  if (deviceError) {
                    callback({ error: deviceError });

                    return;
                  }

                  const oldSocket = io.sockets.connected[authUser.socketId];

                  if (oldSocket) {
                    roomManager.leaveSocketRooms(socket);
                    oldSocket.emit(dbConfig.EmitTypes.LOGOUT);
                  }

                  socketUtils.joinRooms({
                    io,
                    roomIds: authUser.followingRooms,
                    socketId: socket.id,
                  });


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
}

/**
 * Logout user.
 * @param {Object} params - Parameters.
 * @param {Object} params.device - The device of the user that is logging out.
 * @param {string} params.token jwt.
 * @param {Object} params.socket - Socket.io.
 * @param {string} params.userId - ID of the user trying to log out the user.
 * @param {Function} params.callback - Callback.
 */
function logout({
  device,
  userId,
  token,
  socket,
  callback,
}) {
  authenticator.isUserAllowed({
    token,
    matchToId: userId,
    commandName: dbConfig.apiCommands.Logout.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const authUser = data.user;

      dbUser.updateOnline({
        userId: authUser.userId,
        isOnline: false,
        callback: ({ error: socketError }) => {
          if (socketError) {
            callback({ error: socketError });

            return;
          }

          const deviceToUpdate = device;
          deviceToUpdate.lastUserId = authUser.userId;
          deviceToUpdate.socketId = '';

          deviceManager.updateDevice({
            device: deviceToUpdate,
            callback: ({ error: deviceError }) => {
              if (deviceError) {
                callback({ error: deviceError });

                return;
              }

              roomManager.leaveSocketRooms({ socket });

              callback({ data: { success: true } });
            },
          });
        },
      });
    },
  });
}

/**
 * Get banned users.
 * @param {Object} params - Parameters.
 * @param {string} params.token - jwt.
 * @param {Function} params.callback - Callback.
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

      dbUser.getUsersListByUser({
        callback: (usersData) => {
          if (usersData.error) {
            callback({ error: usersData.error });

            return;
          }

          const { users } = usersData.data;

          callback({
            data: { users: users.map(user => user.username) },
          });
        },
      });
    },
  });
}

/**
 * Unban user.
 * @param {Object} params - Parameters.
 * @param {string} params.token - jwt token.
 * @param {Object} params.bannedUserId - ID of the user to unban.
 * @param {Function} params.callback - Callback.
 * @param {Object} params.io - Socket.io.
 */
function unbanUser({
  token,
  bannedUserId,
  callback,
  io,
}) {
  authenticator.isUserAllowed({
    token,
    matchToId: bannedUserId,
    commandName: dbConfig.apiCommands.UnbanUser.name,
    callback: ({ error }) => {
      if (error) {
        callback({ error });

        return;
      }

      dbUser.updateBanUser({
        shouldBan: false,
        userId: bannedUserId,
        callback: ({ error: unbanError }) => {
          if (unbanError) {
            callback({ error: unbanError });

            return;
          }

          const dataToSend = {
            data: {
              user: {
                userId: bannedUserId,
                isBanned: false,
              },
              changeType: dbConfig.ChangeTypes.UPDATE,
            },
          };

          io.emit(dbConfig.EmitTypes.USER, dataToSend);

          callback({ data: { success: true } });
        },
      });
    },
  });
}

/**
 * Ban user.
 * @param {Object} params - Parameters.
 * @param {Object} params.banUserId - ID of the user to ban.
 * @param {Object} params.io - socket-io.
 * @param {string} params.token - jwt.
 * @param {Function} params.callback - Callback.
 * @param {string} [params.reason] - Text describing why the user was banned.
 */
function banUser({
  banUserId,
  reason,
  io,
  token,
  callback,
}) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.BanUser.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      } else if (banUserId === data.user.userId) {
        callback({ error: new errorCreator.InvalidData({ name: 'cannot ban self' }) });

        return;
      }

      dbUser.updateBanUser({
        userId: banUserId,
        shouldBan: true,
        callback: ({ error: banError }) => {
          if (banError) {
            callback({ error: banError });

            return;
          }

          const bannedSocket = io.sockets.connected[banUserId];
          const banDataToSend = {
            data: {
              reason,
              user: { userId: banUserId },
            },
          };
          const dataToSend = {
            data: {
              user: {
                userId: banUserId,
                isBanned: true,
              },
              changeType: dbConfig.ChangeTypes.UPDATE,
            },
          };

          if (bannedSocket) {
            roomManager.leaveSocketRooms({ socket: bannedSocket });
          }

          io.to(banUserId).emit(dbConfig.EmitTypes.BAN, banDataToSend);
          io.emit(dbConfig.EmitTypes.USER, dataToSend);

          callback({ data: { success: true } });
        },
      });
    },
  });
}

/**
 * Verifies a user account and allows it to login.
 * @param {Object} params - Parameters.
 * @param {string} params.userIdToVerify - ID of the user to verify.
 * @param {string} params.token - jwt.
 * @param {Object} params.io - Socket.io. Will be used if socket is not set.
 * @param {Function} params.callback - Callback.
 */
function verifyUser({
  userIdToVerify,
  token,
  io,
  callback,
}) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.VerifyUser.name,
    callback: ({ error }) => {
      if (error) {
        callback({ error });

        return;
      }

      dbUser.verifyUser({
        userId: userIdToVerify,
        callback: ({ error: verifyError }) => {
          if (verifyError) {
            callback({ error: verifyError });

            return;
          }

          const dataToSend = {
            data: {
              user: {
                userId: userIdToVerify,
                isVerified: true,
              },
              changeType: dbConfig.ChangeTypes.UPDATE,
            },
          };

          io.emit(dbConfig.EmitTypes.USER, dataToSend);

          callback({ data: { success: true } });
        },
      });
    },
  });
}

exports.createUser = createUser;
exports.getUserByName = getUserByName;
exports.changePassword = changePassword;
exports.login = login;
exports.logout = logout;
exports.getBannedUsers = getBannedUsers;
exports.listUsers = listUsers;
exports.banUser = banUser;
exports.unbanUser = unbanUser;
exports.verifyUser = verifyUser;
