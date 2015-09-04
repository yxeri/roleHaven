'use strict';

const dbConnector = require('../../databaseConnector');
const manager = require('../../manager');
const dbDefaults = require('../../config/dbPopDefaults.js');
const logger = require('../../logger');

const messageSort = function(a, b) {
  if (a.time < b.time) {
    return -1;
  } else if (a.time > b.time) {
    return 1;
  }

  return 0;
};

function isTextAllowed(text) {
  return /^[a-zA-Z0-9]+$/g.test(text);
}

function handle(socket) {
  socket.on('chatMsg', function(data) {
    manager.userAllowedCommand(socket.id, dbDefaults.commands.msg.commandName, function(allowed) {
      if (allowed) {
        const newData = data;
        const roomName = newData.message.whisper ? newData.roomName + dbDefaults.whisper : newData.roomName;

        newData.message.time = new Date();

        dbConnector.addMsgToHistory(roomName, newData.message, function(err, history) {
          if (err || history === null) {
            logger.sendErrorMsg(logger.ErrorCodes.db, 'Failed to add message to history', err);
            logger.sendSocketErrorMsg(socket, logger.ErrorCodes.db, 'Failed to send the whisper');
          } else {
            const newMessage = newData.message;

            newMessage.roomName = newData.roomName;

            socket.broadcast.to(roomName).emit('chatMsg', newMessage);

            if (!data.skipSelfMsg) {
              socket.emit('message', newMessage);
            }

            // Save the sent message in the sender's room history too,
            // if it is a whisper
            if (newData.message.whisper) {
              const whisperRoom = newData.message.user + dbDefaults.whisper;
              dbConnector.addMsgToHistory(whisperRoom, newData.message, function(err, history) {
                if (err || history === null) {
                  logger.sendErrorMsg(logger.ErrorCodes.db, 'Failed to save whisper in senders history', err);
                }
              });
            }
          }
        });
      }
    });
  });

  socket.on('broadcastMsg', function(data) {
    manager.userAllowedCommand(socket.id, dbDefaults.commands.broadcast.commandName, function(allowed) {
      if (allowed) {
        data.time = new Date();

        dbConnector.addMsgToHistory('broadcast', data, function(err, history) {
          if (err || history === null) {
            logger.sendErrorMsg(logger.ErrorCodes.db, 'Failed to add message to history', err);
          } else {
            data.roomName = 'ALL';

            socket.broadcast.emit('broadcastMsg', data);
            socket.emit('message', data);
          }
        });
      }
    });
  });

  socket.on('createRoom', function(sentRoom) {
    manager.userAllowedCommand(socket.id, dbDefaults.commands.createroom.commandName, function(allowed, user) {
      if (allowed) {
        sentRoom.roomName = sentRoom.roomName.toLowerCase();

        if (sentRoom && sentRoom.owner && isTextAllowed(sentRoom.roomName)) {
          dbConnector.createRoom(sentRoom, user, function(err, room) {
            if (err) {
              logger.sendErrorMsg(logger.ErrorCodes.db, 'Failed to create the room');
            } else if (room !== null) {
              socket.emit('message',
                { text : ['Room successfully created'] }
              );
            } else {
              socket.emit('message', {
                  text : [
                    sentRoom.roomName + ' either already exists or you\'ve already created a room',
                    'You can only be the owner of one room'
                  ]
                }
              );
            }
          });
        } else {
          logger.sendErrorMsg(logger.ErrorCodes.db, 'Failed to create the room');
        }
      }
    });
  });

  socket.on('follow', function(data) {
    manager.userAllowedCommand(socket.id, dbDefaults.commands.follow.commandName, function(allowed, user) {
      if (allowed) {
        data.roomName = data.roomName.toLowerCase();

        if (data.password === undefined) {
          data.password = '';
        }
        dbConnector.authUserToRoom(user, data.roomName, data.password, function(err, room) {
          if (err || room === null) {
            logger.sendErrorMsg(logger.ErrorCodes.db, 'You are not authorized to join ' + data.roomName);
          } else {
            const roomName = room.roomName;

            dbConnector.addRoomToUser(user.userName, roomName, function(err) {
              if (err) {
                logger.sendErrorMsg(logger.ErrorCodes.db, 'Failed to follow ' + data.roomName);
              } else {
                if (data.entered) {
                  room.entered = true;
                }

                if (socket.rooms.indexOf(roomName) < 0) {
                  socket.broadcast.to(roomName).emit('chatMsg', {
                    text : [
                      user.userName + ' is following ' + roomName
                    ],
                    room : roomName
                  });
                }

                socket.join(roomName);
                socket.emit('follow', room);
              }
            });
          }
        });
      }
    });
  });

  socket.on('switchRoom', function(room) {
    manager.userAllowedCommand(socket.id, dbDefaults.commands.switchroom.commandName, function(allowed) {
      if (allowed) {
        room.roomName = room.roomName.toLowerCase();

        if (socket.rooms.indexOf(room.roomName) > 0) {
          socket.emit('follow', room);
        } else {
          socket.emit('message', {
            text : ['You are not following room ' + room.roomName]
          });
        }
      }
    });
  });

  socket.on('unfollow', function(room) {
    manager.userAllowedCommand(socket.id, dbDefaults.commands.unfollow.commandName, function(allowed, user) {
      if (allowed) {
        const roomName = room.roomName.toLowerCase();

        if (socket.rooms.indexOf(roomName) > -1) {
          const userName = user.userName;

          // User should not be able to unfollow its own room
          // That room is for private messaging between users
          if (roomName !== userName) {
            dbConnector.removeRoomFromUser(userName, roomName,
              function(err, user) {
                if (err || user === null) {
                  logger.sendSocketErrorMsg(socket, logger.ErrorCodes.db, 'Failed to unfollow room');
                } else {
                  socket.broadcast.to(roomName).emit('chatMsg', {
                    text : [userName + ' left ' + roomName],
                    room : roomName
                  });
                  socket.leave(roomName);
                  socket.emit('unfollow', room);
                }
              });
          }
        } else {
          socket.emit('message',
            { text : ['You are not following ' + roomName] });
        }
      }
    });
  });

  // Shows all available rooms
  socket.on('listRooms', function() {
    manager.userAllowedCommand(socket.id, dbDefaults.commands.list.commandName, function(allowed, user) {
      if (allowed) {
        dbConnector.getAllRooms(user, function(roomErr, rooms) {
          if (roomErr) {
            logger.sendErrorMsg(logger.ErrorCodes.db, 'Failed to get all room names');
          } else {
            if (rooms.length > 0) {
              let roomsString = '';

              for (let i = 0; i < rooms.length; i++) {
                roomsString += rooms[i].roomName + '\t';
              }

              socket.emit('message', {
                text : [
                  '--------------',
                  '  List rooms',
                  '--------------',
                  roomsString
                ]
              });
            }
          }
        });
      }
    });
  });

  socket.on('listUsers', function() {
    manager.userAllowedCommand(socket.id, dbDefaults.commands.list.commandName, function(allowed, user) {
      if (allowed) {
        dbConnector.getAllUsers(user, function(userErr, users) {
          if (userErr || users === null) {
            logger.sendErrorMsg(logger.ErrorCodes.db, 'Failed to get all users');
          } else {
            if (users.length > 0) {
              let usersString = '';
              let onlineString = '';

              for (let i = 0; i < users.length; i++) {
                const currentUser = users[i];

                if (currentUser.verified && !currentUser.banned) {
                  if (currentUser.online) {
                    onlineString += currentUser.userName;
                    onlineString += '\t';
                  } else {
                    usersString += currentUser.userName;
                    usersString += '\t';
                  }
                }
              }

              socket.emit('message', {
                text : [
                  '--------------',
                  '  List users',
                  '--------------------',
                  '  Currently online',
                  '--------------------',
                  onlineString,
                  '-----------------',
                  '  Other users',
                  '-----------------',
                  usersString
                ]
              });
            }
          }
        });
      }
    });
  });

  socket.on('myRooms', function(data) {
    function shouldBeHidden(room) {
      const hiddenRooms = [
        socket.id,
        data.userName + dbDefaults.whisper,
        data.device + dbDefaults.device,
        dbDefaults.rooms.important.roomName,
        dbDefaults.rooms.broadcast.roomName
      ];

      return hiddenRooms.indexOf(room) >= 0;
    }

    manager.userAllowedCommand(socket.id, dbDefaults.commands.myrooms.commandName, function(allowed, user) {
      if (allowed) {
        const rooms = [];

        for (let i = 0; i < socket.rooms.length; i++) {
          const room = socket.rooms[i];

          if (!shouldBeHidden(room)) {
            rooms.push(room);
          }
        }

        socket.emit('message', {
          text : [
            '------------',
            '  My rooms',
            '------------',
            'You are following rooms:',
            rooms.join('\t')
          ]
        });

        dbConnector.getOwnedRooms(user, function(err, rooms) {
          if (err || rooms === null) {
            logger.sendErrorMsg(logger.ErrorCodes.db, 'Failed to get owned rooms');
          } else {
            let ownedRoomsString = '';

            for (let i = 0; i < rooms.length; i++) {
              ownedRoomsString += rooms[i].roomName + '\t';
            }

            if (ownedRoomsString.length > 0) {
              socket.emit('message', {
                text : [
                  'You are owner of the rooms:',
                  ownedRoomsString
                ]
              });
            }
          }
        });
      }
    });
  });

  socket.on('history', function(lines) {
    manager.userAllowedCommand(socket.id, dbDefaults.commands.history.commandName, function(allowed) {
      if (allowed) {
        const allRooms = socket.rooms;

        allRooms.push(dbDefaults.rooms.important.roomName);
        allRooms.push(dbDefaults.rooms.broadcast.roomName);

        dbConnector.getHistoryFromRooms(allRooms, function(err, history) {
          if (err || history === null) {
            logger.sendErrorMsg(logger.ErrorCodes.db, 'Failed to get history');
          } else {
            const historyMessages = [];
            const maxLines = lines === null || isNaN(lines) ? 20 : lines;

            for (let i = 0; i < history.length; i++) {
              const currentHistory = history[i];

              if (currentHistory.messages.length > 0) {
                const messages = currentHistory.messages.slice(-maxLines);
                const messageLength = messages.length - 1;

                for (let j = messageLength; j !== 0; j--) {
                  const message = messages[j];

                  message.roomName = currentHistory.roomName;
                  historyMessages.push(message);
                }
              }
            }

            // Above loop pushes in everything in the reverse order.
            historyMessages.reverse();
            historyMessages.sort(messageSort);

            while (historyMessages.length) {
              socket.emit('multiMsg', historyMessages.splice(0, 10));
            }
          }
        });
      }
    });
  });

  socket.on('morse', function(data) {
    manager.userAllowedCommand(socket.id, dbDefaults.commands.morse.commandName, function(allowed) {
      if (allowed) {
        if (!data.local) {
          socket.broadcast.emit('morse', data.morseCode);
        }

        socket.emit('morse', data.morseCode);
      }
    });
  });

  socket.on('roomHackable', function(roomName) {
    const roomNameLower = roomName.toLowerCase();

    dbConnector.getUserById(socket.id, function(err, user) {
      if (err || user === null) {
        logger.sendSocketErrorMsg(socket, logger.ErrorCodes.db, 'Something went wrong. Failed to hack room');
        socket.emit('commandFail');
      } else {
        dbConnector.getRoom(roomNameLower, function(err, room) {
          if (err || room === null) {
            logger.sendSocketErrorMsg(socket, logger.ErrorCodes.db, 'The room is not hackable by you or doesn\'t ' +
                                                                    'exist');
            socket.emit('commandFail');
          } else {

            // Only rooms visible to the user can be hacked
            if (user.accessLevel >= room.visibility) {
              socket.emit('commandSuccess');
            } else {
              logger.sendSocketErrorMsg(socket, logger.ErrorCodes.general, 'The room is not hackable by you or' +
                                                                          ' doesn\'t exist');
              socket.emit('commandFail');
            }
          }
        });
      }
    });
  });

  socket.on('hackRoom', function(data) {
    manager.userAllowedCommand(socket.id, dbDefaults.commands.hackroom.commandName, function(allowed) {
      if (allowed) {
        const roomName = data.roomName.toLowerCase();
        const userName = data.userName.toLowerCase();

        dbConnector.addRoomToUser(userName, roomName, function(err) {
          if (err) {
            logger.sendSocketErrorMsg(socket, logger.ErrorCodes.db, 'Failed to follow the room');
          } else {
            const room = { roomName : roomName };

            socket.join(roomName);
            socket.emit('follow', room);
          }
        });
      }
    });
  });

  socket.on('removeRoom', function(roomName) {
    manager.userAllowedCommand(socket.id, dbDefaults.commands.removeroom.commandName, function(allowed, user) {
      if (allowed) {
        const roomNameLower = roomName.toLowerCase();

        dbConnector.removeRoom(roomNameLower, user, function(err, room) {
          if (err || room == null) {
            logger.sendSocketErrorMsg(socket, logger.ErrorCodes.db, 'Failed to remove the room');
          } else {
            socket.emit('message', {
              text : ['Removed the room']
            });
          }
        });
      }
    });
  });

  socket.on('importantMsg', function(data) {
    const deviceFunc = function(roomName) {
      socket.to(roomName).emit('importantMsg', data);
    };
    const messageFunc = function() {
      socket.broadcast.emit('importantMsg', data);
      socket.emit('importantMsg', data);
    };
    const historyFunc = function(roomName, sendFunc) {
      dbConnector.addMsgToHistory(roomName, data, function(err, history) {
        if (err || history === null) {
          logger.sendSocketErrorMsg(socket, logger.ErrorCodes.db, 'Failed to send the message');
        } else {
          sendFunc(roomName);
        }
      });
    };

    manager.userAllowedCommand(socket.id, dbDefaults.commands.importantmsg.commandName, function(allowed) {
      if (allowed) {
        data.time = new Date();

        if (data.device) {
          dbConnector.getDevice(data.device, function(err, device) {
            if (err || device === null) {
              logger.sendSocketErrorMsg(socket, logger.ErrorCodes.db, 'Failed to send the message to the device');
            } else {
              const deviceId = device.deviceId;
              const roomName = deviceId + dbDefaults.device;

              historyFunc(roomName, deviceFunc);
            }
          });
        } else {
          const roomName = dbDefaults.rooms.important.roomName;

          historyFunc(roomName, messageFunc);
        }
      }
    });
  });

  //TODO Change this, quick fix implementation
  socket.on('followPublic', function() {
    socket.join(dbDefaults.rooms.public.roomName);
  });

  socket.on('updateRoom', function(data) {
    manager.userAllowedCommand(socket.id, dbDefaults.commands.updateroom.commandName, function(allowed) {
      if (allowed) {
        const roomName = data.room;
        const field = data.field;
        const value = data.value;
        const callback = function(err, room) {
          if (err || room === null) {
            logger.sendSocketErrorMsg(socket, logger.ErrorCodes.db, 'Failed to update room');
          } else {
            socket.emit('message', {
              text : ['User has been updated']
            });
          }
        };
        let managerFunc;

        switch (field) {
          case 'visibility':
            managerFunc = dbConnector.updateRoomVisibility(
              roomName, value, callback);

            break;
          case 'accesslevel':
            managerFunc = dbConnector.updateRoomAccessLevel(
              roomName, value, callback);

            break;
          default:
            logger.sendSocketErrorMsg(socket, logger.ErrorCodes.db, 'Invalid field. Room doesn\'t have ' + field);

            break;
        }
      }
    });
  });
}

exports.handle = handle;