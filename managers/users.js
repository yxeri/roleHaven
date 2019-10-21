/*
 Copyright 2017 Carmilla Mina Jankovic

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

const bcrypt = require('bcrypt');
const dbUser = require('../db/connectors/user');
const dbWallet = require('../db/connectors/wallet');
const { dbConfig, appConfig } = require('../config/defaults/config');
const errorCreator = require('../error/errorCreator');
const textTools = require('../utils/textTools');
const authenticator = require('../helpers/authenticator');
const roomManager = require('./rooms');
const dbRoom = require('../db/connectors/room');
const socketUtils = require('../utils/socketIo');
const dbForum = require('../db/connectors/forum');
const managerHelper = require('../helpers/manager');
const positionManager = require('./positions');
const imager = require('../helpers/imager');
const messageManager = require('./messages');
const dbAlias = require('../db/connectors/alias');

/**
 * Create a user.
 * @param {Object} params Parameters.
 * @param {Object} params.user User to create.
 * @param {Function} params.callback Callback.
 * @param {Object} params.io Socket.io.
 */
function createUser({
  token,
  user,
  callback,
  io,
  options,
  socket,
  image,
}) {
  let command;

  if (appConfig.mode === appConfig.Modes.TEST) {
    command = dbConfig.apiCommands.AnonymousCreation;
  } else if (appConfig.disallowUserRegister) {
    command = dbConfig.apiCommands.CreateDisallowedUser;
  } else {
    command = dbConfig.apiCommands.CreateUser;
  }

  authenticator.isUserAllowed({
    token,
    commandName: command.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const { user: authUser } = data;

      if (appConfig.requireOffName && !user.offName) {
        callback({
          error: new errorCreator.InvalidData({
            expected: 'offName',
            extraData: { param: 'offName' },
          }),
        });

        return;
      }

      if (!textTools.isAllowedFull(user.username)) {
        callback({
          error: new errorCreator.InvalidCharacters({
            name: `User name: ${user.username}.`,
            extraData: { param: 'characters' },
          }),
        });

        return;
      }

      if (user.username.length < appConfig.usernameMinLength || user.username.length > appConfig.usernameMaxLength) {
        callback({
          error: new errorCreator.InvalidLength({
            name: `User name length: ${appConfig.usernameMinLength}-${appConfig.usernameMaxLength}`,
            extraData: { param: 'username' },
          }),
        });

        return;
      }

      if (user.offName && (user.offName.length < appConfig.offNameMinLength || user.offName.length > appConfig.offNameNameMaxLength)) {
        callback({
          error: new errorCreator.InvalidLength({
            name: `Off name length: ${appConfig.offNameMinLength}-${appConfig.offNameNameMaxLength}`,
            extraData: { param: 'offName' },
          }),
        });

        return;
      }

      if (user.password.length < appConfig.passwordMinLength || user.password.length > appConfig.passwordMaxLength) {
        callback({
          error: new errorCreator.InvalidLength({
            name: `Password length: ${appConfig.passwordMinLength}-${appConfig.passwordMaxLength}`,
            extraData: { param: 'password' },
          }),
        });

        return;
      }

      if (user.registerDevice.length > appConfig.deviceIdLength) {
        callback({
          error: new errorCreator.InvalidLength({
            name: `Device length: ${appConfig.deviceIdLength}`,
            extraData: { param: 'device' },
          }),
        });

        return;
      }

      if (dbConfig.protectedNames.includes(user.username.toLowerCase())) {
        callback({
          error: new errorCreator.InvalidCharacters({
            name: `protected name ${user.username}`,
            extraData: { param: 'protected' },
          }),
        });

        return;
      }

      if (user.description && user.description.join('').length > appConfig.userDescriptionMaxLength) {
        callback({
          error: new errorCreator.InvalidLength({
            name: `Description length: ${appConfig.userDescriptionMaxLength}`,
            extraData: { param: 'description' },
          }),
        });

        return;
      }

      if (user.accessLevel && (authUser.accessLevel < dbConfig.apiCommands.UpdateUserAccess.accessLevel)) {
        callback({ error: new errorCreator.NotAllowed({ name: 'Set user access level' }) });

        return;
      }

      if (user.visibility && (authUser.accessLevel < dbConfig.apiCommands.UpdateUserVisibility.accessLevel)) {
        callback({ error: new errorCreator.NotAllowed({ name: 'Set user visibility' }) });

        return;
      }

      const newUser = user;
      newUser.username = textTools.trimSpace(newUser.username);
      newUser.usernameLowerCase = newUser.username.toLowerCase();
      newUser.isVerified = !appConfig.userVerify;
      newUser.followingRooms = dbConfig.requiredRooms;
      newUser.accessLevel = newUser.accessLevel || dbConfig.AccessLevels.STANDARD;
      newUser.mailAddress = newUser.mailAddress
        ? newUser.mailAddress.toLowerCase()
        : undefined;

      const userCallback = () => {
        dbUser.createUser({
          options,
          user: newUser,
          callback: ({ error: userError, data: userData }) => {
            if (userError) {
              callback({ error: userError });

              return;
            }

            const { user: createdUser } = userData;

            dbRoom.createRoom({
              room: {
                ownerId: createdUser.objectId,
                roomName: createdUser.objectId,
                objectId: createdUser.objectId,
                visibility: dbConfig.AccessLevels.STANDARD,
                accessLevel: dbConfig.AccessLevels.SUPERUSER,
                isUser: true,
              },
              options: {
                setId: true,
              },
              callback: ({ error: roomError, data: roomData }) => {
                if (roomError) {
                  callback({ error: roomError });

                  return;
                }

                const wallet = {
                  objectId: createdUser.objectId,
                  accessLevel: createdUser.accessLevel,
                  ownerId: createdUser.objectId,
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

                    positionManager.createPosition({
                      io,
                      position: {
                        objectId: createdUser.objectId,
                        positionName: createdUser.objectId,
                        positionType: dbConfig.PositionTypes.USER,
                      },
                      internalCallUser: createdUser,
                      isUserPosition: true,
                      callback: ({ error: positionError }) => {
                        if (positionError) {
                          callback({ error: positionError });

                          return;
                        }

                        const forum = {
                          title: newUser.fullName || newUser.username,
                          isPersonal: true,
                          objectId: createdUser.objectId,
                          ownerId: createdUser.objectId,
                        };
                        const forumOptions = { setId: true };

                        dbForum.createForum({
                          forum,
                          options: forumOptions,
                          callback: ({ error: forumError, data: forumData }) => {
                            if (forumError) {
                              callback({ error: forumError });

                              return;
                            }

                            const createdRoom = roomData.room;
                            const createdWallet = walletData.wallet;
                            const createdForum = forumData.forum;

                            const creatorDataToSend = {
                              data: {
                                wallet: createdWallet,
                                room: createdRoom,
                                user: createdUser,
                                forum: createdForum,
                                isSender: true,
                                changeType: dbConfig.ChangeTypes.CREATE,
                              },
                            };
                            const dataToSend = {
                              data: {
                                user: managerHelper.stripObject({ object: { ...createdUser } }),
                                changeType: dbConfig.ChangeTypes.CREATE,
                              },
                            };
                            const roomDataToSend = {
                              data: {
                                room: managerHelper.stripObject({ object: { ...createdRoom } }),
                                changeType: dbConfig.ChangeTypes.CREATE,
                              },
                            };
                            const walletDataToSend = {
                              data: {
                                wallet: managerHelper.stripObject({ object: { ...createdWallet } }),
                                changeType: dbConfig.ChangeTypes.CREATE,
                              },
                            };
                            const forumDataToSend = {
                              data: {
                                forum: managerHelper.stripObject({ object: { ...createdForum } }),
                              },
                            };

                            if (!socket) {
                              io.to(createdUser.objectId).emit(dbConfig.EmitTypes.USER, creatorDataToSend);
                            }

                            if (socket) {
                              socket.join(createdUser.objectId);
                              socket.broadcast.emit(dbConfig.EmitTypes.USER, dataToSend);
                            } else {
                              const userSocket = socketUtils.getUserSocket({ io, socketId: user.socketId });

                              if (userSocket) {
                                userSocket.join(createdRoom.objectId);
                              }

                              io.emit(dbConfig.EmitTypes.USER, dataToSend);
                            }

                            io.emit(dbConfig.EmitTypes.FORUM, forumDataToSend);
                            io.emit(dbConfig.EmitTypes.ROOM, roomDataToSend);
                            io.emit(dbConfig.EmitTypes.WALLET, walletDataToSend);

                            if (!createdUser.isVerified) {
                              messageManager.sendChatMsg({
                                io,
                                socket,
                                message: {
                                  roomId: dbConfig.rooms.admin.objectId,
                                  text: [`User ${createdUser.username} (${createdUser.objectId}) needs to be verified.`],
                                },
                                internalCallUser: dbConfig.users.systemUser,
                                callback: () => {},
                              });
                            }

                            callback(creatorDataToSend);
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
      };

      bcrypt.hash(newUser.password, 10, (hashError, hash) => {
        if (hashError) {
          callback({ error: new errorCreator.Internal({ errObject: hashError }) });

          return;
        }

        newUser.password = hash;

        if (image) {
          imager.createImage({
            image,
            callback: ({ error: imageError, data: imageData }) => {
              if (imageError) {
                callback({ error: imageError });

                return;
              }

              const { image: createdImage } = imageData;

              newUser.image = createdImage;

              userCallback();
            },
          });

          return;
        }

        userCallback();
      });
    },
  });
}

/**
 * Get users that the user has access to.
 * @param {Object} params Parameters.
 * @param {Object} params.token jwt.
 * @param {Function} params.callback Callback.
 * @param {boolean} [params.includeInactive] Should banned and unverified users be in the result?
 */
function getUsersByUser({
  token,
  includeInactive = false,
  callback,
}) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.GetUsers.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const { user: authUser } = data;

      dbUser.getUsersByUser({
        user: authUser,
        includeInactive: authUser.accessLevel >= dbConfig.AccessLevels.MODERATOR
          ? true
          : includeInactive,
        includeOff: authUser.accessLevel >= dbConfig.apiCommands.IncludeOff.accessLevel,
        callback: ({ error: userError, data: userData }) => {
          if (userError) {
            callback({ error: userError });

            return;
          }

          const { users } = userData;
          const allUsers = users.filter((user) => {
            const { canSee } = authenticator.hasAccessTo({
              toAuth: authUser,
              objectToAccess: user,
            });

            return canSee;
          }).map((user) => {
            const { hasFullAccess } = authenticator.hasAccessTo({
              toAuth: authUser,
              objectToAccess: user,
            });
            const userObject = user;

            if (!hasFullAccess) {
              return managerHelper.stripObject({ object: userObject });
            }

            return userObject;
          }).sort((a, b) => {
            const aName = a.username;
            const bName = b.username;

            if (aName < bName) {
              return -1;
            }

            if (aName > bName) {
              return 1;
            }

            return 0;
          });

          callback({ data: { users: allUsers } });
        },
      });
    },
  });
}

/**
 * Get user by Id or name.
 * @param {Object} params Parameters.
 * @param {string} params.userId Id of the user to retrieve.
 * @param {Object} [params.internalCallUser] User to use on authentication. It will bypass token authentication.
 * @param {Function} params.callback Callback.
 */
function getUserById({
  token,
  userId,
  username,
  internalCallUser,
  callback,
}) {
  authenticator.isUserAllowed({
    token,
    internalCallUser,
    commandName: dbConfig.apiCommands.GetUser.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const { user: authUser } = data;

      if (userId === authUser.objectId) {
        callback({ data });

        return;
      }

      dbUser.getUserById({
        username,
        userId,
        callback: ({ error: userError, data: userData }) => {
          if (userError) {
            callback({ error: userError });

            return;
          }

          const { user: foundUser } = userData;
          const {
            hasAccess,
            canSee,
          } = authenticator.hasAccessTo({
            objectToAccess: foundUser,
            toAuth: authUser,
          });

          if (!canSee) {
            callback({ error: errorCreator.NotAllowed({ name: `user ${username || userId}` }) });

            return;
          }

          if (!hasAccess) {
            callback({ data: { user: managerHelper.stripObject({ object: foundUser }) } });

            return;
          }

          callback({ data: userData });
        },
      });
    },
  });
}

/**
 * Get user or owner (user) of the alias.
 * @param {Object} params Parameters.
 * @param {string} params.identityId Id of the user or alias owner to retrieve.
 * @param {Object} [params.internalCallUser] User to use on authentication. It will bypass token authentication.
 * @param {Function} params.callback Callback.
 */
function getUserOrAliasOwner({
  token,
  identityId,
  internalCallUser,
  callback,
}) {
  authenticator.isUserAllowed({
    token,
    internalCallUser,
    commandName: dbConfig.apiCommands.GetUser.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const { user: authUser } = data;
      const userCall = ({ data: userData }) => {
        const { user, alias } = userData;
        const {
          hasAccess,
          canSee,
        } = authenticator.hasAccessTo({
          objectToAccess: user,
          toAuth: authUser,
        });

        if (!canSee) {
          callback({ error: errorCreator.NotAllowed({ name: `identity ${identityId}` }) });

          return;
        }

        if (!hasAccess) {
          callback({
            data: {
              user: managerHelper.stripObject({ object: user }),
              alias: managerHelper.stripObject({ object: alias }),
            },
          });

          return;
        }

        callback({ data: userData });
      };

      if (identityId === authUser.objectId) {
        callback({ data: { user: authUser } });

        return;
      }

      dbUser.getUserById({
        userId: identityId,
        supressExistError: true,
        callback: ({ error: userError, data: userData }) => {
          if (userError) {
            if (userError.type !== 'does not exist') {
              callback({ error: userError });

              return;
            }

            dbAlias.getAliasById({
              aliasId: identityId,
              callback: ({ error: aliasError, data: aliasData }) => {
                if (aliasError) {
                  callback({ error: aliasError });

                  return;
                }

                const { alias } = aliasData;

                dbUser.getUserById({
                  userId: alias.ownerId,
                  callback: ({ error: ownerError, data: ownerData }) => {
                    if (ownerError) {
                      callback({ error: ownerError });

                      return;
                    }

                    userCall({ data: { user: ownerData.user, alias } });
                  },
                });
              },
            });

            return;
          }

          userCall({ data: userData });
        },
      });
    },
  });
}

/**
 * Change password for a user.
 * @param {Object} params Parameters.
 * @param {string} params.userId Id of the user.
 * @param {string} [params.password] Password. A password will be auto-generated and returned, if password hasn't been set.
 * @param {Function} params.callback Callback.
 */
function changePassword({
  token,
  userId,
  password,
  callback,
}) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.ChangePassword.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const { user } = data;

      getUserById({
        token,
        userId,
        internalCallUser: user,
        callback: ({ error: getUserError, data: getUserData }) => {
          if (getUserError) {
            callback({ error: getUserError });

            return;
          }

          const { user: foundUser } = getUserData;
          const {
            hasFullAccess,
          } = authenticator.hasAccessTo({
            objectToAccess: foundUser,
            toAuth: user,
          });

          if (!hasFullAccess) {
            callback({ error: errorCreator.NotAllowed({ name: `change password ${userId}` }) });

            return;
          }

          if (!password) {
            const generatedPassword = textTools.generateTextCode(10);

            bcrypt.hash(generatedPassword, 10, (hashError, hash) => {
              if (hashError) {
                callback({ error: new errorCreator.Internal({ errObject: hashError }) });

                return;
              }

              dbUser.updateUserPassword({
                userId,
                password: hash,
                callback: ({ error: passwordError }) => {
                  if (passwordError) {
                    callback({ error: passwordError });

                    return;
                  }

                  callback({
                    data: {
                      success: true,
                      user: {
                        objectId: userId,
                        password: generatedPassword,
                      },
                    },
                  });
                },
              });
            });

            return;
          }

          bcrypt.hash(password, 10, (hashError, hash) => {
            if (hashError) {
              callback({ error: new errorCreator.Internal({ errObject: hashError }) });

              return;
            }

            dbUser.updateUserPassword({
              password: hash,
              userId: foundUser.objectId,
              callback: ({ error: updateError }) => {
                if (updateError) {
                  callback({ error: updateError });

                  return;
                }

                callback({
                  data: {
                    success: true,
                    user: { objectId: userId },
                  },
                });
              },
            });
          });
        },
      });
    },
  });
}

/**
 * Login user through socket client side.
 * @param {Object} params Parameters.
 * @param {Object} params.user User logging in.
 * @param {Object} params.io Socket.io.
 * @param {Function} params.callback Callback.
 * @param {Object} params.socket Socket.io.
 */
function login({
  user,
  socket,
  io,
  callback,
}) {
  const {
    username,
    password,
    pushToken,
  } = user;

  authenticator.createToken({
    username,
    password,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const { token, user: authUser } = data;
      const {
        accessLevel,
        partOfTeams = [],
        objectId: userId,
        followingRooms: roomIds,
      } = authUser;
      const socketId = socket.id;

      dbUser.updateOnline({
        userId,
        socketId,
        pushToken,
        isOnline: true,
        callback: (socketData) => {
          if (socketData.error) {
            callback({ error: socketData.error });

            return;
          }

          socketUtils.joinRooms({
            io,
            socketId,
            userId,
            roomIds: roomIds.concat(partOfTeams),
          });
          socketUtils.joinRequiredRooms({
            io,
            userId,
            socketId,
            socket,
            accessLevel,
          });
          socketUtils.joinAliasRooms({
            io,
            socketId,
            aliases: authUser.aliases,
          });

          callback({ data: { user: authUser, token } });
        },
      });
    },
  });
}

/**
 * Logout user.
 * @param {Object} params Parameters.
 * @param {string} params.token jwt.
 * @param {Object} params.socket Socket.io.
 * @param {Function} params.callback Callback.
 */
function logout({
  token,
  socket,
  callback,
}) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.Logout.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const { objectId: userId } = data.user;

      dbUser.updateOnline({
        userId,
        isOnline: false,
        callback: ({ error: socketError }) => {
          if (socketError) {
            callback({ error: socketError });

            return;
          }

          positionManager.updatePosition({
            positionId: userId,
            position: {},
            options: { resetConnectedToUser: true },
            callback: () => {},
          });

          roomManager.leaveSocketRooms(socket);

          callback({ data: { success: true } });
        },
      });
    },
  });
}

/**
 * Unban user.
 * @param {Object} params Parameters.
 * @param {string} params.token jwt token.
 * @param {Object} params.bannedUserId ID of the user to unban.
 * @param {Function} params.callback Callback.
 * @param {Object} params.io Socket.io.
 */
function unbanUser({
  token,
  bannedUserId,
  callback,
  io,
}) {
  authenticator.isUserAllowed({
    token,
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
                objectId: bannedUserId,
                isBanned: false,
              },
              changeType: dbConfig.ChangeTypes.UPDATE,
            },
          };

          io.emit(dbConfig.EmitTypes.USER, dataToSend);

          callback(dataToSend);
        },
      });
    },
  });
}

/**
 * Ban user.
 * @param {Object} params Parameters.
 * @param {Object} params.banUserId ID of the user to ban.
 * @param {Object} params.io socket-io.
 * @param {string} params.token jwt.
 * @param {Function} params.callback Callback.
 * @param {string} [params.reason] Text describing why the user was banned.
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
      }

      if (banUserId === data.user.objectId) {
        callback({ error: new errorCreator.InvalidData({ name: 'cannot ban self' }) });

        return;
      }

      const { user } = data;

      getUserById({
        token,
        userId: banUserId,
        internalCallUser: user,
        callback: ({ error: getUserError }) => {
          if (getUserError) {
            callback({ error: getUserError });

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
                  user: {
                    isBanned: true,
                    objectId: banUserId,
                  },
                  changeType: dbConfig.ChangeTypes.UPDATE,
                },
              };
              const dataToSend = {
                data: {
                  user: {
                    objectId: banUserId,
                    isBanned: true,
                  },
                  changeType: dbConfig.ChangeTypes.UPDATE,
                },
              };

              if (bannedSocket) {
                roomManager.leaveSocketRooms(bannedSocket);
              }

              io.to(banUserId).emit(dbConfig.EmitTypes.BAN, banDataToSend);
              io.emit(dbConfig.EmitTypes.USER, dataToSend);

              callback(dataToSend);
            },
          });
        },
      });
    },
  });
}

/**
 * Verifies a user account and allows it to login.
 * @param {Object} params Parameters.
 * @param {string} params.userIdToVerify ID of the user to verify.
 * @param {string} params.token jwt.
 * @param {Object} params.io Socket.io. Will be used if socket is not set.
 * @param {Function} params.callback Callback.
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
                objectId: userIdToVerify,
                isVerified: true,
              },
              changeType: dbConfig.ChangeTypes.UPDATE,
            },
          };

          io.emit(dbConfig.EmitTypes.USER, dataToSend);

          callback(dataToSend);
        },
      });
    },
  });
}

/**
 * Update a user.
 * @param {Object} params Parameters.
 * @param {string} params.token jwt.
 * @param {Object} params.io Socket.io.
 * @param {Function} params.callback Callback.
 * @param {string} params.userId Id of the user to update.
 * @param {Object} params.user User parameter to update.
 * @param {Object} [params.options] Update options.
 */
function updateUser({
  token,
  io,
  callback,
  userId,
  options,
  socket,
  image,
  user = {},
}) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.UpdateUser.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const { user: authUser } = data;
      const userUpdate = user;
      const updateUserCallback = () => {
        getUserById({
          token,
          userId,
          internalCallUser: authUser,
          callback: ({ error: getUserError, data: getUserData }) => {
            if (getUserError) {
              callback({ error: getUserError });

              return;
            }

            if (userId === authUser.userId && dbConfig.apiCommands.UpdateSelf.accessLevel > authUser.accessLevel) {
              callback({ error: new errorCreator.NotAllowed({ name: 'update self' }) });

              return;
            }

            const { user: foundUser } = getUserData;

            const {
              hasFullAccess,
            } = authenticator.hasAccessTo({
              objectToAccess: foundUser,
              toAuth: authUser,
            });

            if (!hasFullAccess) {
              callback({ error: new errorCreator.NotAllowed({ name: `update user ${userId}` }) });

              return;
            }

            if (user.accessLevel && (authUser.accessLevel < dbConfig.AccessLevels.ADMIN || user.accessLevel > dbConfig.AccessLevels.ADMIN)) {
              callback({ error: new errorCreator.NotAllowed({ name: `update access level user ${userId}` }) });

              return;
            }

            dbUser.updateUser({
              options,
              userId,
              user: userUpdate,
              callback: ({ error: updateError, data: updateData }) => {
                if (updateError) {
                  callback({ error: updateError });

                  return;
                }

                const { user: updatedUser } = updateData;
                const dataToSend = {
                  data: {
                    user: managerHelper.stripObject({ object: { ...updatedUser } }),
                    changeType: dbConfig.ChangeTypes.UPDATE,
                  },
                };
                const creatorDataToSend = {
                  data: {
                    user: updatedUser,
                    changeType: dbConfig.ChangeTypes.UPDATE,
                  },
                };

                if (socket) {
                  socket.broadcast.emit(dbConfig.EmitTypes.USER, dataToSend);
                } else {
                  io.emit(dbConfig.EmitTypes.USER, dataToSend);
                }

                callback(creatorDataToSend);
              },
            });
          },
        });
      };

      if (image) {
        imager.createImage({
          image,
          callback: ({ error: imageError, data: imageData }) => {
            if (imageError) {
              callback({ error: imageError });

              return;
            }

            const { image: createdImage } = imageData;

            userUpdate.image = createdImage;

            updateUserCallback();
          },
        });

        return;
      }

      updateUserCallback();
    },
  });
}

/**
 * Update user. It will be called on reconnects from the client.
 * @param {Object} params Parameters.
 * @param {string} params.token jwt.
 * @param {Object} params.io Socket.io.
 * @param {Object} params.socket Socket.io.
 * @param {Function} params.callback Callback.
 */
function updateId({
  token,
  io,
  socket,
  callback,
}) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.UpdateId.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const { user: authUser } = data;

      const {
        accessLevel,
        partOfTeams = [],
        objectId: userId,
        followingRooms: roomIds,
      } = authUser;
      const socketId = socket.id;

      if (authUser.isAnonymous) {
        socketUtils.joinRequiredRooms({
          io,
          userId,
          socketId,
          socket,
          accessLevel: 0,
        });

        callback({ data: { user: authUser } });

        return;
      }

      dbUser.updateOnline({
        userId,
        socketId,
        isOnline: true,
        callback: (socketData) => {
          if (socketData.error) {
            callback({ error: socketData.error });

            return;
          }

          socketUtils.joinRooms({
            io,
            socketId,
            userId,
            roomIds: roomIds.concat(partOfTeams),
          });
          socketUtils.joinRequiredRooms({
            io,
            userId,
            socketId,
            socket,
            accessLevel,
          });
          socketUtils.joinAliasRooms({
            io,
            socketId,
            aliases: authUser.aliases,
          });

          callback({ data: { user: authUser } });
        },
      });
    },
  });
}

/**
 * Get all users.
 * @param {Object} params Parameters.
 * @param {Object} params.token Jwt.
 * @param {Object} [params.internalCallUser] Skip authentication and instead use this user.
 * @param {Function} params.callback Callback.
 */
function getAllUsers({
  token,
  internalCallUser,
  callback,
}) {
  authenticator.isUserAllowed({
    token,
    internalCallUser,
    commandName: dbConfig.apiCommands.GetFull.name,
    callback: ({ error }) => {
      if (error) {
        callback({ error });

        return;
      }

      dbUser.getAllUsers({ callback });
    },
  });
}

function getPushTokens({
  identities,
  token,
  callback,
  internalCallUser,
}) {
  authenticator.isUserAllowed({
    token,
    internalCallUser,
    commandName: dbConfig.apiCommands.GetUsers.name,
    callback: ({ error }) => {
      if (error) {
        callback({ error });

        return;
      }

      dbUser.getAllUsers({
        includeInactive: false,
        callback: ({ error: userError, data: userData }) => {
          if (userError) {
            callback({ error: userError });

            return;
          }

          const { users } = userData;

          if (!identities) {
            callback({
              data: {
                pushTokens: users
                  .filter((user) => { return user.pushToken; })
                  .map((user) => { return user.pushToken; }),
              },
            });

            return;
          }

          dbAlias.getAllAliases({
            callback: ({ error: aliasError, data: aliasData }) => {
              if (aliasError) {
                callback({ error: aliasError });

                return;
              }

              const { aliases } = aliasData;
              const aliasOwnerIds = aliases
                .filter((alias) => { return identities.includes(alias.objectId); })
                .map((alias) => { return alias.ownerId; });
              const pushTokens = users
                .filter((user) => {
                  return user.pushToken && (identities.includes(user.objectId) || aliasOwnerIds.includes(user.objectId));
                })
                .map((user) => { return user.pushToken; });

              callback({ data: { pushTokens } });
            },
          });
        },
      });
    },
  });
}

exports.createUser = createUser;
exports.getUserById = getUserById;
exports.changePassword = changePassword;
exports.login = login;
exports.logout = logout;
exports.banUser = banUser;
exports.unbanUser = unbanUser;
exports.verifyUser = verifyUser;
exports.updateUser = updateUser;
exports.getUsersByUser = getUsersByUser;
exports.updateId = updateId;
exports.getAllUsers = getAllUsers;
exports.getUserOrAliasOwner = getUserOrAliasOwner;
exports.getPushTokens = getPushTokens;
