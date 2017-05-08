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

const dbRoom = require('../../db/connectors/room');
const dbUser = require('../../db/connectors/user');
const manager = require('../../socketHelpers/manager');
const databasePopulation = require('../../config/defaults/config').databasePopulation;
const appConfig = require('../../config/defaults/config').app;
const messenger = require('../../socketHelpers/messenger');
const objectValidator = require('../../utils/objectValidator');
const fs = require('fs');
const errorCreator = require('../../objects/error/errorCreator');
const textTools = require('../../utils/textTools');

/**
 * Should the room be hidden?
 * @param {string} room - Room name
 * @param {string} socketId - ID of the socket
 * @returns {boolean} Should the room be hidden?
 */
function shouldBeHidden(room, socketId) {
  const hiddenRooms = [
    socketId,
    databasePopulation.rooms.bcast.roomName,
  ];

  return hiddenRooms.indexOf(room) >= 0 || room.indexOf(appConfig.whisperAppend) >= 0 || room.indexOf(appConfig.deviceAppend) >= 0;
}

/**
 * @param {object} socket - Socket.IO socket
 * @param {object} io - Socket.IO
 */
function handle(socket, io) {
  socket.on('chatMsg', ({ message, image }, callback = () => {}) => {
    if (!objectValidator.isValidData({ message }, { message: { text: true, roomName: true } })) {
      callback({ error: new errorCreator.InvalidData({ expected: '{ message: { text, roomName } }' }) });

      return;
    }

    message.text = textTools.cleanText(message.text);

    manager.userIsAllowed(socket.id, databasePopulation.commands.chatMsg.commandName, (allowErr, allowed, user) => {
      if (allowErr) {
        callback({ error: new errorCreator.Database() });

        return;
      } else if (!allowed) {
        callback({ error: new errorCreator.NotAllowed({ name: 'chatMsg' }) });

        return;
      }

      if (image && image.imageName && image.source.match(/^data:image\/((png)|(jpeg));base64,/)) {
        const fileName = `${new Buffer(user.userName).toString('base64')}-${appConfig.mode}-${image.imageName.replace(/[^\w.]/g, '-')}`;

        fs.writeFile(`${appConfig.publicBase}/images/${fileName}`, image.source.replace(/data:image\/((png)|(jpeg));base64,/, ''), { encoding: 'base64' }, (err) => {
          if (err) {
            callback({ error: new errorCreator.Database() });

            return;
          }

          message.image = {
            imageName: image.imageName,
            fileName,
            width: image.width,
            height: image.height,
          };

          messenger.sendChatMsg({ user, callback, message, io, socket });
        });
      } else {
        messenger.sendChatMsg({ user, callback, message, io, socket });
      }
    });
  });

  socket.on('whisperMsg', ({ message }, callback = () => {}) => {
    if (!objectValidator.isValidData({ message }, { message: { text: true, roomName: true, userName: true } })) {
      callback({ error: new errorCreator.InvalidData({ expected: '{ message: { text, roomName, userName } }' }) });

      return;
    }

    message.text = textTools.cleanText(message.text);

    manager.userIsAllowed(socket.id, databasePopulation.commands.whisper.commandName, (allowErr, allowed, user) => {
      if (allowErr) {
        callback({ error: new errorCreator.Database() });

        return;
      } else if (!allowed) {
        callback({ error: new errorCreator.NotAllowed({ name: 'whisperMsg' }) });

        return;
      }


      messenger.sendWhisperMsg({ socket, callback, message, user, io });
    });
  });

  // TODO Unused
  socket.on('broadcastMsg', ({ message }, callback = () => {}) => {
    if (!objectValidator.isValidData({ message }, { message: { text: true } })) {
      callback({ error: new errorCreator.InvalidData({ expected: '{ message: { text } }' }) });

      return;
    }

    manager.userIsAllowed(socket.id, databasePopulation.commands.broadcast.commandName, (allowErr, allowed, user) => {
      if (allowErr) {
        callback({ error: new errorCreator.Database() });

        return;
      } else if (!allowed) {
        callback({ error: new errorCreator.NotAllowed({ name: 'broadcastMsg' }) });

        return;
      }

      message.userName = user.userName;

      messenger.sendBroadcastMsg({ socket, message, callback });
    });
  });

  socket.on('createRoom', ({ room }, callback = () => {}) => {
    if (!objectValidator.isValidData({ room }, { room: { roomName: true } })) {
      callback({ error: new errorCreator.InvalidData({ expected: '{ room: { roomName } }' }) });

      return;
    }

    manager.userIsAllowed(socket.id, databasePopulation.commands.createRoom.commandName, (allowErr, allowed, user) => {
      if (allowErr) {
        callback({ error: new errorCreator.Database() });

        return;
      } else if (!allowed) {
        callback({ error: new errorCreator.NotAllowed({ name: 'broadcastMsg' }) });

        return;
      }

      room.owner = user.userName;
      room.roomName = room.roomName.toLowerCase();

      manager.createRoom(room, user, (createErr, createdRoom) => {
        if (createErr) {
          callback({ error: new errorCreator.Database() });

          return;
        } else if (!createdRoom) {
          callback({ error: new errorCreator.AlreadyExists({ name: 'room' }) });

          return;
        }

        manager.followRoom({ userName: user.userName, room: createdRoom, callback, socket });
      });
    });
  });

  socket.on('authUserToRoom', ({ room }, callback = () => {}) => {
    if (!objectValidator.isValidData({ room }, { room: { roomName: true } })) {
      callback({ error: new errorCreator.InvalidData({ expected: '{ room: { roomName } }' }) });

      return;
    }

    manager.userIsAllowed(socket.id, databasePopulation.commands.getHistory.commandName, (allowErr, allowed, user) => {
      if (allowErr) {
        callback({ error: new errorCreator.Database() });

        return;
      } else if (!allowed) {
        callback({ error: new errorCreator.NotAllowed({ name: 'authUserToRoom' }) });

        return;
      }

      dbRoom.getRoom(room.roomName, user, (error, retrievedRoom) => {
        if (error) {
          callback({ error: new errorCreator.Database() });

          return;
        }

        const socketRooms = Object.keys(socket.rooms);

        if ((retrievedRoom && Object.keys(socket.rooms).indexOf(retrievedRoom.roomName) > -1) || socketRooms.indexOf(room.roomName) > -1) {
          callback({ data: { allowed: true, room: retrievedRoom } });
        } else {
          callback({ data: { allowed: false, room: retrievedRoom } });
        }
      });
    });
  });

  socket.on('followWhisper', ({ room }, callback = () => {}) => {
    if (!objectValidator.isValidData({ room }, { room: { roomName: true } })) {
      callback({ error: new errorCreator.InvalidData({ expected: '{ room: { roomName } }' }) });

      return;
    }

    manager.userIsAllowed(socket.id, databasePopulation.commands.follow.commandName, (allowErr, allowed, user) => {
      if (allowErr) {
        callback({ error: new errorCreator.Database() });

        return;
      } else if (!allowed) {
        callback({ error: new errorCreator.NotAllowed({ name: 'followWhisper' }) });

        return;
      }

      dbUser.addWhisperRoomToUser(user.userName, room.roomName, (dbErr) => {
        if (dbErr) {
          callback({ error: new errorCreator.Database() });

          return;
        }

        callback({ data: { room } });
      });
    });
  });

  socket.on('unfollowWhisper', ({ room }, callback = () => {}) => {
    if (!objectValidator.isValidData({ room }, { room: { roomName: true } })) {
      callback({ error: new errorCreator.InvalidData({ expected: '{ room: { roomName } }' }) });

      return;
    }

    manager.userIsAllowed(socket.id, databasePopulation.commands.unfollow.commandName, (allowErr, allowed, user) => {
      if (allowErr) {
        callback({ error: new errorCreator.Database() });

        return;
      } else if (!allowed) {
        callback({ error: new errorCreator.NotAllowed({ name: 'unfollowWhisper' }) });

        return;
      }

      dbUser.removeWhisperRoomFromUser(user.userName, room.roomName, (dbErr) => {
        if (dbErr) {
          callback({ error: new errorCreator.Database() });

          return;
        }

        callback({ data: { room } });
      });
    });
  });

  socket.on('follow', ({ room }, callback = () => {}) => {
    if (!objectValidator.isValidData({ room }, { room: { roomName: true } })) {
      callback({ error: new errorCreator.InvalidData({ expected: '{ room: { roomName } }' }) });

      return;
    }

    manager.userIsAllowed(socket.id, databasePopulation.commands.follow.commandName, (allowErr, allowed, user) => {
      if (allowErr) {
        callback({ error: new errorCreator.Database() });

        return;
      } else if (!allowed) {
        callback({ error: new errorCreator.NotAllowed({ name: 'follow' }) });

        return;
      }

      manager.authFollowRoom({ socket, room, user, callback });
    });
  });

  // TODO Unused
  socket.on('unfollow', ({ room }, callback = () => {}) => {
    if (!objectValidator.isValidData({ room }, { room: { roomName: true } })) {
      callback({ error: new errorCreator.InvalidData({ expected: '{ room: { roomName } }' }) });

      return;
    }

    manager.userIsAllowed(socket.id, databasePopulation.commands.unfollow.commandName, (allowErr, allowed, user) => {
      if (allowErr) {
        callback({ error: new errorCreator.Database() });

        return;
      } else if (!allowed) {
        callback({ error: new errorCreator.NotAllowed({ name: 'unfollow' }) });

        return;
      }

      const roomName = room.roomName.toLowerCase();

      if (Object.keys(socket.rooms).indexOf(roomName) === -1) {
        callback({ error: new errorCreator.NotAllowed({ name: 'unfollow room that is not followed' }) });

        return;
      }

      const userName = user.userName;

      /*
       * User should not be able to unfollow its own room
       * That room is for private messaging between users
       */
      if (roomName !== userName) {
        dbUser.removeRoomFromUser(userName, roomName, (err) => {
          if (err) {
            callback({ error: new errorCreator.Database() });

            return;
          }

          socket.broadcast.to(roomName).emit('roomFollower', { userName, roomName, isFollowing: false });
          socket.leave(roomName);
          callback({ data: { room } });
        });
      }
    });
  });

  socket.on('listRooms', (params, callback = () => {}) => {
    manager.userIsAllowed(socket.id, databasePopulation.commands.listRooms.commandName, (allowErr, allowed, user) => {
      if (allowErr) {
        callback({ error: new errorCreator.Database() });

        return;
      } else if (!allowed) {
        callback({ error: new errorCreator.NotAllowed({ name: 'listRooms' }) });

        return;
      }

      dbRoom.getAllRooms(user, (roomErr, rooms = []) => {
        if (roomErr) {
          callback({ error: new errorCreator.Database() });

          return;
        }

        const socketRooms = Object.keys(socket.rooms);
        const roomNames = rooms.filter(room => socketRooms.indexOf(room.roomName) < 0).map(room => room.roomName);
        const followedNames = socketRooms.filter(roomName => !shouldBeHidden(roomName, socket.id));

        if (user.userName === '') {
          callback({ data: { rooms: roomNames, followedRooms: followedNames } });
        } else {
          dbRoom.getOwnedRooms(user, (err, ownedRooms = []) => {
            if (err) {
              callback({ error: new errorCreator.Database() });

              return;
            }

            const ownedNames = ownedRooms.map(room => room.roomName);

            callback({ data: { rooms: roomNames, followedRooms: followedNames, ownedRooms: ownedNames, whisperRooms: user.whisperRooms || [] } });
          });
        }
      });
    });
  });

  socket.on('getHistory', ({ room, startDate, lines, whisperTo }, callback = () => {}) => {
    manager.userIsAllowed(socket.id, databasePopulation.commands.getHistory.commandName, (allowErr, allowed, user) => {
      if (allowErr) {
        callback({ error: new errorCreator.Database() });

        return;
      } else if (!allowed) {
        callback({ error: new errorCreator.NotAllowed({ name: 'getHistory' }) });

        return;
      }

      if (user.team && room.roomName === 'team') {
        room.roomName = user.team + appConfig.teamAppend;
      } else if (whisperTo) {
        room.roomName += appConfig.whisperAppend;
      }

      if (Object.keys(socket.rooms).indexOf(room.roomName) === -1) {
        callback({ error: new errorCreator.NotAllowed({ name: `retrieve history from ${room.roomName}` }) });

        return;
      }

      const allRooms = room ? [room.roomName] : Object.keys(socket.rooms);
      const historyLines = lines > appConfig.maxHistoryLines ? appConfig.maxHistoryLines : lines;

      manager.getHistory({
        rooms: allRooms,
        lines: historyLines,
        missedMsgs: false,
        lastOnline: startDate || new Date(),
        whisperTo,
        callback: (histErr, historyMessages = [], anonymous) => {
          if (histErr) {
            callback({ error: new errorCreator.Database() });

            return;
          }

          const data = { following: room && Object.keys(socket.rooms).indexOf(room.roomName) > -1 };

          if (anonymous) {
            data.messages = historyMessages.map((message) => {
              message.time = new Date();
              message.time.setHours(0);
              message.time.setMinutes(0);
              message.time.setSeconds(0);
              message.userName = 'anonymous';

              return message;
            });
          } else {
            data.messages = historyMessages;
          }

          callback({ data });
        },
      });
    });
  });

  // TODO Unused
  socket.on('removeRoom', ({ room }, callback = () => {}) => {
    if (!objectValidator.isValidData({ room }, { room: { roomName: true } })) {
      callback({ error: new errorCreator.InvalidData({ expected: '{ room: { roomName } }' }) });

      return;
    }

    manager.userIsAllowed(socket.id, databasePopulation.commands.removeRoom.commandName, (allowErr, allowed, user) => {
      if (allowErr) {
        callback({ error: new errorCreator.Database() });

        return;
      } else if (!allowed) {
        callback({ error: new errorCreator.NotAllowed({ name: 'removeRoom' }) });

        return;
      }

      room.roomName = room.roomName.toLowerCase();

      dbRoom.removeRoom(room.roomName, user, (err) => {
        if (err) {
          callback({ error: new errorCreator.Database() });

          return;
        }

        dbUser.removeRoomFromAllUsers(room.roomName, (roomErr) => {
          if (roomErr) {
            callback({ error: new errorCreator.Database() });

            return;
          }

          const connectedIds = Object.keys(io.sockets.adapter.rooms[room.roomName].sockets);
          const allSockets = io.sockets.connected;

          for (let i = 0; i < connectedIds.length; i += 1) {
            const userSocket = allSockets[connectedIds[i]];

            userSocket.leave(room.roomName);
          }

          socket.broadcast.to(room.roomName).emit('unfollow', { room });
        });

        // TODO Send message to all users that were following the room
        callback({ data: { room } });
      });
    });
  });

  // TODO Unused
  socket.on('updateRoom', ({ field, value, room }, callback = () => {}) => {
    if (!objectValidator.isValidData({ field, value, room }, { room: { roomName: true }, field: true, value: true })) {
      callback({ error: new errorCreator.InvalidData({ expected: '{ field, value, room: { roomName } }' }) });

      return;
    }

    manager.userIsAllowed(socket.id, databasePopulation.commands.updateRoom.commandName, (allowErr, allowed) => {
      if (allowErr) {
        callback({ error: new errorCreator.Database() });

        return;
      } else if (!allowed) {
        callback({ error: new errorCreator.NotAllowed({ name: 'updateRoom' }) });

        return;
      }

      room.roomName = room.roomName.toLowerCase();

      const updateRoomCallback = (err, updatedRoom) => {
        if (err) {
          callback({ error: new errorCreator.Database() });

          return;
        } else if (updatedRoom === null) {
          callback({ error: new errorCreator.DoesNotExist({ name: `room ${room.roomName}` }) });

          return;
        }

        callback({ data: { success: true } });
      };

      switch (field) {
        case 'visibility': {
          dbRoom.updateRoomVisibility(room.roomName, value, updateRoomCallback);

          break;
        }
        case 'accesslevel': {
          dbRoom.updateRoomAccessLevel(room.roomName, value, updateRoomCallback);

          break;
        }
        default: {
          callback({ error: new errorCreator.InvalidData({ expected: 'visibility || accessLevel' }) });

          break;
        }
      }
    });
  });

  // TODO Unused
  socket.on('matchPartialMyRoom', ({ partialName }, callback = () => {}) => {
    // params.partialName is not checked if it set, to allow the retrieval of all rooms on no input

    manager.userIsAllowed(socket.id, databasePopulation.commands.listRooms.commandName, (allowErr, allowed, user) => {
      if (allowErr) {
        callback({ error: new errorCreator.Database() });

        return;
      } else if (!allowed) {
        callback({ error: new errorCreator.NotAllowed({ name: 'matchPartialMyRoom' }) });

        return;
      }

      const rooms = user.rooms.filter(room => !shouldBeHidden(room, socket.id) && (!partialName || room.indexOf(partialName) === 0));

      if (user.team) {
        rooms.push('team');
      }

      callback({ data: { matched: rooms } });
    });
  });

  // TODO Unused
  socket.on('matchPartialRoom', ({ partialName }, callback = () => {}) => {
    // params.partialName is not checked if it set, to allow the retrieval of all rooms on no input

    manager.userIsAllowed(socket.id, databasePopulation.commands.listRooms.commandName, (allowErr, allowed, user) => {
      if (allowErr) {
        callback({ error: new errorCreator.Database() });

        return;
      } else if (!allowed) {
        callback({ error: new errorCreator.NotAllowed({ name: 'matchPartialRoom' }) });

        return;
      }

      dbRoom.matchPartialRoom(partialName, user, (err, rooms) => {
        if (err) {
          callback({ error: new errorCreator.Database() });

          return;
        }

        callback({ data: { matched: rooms.map(room => room.roomName) } });
      });
    });
  });
}

exports.handle = handle;
