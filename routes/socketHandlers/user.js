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
const dbDevice = require('../../db/connectors/device');

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
    } else if (appConfig.disallowUserRegister) {
      callback({ error: new errorCreator.NotAllowed({ name: 'register disallowed' }) });

      return;
    } else if (!textTools.isAllowedFull(user.userName.toLowerCase())) {
      callback({ error: new errorCreator.InvalidCharacters({ name: `User name: ${user.userName}` }) });

      return;
    } else if (user.userName.length > appConfig.userNameMaxLength || user.password.length > appConfig.passwordMaxLength || user.registerDevice.length > appConfig.deviceIdLength) {
      callback({ error: new errorCreator.InvalidCharacters({ name: `User name length: ${appConfig.userNameMaxLength} Password length: ${appConfig.userNameMaxLength} Device length: ${appConfig.deviceIdLength}` }) });

      return;
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
        dbConfig.rooms.important.roomName,
        dbConfig.rooms.user.roomName,
        dbConfig.rooms.news.roomName,
        dbConfig.rooms.schedule.roomName,
      ],
    };

    dbUser.createUser({
      user: userObj,
      callback: (userData) => {
        if (userData.error) {
          callback({ error: userData.error });

          return;
        }

        const newRoom = {
          roomName: userObj.userName + appConfig.whisperAppend,
          visibility: dbConfig.accessLevels.superUser,
          accessLevel: dbConfig.accessLevels.superUser,
        };
        const requiresVerification = appConfig.userVerify;
        const wallet = { owner: userName };

        manager.createRoom({ room: newRoom, user: userObj, callback: () => {} });
        manager.createWallet({ wallet, callback: () => {} });

        if (requiresVerification) {
          // TODO Send event to admin
        }

        callback({
          data: {
            requiresVerification,
            success: true,
          },
        });
      },
    });
  });

  socket.on('updateId', ({ token, device }, callback = () => {}) => {
    if (!objectValidator.isValidData({ token, device }, { token: true, device: { deviceId: true } }, { verbose: false })) {
      callback({ error: new errorCreator.InvalidData({ expected: '{ token, device: { deviceId } }', verbose: false }) });

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

        dbUser.updateUserSocketId({
          userName: allowedUser.userName,
          socketId: socket.id,
          callback: (userData) => {
            if (userData.error) {
              callback({ error: userData.error });

              return;
            }

            const { user: updatedUser } = userData.data;

            const data = {
              user: {
                userName: updatedUser.userName,
                accessLevel: updatedUser.accessLevel,
                aliases: updatedUser.aliases,
                team: updatedUser.team,
                shortTeam: updatedUser.shortTeam,
                blockedBy: updatedUser.blockedBy,
              },
            };

            manager.joinRooms({
              socket,
              rooms: updatedUser.rooms,
              deviceId: device.deviceId,
            });

            callback({ data });
          },
        });
      },
    });
  });

  socket.on('login', ({ user, device }, callback = () => {}) => {
    if (!objectValidator.isValidData({ user, device }, { user: { userName: true, password: true }, device: { deviceId: true } })) {
      callback({ error: new errorCreator.InvalidData({ expected: '{ user: { userName, password } }' }) });

      return;
    }

    dbUser.authUser({
      userName: user.userName.toLowerCase(),
      password: user.password,
      callback: (authData) => {
        if (authData.error) {
          callback({ error: authData.error });

          return;
        }

        const { user: authUser } = authData.data;

        dbUser.updateUserSocketId({
          userName: authUser.userName,
          socketId: socket.id,
          callback: (socketData) => {
            if (socketData.error) {
              callback({ error: socketData.error });

              return;
            }

            device.lastUser = authUser.userName;
            device.socketId = socket.id;

            dbDevice.updateDevice({
              device,
              callback: () => {},
            });

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

            manager.joinRooms({ rooms: authUser.rooms, socket });

            dbUser.setUserLastOnline({
              userName: authUser.userName,
              date: new Date(),
              callback: (userData) => {
                if (userData.error) {
                  callback({ error: userData.error });

                  return;
                }

                callback({
                  data: {
                    token: jwt.sign({ data: jwtUser }, appConfig.jsonKey),
                    user: authUser,
                  },
                });
              },
            });
          },
        });
      },
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
          callback({ error: new errorCreator.Database({ errorObject: allowErr, name: 'changePassword' }) });

          return;
        } else if (!allowed) {
          callback({ error: new errorCreator.NotAllowed({ name: 'changePassword' }) });

          return;
        }

        dbUser.authUser({
          userName: allowedUser.userName,
          password: oldPassword,
          callback: (authData) => {
            if (authData.error) {
              callback({ error: authData.error });

              return;
            }

            dbUser.updateUserPassword({
              userName: authData.data.user.userName,
              password: newPassword,
              callback: (passwordData) => {
                if (passwordData.error) {
                  callback({ error: passwordData.error });

                  return;
                }

                callback({ data: { success: true } });
              },
            });
          },
        });
      },
    });
  });

  socket.on('logout', ({ device, token }, callback = () => {}) => {
    if (!objectValidator.isValidData({ device }, { device: { deviceId: true } })) {
      callback({ error: new errorCreator.InvalidData({ expected: '{ device: { deviceId } }' }) });

      return;
    }

    manager.userIsAllowed({
      token,
      commandName: dbConfig.commands.logout.commandName,
      callback: ({ error, allowedUser }) => {
        if (error) {
          callback({ error });

          return;
        }

        dbUser.updateUserSocketId({
          userName: allowedUser.userName,
          socketId: '',
          callback: (socketData) => {
            if (socketData.error) {
              callback({ error: socketData.error });

              return;
            }

            device.lastUser = allowedUser.userName;
            device.socketId = '';

            dbDevice.updateDevice({
              device,
              callback: () => {},
            });

            dbUser.updateUserOnline({
              userName: allowedUser.userName,
              online: false,
              callback: (onlineData) => {
                if (onlineData.error) {
                  callback({ error: onlineData.error });

                  return;
                }

                dbUser.getUserPosition({
                  user: allowedUser,
                  userName: allowedUser.userName,
                  callback: (positionData) => {
                    if (positionData.error) {
                      return;
                    }

                    socket.broadcast.to(dbConfig.rooms.public.roomName).emit('mapPositions', {
                      positions: [positionData.data.position],
                      currentTime: new Date(),
                      shouldRemove: true,
                    });
                  },
                });

                manager.leaveSocketRooms({ socket });
                callback({ data: { success: true } });
              },
            });
          },
        });
      },
    });
  });

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
          dbUser.verifyUser({
            userName,
            callback: (verifyData) => {
              if (verifyData.error) {
                callback({ error: verifyData.error });

                return;
              }

              callback({ data: { user: [user] } });
            },
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

        dbUser.verifyAllUsers({
          callback: (verifyData) => {
            if (verifyData.error) {
              callback({ error: verifyData.error });

              return;
            }

            const { users } = verifyData.data;

            callback({ data: { users } });

            // TODO Send message to registered device
          },
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

        dbUser.getUnverifiedUsers({
          callback: (unverifiedData) => {
            if (unverifiedData.error) {
              callback({ error: unverifiedData.error });

              return;
            }

            const { users } = unverifiedData.data;

            callback({ data: { users: users.map(user => user.userName) } });
          },
        });
      },
    });
  });

  socket.on('ban', ({ user, token, shouldBan = true }, callback = () => {}) => {
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

        if (shouldBan) {
          dbUser.banUser({
            userName,
            callback: (bannedData) => {
              if (bannedData.error) {
                callback({ error: bannedData.error });

                return;
              }

              const bannedSocketId = user.socketId;

              dbUser.updateUserSocketId({
                userName,
                socketId: '',
                callback: (updateData) => {
                  if (updateData.error) {
                    if (updateData.error.type === errorCreator.ErrorTypes.DOESNOTEXIST) {
                      callback({ data: { success: true } });

                      return;
                    }

                    callback({ error: updateData.error });

                    return;
                  }

                  socket.to(bannedSocketId).emit('ban');
                  manager.leaveSocketRooms({ socket });

                  callback({ data: { success: true } });
                },
              });
            },
          });
        } else {
          dbUser.unbanUser({
            userName,
            callback: () => {

            },
          });
        }
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

        dbUser.getBannedUsers({
          callback: (usersData) => {
            if (usersData.error) {
              callback({ error: usersData.error });

              return;
            }

            const { users } = usersData.data;

            callback({
              data: {
                users: users.map(user => user.userName),
              },
            });
          },
        });
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

        dbUser.matchPartialUser({
          partialName,
          user: allowedUser,
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

  socket.on('listAliases', ({ includeInactive, token }, callback = () => {}) => {
    manager.userIsAllowed({
      token,
      commandName: dbConfig.commands.listAliases.commandName,
      callback: ({ error, allowedUser }) => {
        if (error) {
          callback({ error });

          return;
        }

        dbUser.getAllUsers({
          includeInactive: includeInactive && allowedUser.accessLevel >= dbConfig.accessLevels.lowerAdmin,
          user: allowedUser,
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
  });

  socket.on('listUsers', ({ team = {}, includeInactive, token }, callback = () => {}) => {
    manager.userIsAllowed({
      token,
      commandName: dbConfig.commands.listUsers.commandName,
      callback: ({ error, allowedUser }) => {
        if (error) {
          callback({ error });

          return;
        }

        dbUser.getAllUsers({
          includeInactive: includeInactive && allowedUser.accessLevel >= dbConfig.accessLevels.lowerAdmin,
          user: allowedUser,
          callback: (usersData) => {
            if (usersData.error) {
              callback({ error: usersData.error });

              return;
            }

            const { users } = usersData.data;
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
              if (includeInactive || ((!appConfig.userVerify || currentUser.verified) && (!currentUser.banned))) {
                const aliases = currentUser.aliases.map((alias) => {
                  return { userName: alias };
                });
                const filteredUser = {
                  userName: currentUser.userName,
                };

                if (allowedUser.accessLevel >= dbConfig.accessLevels.lowerAdmin) {
                  filteredUser.verified = currentUser.verified;
                  filteredUser.banned = currentUser.banned;
                  filteredUser.fullName = currentUser.fullName;
                  filteredUser.warnings = currentUser.warnings;
                }

                if (currentUser.online) {
                  onlineUsers.push(filteredUser);
                } else {
                  offlineUsers.push(filteredUser);
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
          },
        });
      },
    });
  });
}

exports.handle = handle;
