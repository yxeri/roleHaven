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
const databasePopulation = require('../../config/defaults/config').databasePopulation;
const manager = require('../../socketHelpers/manager');
const logger = require('../../utils/logger');
const appConfig = require('../../config/defaults/config').app;
const messenger = require('../../socketHelpers/messenger');
const objectValidator = require('../../utils/objectValidator');
const errorCreator = require('../../objects/error/errorCreator');
const textTools = require('../../utils/textTools');

/**
 * @param {object} socket Socket.IO socket
 * @param {object} io Socket.IO
 */
function handle(socket, io) {
  socket.on('register', ({ user }, callback = () => {}) => {
    if (!objectValidator.isValidData({ user }, { user: { userName: true, password: true, registerDevice: true } })) {
      callback({ error: new errorCreator.InvalidData({ expected: '{ user: { userName, password, registerDevice } }' }) });

      return;
    }

    manager.userIsAllowed(socket.id, databasePopulation.commands.register.commandName, (allowErr, allowed) => {
      if (allowErr) {
        callback({ error: new errorCreator.Database() });

        return;
      } else if (!allowed) {
        callback({ error: new errorCreator.NotAllowed({ name: 'register' }) });

        return;
      } else if (!textTools.isAllowedFull(user.userName)) {
        callback({ error: new errorCreator.InvalidCharacters({ name: user.userName }) });

        return;
      }

      const userName = user.userName.toLowerCase();
      const userObj = {
        fullName: user.fullName || userName,
        socketId: '',
        password: user.password,
        registerDevice: user.registerDevice,
        verified: false,
        rooms: [
          databasePopulation.rooms.public.roomName,
          databasePopulation.rooms.bcast.roomName,
        ],
        userName,
      };
      const wallet = { owner: userName };

      dbUser.createUser(userObj, (err, createdUser) => {
        if (err) {
          callback({ error: new errorCreator.Database() });

          return;
        } else if (createdUser === null) {
          callback({ error: new errorCreator.AlreadyExists({ name: `user ${userName}` }) });

          return;
        }

        const newRoom = {
          roomName: createdUser.userName + appConfig.whisperAppend,
          visibility: databasePopulation.accessLevels.superUser,
          accessLevel: databasePopulation.accessLevels.superUser,
        };
        const requiresVerification = appConfig.userVerify;

        manager.createRoom(newRoom, createdUser, () => {});
        manager.createWallet(wallet, () => {});

        if (requiresVerification) {
          const message = {
            time: new Date(),
            roomName: databasePopulation.rooms.admin.roomName,
          };

          messenger.sendMsg({
            message: {
              userName: 'SYSTEM',
              text: [`User ${createdUser.userName} needs to be verified`],
              text_se: [`Användaren ${createdUser.userName} måste bli verifierad`],
            },
            sendTo: message.roomName,
            socket,
          });
        }

        callback({ data: { user: createdUser, requiresVerification } });
      });
    });
  });

  socket.on('updateId', ({ user, device, firstConnection }, callback = () => {}) => {
    if (!objectValidator.isValidData({ user }, { user: true })) {
      callback({ error: new errorCreator.InvalidData({ expected: '{ user }' }) });

      return;
    }

    const data = {};

    if (firstConnection) {
      data.welcomeMessage = appConfig.welcomeMessage;
    }

    if (user.userName === null) {
      data.anonUser = true;

      socket.join(databasePopulation.rooms.public.roomName);
      callback({ data });
    } else {
      dbUser.updateUserSocketId(user.userName, socket.id, (idErr, updatedUser) => {
        if (idErr) {
          callback({ error: new errorCreator.Database() });

          return;
        } else if (updatedUser === null) {
          data.anonUser = true;

          socket.join(databasePopulation.rooms.public.roomName);
          callback({ data });

          return;
        }

        const allRooms = updatedUser.rooms;
        data.user = updatedUser;

        manager.joinRooms(allRooms, socket, device.deviceId);
        // TODO Client should send time of the last message it received
        // manager.getHistory({
        //   rooms: allRooms,
        //   lines: Infinity,
        //   missedMsgs: true,
        //   lastOnline: lastMsgTime,
        //   callback: (histErr, missedMessages) => {
        //     if (histErr) {
        //       return;
        //     }
        //
        //     data.missedMessages = missedMessages;
        //
        //     callback({ data });
        //   },
        // });

        callback({ data });
      });
    }
  });

  socket.on('login', ({ user }, callback = () => {}) => {
    if (!objectValidator.isValidData({ user }, { user: { userName: true, password: true } })) {
      callback({ error: new errorCreator.InvalidData({ expected: '{ user: { userName, password } }' }) });

      return;
    }

    manager.userIsAllowed(socket.id, databasePopulation.commands.login.commandName, (allowErr, allowed) => {
      if (allowErr) {
        callback({ error: new errorCreator.Database() });

        return;
      } else if (!allowed) {
        callback({ error: new errorCreator.NotAllowed({ name: 'login' }) });

        return;
      }

      user.userName = user.userName.toLowerCase();

      dbUser.authUser(user.userName, user.password, (err, authUser) => {
        if (err) {
          callback({ error: new errorCreator.Database() });

          return;
        } else if (authUser === null) {
          callback({ error: new errorCreator.DoesNotExist({ name: user.userName }) });

          return;
        } else if (appConfig.userVerify && !authUser.verified) {
          callback({ error: new errorCreator.NeedsVerification({ name: authUser.userName }) });

          return;
        } else if (authUser.banned) {
          callback({ error: new errorCreator.Banned({ name: authUser.userName }) });

          return;
        }

        dbUser.updateUserSocketId(user.userName, socket.id, (idErr) => {
          if (idErr) {
            callback({ error: new errorCreator.Database() });

            return;
          }

          const oldSocket = io.sockets.connected[authUser.socketId];

          if (oldSocket) {
            manager.leaveSocketRooms({ socket });
            oldSocket.emit('logout');

            messenger.sendSelfMsg({
              socket: oldSocket,
              message: {
                text: [
                  'Your user has been logged in on another device',
                  'You have been logged out',
                ],
                text_se: [
                  'Din användare har loggat in på en annan enhet',
                  'Ni har blivit urloggade',
                ],
              },
            });
          }

          manager.joinRooms(authUser.rooms, socket);
          callback({ data: { user: authUser } });
        });

        dbUser.setUserLastOnline(user.userName, new Date(), (userOnlineErr, settedUser) => {
          if (userOnlineErr || settedUser === null) {
            console.log('Failed to set last online');
          }
        });
      });
    });
  });

  // TODO Not used
  socket.on('changePassword', ({ oldPassword, newPassword }, callback = () => {}) => {
    if (!objectValidator.isValidData({ oldPassword, newPassword }, { oldPassword: true, newPassword: true })) {
      callback({ error: new errorCreator.InvalidData({ expected: '{ oldPassword, newPassword }' }) });

      return;
    }

    manager.userIsAllowed(socket.id, databasePopulation.commands.password.commandName, (allowErr, allowed, user) => {
      if (allowErr) {
        callback({ error: new errorCreator.Database() });

        return;
      } else if (!allowed) {
        callback({ error: new errorCreator.NotAllowed({ name: 'changePassword' }) });

        return;
      }

      dbUser.authUser(user.userName, oldPassword, (err, authUser) => {
        if (err) {
          callback({ error: new errorCreator.Database() });

          return;
        } else if (authUser === null) {
          callback({ error: new errorCreator.NotAllowed({ name: 'changePassword' }) });

          return;
        }

        dbUser.updateUserPassword(authUser.userName, newPassword, (userErr) => {
          if (userErr) {
            callback({ error: new errorCreator.Database() });

            return;
          }

          callback({ data: { success: true } });
        });
      });
    });
  });

  socket.on('logout', (params, callback = () => {}) => {
    manager.userIsAllowed(socket.id, databasePopulation.commands.logout.commandName, (allowErr, allowed, user) => {
      if (allowErr) {
        callback({ error: new errorCreator.Database() });

        return;
      } else if (!allowed) {
        callback({ error: new errorCreator.NotAllowed({ name: 'logout' }) });

        return;
      }

      const userName = user.userName.toLowerCase();

      dbUser.updateUserSocketId(userName, '', (err) => {
        if (err) {
          callback({ error: new errorCreator.Database() });

          return;
        }

        dbUser.updateUserOnline(userName, false, (userErr) => {
          if (userErr) {
            callback({ error: new errorCreator.Database() });

            return;
          }

          manager.leaveSocketRooms({ socket });
          callback({ data: { success: true } });
        });
      });
    });
  });

  // TODO Not used
  socket.on('verifyUser', ({ user }, callback = () => {}) => {
    if (!objectValidator.isValidData({ user }, { user: { userName: true } })) {
      callback({ error: new errorCreator.InvalidData({ expected: '{ user }' }) });

      return;
    }

    manager.userIsAllowed(socket.id, databasePopulation.commands.verifyUser.commandName, (allowErr, allowed) => {
      if (allowErr) {
        callback({ error: new errorCreator.Database() });

        return;
      } else if (!allowed) {
        callback({ error: new errorCreator.NotAllowed({ name: 'verifyUser' }) });

        return;
      }

      const userName = user.userName.toLowerCase();

      if (userName !== undefined) {
        dbUser.verifyUser(userName, (err) => {
          if (err) {
            callback({ error: new errorCreator.Database() });

            return;
          } else if (user === null) {
            callback({ error: new errorCreator.DoesNotExist({ name: userName }) });

            return;
          }

          callback({ data: { user: [user] } });
        });
      }
    });
  });

  // TODO Not used
  socket.on('verifyAllUsers', (params, callback = () => {}) => {
    manager.userIsAllowed(socket.id, databasePopulation.commands.verifyUser.commandName, (allowErr, allowed) => {
      if (allowErr) {
        callback({ error: new errorCreator.Database() });

        return;
      } else if (!allowed) {
        callback({ error: new errorCreator.NotAllowed({ name: 'verifyAllUsers' }) });

        return;
      }

      dbUser.verifyAllUsers((verifyErr, users = []) => {
        if (verifyErr) {
          callback({ error: new errorCreator.Database() });

          return;
        }

        callback({ data: { users } });

        // TODO Send message to registered device
      });
    });
  });

  // TODO Not used
  socket.on('getUnverifiedUsers', (params, callback = () => {}) => {
    manager.userIsAllowed(socket.id, databasePopulation.commands.getUnverifiedUsers.commandName, (allowErr, allowed) => {
      if (allowErr) {
        callback({ error: new errorCreator.Database() });

        return;
      } else if (!allowed) {
        callback({ error: new errorCreator.NotAllowed({ name: 'getUnverifiedUsers' }) });

        return;
      }

      dbUser.getUnverifiedUsers((err, users = []) => {
        if (err) {
          callback({ error: new errorCreator.Database() });

          return;
        }

        callback({ data: { users: users.map(user => user.userName) } });
      });
    });
  });

  // TODO Not used
  socket.on('ban', ({ user }, callback = () => {}) => {
    if (!objectValidator.isValidData({ user }, { user: { userName: true } })) {
      callback({ error: new errorCreator.InvalidData({ expected: '{ user: { userName } }' }) });

      return;
    }

    manager.userIsAllowed(socket.id, databasePopulation.commands.banUser.commandName, (allowErr, allowed) => {
      if (allowErr) {
        callback({ error: new errorCreator.Database() });

        return;
      } else if (!allowed) {
        callback({ error: new errorCreator.NotAllowed({ name: 'ban' }) });

        return;
      }

      const userName = user.userName.toLowerCase();

      dbUser.banUser(userName, (err, bannedUser) => {
        if (err) {
          callback({ error: new errorCreator.Database() });

          return;
        } else if (bannedUser === null) {
          callback({ error: new errorCreator.DoesNotExist({ name: `user ${userName}` }) });

          return;
        }

        const bannedSocketId = user.socketId;

        dbUser.updateUserSocketId(userName, '', (userErr) => {
          if (userErr) {
            callback({ error: new errorCreator.Database() });

            return;
          }

          socket.to(bannedSocketId).emit('ban');
          manager.leaveSocketRooms({ socket });

          callback({ data: { success: true } });
        });
      });
    });
  });

  // TODO Not used
  socket.on('unban', ({ user }, callback = () => {}) => {
    if (!objectValidator.isValidData({ user }, { user: { userName: true } })) {
      callback({ error: new errorCreator.InvalidData({ expected: '{ user: { userName } }' }) });

      return;
    }

    manager.userIsAllowed(socket.id, databasePopulation.commands.unbanUser.commandName, (allowErr, allowed) => {
      if (allowErr) {
        callback({ error: new errorCreator.Database() });

        return;
      } else if (!allowed) {
        callback({ error: new errorCreator.NotAllowed({ name: 'unban' }) });

        return;
      }

      const userName = user.userName.toLowerCase();

      dbUser.unbanUser(userName, (err, unbannedUser) => {
        if (err) {
          callback({ error: new errorCreator.Database() });

          return;
        } else if (unbannedUser === null) {
          callback({ error: new errorCreator.DoesNotExist({ name: `user ${userName}` }) });

          return;
        }

        callback({ data: { success: true } });
      });
    });
  });

  socket.on('getBannedUsers', (params, callback = () => {}) => {
    manager.userIsAllowed(socket.id, databasePopulation.commands.getBannedUsers.commandName, (allowErr, allowed) => {
      if (allowErr) {
        callback({ error: new errorCreator.Database() });

        return;
      } else if (!allowed) {
        callback({ error: new errorCreator.NotAllowed({ name: 'getBannedUsers' }) });

        return;
      }

      dbUser.getBannedUsers((err, users = []) => {
        if (err) {
          callback({ error: new errorCreator.Database() });

          return;
        }

        callback({ data: { users: users.map(user => user.userName) } });
      });
    });
  });

  // TODO Unused and not ready
  socket.on('updateUserTeam', () => {

  });

  socket.on('updateUser', ({ user, field, value }, callback = () => {}) => {
    if (!objectValidator.isValidData({ user, field, value }, { user: { userName: true }, field: true, value: true })) {
      callback({ error: new errorCreator.InvalidData({ expected: '{ user: { userName }, field, value }' }) });

      return;
    }

    manager.userIsAllowed(socket.id, databasePopulation.commands.updateUser.commandName, (allowErr, allowed) => {
      if (allowErr) {
        callback({ error: new errorCreator.Database() });

        return;
      } else if (!allowed) {
        callback({ error: new errorCreator.NotAllowed({ name: 'updateUser' }) });

        return;
      }

      const userName = user.userName.toLowerCase();
      const updateCallback = (err, updatedUser) => {
        if (err) {
          callback({ error: new errorCreator.Database() });

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
    });
  });

  // TODO Unused
  socket.on('matchPartialUser', (params, callback = () => {}) => {
    // params.partialName is not checked if it set, to allow the retrieval of all users on no input

    manager.userIsAllowed(socket.id, databasePopulation.commands.listUsers.commandName, (allowErr, allowed, user) => {
      if (allowErr) {
        callback({ error: new errorCreator.Database() });

        return;
      } else if (!allowed) {
        callback({ error: new errorCreator.NotAllowed({ name: 'matchPartialUser' }) });

        return;
      }

      dbUser.matchPartialUser(params.partialName, user, (err, users) => {
        if (err) {
          callback({ error: new errorCreator.Database() });

          return;
        }

        callback({ matches: Object.keys(users).map(userKey => users[userKey].userName) });
      });
    });
  });

  // TODO Unused
  socket.on('matchPartialAlias', ({ partialName }, callback = () => {}) => {
    // params.partialAlias is not checked if it set, to allow the retrieval of all aliases on no input

    manager.userIsAllowed(socket.id, databasePopulation.commands.aliases.commandName, (allowErr, allowed, user) => {
      if (allowErr) {
        callback({ error: new errorCreator.Database() });

        return;
      } else if (!allowed) {
        callback({ error: new errorCreator.NotAllowed({ name: 'matchPartialAlias' }) });

        return;
      }

      let matched = [];

      if (user.aliases) {
        if (!partialName) {
          matched = user.aliases;
        } else {
          user.aliases.forEach((alias) => {
            const aliasRegex = new RegExp(`^${partialName}.*`);

            if (alias.match(aliasRegex)) {
              matched.push(alias);
            }
          });
        }
      }

      callback({ matched });
    });
  });

  socket.on('addAlias', ({ alias }, callback = () => {}) => {
    manager.userIsAllowed(socket.id, databasePopulation.commands.addAlias.commandName, (allowErr, allowed, user) => {
      if (allowErr) {
        callback({ error: new errorCreator.Database() });

        return;
      } else if (!allowed) {
        callback({ error: new errorCreator.NotAllowed({ name: 'addAlias' }) });

        return;
      }

      manager.addAlias({ user, alias, callback });
    });
  });
}

exports.handle = handle;
