'use strict';

const dbConnector = require('../../databaseConnector');
const dbDefaults = require('../../config/dbPopDefaults');
const manager = require('../../manager');
const logger = require('../../logger');
const config = require('../../config/config');

function isTextAllowed(text) {
  return /^[a-zA-Z0-9]+$/g.test(text);
}

function handle(socket, io) {
  socket.on('register', function(sentUser) {
    manager.userAllowedCommand(socket.id, dbDefaults.commands.register.commandName, function(allowErr, allowed) {
      if (allowErr || !allowed || !sentUser || !isTextAllowed(sentUser.userName)) {
        return;
      }

      const userName = sentUser.userName.toLowerCase();
      const userObj = {
        userName : userName,
        socketId : '',
        password : sentUser.password,
        registerDevice : sentUser.registerDevice
      };

      if (!config.userVerify) {
        userObj.verified = true;
      }

      //TODO Refactor the inner code
      dbConnector.addUser(userObj, function(err, user) {
        if (err) {
          logger.sendSocketErrorMsg(socket, logger.ErrorCodes.db, 'Failed to register user');
          return;
        }

        if (user !== null) {
          const message = {};
          const newRoom = {};

          message.time = new Date();
          message.roomName = dbDefaults.rooms.admin.roomName;

          newRoom.roomName = user.userName + dbDefaults.whisper;
          newRoom.visibility = 12;
          newRoom.accessLevel = 12;

          if (config.userVerify) {
            socket.broadcast.to(message.roomName).emit('message', {
              text : [
                'User ' + user.userName + ' needs to be verified'
              ]
            });
          }

          socket.emit('message', {
            text : [
              user.userName + ' has been registered!'
            ]
          });

          manager.createRoom(newRoom, user, function(createErr, roomName) {
            if (createErr) {
              return;
            }

            socket.join(roomName);
          });
        } else {
          socket.emit('message', {
            text : [
              userName + ' already exists'
            ]
          });
        }
      });
    });
  });

  //TODO Rename to reflect the function
  socket.on('updateId', function(sentObject) {
    manager.updateUserSocketId(socket.id, sentObject.userName, function(idErr, user) {
      if (idErr) {
        return;
      }

      if (user === null) {
        socket.emit('disconnectUser');
        socket.join(dbDefaults.rooms.public.roomName);
      } else {
        const data = {};
        const allRooms = user.rooms;

        data.firstConnection = sentObject.firstConnection;
        data.user = user;

        manager.joinRooms(allRooms, socket, sentObject.device);

        socket.emit('reconnectSuccess', data);

        manager.getHistory(allRooms, Infinity, true, user.lastOnline, function(histErr, missedMessages) {
          if (histErr) {
            return;
          }

          while (missedMessages.length) {
            socket.emit('multiMsg', missedMessages.splice(0, config.chunkLength));
          }

        });
      }
    });
  });

  socket.on('updateLocation', function(position) {
    dbConnector.getUserById(socket.id, function(err, user) {
      if (err) {
        logger.sendErrorMsg(logger.ErrorCodes.db, 'Failed to update location');
        return;
      }

      if (user) {
        dbConnector.updateUserLocation(user.userName, position, function(err) {
          if (err) {
            logger.sendErrorMsg(logger.ErrorCodes.db, 'Failed to update location');
            return;
          }
        });
      }
    });
  });

  socket.on('login', function(sentUser) {
    manager.userAllowedCommand(socket.id, dbDefaults.commands.login.commandName, function(allowErr, allowed) {
      if (allowErr || !allowed || !sentUser.userName || !sentUser.password) {
        return;
      }

      const userName = sentUser.userName.toLowerCase();

      dbConnector.authUser(userName, sentUser.password, function(err, user) {
        if (err || user === null) {
          logger.sendSocketErrorMsg(socket, logger.ErrorCodes.general, 'Failed to login');
          return;
        }

        if (user.verified && !user.banned) {
          const authUser = user;
          const oldSocket = io.sockets.connected[user.socketId];

          manager.updateUserSocketId(socket.id, userName, function(idErr) {
            if (idErr) {
              return;
            }

            const rooms = authUser.rooms;

            if (oldSocket) {
              const oldRooms = oldSocket.rooms;

              for (let i = 1; i < oldRooms.length; i++) {
                if (oldRooms[i].indexOf(dbDefaults.device) < 0) {
                  oldSocket.leave(oldRooms[i]);
                }
              }

              oldSocket.emit('logout');
              oldSocket.emit('message', {
                text : [
                  'Your user has been logged in on another device',
                  'You have been logged out'
                ]
              });
            }

            manager.joinRooms(rooms, socket);

            socket.emit('login', authUser);
          });
        } else {
          if (!user.verified) {
            logger.sendSocketErrorMsg(socket, logger.ErrorCodes.general, 'The user has not yet been verified.' +
                                                                         ' Failed to login');
          } else {
            logger.sendSocketErrorMsg(socket, logger.ErrorCodes.general, 'The user has been banned. Failed to' +
                                                                         ' login');
          }
        }
      });
    });
  });

  socket.on('changePassword', function(data) {
    manager.userAllowedCommand(socket.id, dbDefaults.commands.login.commandName, function(allowErr, allowed) {
      if (allowErr || !allowed) {
        return;
      }

      if (data.oldPassword && data.newPassword && data.userName) {
        dbConnector.authUser(data.userName, data.oldPassword, function(err, user) {
          if (err || user === null) {
            logger.sendSocketErrorMsg(socket, logger.ErrorCodes.general, 'Failed to update password');
            return
          }

          dbConnector.updateUserPassword(user.userName, data.newPassword, function(err, user) {
            if (err || user === null) {
              logger.sendSocketErrorMsg(socket, logger.ErrorCodes.general, 'Failed to update password');
              return;
            }

            socket.emit('message', {
              text : [
                'Password has been successfully changed!'
              ]
            });
          });
        });
      }
    });
  });

  socket.on('logout', function() {
    manager.userAllowedCommand(socket.id, dbDefaults.commands.login.commandName, function(allowErr, allowed, user) {
      if (allowErr || !allowed) {
        return;
      }

      const userName = user.userName;

      dbConnector.updateUserSocketId(userName, '', function(err, socketUser) {
        if (err || socketUser === null) {
          logger.sendErrorMsg(logger.ErrorCodes.general, 'Failed to reset user socket ID', err);
          return;
        }

        dbConnector.updateUserOnline(userName, false, function(err, user) {
          if (err || user === null) {
            logger.sendErrorMsg(logger.ErrorCodes.general, 'Failed to reset socket id', err);
            return;
          }

          const rooms = socket.rooms;

          for (let i = 1; i < rooms.length; i++) {
            if (rooms[i].indexOf(dbDefaults.device) < 0) {
              socket.leave(rooms[i]);
            }
          }

          socket.emit('logout');
          socket.emit('message', {
            text : ['You have been logged out']
          });
        });
      });
    });
  });

  socket.on('verifyUser', function(sentUserName) {
    manager.userAllowedCommand(socket.id, dbDefaults.commands.verifyuser.commandName, function(allowErr, allowed) {
      if (allowErr || !allowed) {
        return;
      }

      const userNameLower = sentUserName.toLowerCase();

      if (userNameLower !== undefined) {
        dbConnector.verifyUser(userNameLower, function(err, user) {
          if (err || user === null) {
            logger.sendSocketErrorMsg(socket, logger.ErrorCodes.general, 'Failed to verify user');
            return;
          }

          socket.emit('message', {
            text : ['User ' + user.userName + ' has been verified']
          });

          //TODO Send message to verified user

        });
      }
    });
  });

  socket.on('verifyAllUsers', function() {
    manager.userAllowedCommand(socket.id, dbDefaults.commands.verifyuser.commandName, function(allowErr, allowed) {
      if (allowErr || !allowed) {
        return;
      }

      dbConnector.getUnverifiedUsers(function(err, users) {
        if (err || users === null) {
          logger.sendSocketErrorMsg(socket, logger.ErrorCodes.general, 'Failed to verify all user');
          return;
        }

        dbConnector.verifyAllUsers(function(err) {
          if (err) {
            logger.sendSocketErrorMsg(socket, logger.ErrorCodes.general, 'Failed to verify all user');
            return;
          }

          socket.emit('message', {
            text : ['Users have been verified']
          });
          //TODO Send message to verified user
        });
      });
    });
  });

  socket.on('unverifiedUsers', function() {
    manager.userAllowedCommand(socket.id, dbDefaults.commands.verifyuser.commandName, function(allowErr, allowed) {
      if (allowErr || !allowed) {
        return;
      }

      dbConnector.getUnverifiedUsers(function(err, users) {
        if (err || users === null) {
          logger.sendSocketErrorMsg(socket, logger.ErrorCodes.general, 'Failed to unverified users');
          return;
        }

        let usersString = '';

        for (let i = 0; i < users.length; i++) {
          usersString += users[i].userName;

          if (i !== users.length - 1) {
            usersString += ' | ';
          }
        }

        socket.emit('message', { text : [usersString] });
      });
    });
  });

  socket.on('ban', function(sentUserName) {
    manager.userAllowedCommand(socket.id, dbDefaults.commands.banuser.commandName, function(allowErr, allowed) {
      if (allowErr || !allowed) {
        return;
      }

      const userNameLower = sentUserName.toLowerCase();

      dbConnector.banUser(userNameLower, function(err, user) {
        if (err || user === null) {
          logger.sendSocketErrorMsg(socket, logger.ErrorCodes.general, 'Failed to ban user');
          return;
        }

        const bannedSocketId = user.socketId;

        socket.emit('message', {
          text : ['User ' + userNameLower + ' has been banned']
        });

        dbConnector.updateUserSocketId(userNameLower, '', function(err, user) {
          if (err || user === null) {
            logger.sendSocketErrorMsg(socket, logger.ErrorCodes.general, 'Failed to disconnect user ' +
                                                                         userNameLower);
            return;
          }

          var rooms = socket.rooms;

          socket.to(bannedSocketId).emit('ban');

          for (let i = 1; i < rooms.length; i++) {
            socket.leave(rooms[i]);
          }

          socket.emit('message', {
            text : [
              'User ' + userNameLower + ' has been disconnected'
            ]
          });
        });
      });
    });
  });

  socket.on('unban', function(sentUserName) {
    manager.userAllowedCommand(socket.id, dbDefaults.commands.unbanuser.commandName, function(allowErr, allowed) {
      if (allowErr || !allowed) {
        return;
      }

      const userNameLower = sentUserName.toLowerCase();

      dbConnector.unbanUser(userNameLower, function(err, user) {
        if (err || user === null) {
          logger.sendSocketErrorMsg(socket, logger.ErrorCodes.general, 'Failed to unban user');
          return;
        }

        socket.emit('message', {
          text : ['Ban on user ' + userNameLower + ' has been removed']
        });
      });
    });
  });

  socket.on('bannedUsers', function() {
    manager.userAllowedCommand(socket.id, dbDefaults.commands.unbanuser.commandName, function(allowErr, allowed) {
      if (allowErr || !allowed) {
        return;
      }

      dbConnector.getBannedUsers(function(err, users) {
        if (err || users === null) {
          logger.sendSocketErrorMsg(socket, logger.ErrorCodes.general, 'Failed to get all banned users');
          return;
        }

        let usersString = '';

        for (let i = 0; i < users.length; i++) {
          usersString += users[i].userName;

          if (i !== users.length - 1) {
            usersString += ' | ';
          }
        }

        socket.emit('message', { text : [usersString] });
      });
    });
  });

  socket.on('updateUser', function(data) {
    dbConnector.userAllowedCommand(socket.id, dbDefaults.commands.updateuser.commandName, function(allowErr, allowed) {
      if (allowErr || !allowed) {
        return;
      }

      const userName = data.user;
      const field = data.field;
      const value = data.value;
      const callback = function(err, user) {
        if(err || user === null) {
          logger.sendSocketErrorMsg(socket, logger.ErrorCodes.general, 'Failed to update user');
          return;
        }

        socket.emit('message', {
          text : ['User has been updated']
        });
      };

      switch(field) {
        case 'visibility':
          dbConnector.updateUserVisibility(userName, value, callback);

          break;
        case 'accesslevel':
          dbConnector.updateUserAccessLevel(userName, value, callback);

          break;
        case 'addgroup':

          break;
        case 'removegroup':

          break;
        case 'password':
          dbConnector.updateUserPassword(userName, value, callback);

          break;
        default:
          logger.sendSocketErrorMsg(socket, logger.ErrorCodes.general, 'Invalid field. User doesn\'t have ' + field);
          socket.emit('message', {
            text : ['Invalid field. User doesn\'t have ' + field]
          });

          break;
      }
    });
  });
}

exports.handle = handle;