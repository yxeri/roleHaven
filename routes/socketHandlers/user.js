/*
 Copyright 2015 Aleksandar Jankovic

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

const dbUser = require('../../db/connectors/user');
const dbConfig = require('../../config/defaults/config').databasePopulation;
const manager = require('../../socketHelpers/manager');
const appConfig = require('../../config/defaults/config').app;
const objectValidator = require('../../utils/objectValidator');
const errorCreator = require('../../objects/error/errorCreator');
const textTools = require('../../utils/textTools');
const jwt = require('jsonwebtoken');

dbUser.removeAllUserBlockedBy(() => {});

/**
 * @param {object} socket Socket.IO socket
 * @param {object} io Socket.IO
 */
function handle(socket, io) {
  socket.on('register', ({ user }, callback = () => {}) => {
    if (!objectValidator.isValidData({ user }, { user: { userName: true, password: true, registerDevice: true } })) {
      callback({ error: new errorCreator.InvalidData({ expected: '{ user: { userName, password, registerDevice } }' }) });

      return;
    } else if (!textTools.isAllowedFull(user.userName.toLowerCase())) {
      callback({ error: new errorCreator.InvalidCharacters({ name: `User name: ${user.userName}` }) });

      return;
    } else if (!appConfig.disallowUserRegister) {
      callback({ error: new errorCreator.NotAllowed({ name: 'register disallowed' }) });
    }

    const userName = user.userName.toLowerCase();
    const userObj = {
      userName,
      fullName: user.fullName || userName,
      socketId: '',
      password: user.password,
      registerDevice: user.registerDevice,
      verified: false,
      rooms: [
        dbConfig.rooms.public.roomName,
        dbConfig.rooms.bcast.roomName,
      ],
    };
    const wallet = { owner: userName };

    dbUser.createUser(userObj, (err, createdUser) => {
      if (err) {
        callback({ error: new errorCreator.Database({}) });

        return;
      } else if (createdUser === null) {
        callback({ error: new errorCreator.AlreadyExists({ name: `user ${userName}` }) });

        return;
      }

      const newRoom = {
        roomName: createdUser.userName + appConfig.whisperAppend,
        visibility: dbConfig.accessLevels.superUser,
        accessLevel: dbConfig.accessLevels.superUser,
      };
      const requiresVerification = appConfig.userVerify;

      manager.createRoom(newRoom, createdUser, () => {});
      manager.createWallet(wallet, () => {});

      if (requiresVerification) {
        // TODO Send event to admin
      }

      callback({
        data: {
          requiresVerification,
          user: createdUser,
        },
      });
    });
  });

  socket.on('updateId', ({ token, device }, callback = () => {}) => {
    if (!objectValidator.isValidData({ token, device }, { token: true, device: { deviceId: true } })) {
      callback({ error: new errorCreator.InvalidData({ expected: '{ user: { userName, password, registerDevice } }' }) });

      return;
    }

    manager.userIsAllowed({
      token,
      commandName: dbConfig.commands.updateId.commandName,
      callback: ({ error, allowedUser }) => {
        if (error) {
          callback({ error });

          return;
        }

        dbUser.updateUserSocketId(allowedUser.userName, socket.id, (idErr, updatedUser) => {
          if (idErr) {
            callback({ error: new errorCreator.Database({}) });

            return;
          }

          const data = {
            welcomeMessage: appConfig.welcomeMessage,
            user: {
              userName: updatedUser.userName,
              accessLevel: updatedUser.accessLevel,
              aliases: updatedUser.aliases,
              team: updatedUser.team,
              blockedBy: updatedUser.blockedBy,
            },
          };

          manager.joinRooms(updatedUser.rooms, socket, device.deviceId);

          callback({ data });
        });
      },
    });
  });

  socket.on('login', ({ user }, callback = () => {}) => {
    if (!objectValidator.isValidData({ user }, { user: { userName: true, password: true } })) {
      callback({ error: new errorCreator.InvalidData({ expected: '{ user: { userName, password } }' }) });

      return;
    }

    dbUser.authUser(user.userName, user.password, (err, authUser) => {
      if (err) {
        callback({ error: new errorCreator.Database({}) });

        return;
      } else if (authUser === null) {
        if (appConfig.userVerify) {
          callback({ error: new errorCreator.NeedsVerification({ name: user.userName }) });
        } else {
          callback({ error: new errorCreator.DoesNotExist({ name: user.userName }) });
        }

        return;
      }

      dbUser.updateUserSocketId(user.userName, socket.id, (idErr) => {
        if (idErr) {
          callback({ error: new errorCreator.Database({}) });

          return;
        }

        const oldSocket = io.sockets.connected[authUser.socketId];
        const jwtUser = {
          _id: authUser._id, // eslint-disable-line no-underscore-dangle
          userName: authUser.userName,
          accessLevel: authUser.accessLevel,
          visibility: authUser.visibility,
          verified: authUser.verified,
          banned: authUser.banned,
        };

        if (oldSocket) {
          manager.leaveSocketRooms({ socket });
          oldSocket.emit('logout');
        }

        manager.joinRooms(authUser.rooms, socket);

        callback({
          data: {
            token: jwt.sign({ data: jwtUser }, appConfig.jsonKey),
            user: authUser,
          },
        });

        dbUser.setUserLastOnline(user.userName, new Date(), (userOnlineErr, onlineUser) => {
          if (userOnlineErr || onlineUser === null) {
            console.log('Failed to set last online');
          }
        });
      });
    });
  });

  // TODO Not used
  socket.on('changePassword', ({ oldPassword, newPassword, token }, callback = () => {}) => {
    if (!objectValidator.isValidData({ oldPassword, newPassword }, { oldPassword: true, newPassword: true })) {
      callback({ error: new errorCreator.InvalidData({ expected: '{ oldPassword, newPassword }' }) });

      return;
    }

    manager.userIsAllowed({
      token,
      commandName: dbConfig.commands.password.commandName,
      callback: (allowErr, allowed, allowedUser) => {
        if (allowErr) {
          callback({ error: new errorCreator.Database({}) });

          return;
        } else if (!allowed) {
          callback({ error: new errorCreator.NotAllowed({ name: 'changePassword' }) });

          return;
        }

        dbUser.authUser(allowedUser.userName, oldPassword, (err, authUser) => {
          if (err) {
            callback({ error: new errorCreator.Database({}) });

            return;
          } else if (authUser === null) {
            callback({ error: new errorCreator.NotAllowed({ name: 'changePassword' }) });

            return;
          }

          dbUser.updateUserPassword(authUser.userName, newPassword, (userErr) => {
            if (userErr) {
              callback({ error: new errorCreator.Database({}) });

              return;
            }

            callback({ data: { success: true } });
          });
        });
      },
    });
  });

  socket.on('logout', ({ token }, callback = () => {}) => {
    manager.userIsAllowed({
      token,
      commandName: dbConfig.commands.logout.commandName,
      callback: ({ error, allowedUser }) => {
        if (error) {
          callback({ error });

          return;
        }

        dbUser.updateUserSocketId(allowedUser.userName, '', (err) => {
          if (err) {
            callback({ error: new errorCreator.Database({}) });

            return;
          }

          dbUser.updateUserOnline(allowedUser.userName, false, (userErr) => {
            if (userErr) {
              callback({ error: new errorCreator.Database({}) });

              return;
            }

            manager.leaveSocketRooms({ socket });
            callback({ data: { success: true } });
          });
        });
      },
    });
  });

  // TODO Not used
  socket.on('verifyUser', ({ user, token }, callback = () => {}) => {
    if (!objectValidator.isValidData({ user }, { user: { userName: true } })) {
      callback({ error: new errorCreator.InvalidData({ expected: '{ user }' }) });

      return;
    }

    manager.userIsAllowed({
      token,
      commandName: dbConfig.commands.verifyUser.commandName,
      callback: ({ error }) => {
        if (error) {
          callback({ error });

          return;
        }

        const userName = user.userName.toLowerCase();

        if (userName !== undefined) {
          dbUser.verifyUser(userName, (err) => {
            if (err) {
              callback({ error: new errorCreator.Database({}) });

              return;
            } else if (user === null) {
              callback({ error: new errorCreator.DoesNotExist({ name: userName }) });

              return;
            }

            callback({ data: { user: [user] } });
          });
        }
      },
    });
  });

  // TODO Not used
  socket.on('verifyAllUsers', ({ token }, callback = () => {}) => {
    manager.userIsAllowed({
      token,
      commandName: dbConfig.commands.verifyUser.commandName,
      callback: ({ error }) => {
        if (error) {
          callback({ error });

          return;
        }

        dbUser.verifyAllUsers((verifyErr, users = []) => {
          if (verifyErr) {
            callback({ error: new errorCreator.Database({}) });

            return;
          }

          callback({ data: { users } });

          // TODO Send message to registered device
        });
      },
    });
  });

  // TODO Not used
  socket.on('getUnverifiedUsers', ({ token }, callback = () => {}) => {
    manager.userIsAllowed({
      token,
      commandName: dbConfig.commands.getUnverifiedUsers.commandName,
      callback: ({ error }) => {
        if (error) {
          callback({ error });

          return;
        }

        dbUser.getUnverifiedUsers((err, users = []) => {
          if (err) {
            callback({ error: new errorCreator.Database({}) });

            return;
          }

          callback({ data: { users: users.map(user => user.userName) } });
        });
      },
    });
  });

  // TODO Not used
  socket.on('ban', ({ user, token }, callback = () => {}) => {
    if (!objectValidator.isValidData({ user }, { user: { userName: true } })) {
      callback({ error: new errorCreator.InvalidData({ expected: '{ user: { userName } }' }) });

      return;
    }

    manager.userIsAllowed({
      token,
      commandName: dbConfig.commands.banUser.commandName,
      callback: ({ error }) => {
        if (error) {
          callback({ error });

          return;
        }

        const userName = user.userName.toLowerCase();

        dbUser.banUser(userName, (err, bannedUser) => {
          if (err) {
            callback({ error: new errorCreator.Database({}) });

            return;
          } else if (bannedUser === null) {
            callback({ error: new errorCreator.DoesNotExist({ name: `user ${userName}` }) });

            return;
          }

          const bannedSocketId = user.socketId;

          dbUser.updateUserSocketId(userName, '', (userErr) => {
            if (userErr) {
              callback({ error: new errorCreator.Database({}) });

              return;
            }

            socket.to(bannedSocketId).emit('ban');
            manager.leaveSocketRooms({ socket });

            callback({ data: { success: true } });
          });
        });
      },
    });
  });

  // TODO Not used
  socket.on('unban', ({ user, token }, callback = () => {}) => {
    if (!objectValidator.isValidData({ user }, { user: { userName: true } })) {
      callback({ error: new errorCreator.InvalidData({ expected: '{ user: { userName } }' }) });

      return;
    }

    manager.userIsAllowed({
      token,
      commandName: dbConfig.commands.unbanUser.commandName,
      callback: ({ error }) => {
        if (error) {
          callback({ error });

          return;
        }

        const userName = user.userName.toLowerCase();

        dbUser.unbanUser(userName, (err, unbannedUser) => {
          if (err) {
            callback({ error: new errorCreator.Database({}) });

            return;
          } else if (unbannedUser === null) {
            callback({ error: new errorCreator.DoesNotExist({ name: `user ${userName}` }) });

            return;
          }

          callback({ data: { success: true } });
        });
      },
    });
  });

  // TODO Not used
  socket.on('getBannedUsers', ({ token }, callback = () => {}) => {
    manager.userIsAllowed({
      token,
      commandName: dbConfig.commands.getBannedUsers.commandName,
      callback: ({ error }) => {
        if (error) {
          callback({ error });

          return;
        }

        dbUser.getBannedUsers((err, users = []) => {
          if (err) {
            callback({ error: new errorCreator.Database({}) });

            return;
          }

          callback({
            data: {
              users: users.map(user => user.userName),
            },
          });
        });
      },
    });
  });

  // TODO Not used
  socket.on('updateUser', ({ user, field, value, token }, callback = () => {}) => {
    if (!objectValidator.isValidData({ user, field, value }, { user: { userName: true }, field: true, value: true })) {
      callback({ error: new errorCreator.InvalidData({ expected: '{ user: { userName }, field, value }' }) });

      return;
    }

    manager.userIsAllowed({
      token,
      commandName: dbConfig.commands.updateUser.commandName,
      callback: ({ error }) => {
        if (error) {
          callback({ error });

          return;
        }

        const userName = user.userName.toLowerCase();
        const updateCallback = (err, updatedUser) => {
          if (err) {
            callback({ error: new errorCreator.Database({}) });

            return;
          } else if (updatedUser === null) {
            callback({ error: new errorCreator.DoesNotExist({ name: `user ${userName}` }) });

            return;
          }

          callback({ data: { success: true } });
        };

        switch (field) {
          case 'visibility': {
            dbUser.updateUserVisibility(userName, value, updateCallback);

            break;
          }
          case 'accesslevel': {
            dbUser.updateUserAccessLevel(userName, value, updateCallback);

            break;
          }
          case 'password': {
            dbUser.updateUserPassword(userName, value, updateCallback);

            break;
          }
          default: {
            callback({ error: new errorCreator.InvalidData({ expected: 'visibility || accessLevel || password' }) });

            break;
          }
        }
      },
    });
  });

  // TODO Unused
  socket.on('matchPartialUser', ({ token, partialName }, callback = () => {}) => {
    // params.partialName is not checked if it set, to allow the retrieval of all users on no input

    manager.userIsAllowed({
      token,
      commandName: dbConfig.commands.listUsers.commandName,
      callback: ({ error, allowedUser }) => {
        if (error) {
          callback({ error });

          return;
        }

        dbUser.matchPartialUser(partialName, allowedUser, (err, users) => {
          if (err) {
            callback({ error: new errorCreator.Database({}) });

            return;
          }

          callback({ matches: Object.keys(users).map(userKey => users[userKey].userName) });
        });
      },
    });
  });

  // TODO Unused
  socket.on('matchPartialAlias', ({ partialName, token }, callback = () => {}) => {
    // params.partialAlias is not checked if it set, to allow the retrieval of all aliases on no input

    manager.userIsAllowed({
      token,
      commandName: dbConfig.commands.aliases.commandName,
      callback: ({ error, allowedUser }) => {
        if (error) {
          callback({ error });

          return;
        }

        let matched = [];

        if (allowedUser.aliases) {
          if (!partialName) {
            matched = allowedUser.aliases;
          } else {
            allowedUser.aliases.forEach((alias) => {
              const aliasRegex = new RegExp(`^${partialName}.*`);

              if (alias.match(aliasRegex)) {
                matched.push(alias);
              }
            });
          }
        }

        callback({ matched });
      },
    });
  });

  socket.on('addAlias', ({ alias, token }, callback = () => {}) => {
    manager.userIsAllowed({
      token,
      commandName: dbConfig.commands.addAlias.commandName,
      callback: ({ error, allowedUser }) => {
        if (error) {
          callback({ error });

          return;
        }

        manager.addAlias({
          alias,
          callback,
          user: allowedUser,
        });
      },
    });
  });

  socket.on('listUsers', ({ team = {}, token }, callback = () => {}) => {
    manager.userIsAllowed({
      token,
      commandName: dbConfig.commands.listUsers.commandName,
      callback: ({ error, allowedUser }) => {
        if (error) {
          callback({ error });

          return;
        }

        dbUser.getAllUsers(allowedUser, (userErr, users = []) => {
          if (userErr) {
            callback({ error: new errorCreator.Database({}) });

            return;
          }

          const { teamName, shouldEqual } = team;
          const offlineUsers = [];
          const onlineUsers = [];

          users.filter((currentUser) => {
            if (teamName) {
              if (shouldEqual && currentUser.team && currentUser.team === allowedUser.team) {
                return true;
              } else if (!shouldEqual && ((!currentUser.team && allowedUser.team) || currentUser.team !== allowedUser.team)) {
                return true;
              }

              return false;
            }

            return true;
          }).forEach((currentUser) => {
            if ((!appConfig.userVerify || currentUser.verified) && !currentUser.banned) {
              const aliases = currentUser.aliases;

              if (currentUser.online) {
                onlineUsers.push(currentUser.userName);
              } else {
                offlineUsers.push(currentUser.userName);
              }

              if (!teamName && aliases && aliases.length > 0) {
                if (currentUser.online) {
                  Array.prototype.push.apply(onlineUsers, aliases);
                } else {
                  Array.prototype.push.apply(offlineUsers, aliases);
                }
              }
            }
          });

          callback({ data: { onlineUsers, offlineUsers } });
        });
      },
    });
  });
}

exports.handle = handle;
