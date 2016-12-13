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

/**
 * Does string contain valid characters?
 * @param {string} text - String to check
 * @returns {boolean} Does string contain valid characters?
 */
function isTextAllowed(text) {
  return /^[a-zA-Z0-9]+$/g.test(text);
}

/**
 * @param {object} socket - Socket.IO socket
 * @param {object} io - Socket.IO
 */
function handle(socket, io) {
  socket.on('userExists', (params, callback = () => {}) => {
    if (!objectValidator.isValidData(params, { user: { userName: true } })) {
      callback({ error: {} });

      return;
    }

    manager.userAllowedCommand(socket.id, databasePopulation.commands.register.commandName, (allowErr, allowed) => {
      if (allowErr || !allowed || !params || !params.user || !isTextAllowed(params.user.userName)) {
        callback({ error: {} });
        socket.emit('commandFail');

        return;
      }

      dbUser.getUser(params.user.userName, (err, foundUser) => {
        if (err) {
          callback({
            error: {
              code: logger.ErrorCodes.db,
              text: ['Failed to check if user exists'],
              text_se: ['Misslyckades med att försöka hitta användaren'],
            },
          });
          socket.emit('commandFail');

          return;
        } else if (foundUser !== null) {
          callback({
            error: {
              text: ['User with that name already exists'],
              text_se: ['En användare med det namnet existerar redan'],
            },
          });
          socket.emit('commandFail');

          return;
        }

        socket.emit('commandSuccess', { freezeStep: true });
      });
    });
  });

  socket.on('register', ({ user }, callback = () => {}) => {
    if (!objectValidator.isValidData({ user }, { user: { userName: true, password: true, registerDevice: true } })) {
      callback({ error: {} });

      return;
    }

    manager.userAllowedCommand(socket.id, databasePopulation.commands.register.commandName, (allowErr, allowed) => {
      if (allowErr || !allowed || !user || !isTextAllowed(user.userName)) {
        callback({ error: {} });

        return;
      }

      const userName = user.userName.toLowerCase();
      const userObj = {
        userName,
        socketId: '',
        password: user.password,
        registerDevice: user.registerDevice,
        mode: appConfig.defaultMode,
        verified: false,
        rooms: [
          databasePopulation.rooms.public.roomName,
          databasePopulation.rooms.important.roomName,
          databasePopulation.rooms.bcast.roomName,
          databasePopulation.rooms.morse.roomName,
        ],
      };
      dbUser.createUser(userObj, (err, createdUser) => {
        if (err) {
          callback({
            error: {
              code: logger.ErrorCodes.db,
              text: ['Failed to register user'],
              text_se: ['Misslyckades med att registrera användare'],
            },
          });

          return;
        } else if (createdUser === null) {
          callback({
            error: {
              text: [`${userName} already exists`],
              text_se: [`${userName} existerar redan`],
            },
          });

          return;
        }


        const newRoom = {
          roomName: createdUser.userName + appConfig.whisperAppend,
          visibility: 12,
          accessLevel: 12,
        };

        manager.createRoom(newRoom, createdUser, () => {
        });

        const registeredMessage = {
          text: [`${createdUser.userName} has been registered`],
          text_se: [`${createdUser.userName} har blivit registerad`],
        };

        if (appConfig.userVerify) {
          const message = {
            time: new Date(),
            roomName: databasePopulation.rooms.admin.roomName,
          };

          messenger.sendMsg({
            socket,
            message: {
              userName: 'SYSTEM',
              text: [`User ${createdUser.userName} needs to be verified`],
              text_se: [`Användaren ${createdUser.userName} måste bli verifierad`],
            },
            sendTo: message.roomName,
          });

          registeredMessage.text.push('You will need to be verified before you can login');
          registeredMessage.text_se.push('Ni måste bli verifierad innan ni kan logga in');
        }

        callback({ message: registeredMessage });
      });
    });
  });

  socket.on('updateId', ({ user, device, firstConnection }, callback = () => {}) => {
    if (!objectValidator.isValidData({ user }, { user: true })) {
      callback({ error: {} });

      return;
    }

    if (user.userName === null) {
      const publicRoom = databasePopulation.rooms.public.roomName;

      socket.join(publicRoom);
      socket.emit('reconnectSuccess', {
        firstConnection,
        anonUser: true,
        welcomeMessage: appConfig.welcomeMessage,
      });
    } else {
      manager.updateUserSocketId(socket.id, user.userName, (idErr, updatedUser) => {
        if (idErr) {
          callback({ error: {} });

          return;
        } else if (updatedUser === null) {
          socket.emit('disconnectUser');
          socket.join(databasePopulation.rooms.public.roomName);

          return;
        }

        const allRooms = updatedUser.rooms;

        manager.joinRooms(allRooms, socket, device.deviceId);
        socket.emit('reconnectSuccess', {
          firstConnection,
          user: updatedUser,
          welcomeMessage: appConfig.welcomeMessage,
        });
        manager.getHistory({
          rooms: allRooms,
          lines: Infinity,
          missedMsgs: true,
          lastOnline: updatedUser.lastOnline,
          callback: (histErr, missedMessages) => {
            if (histErr) {
              return;
            }

            messenger.sendSelfMsgs({
              socket,
              messages: missedMessages,
            });
          },
        });
      });
    }
  });

  socket.on('login', ({ user }, callback = () => {}) => {
    if (!objectValidator.isValidData({ user }, { user: { userName: true, password: true } })) {
      callback({ error: {} });

      return;
    }

    manager.userAllowedCommand(socket.id, databasePopulation.commands.login.commandName, (allowErr, allowed) => {
      if (allowErr || !allowed) {
        callback({ error: {} });

        return;
      }

      const userName = user.userName.toLowerCase();

      dbUser.authUser(userName, user.password, (err, authUser) => {
        if (err || authUser === null) {
          callback({
            error: {
              code: logger.ErrorCodes.general,
              text: ['Failed to login'],
              text_se: ['Misslyckades med att logga in'],
            },
          });

          return;
        } else if (appConfig.userVerify && !authUser.verified) {
          callback({
            error: {
              code: logger.ErrorCodes.general,
              text: ['The user has not yet been verified. Failed to login'],
              text_se: ['Användaren har ännu inte blivit verifierad. Inloggningen misslyckades'],
            },
          });

          return;
        } else if (authUser.banned) {
          callback({
            error: {
              code: logger.ErrorCodes.general,
              text: ['The user has been banned. Failed to login'],
              text_se: ['Användaren är bannad. Inloggningen misslyckades'],
            },
          });

          return;
        }

        manager.updateUserSocketId(socket.id, userName, (idErr) => {
          if (idErr) {
            callback({ error: {} });

            return;
          }

          const oldSocket = io.sockets.connected[authUser.socketId];
          const rooms = authUser.rooms;

          if (oldSocket) {
            const oldRooms = Object.keys(oldSocket.rooms);

            for (const oldRoom of oldRooms) {
              if (oldRoom.indexOf(appConfig.deviceAppend) < 0) {
                oldSocket.leave(oldRoom);
              }
            }

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

          manager.joinRooms(rooms, socket);
          callback({ data: { user: authUser } });
        });

        dbUser.setUserLastOnline(userName, new Date(), (userOnlineErr, settedUser) => {
          if (userOnlineErr || settedUser === null) {
            console.log('Failed to set last online');
          }
        });
      });
    });
  });

  socket.on('checkPassword', (params, callback = () => {}) => {
    if (!objectValidator.isValidData(params, { oldPassword: true })) {
      callback({ error: {} });

      return;
    }

    manager.userAllowedCommand(socket.id, databasePopulation.commands.password.commandName, (allowErr, allowed, user) => {
      if (allowErr || !allowed) {
        callback({ error: {} });

        return;
      }

      dbUser.authUser(user.userName, params.oldPassword, (err, authUser) => {
        if (err || authUser === null) {
          callback({
            error: {
              code: logger.ErrorCodes.general,
              text: ['Incorrect password'],
              text_se: ['Felaktigt lösenord'],
            },
          });
          socket.emit('commandFail');

          return;
        }

        callback({
          message: {
            text: ['Enter your new password'],
            text_se: ['Skriv in ert nya lösenord'],
          },
        });
      });
    });
  });

  socket.on('changePassword', (params, callback = () => {}) => {
    if (!objectValidator.isValidData(params, { oldPassword: true, newPassword: true })) {
      callback({ error: {} });

      return;
    }

    manager.userAllowedCommand(socket.id, databasePopulation.commands.password.commandName, (allowErr, allowed, user) => {
      if (allowErr || !allowed) {
        callback({ error: {} });

        return;
      } else if (!params.newPassword) {
        callback({
          error: {
            code: logger.ErrorCodes.general,
            text: ['Failed to update password. No new password sent'],
            text_se: ['Misslyckades med att uppdatera lösenordet. Inget nytt lösenord skickades'],
          },
        });

        return;
      }

      dbUser.authUser(user.userName, params.oldPassword, (err, authUser) => {
        if (err || authUser === null) {
          callback({
            error: {
              code: logger.ErrorCodes.general,
              text: ['Failed to update password'],
              text_se: ['Misslyckades med att uppdatera lösenordet'],
            },
          });

          return;
        }

        dbUser.updateUserPassword(authUser.userName, params.newPassword, (userErr, updatedUser) => {
          if (userErr || updatedUser === null) {
            callback({
              error: {
                code: logger.ErrorCodes.general,
                text: ['Failed to update password'],
                text_se: ['Misslyckades med att uppdatera lösenordet'],
              },
            });

            return;
          }

          callback({
            message: {
              text: ['Password has been successfully changed!'],
              text_se: ['Lösenordet har ändrats!'],
            },
          });
        });
      });
    });
  });

  socket.on('logout', (params, callback = () => {}) => {
    manager.userAllowedCommand(socket.id, databasePopulation.commands.logout.commandName, (allowErr, allowed, user) => {
      if (allowErr || !allowed || !user) {
        callback({ error: {} });

        return;
      }

      const userName = user.userName;

      dbUser.updateUserSocketId(userName, '', (err, socketUser) => {
        if (err || socketUser === null) {
          logger.sendErrorMsg({
            code: logger.ErrorCodes.general,
            text: ['Failed to reset user socket ID'],
            err,
          });
          callback({ error: {} });

          return;
        }

        dbUser.updateUserOnline(userName, false, (userErr, updatedUser) => {
          if (userErr || updatedUser === null) {
            logger.sendErrorMsg({
              code: logger.ErrorCodes.general,
              text: ['Failed to reset socket id'],
              err: userErr,
            });
            callback({ error: {} });

            return;
          }

          const rooms = Object.keys(socket.rooms);

          for (const room of rooms) {
            if (room.indexOf(appConfig.deviceAppend) < 0) {
              socket.leave(room);
            }
          }

          callback({
            message: {
              text: ['You have been logged out'],
              text_se: ['Ni har blivit urloggade'],
            },
          });
          socket.emit('logout');
        });
      });
    });
  });

  socket.on('verifyUser', (params, callback = () => {}) => {
    if (!objectValidator.isValidData(params, { user: { userName: true } })) {
      callback({ error: {} });

      return;
    }

    manager.userAllowedCommand(socket.id, databasePopulation.commands.verifyuser.commandName, (allowErr, allowed) => {
      if (allowErr || !allowed) {
        return;
      }

      const userNameLower = params.user.userName.toLowerCase();

      if (userNameLower !== undefined) {
        dbUser.verifyUser(userNameLower, (err, user) => {
          if (err || user === null) {
            callback({
              error: {
                code: logger.ErrorCodes.general,
                text: ['Failed to verify user'],
                text_se: ['Misslyckades med att verifiera användaren'],
              },
            });

            return;
          }

          callback({
            message: {
              text: [`User ${user.userName} has been verified`],
              text_se: [`Användaren ${user.userName} har blivit verifierad`],
            },
          });
        });
      }
    });
  });

  socket.on('verifyAllUsers', () => {
    manager.userAllowedCommand(socket.id, databasePopulation.commands.verifyuser.commandName, (allowErr, allowed) => {
      if (allowErr || !allowed) {
        return;
      }

      dbUser.getUnverifiedUsers((err, users) => {
        if (err || users === null) {
          logger.sendSocketErrorMsg({
            socket,
            code: logger.ErrorCodes.general,
            text: ['Failed to verify all user'],
            text_se: ['Misslyckades med att verifiera alla användare'],
            err,
          });

          return;
        }

        dbUser.verifyAllUsers((verifyErr) => {
          if (verifyErr) {
            logger.sendSocketErrorMsg({
              socket,
              code: logger.ErrorCodes.general,
              text: ['Failed to verify all user'],
              text_se: ['Misslyckades med att verifiera alla användare'],
              err: verifyErr,
            });

            return;
          }

          messenger.sendSelfMsg({
            socket,
            message: {
              text: ['Users have been verified'],
              text_se: ['Användarna har blivit verifierade'],
            },
          });
          // TODO Send message to verified user
        });
      });
    });
  });

  socket.on('unverifiedUsers', () => {
    manager.userAllowedCommand(socket.id, databasePopulation.commands.verifyuser.commandName, (allowErr, allowed) => {
      if (allowErr || !allowed) {
        return;
      }

      dbUser.getUnverifiedUsers((err, users) => {
        if (err || users === null) {
          logger.sendSocketErrorMsg({
            socket,
            code: logger.ErrorCodes.general,
            text: ['Failed to get unverified users'],
            text_se: ['Misslyckades med hämtningen av icke-verifierade användare'],
            err,
          });

          return;
        }

        // TODO Should send a list, not a string
        let usersString = '';

        for (let i = 0; i < users.length; i += 1) {
          usersString += users[i].userName;

          if (i !== users.length - 1) {
            usersString += ' | ';
          }
        }

        messenger.sendSelfMsg({
          socket,
          message: {
            text: [usersString],
          },
        });
      });
    });
  });

  socket.on('ban', (params) => {
    if (!objectValidator.isValidData(params, { user: { userName: true } })) {
      return;
    }

    manager.userAllowedCommand(socket.id, databasePopulation.commands.banuser.commandName, (allowErr, allowed) => {
      if (allowErr || !allowed) {
        return;
      }

      const userNameLower = params.user.userName.toLowerCase();

      dbUser.banUser(userNameLower, (err, user) => {
        if (err || user === null) {
          logger.sendSocketErrorMsg({
            socket,
            code: logger.ErrorCodes.general,
            text: ['Failed to ban user'],
            text_se: ['Misslyckades med att banna användaren'],
          });

          return;
        }

        const bannedSocketId = user.socketId;

        messenger.sendSelfMsg({
          socket,
          message: {
            text: [`User ${userNameLower} has been banned`],
            text_se: [`Användaren ${userNameLower} har blivit bannad`],
          },
        });

        dbUser.updateUserSocketId(userNameLower, '', (userErr, updatedUser) => {
          if (userErr || updatedUser === null) {
            logger.sendSocketErrorMsg({
              socket,
              code: logger.ErrorCodes.general,
              text: [`Failed to disconnect user ${userNameLower}`],
              text_se: [`Misslyckades med att koppla från användaren ${userNameLower}`],
              err: userErr,
            });

            return;
          }

          socket.to(bannedSocketId).emit('ban');

          for (const room of Object.keys(socket.rooms)) {
            socket.leave(room);
          }

          messenger.sendSelfMsg({
            socket,
            message: {
              text: [`User ${userNameLower} has been disconnected`],
              text_se: [`Användaren ${userNameLower} har blivit urloggad`],
            },
          });
        });
      });
    });
  });

  socket.on('unban', (params) => {
    if (!objectValidator.isValidData(params, { user: { userName: true } })) {
      return;
    }

    manager.userAllowedCommand(socket.id, databasePopulation.commands.unbanuser.commandName, (allowErr, allowed) => {
      if (allowErr || !allowed) {
        return;
      }

      const userNameLower = params.user.userName.toLowerCase();

      dbUser.unbanUser(userNameLower, (err, user) => {
        if (err || user === null) {
          logger.sendSocketErrorMsg({
            socket,
            code: logger.ErrorCodes.general,
            text: ['Failed to unban user'],
            text_se: ['Misslyckades med att unbanna användaren'],
            err,
          });

          return;
        }

        messenger.sendSelfMsg({
          socket,
          message: {
            text: [`Ban on user ${userNameLower} has been removed`],
            text_se: [`Ban på användaren ${userNameLower} har blivit borttaget`],
          },
        });
      });
    });
  });

  socket.on('bannedUsers', () => {
    manager.userAllowedCommand(socket.id, databasePopulation.commands.unbanuser.commandName, (allowErr, allowed) => {
      if (allowErr || !allowed) {
        return;
      }

      dbUser.getBannedUsers((err, users) => {
        if (err || users === null) {
          logger.sendSocketErrorMsg({
            socket,
            code: logger.ErrorCodes.general,
            text: ['Failed to get all banned users'],
            text_se: ['Misslyckades med att hämta en lista över alla bannade användare'],
            err,
          });

          return;
        }

        // TODO Should send a list, not a string
        let usersString = '';

        for (let i = 0; i < users.length; i += 1) {
          usersString += users[i].userName;

          if (i !== users.length - 1) {
            usersString += ' | ';
          }
        }

        messenger.sendSelfMsg({
          socket,
          message: {
            text: [usersString],
          },
        });
      });
    });
  });

  socket.on('updateUserTeam', () => {

  });

  socket.on('updateUser', (params) => {
    if (!objectValidator.isValidData(params, { user: { userName: true }, field: true, value: true })) {
      return;
    }

    manager.userAllowedCommand(socket.id, databasePopulation.commands.updateuser.commandName, (allowErr, allowed) => {
      if (allowErr || !allowed) {
        return;
      }

      const userName = params.user.userName;
      const field = params.field;
      const value = params.value;
      const callback = (err, user) => {
        if (err || user === null) {
          logger.sendSocketErrorMsg({
            socket,
            code: logger.ErrorCodes.general,
            text: ['Failed to update user'],
            text_se: ['Misslyckades med att uppdatera användaren'],
            err,
          });

          return;
        }

        messenger.sendSelfMsg({
          socket,
          message: {
            text: ['User has been updated'],
            text_se: ['Användaren har blivit uppdaterad'],
          },
        });
      };

      switch (field) {
        case 'visibility':
          dbUser.updateUserVisibility(userName, value, callback);

          break;
        case 'accesslevel':
          dbUser.updateUserAccessLevel(userName, value, callback);

          break;
        case 'addgroup':

          break;
        case 'removegroup':

          break;
        case 'password':
          dbUser.updateUserPassword(userName, value, callback);

          break;
        default:
          logger.sendSocketErrorMsg({
            socket,
            code: logger.ErrorCodes.general,
            text: [`Invalid field. User doesn't have ${field}`],
            text_se: [`Inkorrekt fält. Användare har inte fältet ${field}`],
          });
          messenger.sendSelfMsg({
            socket,
            message: {
              text: [`Invalid field. User doesn't have ${field}`],
              text_se: [`Inkorrekt fält. Användare har inte fältet ${field}`],
            },
          });

          break;
      }
    });
  });

  socket.on('updateMode', ({ mode }) => {
    if (!objectValidator.isValidData({ mode }, { mode: true })) {
      return;
    }

    manager.userAllowedCommand(socket.id, databasePopulation.commands.mode.commandName, (allowErr, allowed, user) => {
      if (allowErr || !allowed) {
        return;
      }

      const userName = user.userName;

      dbUser.updateUserMode(userName, mode, (err) => {
        if (err) {
          logger.sendSocketErrorMsg({
            socket,
            code: logger.ErrorCodes.general,
            text: ['Failed to store new user mode'],
            text_se: ['Misslyckades med att lagra nya användarläget'],
            err,
          });
        }
      });
    });
  });

  socket.on('whoAmI', (params, callback = () => {}) => {
    manager.userAllowedCommand(socket.id, databasePopulation.commands.whoami.commandName, (allowErr, allowed, user) => {
      if (allowErr || !allowed || !user) {
        return;
      }

      callback({
        user: {
          userName: user.userName,
          accessLevel: user.accessLevel,
          team: user.team,
        },
      });
    });
  });

  socket.on('matchPartialUser', (params, callback = () => {}) => {
    // params.partialName is not checked if it set, to allow the retrieval of all users on no input

    manager.userAllowedCommand(socket.id, databasePopulation.commands.list.commandName, (allowErr, allowed, user) => {
      if (allowErr || !allowed || !user) {
        callback({ error: {} });

        return;
      }

      dbUser.matchPartialUser(params.partialName, user, (err, users) => {
        if (err) {
          callback({ error: {} });

          return;
        }

        const itemList = Object.keys(users).map(userKey => users[userKey].userName);

        callback({ matched: itemList });
      });
    });
  });

  socket.on('matchPartialAlias', ({ partialName }, callback = () => {}) => {
    // params.partialAlias is not checked if it set, to allow the retrieval of all aliases on no input

    manager.userAllowedCommand(socket.id, databasePopulation.commands.list.commandName, (allowErr, allowed, user) => {
      if (allowErr || !allowed) {
        callback({ error: {} });

        return;
      }

      console.log(user);

      let matched = [];

      if (user.aliases) {
        if (!partialName) {
          matched = user.aliases;
        } else {
          for (const alias of user.aliases) {
            const aliasRegex = new RegExp(`^${partialName}.*`);

            if (alias.match(aliasRegex)) {
              matched.push(alias);
            }
          }
        }
      }

      callback({ matched });
    });
  });
}

exports.handle = handle;
