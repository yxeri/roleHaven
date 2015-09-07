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
    manager.userAllowedCommand(socket.id, dbDefaults.commands.register.commandName, function(allowed) {
      if (allowed) {
        sentUser.userName = sentUser.userName.toLowerCase();

        if (sentUser && isTextAllowed(sentUser.userName)) {
          const userObj = {
            userName : sentUser.userName,
            socketId : '',
            password : sentUser.password,
            registerDevice : sentUser.registerDevice
          };

          //TODO Refactor the inner code
          dbConnector.addUser(userObj, function(err, user) {
            if (err) {
              logger.sendSocketErrorMsg(socket, logger.ErrorCodes.db, 'Failed to register user');
            } else if (user !== null) {
              const message = {};
              const newRoom = {};

              message.text = [
                'User ' + user.userName + ' needs to be verified'
              ];
              message.time = new Date();
              message.roomName = dbDefaults.rooms.admin.roomName;

              newRoom.roomName = user.userName + dbDefaults.whisper;
              newRoom.visibility = 12;
              newRoom.accessLevel = 12;

              socket.broadcast.to(dbDefaults.rooms.admin.roomName).emit(
                'message', message);
              socket.emit('message', {
                text : [
                  user.userName + ' has been registered!',
                  'You need to be verified by another user before ' +
                  'you can log in',
                  'Contact your nearest Razor representative for assistance',
                  'The Razor representative for your sector is Mina',
                  'Can\'t find your representative? Get in touch with another' +
                  ' person who has' +
                  ' access and ask them to contact Mina'
                ]
              });

              manager.createRoom(newRoom, user, function(roomName) {
                socket.join(roomName);
              });
            } else {
              socket.emit('message',
                { text : [sentUser.userName + ' already exists'] });
            }
          });
        }
      }
    });
  });

  //TODO: This needs to be refactored. Too big
  socket.on('updateId', function(sentObject) {
    dbConnector.updateUserSocketId(sentObject.userName, socket.id,
      function(err, user) {
        if (err) {
          logger.sendErrorMsg(logger.ErrorCodes.db, 'Failed to update Id', err);
        } else if (user === null) {
          socket.emit('disconnectUser');
          socket.join(dbDefaults.rooms.public.roomName);
        } else {
          const data = {};
          const allRooms = user.rooms;

          allRooms.push(dbDefaults.rooms.important.roomName);
          allRooms.push(dbDefaults.rooms.broadcast.roomName);
          allRooms.push(sentObject.device + dbDefaults.device);

          data.firstConnection = sentObject.firstConnection;
          data.user = user;

          for (let i = 0; i < allRooms.length; i++) {
            const room = allRooms[i];

            socket.join(room);
          }

          socket.emit('reconnectSuccess', data);

          manager.getHistory(allRooms, Infinity, true, user.lastOnline, function(missedMessages) {
            while (missedMessages.length) {
              socket.emit('multiMsg', missedMessages.splice(0, config.chunkLength));
            }
          })
        }
      });
  });

  socket.on('updateLocation', function(position) {
    dbConnector.getUserById(socket.id, function(err, user) {
      if (err) {
        logger.sendErrorMsg(logger.ErrorCodes.db, 'Failed to update location');
      } else if (user === null) {

      } else {
        dbConnector.updateUserLocation(user.userName, position, function(err) {
          if (err) {
            logger.sendErrorMsg(logger.ErrorCodes.db, 'Failed to update location');
          }
        });
      }
    });
  });

  socket.on('login', function(sentUser) {
    manager.userAllowedCommand(socket.id, dbDefaults.commands.login.commandName, function(allowed) {
      if (allowed) {
        sentUser.userName = sentUser.userName.toLowerCase();

        if (sentUser.userName && sentUser.password) {
          dbConnector.authUser(sentUser.userName, sentUser.password, function(err, user) {
            if (err || user === null) {
              logger.sendSocketErrorMsg(socket, logger.ErrorCodes.general, 'Failed to login');
            } else {
              if (user.verified && !user.banned) {
                const authUser = user;
                const oldSocket = io.sockets.connected[user.socketId];

                dbConnector.updateUserSocketId(sentUser.userName, socket.id,
                  function(err, user) {
                    if (err || user === null) {
                      logger.sendSocketErrorMsg(socket, logger.ErrorCodes.general, 'Failed to login');
                    } else {
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

                      rooms.push(dbDefaults.rooms.important.roomName);
                      rooms.push(dbDefaults.rooms.broadcast.roomName);

                      for (let i = 0; i < rooms.length; i++) {
                        socket.join(rooms[i]);
                      }

                      socket.emit('login', authUser);
                    }
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
            }
          });
        } else {
          logger.sendSocketErrorMsg(socket, logger.ErrorCodes.general, 'User name and password needed to login.' +
                                                                       ' Failed to login');
        }
      }
    });
  });

  socket.on('changePassword', function(data) {
    manager.userAllowedCommand(socket.id, dbDefaults.commands.login.commandName, function(allowed) {
      if (allowed && data.oldPassword && data.newPassword && data.userName) {
        dbConnector.authUser(data.userName, data.oldPassword, function(err, user) {
          if (err || user === null) {
            logger.sendSocketErrorMsg(socket, logger.ErrorCodes.general, 'Failed to update password');
          } else {
            dbConnector.updateUserPassword(user.userName, data.newPassword, function(err, user) {
              if (err || user === null) {
                logger.sendSocketErrorMsg(socket, logger.ErrorCodes.general, 'Failed to update password');
              } else {
                socket.emit('message', {
                  text : [
                    'Password has been successfully changed!'
                  ]
                });
              }
            });
          }
        });
      }
    });
  });

  socket.on('logout', function() {
    manager.userAllowedCommand(socket.id, dbDefaults.commands.login.commandName, function(allowed, user) {
      if (allowed) {
        const userName = user.userName;

        dbConnector.updateUserSocketId(userName, '', function(err, socketUser) {
          if (err || socketUser === null) {
            console.log('Failed to reset user socket ID', err);
          } else {
            dbConnector.updateUserOnline(userName, false, function(err, user) {
              if (err || user === null) {
                console.log('Failed to reset socket id', err);
              } else {
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
              }
            });
          }
        });
      }
    });
  });

  socket.on('verifyUser', function(sentUserName) {
    manager.userAllowedCommand(socket.id, dbDefaults.commands.verifyuser.commandName, function(allowed) {
      if (allowed) {
        const userNameLower = sentUserName.toLowerCase();

        if (userNameLower !== undefined) {
          dbConnector.verifyUser(userNameLower, function(err, user) {
            if (err || user === null) {
              logger.sendSocketErrorMsg(socket, logger.ErrorCodes.general, 'Failed to verify user');
            } else {
              socket.emit('message', {
                text : ['User ' + user.userName + ' has been verified']
              });

              //TODO Send message to verified user
            }
          });
        }
      }
    });
  });

  socket.on('verifyAllUsers', function() {
    manager.userAllowedCommand(socket.id, dbDefaults.commands.verifyuser.commandName, function(allowed) {
      if (allowed) {
        dbConnector.getUnverifiedUsers(function(err, users) {
          if (err || users === null) {
            logger.sendSocketErrorMsg(socket, logger.ErrorCodes.general, 'Failed to verify all user');
          } else {
            dbConnector.verifyAllUsers(function(err) {
              if (err) {
                logger.sendSocketErrorMsg(socket, logger.ErrorCodes.general, 'Failed to verify all user');
              } else {
                socket.emit('message', {
                  text : ['Users have been verified']
                });
                //TODO Send message to verified user
              }
            });
          }
        });
      }
    });
  });

  socket.on('unverifiedUsers', function() {
    manager.userAllowedCommand(socket.id, dbDefaults.commands.verifyuser.commandName, function(allowed) {
      if (allowed) {
        dbConnector.getUnverifiedUsers(function(err, users) {
          if (err || users === null) {
            logger.sendSocketErrorMsg(socket, logger.ErrorCodes.general, 'Failed to unverified users');
          } else {
            let usersString = '';

            for (let i = 0; i < users.length; i++) {
              usersString += users[i].userName;

              if (i !== users.length - 1) {
                usersString += ' | ';
              }
            }

            socket.emit('message', { text : [usersString] });
          }
        });
      }
    });
  });

  socket.on('ban', function(sentUserName) {
    manager.userAllowedCommand(socket.id, dbDefaults.commands.banuser.commandName, function(allowed) {
      if (allowed) {
        const userNameLower = sentUserName.toLowerCase();

        dbConnector.banUser(userNameLower, function(err, user) {
          if (err || user === null) {
            logger.sendSocketErrorMsg(socket, logger.ErrorCodes.general, 'Failed to ban user');
          } else {
            const bannedSocketId = user.socketId;

            socket.emit('message', {
              text : ['User ' + userNameLower + ' has been banned']
            });

            dbConnector.updateUserSocketId(userNameLower, '',
              function(err, user) {
                if (err || user === null) {
                  logger.sendSocketErrorMsg(socket, logger.ErrorCodes.general, 'Failed to disconnect user ' +
                                                                               userNameLower);
                } else {
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
                }
              });
          }
        });
      }
    });
  });

  socket.on('unban', function(sentUserName) {
    manager.userAllowedCommand(socket.id, dbDefaults.commands.unbanuser.commandName, function(allowed) {
      if (allowed) {
        const userNameLower = sentUserName.toLowerCase();

        dbConnector.unbanUser(userNameLower, function(err, user) {
          if (err || user === null) {
            logger.sendSocketErrorMsg(socket, logger.ErrorCodes.general, 'Failed to unban user');
          } else {
            socket.emit('message', {
              text : ['Ban on user ' + userNameLower + ' has been removed']
            });
          }
        });
      }
    });
  });

  socket.on('bannedUsers', function() {
    manager.userAllowedCommand(socket.id, dbDefaults.commands.unbanuser.commandName, function(allowed) {
      if (allowed) {
        dbConnector.getBannedUsers(function(err, users) {
          if (err || users === null) {
            logger.sendSocketErrorMsg(socket, logger.ErrorCodes.general, 'Failed to get all banned users');
          } else {
            let usersString = '';

            for (let i = 0; i < users.length; i++) {
              usersString += users[i].userName;

              if (i !== users.length - 1) {
                usersString += ' | ';
              }
            }

            socket.emit('message', { text : [usersString] });
          }
        });
      }
    });
  });

  socket.on('updateUser', function(data) {
    dbConnector.userAllowedCommand(socket.id, dbDefaults.commands.updateuser.commandName, function(allowed) {
      if (allowed) {
        const userName = data.user;
        const field = data.field;
        const value = data.value;
        const callback = function(err, user) {
          if(err || user === null) {
            logger.sendSocketErrorMsg(socket, logger.ErrorCodes.general, 'Failed to update user');
          } else {
            socket.emit('message', {
              text : ['User has been updated']
            });
          }
        };
        let managerFunc;

        switch(field) {
          case 'visibility':
            managerFunc = dbConnector.updateUserVisibility(userName, value, callback);

            break;
          case 'accesslevel':
            managerFunc = dbConnector.updateUserAccessLevel(userName, value, callback);

            break;
          case 'addgroup':

            break;
          case 'removegroup':

            break;
          case 'password':
            managerFunc = dbConnector.updateUserPassword(userName, value, callback);

            break;
          default:
            logger.sendSocketErrorMsg(socket, logger.ErrorCodes.general, 'Invalid field. User doesn\'t have ' + field);
            socket.emit('message', {
              text : ['Invalid field. User doesn\'t have ' + field]
            });

            break;
        }
      } else {
        socket.emit('message', {
          text : ['You do not have access to this command']
        });
      }
    });
  });
}

exports.handle = handle;