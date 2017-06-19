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
 * @param {string} roomName Room name
 * @param {string} socketId ID of the socket
 * @returns {boolean} Should the room be hidden?
 */
function shouldBeHidden({ roomName, socketId }) {
  const hiddenRooms = [
    socketId,
    dbConfig.rooms.bcast.roomName,
  ];

  return hiddenRooms.indexOf(roomName) >= 0 || roomName.indexOf(appConfig.whisperAppend) >= 0 || roomName.indexOf(appConfig.deviceAppend) >= 0;
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
              callback({ error: new errorCreator.Database({ errorObject: err, name: 'writeFile image' }) });

              return;
            }

            message.image = {
              fileName,
              imageName: image.imageName,
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
    } else if (room.roomName.length > appConfig.roomNameMaxLength || !textTools.isAlphaNumeric(room.roomName)) {
      callback({ error: new errorCreator.InvalidCharacters({ expected: 'a-z 0-9 length: 10' }) });

      return;
    } else if (room.roomName.indexOf(appConfig.whisperAppend) > -1 || room.roomName.indexOf(appConfig.teamAppend) > -1) {
      callback({ error: new errorCreator.InvalidCharacters({ expected: 'not protected words' }) });

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

        manager.createRoom({
          room,
          user: allowedUser,
          callback: ({ error: createError, data }) => {
            if (createError) {
              callback({ error: createError });

              return;
            }

            socket.broadcast.emit('room', {
              room: { roomName: room.roomName },
              isProtected: typeof room.password !== 'undefined' && room.password !== '',
            });

            manager.followRoom({
              callback,
              socket,
              userName: allowedUser.userName,
              room: data.room,
            });
          },
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

        dbRoom.getRoom({
          roomName: room.roomName,
          callback: ({ error: getError, data }) => {
            if (getError) {
              callback({ error: getError });

              return;
            } else if (data.room.accessLevel > allowedUser.accessLevel && data.room.roomName.indexOf(appConfig.teamAppend) < 0) {
              callback({ error: new errorCreator.NotAllowed({ name: `${allowedUser.userName} not allowed room ${data.room.roomName}` }) });

              return;
            }

            const { room: retrievedRoom } = data;
            const socketRooms = Object.keys(socket.rooms);

            if ((retrievedRoom && Object.keys(socket.rooms).indexOf(retrievedRoom.roomName) > -1) || socketRooms.indexOf(room.roomName) > -1) {
              callback({ data: { allowed: true, room: retrievedRoom } });
            } else {
              callback({ data: { allowed: false, room: retrievedRoom } });
            }
          },
        });
      },
    });
  });

  socket.on('followWhisper', ({ whisperTo, room, token }, callback = () => {}) => {
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

        dbUser.addWhisperRoomToUser({
          userName: allowedUser.userName,
          roomName: room.roomName,
          callback: ({ error: whisperError }) => {
            if (whisperError) {
              callback({ error: whisperError });

              return;
            }

            const whisperToRoomName = `${whisperTo}-whisper-${allowedUser.userName}`;

            dbUser.addWhisperRoomToUser({
              userName: whisperTo,
              roomName: whisperToRoomName,
              callback: (whisperData) => {
                if (whisperData.error) {
                  callback({ error: whisperData.error });

                  return;
                }

                socket.to(`${whisperTo}${appConfig.whisperAppend}`).emit('follow', {
                  whisperTo: allowedUser.userName,
                  data: whisperToRoomName,
                  room: { roomName: whisperToRoomName },
                  whisper: true,
                });

                callback({ data: { room } });
              },
            });
          },
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

  socket.on('unfollow', ({ room, isWhisperRoom, token }, callback = () => {}) => {
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
        } else if (manager.isRequiredRoom({ roomName, socketId: socket.id, user: allowedUser })) {
          callback({ error: new errorCreator.NotAllowed({ name: 'unfollow protected room' }) });

          return;
        }

        const userName = allowedUser.userName;

        dbUser.removeRoomFromUser({
          userName,
          roomName,
          isWhisperRoom,
          callback: ({ error: removeError }) => {
            if (removeError) {
              callback({ error: removeError });

              return;
            }

            if (!isWhisperRoom) {
              socket.broadcast.to(roomName).emit('roomFollower', {
                userName,
                roomName,
                isFollowing: false,
              });
            }

            socket.leave(roomName);

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

        dbRoom.getAllRooms({
          user: allowedUser,
          callback: ({ error: getError, data }) => {
            if (getError) {
              callback({ error: getError });

              return;
            }

            const { rooms: retrievedRooms } = data;
            const filteredRooms = retrievedRooms.map((room) => {
              return {
                roomName: room.roomName,
                password: room.password !== '',
              };
            });

            const socketRooms = Object.keys(socket.rooms);
            const rooms = filteredRooms.filter(room => socketRooms.indexOf(room.roomName) < 0);
            const followedRooms = socketRooms.filter(roomName => !shouldBeHidden({ roomName, socketId: socket.id })).map((roomName) => { return { roomName }; });
            const protectedRooms = filteredRooms.filter(room => room.password);

            if (allowedUser.userName === '') {
              callback({
                data: {
                  rooms,
                  followedRooms,
                },
              });
            } else {
              dbRoom.getOwnedRooms({
                user: allowedUser,
                callback: ({ error: ownedError, data: roomsData }) => {
                  if (ownedError) {
                    callback({ error: ownedError });

                    return;
                  }

                  callback({
                    data: {
                      rooms,
                      followedRooms,
                      protectedRooms,
                      ownedRooms: roomsData.rooms,
                      whisperRooms: allowedUser.whisperRooms.map((roomName) => { return { roomName }; }),
                    },
                  });
                },
              });
            }
          },
        });
      },
    });
  });

  socket.on('getHistory', ({ room, whisperTo, token }, callback = () => {}) => {
    manager.userIsAllowed({
      token,
      commandName: dbConfig.commands.getHistory.commandName,
      callback: ({ error, allowedUser }) => {
        if (error) {
          callback({ error });

          return;
        }

        if (room && room.roomName) {
          if (allowedUser.team && room.roomName === 'team') {
            room.roomName = allowedUser.team + appConfig.teamAppend;
          } else if (whisperTo) {
            room.roomName += appConfig.whisperAppend;
          }

          if (Object.keys(socket.rooms).indexOf(room.roomName) === -1) {
            callback({ error: new errorCreator.NotAllowed({ name: `retrieve history from ${room.roomName}` }) });

            return;
          }
        }

        const allRooms = room ? [room.roomName] : Object.keys(socket.rooms);

        manager.getHistory({
          whisperTo,
          rooms: allRooms,
          callback: ({ error: histError, data }) => {
            if (histError) {
              callback({ error: histError });

              return;
            }

            const newData = data;
            newData.following = room && Object.keys(socket.rooms).indexOf(room.roomName) > -1;

            callback({ data: newData });
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

        dbRoom.getRoom({
          roomName: room.roomName,
          callback: ({ error: getError, data }) => {
            if (getError) {
              callback({ error: getError });

              return;
            } else if (data.room.owner !== allowedUser.userName) {
              callback({ error: new errorCreator.NotAllowed({ name: 'not owner of room' }) });
            }

            dbRoom.removeRoom({
              roomName: data.room.roomName,
              callback: ({ error: removeError }) => {
                if (removeError) {
                  callback({ error: removeError });

                  return;
                }

                dbUser.removeRoomFromAllUsers({
                  roomName: room.roomName,
                  callback: ({ error: allError }) => {
                    if (allError) {
                      callback({ error: allError });

                      return;
                    }

                    const connectedIds = Object.keys(io.sockets.adapter.rooms[room.roomName].sockets);
                    const allSockets = io.sockets.connected;

                    socket.broadcast.to(room.roomName).emit('unfollow', { room });
                    connectedIds.forEach(connectedId => allSockets[connectedId].leave(room.roomName));

                    callback({ data: { room } });
                  },
                });
              },
            });
          },
        });
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

        const rooms = allowedUser.rooms.filter(room => !shouldBeHidden({ room, socketId: socket.id }) && (!partialName || room.indexOf(partialName) === 0));

        if (allowedUser.team) {
          rooms.push('team');
        }

        callback({
          data: { matched: rooms },
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

        dbRoom.matchPartialRoom({
          partialName,
          user: allowedUser,
          callback: ({ error: partialError, data }) => {
            if (partialError) {
              callback({ error: partialError });

              return;
            }

            callback({
              data: { matched: data.rooms.map(room => room.roomName) },
            });
          },
        });
      },
    });
  });
}

exports.handle = handle;
