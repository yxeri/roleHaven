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
const dbConfig = require('../../config/defaults/config').databasePopulation;
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
    dbConfig.rooms.bcast.roomName,
  ];

  return hiddenRooms.indexOf(room) >= 0 || room.indexOf(appConfig.whisperAppend) >= 0 || room.indexOf(appConfig.deviceAppend) >= 0;
}

/**
 * @param {object} socket - Socket.IO socket
 * @param {object} io - Socket.IO
 */
function handle(socket, io) {
  socket.on('chatMsg', ({ message, image, token }, callback = () => {}) => {
    if (!objectValidator.isValidData({ message }, { message: { text: true, roomName: true } })) {
      callback({ error: new errorCreator.InvalidData({ expected: '{ message: { text, roomName } }' }) });

      return;
    }

    manager.userIsAllowed({
      token,
      commandName: dbConfig.commands.chatMsg.commandName,
      callback: ({ error, allowedUser }) => {
        if (error) {
          callback({ error });

          return;
        }

        message.text = textTools.cleanText(message.text);

        if (image && image.imageName && image.source.match(/^data:image\/((png)|(jpeg));base64,/)) {
          const fileName = `${new Buffer(allowedUser.userName).toString('base64')}-${appConfig.mode}-${image.imageName.replace(/[^\w.]/g, '-')}`;

          fs.writeFile(`${appConfig.publicBase}/images/${fileName}`, image.source.replace(/data:image\/((png)|(jpeg));base64,/, ''), { encoding: 'base64' }, (err) => {
            if (err) {
              callback({ error: new errorCreator.Database({}) });

              return;
            }

            message.image = {
              imageName: image.imageName,
              fileName,
              width: image.width,
              height: image.height,
            };

            messenger.sendChatMsg({
              callback,
              message,
              io,
              socket,
              user: allowedUser,
            });
          });
        } else {
          messenger.sendChatMsg({
            callback,
            message,
            io,
            socket,
            user: allowedUser,
          });
        }
      },
    });
  });

  socket.on('whisperMsg', ({ message, token }, callback = () => {}) => {
    if (!objectValidator.isValidData({ message }, { message: { text: true, roomName: true, userName: true } })) {
      callback({ error: new errorCreator.InvalidData({ expected: '{ message: { text, roomName, userName } }' }) });

      return;
    }

    manager.userIsAllowed({
      token,
      commandName: dbConfig.commands.whisper.commandName,
      callback: ({ error, allowedUser }) => {
        if (error) {
          callback({ error });

          return;
        }

        message.text = textTools.cleanText(message.text);

        messenger.sendWhisperMsg({
          socket,
          callback,
          message,
          io,
          user: allowedUser,
        });
      },
    });
  });

  // TODO Unused
  socket.on('broadcastMsg', ({ message, token }, callback = () => {}) => {
    if (!objectValidator.isValidData({ message }, { message: { text: true } })) {
      callback({ error: new errorCreator.InvalidData({ expected: '{ message: { text } }' }) });

      return;
    }

    manager.userIsAllowed({
      token,
      commandName: dbConfig.commands.broadcast.commandName,
      callback: ({ error, allowedUser }) => {
        if (error) {
          callback({ error });

          return;
        }

        message.userName = allowedUser.userName;

        messenger.sendBroadcastMsg({ socket, message, callback });
      },
    });
  });

  socket.on('createRoom', ({ room, token }, callback = () => {}) => {
    if (!objectValidator.isValidData({ room }, { room: { roomName: true } })) {
      callback({ error: new errorCreator.InvalidData({ expected: '{ room: { roomName } }' }) });

      return;
    }

    manager.userIsAllowed({
      token,
      commandName: dbConfig.commands.createRoom.commandName,
      callback: ({ error, allowedUser }) => {
        if (error) {
          callback({ error });

          return;
        }

        room.owner = allowedUser.userName;
        room.roomName = room.roomName.toLowerCase();

        manager.createRoom(room, allowedUser, (createErr, createdRoom) => {
          if (createErr) {
            callback({ error: new errorCreator.Database({ errorObject: createErr }) });

            return;
          } else if (!createdRoom) {
            callback({ error: new errorCreator.AlreadyExists({ name: 'room' }) });

            return;
          }

          socket.broadcast.emit('room', {
            room: {
              roomName: room.roomName,
            },
            isProtected: typeof room.password !== 'undefined' && room.password !== '',
          });
          manager.followRoom({
            callback,
            socket,
            userName: allowedUser.userName,
            room: createdRoom,
          });
        });
      },
    });
  });

  socket.on('authUserToRoom', ({ room, token }, callback = () => {}) => {
    if (!objectValidator.isValidData({ room }, { room: { roomName: true } })) {
      callback({ error: new errorCreator.InvalidData({ expected: '{ room: { roomName } }' }) });

      return;
    }

    manager.userIsAllowed({
      token,
      commandName: dbConfig.commands.getHistory.commandName,
      callback: ({ error, allowedUser }) => {
        if (error) {
          callback({ error });

          return;
        }

        dbRoom.getRoom(room.roomName, allowedUser, (err, retrievedRoom) => {
          if (err) {
            callback({ error: new errorCreator.Database({}) });

            return;
          }

          const socketRooms = Object.keys(socket.rooms);

          if ((retrievedRoom && Object.keys(socket.rooms).indexOf(retrievedRoom.roomName) > -1) || socketRooms.indexOf(room.roomName) > -1) {
            callback({ data: { allowed: true, room: retrievedRoom } });
          } else {
            callback({ data: { allowed: false, room: retrievedRoom } });
          }
        });
      },
    });
  });

  socket.on('followWhisper', ({ room, token }, callback = () => {}) => {
    if (!objectValidator.isValidData({ room }, { room: { roomName: true } })) {
      callback({ error: new errorCreator.InvalidData({ expected: '{ room: { roomName } }' }) });

      return;
    }

    manager.userIsAllowed({
      token,
      commandName: dbConfig.commands.follow.commandName,
      callback: ({ error, allowedUser }) => {
        if (error) {
          callback({ error });

          return;
        }

        dbUser.addWhisperRoomToUser(allowedUser.userName, room.roomName, (dbErr) => {
          if (dbErr) {
            callback({ error: new errorCreator.Database({}) });

            return;
          }

          callback({ data: { room } });
        });
      },
    });
  });

  socket.on('follow', ({ room, token }, callback = () => {}) => {
    if (!objectValidator.isValidData({ room }, { room: { roomName: true } })) {
      callback({ error: new errorCreator.InvalidData({ expected: '{ room: { roomName } }' }) });

      return;
    }

    manager.userIsAllowed({
      token,
      commandName: dbConfig.commands.follow.commandName,
      callback: ({ error, allowedUser }) => {
        if (error) {
          callback({ error });

          return;
        }

        manager.authFollowRoom({
          socket,
          room,
          callback,
          user: allowedUser,
        });
      },
    });
  });

  socket.on('unfollow', ({ room, token }, callback = () => {}) => {
    if (!objectValidator.isValidData({ room }, { room: { roomName: true } })) {
      callback({ error: new errorCreator.InvalidData({ expected: '{ room: { roomName } }' }) });

      return;
    }

    const roomName = room.roomName.toLowerCase();

    manager.userIsAllowed({
      token,
      commandName: dbConfig.commands.unfollow.commandName,
      callback: ({ error, allowedUser }) => {
        if (error) {
          callback({ error });

          return;
        } else if (Object.keys(socket.rooms).indexOf(roomName) === -1) {
          callback({ error: new errorCreator.NotAllowed({ name: 'unfollow room that is not followed' }) });

          return;
        } else if (roomName === dbConfig.rooms.public.roomName) {
          callback({ error: new errorCreator.NotAllowed({ name: 'unfollow room public' }) });

          return;
        } else if (roomName !== allowedUser.userName + appConfig.whisperAppend && allowedUser.aliases.map(alias => alias + appConfig.whisperAppend).indexOf(roomName) === -1) {
          callback({ error: new errorCreator.NotAllowed({ name: 'unfollow whisper room' }) });

          return;
        }

        const userName = allowedUser.userName;
        const isWhisperRoom = roomName.indexOf(appConfig.whisperAppend) > -1;

        dbUser.removeRoomFromUser({
          userName,
          roomName,
          isWhisperRoom,
          callback: (err) => {
            if (err) {
              callback({ error: new errorCreator.Database({ errorObject: err }) });

              return;
            }

            if (!isWhisperRoom) {
              socket.broadcast.to(roomName).emit('roomFollower', { userName, roomName, isFollowing: false });
              socket.leave(roomName);
            }

            callback({ data: { room } });
          },
        });
      },
    });
  });

  socket.on('listRooms', ({ token }, callback = () => {}) => {
    manager.userIsAllowed({
      token,
      commandName: dbConfig.commands.listRooms.commandName,
      callback: ({ error, allowedUser }) => {
        if (error) {
          callback({ error });

          return;
        }

        dbRoom.getAllRooms(allowedUser, (roomErr, rooms = []) => {
          if (roomErr) {
            callback({ error: new errorCreator.Database({ errorObject: roomErr }) });

            return;
          }

          const socketRooms = Object.keys(socket.rooms);
          const roomNames = rooms.filter(room => socketRooms.indexOf(room.roomName) < 0).map(room => room.roomName);
          const followedNames = socketRooms.filter(roomName => !shouldBeHidden(roomName, socket.id));
          const protectedNames = rooms.filter(room => room.password).map(room => room.roomName);

          if (allowedUser.userName === '') {
            callback({
              data: {
                rooms: roomNames,
                followedRooms: followedNames,
              },
            });
          } else {
            dbRoom.getOwnedRooms(allowedUser, (err, ownedRooms = []) => {
              if (err) {
                callback({ error: new errorCreator.Database({ errorObject: err }) });

                return;
              }

              const ownedNames = ownedRooms.map(room => room.roomName);

              callback({
                data: {
                  rooms: roomNames,
                  followedRooms: followedNames,
                  ownedRooms: ownedNames,
                  whisperRooms: allowedUser.whisperRooms,
                  protectedRooms: protectedNames,
                },
              });
            });
          }
        });
      },
    });
  });

  socket.on('getHistory', ({ room, startDate, lines, whisperTo, token }, callback = () => {}) => {
    manager.userIsAllowed({
      token,
      commandName: dbConfig.commands.getHistory.commandName,
      callback: ({ error, allowedUser }) => {
        if (error) {
          callback({ error });

          return;
        }

        if (allowedUser.team && room.roomName === 'team') {
          room.roomName = allowedUser.team + appConfig.teamAppend;
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
          whisperTo,
          rooms: allRooms,
          lines: historyLines,
          missedMsgs: false,
          lastOnline: startDate || new Date(),
          callback: (histErr, historyMessages = [], anonymous) => {
            if (histErr) {
              callback({ error: new errorCreator.Database({ errorObject: histErr }) });

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
      },
    });
  });

  // TODO Unused
  socket.on('removeRoom', ({ room, token }, callback = () => {}) => {
    if (!objectValidator.isValidData({ room }, { room: { roomName: true } })) {
      callback({ error: new errorCreator.InvalidData({ expected: '{ room: { roomName } }' }) });

      return;
    }

    room.roomName = room.roomName.toLowerCase();

    manager.userIsAllowed({
      token,
      commandName: dbConfig.commands.removeRoom.commandName,
      callback: ({ error, allowedUser }) => {
        if (error) {
          callback({ error });

          return;
        }

        dbRoom.getRoom(room.roomName, allowedUser, (getErr, retrievedRoom) => {
          if (getErr) {
            callback({ error: new errorCreator.Database({ errorObject: getErr }) });

            return;
          } else if (retrievedRoom.owner !== allowedUser.userName) {
            callback({ error: new errorCreator.NotAllowed({ name: 'not owner of room' }) })
          }

          dbRoom.removeRoom(room.roomName, (err) => {
            if (err) {
              callback({ error: new errorCreator.Database({ errorObject: err }) });

              return;
            }

            dbUser.removeRoomFromAllUsers(room.roomName, (roomErr) => {
              if (roomErr) {
                callback({ error: new errorCreator.Database({ errorObject: roomErr }) });

                return;
              }

              const connectedIds = Object.keys(io.sockets.adapter.rooms[room.roomName].sockets);
              const allSockets = io.sockets.connected;

              socket.broadcast.to(room.roomName).emit('unfollow', { room });

              connectedIds.forEach(connectedId => allSockets[connectedId].leave(room.roomName));
            });

            // TODO Send message to all users that were following the room
            callback({ data: { room } });
          });
        });
      },
    });
  });

  // TODO Unused
  socket.on('updateRoom', ({ field, value, room, token }, callback = () => {}) => {
    if (!objectValidator.isValidData({ field, value, room }, { room: { roomName: true }, field: true, value: true })) {
      callback({ error: new errorCreator.InvalidData({ expected: '{ field, value, room: { roomName } }' }) });

      return;
    }

    manager.userIsAllowed({
      token,
      commandName: dbConfig.commands.updateRoom.commandName,
      callback: ({ error }) => {
        if (error) {
          callback({ error });

          return;
        }

        room.roomName = room.roomName.toLowerCase();

        const updateRoomCallback = (err, updatedRoom) => {
          if (err) {
            callback({ error: new errorCreator.Database({}) });

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
      },
    });
  });

  // TODO Unused
  socket.on('matchPartialMyRoom', ({ partialName, token }, callback = () => {}) => {
    // params.partialName is not checked if it set, to allow the retrieval of all rooms on no input

    manager.userIsAllowed({
      token,
      commandName: dbConfig.commands.listRooms.commandName,
      callback: ({ error, allowedUser }) => {
        if (error) {
          callback({ error });

          return;
        }

        const rooms = allowedUser.rooms.filter(room => !shouldBeHidden(room, socket.id) && (!partialName || room.indexOf(partialName) === 0));

        if (allowedUser.team) {
          rooms.push('team');
        }

        callback({
          data: {
            matched: rooms,
          },
        });
      },
    });
  });

  // TODO Unused
  socket.on('matchPartialRoom', ({ partialName, token }, callback = () => {}) => {
    // params.partialName is not checked if it set, to allow the retrieval of all rooms on no input

    manager.userIsAllowed({
      token,
      commandName: dbConfig.commands.listRooms.commandName,
      callback: ({ error, allowedUser }) => {
        if (error) {
          callback({ error });

          return;
        }

        dbRoom.matchPartialRoom(partialName, allowedUser, (err, rooms) => {
          if (err) {
            callback({ error: new errorCreator.Database({}) });

            return;
          }

          callback({
            data: {
              matched: rooms.map(room => room.roomName),
            },
          });
        });
      },
    });
  });
}

exports.handle = handle;
