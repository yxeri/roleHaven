'use strict';

const manager = require('../manager');
const dbDefaults = require('../config/dbPopDefaults.js');

function isTextAllowed(text) {
  return /^[a-zA-Z0-9]+$/g.test(text);
}

function getUser(socketId, callback) {
  manager.getUserById(socketId, function(err, user) {
    if (err || user === null) {

    }

    callback(err, user);
  });
}

function authUserToCommand(callback) {
  manager.authUserToCommand(user, cmdName, function(err, command) {
    if (err || command === null) {

    }

    callback(err, command);
  });
}

function handle(socket) {
  socket.on('register', function(sentUser) {
    sentUser.userName = sentUser.userName.toLowerCase();

    if (sentUser && isTextAllowed(sentUser.userName)) {
      const userObj = {
        userName : sentUser.userName,
        socketId : '',
        password : sentUser.password
      };

      manager.addUser(userObj, function(err, user) {
        if (err) {
          socket.emit('message',
            { text : ['Failed to register user'] });
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
              'you can log in'
            ]
          });

          manager.createRoom(newRoom, null, function(err, room) {
            if (err || room === null) {
              console.log('Failed to create room for user ' +
                          user.userName, err);
            } else {
              manager.addRoomToUser(user.userName, room.roomName,
                function(err) {
                  if (err) {
                    console.log('Failed to add user ' +
                                user.userName + ' to its room');
                  } else {
                    socket.join(room.roomName);
                  }
                });
            }
          });
        } else {
          socket.emit('message',
            { text : [sentUser.userName + ' already exists'] });
        }
      });
    }
  });

  //TODO: This needs to be refactored. Too big
  socket.on('updateId', function(sentObject) {
    manager.updateUserSocketId(sentObject.userName, socket.id,
      function(err, user) {
        if (err || user === null) {
          console.log('Failed to update Id', err);
          socket.emit('disconnectUser');
        } else {
          const data = {};

          data.firstConnection = sentObject.firstConnection;
          data.user = user;

          for (let i = 0; i < user.rooms.length; i++) {
            const room = user.rooms[i];

            socket.join(room);
          }

          socket.emit('reconnectSuccess', data);

          if (!sentObject.firstConnection) {
            manager.getUserHistory(user.rooms, function(err, history) {
              if (err || history === null) {
                socket.emit('message', {
                  text : [
                    'Unable to retrieve missed chat history'
                  ]
                });
              } else {
                const missedMessages = [];

                for (let i = 0; i < history.length; i++) {
                  const currentHistory = history[i];
                  const messages = currentHistory.messages;

                  // Does the history document actually contain
                  // any messages?
                  if (messages.length > 0) {
                    const messagesLength = messages.length - 1;
                    for (let j = messagesLength; j !== 0; j--) {
                      const message = messages[j];

                      // Pushes only the messages that
                      // the user hasn't already seen
                      if (message !== undefined &&
                          user.lastOnline <= message.time) {
                        message.roomName =
                          currentHistory.roomName;
                        missedMessages.push(message);
                      }
                    }
                  }
                }

                if (missedMessages.length > 0) {
                  // Above loop pushes in everything in the
                  // reverse order. Let's fix that
                  missedMessages.reverse();
                  missedMessages.sort(function(a, b) {
                    if (a.time < b.time) {
                      return -1;
                    } else if (a.time > b.time) {
                      return 1;
                    }

                    return 0;
                  });

                  socket.emit('multiMsg', missedMessages);
                }
              }
            });
          }
        }
      });
  });

  socket.on('updateLocation', function(position) {
    manager.getUserById(socket.id, function(err, user) {
      if (err || user === null) {
        console.log('Failed to update location');
      } else {
        manager.updateUserLocation(user.userName, position,
          function(err) {
            if (err) {
              console.log('Failed to update location');
            }
          });
      }
    });
  });

  socket.on('login', function(sentUser) {
    sentUser.userName = sentUser.userName.toLowerCase();

    if (sentUser.userName && sentUser.password) {
      manager.getUserById(socket.id, function(err, loggedInUser) {

        // Should not allow to login if already logged in
        if(err || loggedInUser !== null) {
          socket.emit('message', {
            text : [
              'You are already logged in',
              'You have to be logged out to log in'
            ]
          });
        } else {
          manager.authUser(sentUser.userName, sentUser.password,
            function(err, user) {
              if (err || user === null) {
                socket.emit('message', { text : ['Failed to login'] });
              } else {
                if (user.verified && !user.banned) {
                  const authUser = user;

                  manager.updateUserSocketId(sentUser.userName, socket.id,
                    function(err, user) {
                      if (err || user === null) {
                        socket.emit('message',
                          { text : ['Failed to login'] });
                      } else {
                        const rooms = authUser.rooms;

                        for (let i = 0; i < rooms.length; i++) {
                          socket.join(rooms[i]);
                        }

                        socket.emit('login', authUser);
                      }
                    });
                } else {
                  if (!user.verified) {
                    socket.emit('message', {
                      text : [
                        'The user has not yet been verified. ' +
                        'Failed to login'
                      ]
                    });
                  } else {
                    socket.emit('message', {
                      text : [
                        'The user has been banned. Failed to login'
                      ]
                    });
                  }
                }
              }
            });
        }
      });
    } else {
      socket.emit('message', {
        text : [
          'User name and password needed to login. Failed to login'
        ]
      });
    }
  });

  socket.on('changePassword', function(data) {
    if (data.oldPassword && data.newPassword && data.userName) {
      manager.authUser(data.userName, data.oldPassword,
        function(err, user) {
          if (err || user === null) {
            socket.emit('message',
              { text : ['Failed to update password'] });
          } else {
            manager.updateUserPassword(user.userName, data.newPassword,
              function(err, user) {
                if (err || user === null) {
                  socket.emit('message',
                    { text : ['Failed to update password'] });
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

  socket.on('logout', function() {
    manager.getUserById(socket.id, function(err, currentUser) {
      if (err || currentUser === null) {
        console.log('Failed to get user to logout', err);
      } else {
        const userName = currentUser.userName;

        manager.updateUserSocketId(userName, ' ', function(err, user) {
          if (err || user === null) {
            console.log('Failed to reset socket id', err);
          } else {
            const rooms = socket.rooms;

            for (let i = 1; i < rooms.length; i++) {
              socket.leave(rooms[i]);
            }

            socket.emit('logout');
            socket.emit('message', {
              text : ['You have been logged out']
            });
          }
        });
      }
    });
  });

  socket.on('verifyUser', function(sentUserName) {
    const userNameLower = sentUserName.toLowerCase();

    if (userNameLower !== undefined) {
      manager.verifyUser(userNameLower, function(err, user) {
        if (err || user === null) {
          socket.emit('message',
            { text : ['Failed to verify user'] });
        } else {
          socket.emit('message', {
            text : ['User ' + user.userName + ' has been verified']
          });
        }
      });
    }
  });

  socket.on('verifyAllUsers', function() {
    manager.verifyAllUsers(function(err, user) {
      if (err || user === null) {
        socket.emit('message',
          { text : ['Failed to verify all users'] });
      } else {
        socket.emit('message',
          { text : ['Users have been verified'] });
      }
    });
  });

  socket.on('unverifiedUsers', function() {
    manager.getUnverifiedUsers(function(err, users) {
      if (err || users === null) {
        socket.emit('message',
          { text : ['Failed to get unverified users'] });
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
  });

  socket.on('ban', function(sentUserName) {
    const userNameLower = sentUserName.toLowerCase();

    manager.banUser(userNameLower, function(err, user) {
      if (err || user === null) {
        socket.emit('message', { text : ['Failed to ban user'] });
      } else {
        const bannedSocketId = user.socketId;

        socket.emit('message', {
          text : ['User ' + userNameLower + ' has been banned']
        });

        manager.updateUserSocketId(userNameLower, '',
          function(err, user) {
            if (err || user === null) {
              socket.emit('message', {
                text : ['Failed to disconnect user ' + userNameLower]
              });
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
  });

  socket.on('unban', function(sentUserName) {
    const userNameLower = sentUserName.toLowerCase();

    manager.unbanUser(userNameLower, function(err, user) {
      if (err || user === null) {
        socket.emit('message', { text : ['Failed to unban user'] });
      } else {
        socket.emit('message', {
          text : ['Ban on user ' + userNameLower + ' has been removed']
        });
      }
    });
  });

  socket.on('bannedUsers', function() {
    manager.getBannedUsers(function(err, users) {
      if (err || users === null) {
        socket.emit('message', {
          text : ['Failed to get all banned users']
        });
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
  });

  socket.on('updateUser', function(data) {
    manager.getUserById(socket.id, function(err, user) {
      if (err || user === null) {
        socket.emit('message', {
          text : ['Failed to update user']
        });
        console.log('Failed to get user to update it', err);
      } else {
        if (user.accessLevel >= 11) {
          const userName = data.user;
          const field = data.field;
          const value = data.value;
          const callback = function(err, user) {
            if(err || user === null) {
              socket.emit('message', {
                text : ['Failed to update user']
              });
              console.log('Failed to update user', err);
            } else {
              socket.emit('message', {
                text : ['User has been updated']
              });
            }
          };
          let managerFunc;

          switch(field) {
            case 'visibility':
              managerFunc = manager.updateUserVisibility(
                userName, value, callback);

              break;
            case 'accesslevel':
              managerFunc = manager.updateUserAccessLevel(
                userName, value, callback);

              break;
            case 'addgroup':

              break;
            case 'removegroup':

              break;
            default:
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
      }
    });
  });
}

exports.handle = handle;