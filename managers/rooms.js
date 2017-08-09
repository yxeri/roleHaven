/*
 Copyright 2017 Aleksandar Jankovic

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

const dbUser = require('../db/connectors/user');
const dbChatHistory = require('../db/connectors/chatHistory');
const appConfig = require('../config/defaults/config').app;
const dbConfig = require('../config/defaults/config').databasePopulation;
const errorCreator = require('../objects/error/errorCreator');
const textTools = require('../utils/textTools');
const objectValidator = require('../utils/objectValidator');
const authenticator = require('../helpers/authenticator');
const messenger = require('../helpers/messenger');
const dbRoom = require('../db/connectors/room');

/*
 * Sort messages based on timestamp
 */
const messageSort = (a, b) => {
  if (a.time < b.time) {
    return -1;
  } else if (a.time > b.time) {
    return 1;
  }

  return 0;
};

/**
 * Authenticate user to room
 * @param {Object} params.token jwt
 * @param {Object} params.room Room to auth agaisnt
 * @param {Object} params.callback Callback
 */
function authUserToRoom({ token, room, callback }) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.GetRoom.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      } else if (!objectValidator.isValidData({ room }, { room: { roomName: true } })) {
        callback({ error: new errorCreator.InvalidData({ expected: '{ room: { roomName } }' }) });

        return;
      }

      if (room.roomName.toLowerCase() === dbConfig.rooms.public.roomName) {
        callback({ data: { isFollowing: true } });

        return;
      }

      dbRoom.authUserToRoom({
        user: data.user,
        roomName: room.roomName,
        password: room.password,
        callback: ({ error: roomError, data: roomData }) => {
          if (roomError) {
            callback({ error: roomError });

            return;
          }

          const dataToSend = roomData;
          dataToSend.isFollowing = roomData.isAllowed && data.user.rooms.indexOf(roomData.room.roomName) > -1;

          callback({ data: dataToSend });
        },
      });
    },
  });
}

/**
 * Check if room is protected
 * @param {string} roomName Room name to check
 * @param {string} socketId Socket id
 * @param {Object} user User
 * @returns {boolean} Is the room protected?
 */
function isRequiredRoom({ roomName, socketId, user }) {
  const sentRoomName = roomName.toLowerCase();
  const isAliasWhisperRoom = user.aliases ? user.aliases.map(alias => alias + appConfig.whisperAppend).indexOf(sentRoomName) > -1 : false;
  const isRequired = dbConfig.requiredRooms.indexOf(sentRoomName) > -1;
  const isSocketRoom = socketId && sentRoomName === socketId;
  const isWhisperRoom = sentRoomName === user.userName + appConfig.whisperAppend;

  return isAliasWhisperRoom || isRequired || isSocketRoom || isWhisperRoom;
}

/**
 * Gets getHistory (messages) from one or more rooms
 * @param {string[]} params.rooms The rooms to retrieve the getHistory from
 * @param {Object} params.io socket io. Will be used if socket is not set
 * @param {Object} [params.socket] Socket io
 * @param {boolean} [params.whisperTo] Is it whispers to a user?
 * @param {Function} params.callback Callback
 */
function getHistory({ token, callback, socket, io, roomName, whisperTo }) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.GetHistory.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      } else if (!objectValidator.isValidData({ roomName }, { roomName: true })) {
        callback({ error: new errorCreator.InvalidData({ expected: '{ roomName }' }) });

        return;
      }

      const user = data.user;
      let roomToGet = roomName;
      let allUserRooms = [];

      if (whisperTo) {
        roomToGet = `${roomName}${appConfig.whisperAppend}`;
      } else if (roomName === 'team') {
        roomToGet = user.team + appConfig.teamAppend;
      }

      if (socket) {
        allUserRooms = allUserRooms.concat(Object.keys(socket.rooms));
      } else if (io.sockets.sockets[user.socketId]) {
        allUserRooms = allUserRooms.concat(Object.keys(io.sockets.sockets[user.socketId].rooms));
      } else {
        allUserRooms = allUserRooms.concat(user.rooms);
      }

      if (allUserRooms.indexOf(roomToGet) === -1) {
        callback({ error: new errorCreator.NotAllowed({ name: 'not following room' }) });

        return;
      }

      dbChatHistory.getHistory({
        roomName: roomToGet,
        callback: ({ error: historyError, data: historyData }) => {
          if (historyError) {
            callback({ error: historyError });

            return;
          }

          const history = historyData.history;

          const messages = history.messages.map((message) => {
            if (history.anonymous) {
              const anonMessage = message;

              anonMessage.time = new Date();
              anonMessage.time.setHours(0);
              anonMessage.time.setMinutes(0);
              anonMessage.time.setSeconds(0);
              anonMessage.userName = dbConfig.anonymousUserName;

              return anonMessage;
            }

            return message;
          }).sort(messageSort);

          const historyToSend = history;
          historyToSend.timeZoneOffset = new Date().getTimezoneOffset();

          if (whisperTo) {
            historyToSend.messages = messages.filter(message => message.roomName === `${whisperTo}${appConfig.whisperAppend}` || message.userName === whisperTo);
          } else {
            historyToSend.messages = messages;
          }

          callback({ data: { history: historyToSend } });
        },
      });
    },
  });
}

/**
 * Create team, whisper or other types of rooms that do not follow the normal room rules
 * @param {Object} params.user User creating the room
 * @param {Object} params.room Room to create
 * @param {Function} params.callback Callback
 */
function createSpecialRoom({ user, room, callback }) {
  dbRoom.createRoom({
    room,
    callback: ({ error: roomError, data: roomData }) => {
      if (roomError) {
        callback({ error: roomError });

        return;
      }

      dbUser.addRoomToUser({
        userName: user.userName,
        roomName: roomData.room.roomName,
        callback: ({ error: addError }) => {
          if (addError) {
            callback({ error: addError });

            return;
          }

          callback({ data: roomData });
        },
      });
    },
  });
}

/**
 * Creates a new chat room and adds the user who created it to it
 * @param {Object} params.room New room
 * @param {Object} params.user User who is creating the new room
 * @param {Object} [params.socket] Socket io
 * @param {Object} params.io Socket.io. Used if socket isn't set
 * @param {Function} params.callback callback
 */
function createRoom({ room, token, socket, io, callback }) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.CreateRoom.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      } else if (!objectValidator.isValidData({ room }, { room: { roomName: true } })) {
        callback({ error: new errorCreator.InvalidData({ expected: '{ room: { roomName } }' }) });

        return;
      } else if (room.roomName.length > appConfig.roomNameMaxLength || !textTools.isAlphaNumeric(room.roomName)) {
        callback({ error: new errorCreator.InvalidCharacters({ expected: 'a-z 0-9 length: 10' }) });

        return;
      } else if (dbConfig.protectedNames.indexOf(room.roomName.toLowerCase()) > -1
        || room.roomName.toLowerCase().indexOf(appConfig.whisperAppend) > -1
        || room.roomName.toLowerCase().indexOf(appConfig.teamAppend) > -1
        || room.roomName.toLowerCase().indexOf(appConfig.scheduleAppend) > -1
        || room.roomName.toLowerCase().indexOf(appConfig.teamAppend) > -1) {
        callback({ error: new errorCreator.InvalidCharacters({ expected: 'not protected words' }) });

        return;
      }

      const user = data.user;
      const newRoom = room;
      newRoom.roomName = room.roomName.toLowerCase();
      newRoom.owner = user.userName;

      dbRoom.createRoom({
        room: newRoom,
        callback: ({ error: roomError, data: roomData }) => {
          if (roomError) {
            callback({ error: roomError });

            return;
          }

          const createdRoom = roomData.room;

          dbUser.addRoomToUser({
            userName: user.userName,
            roomName: newRoom.roomName,
            callback: ({ error: addError }) => {
              if (addError) {
                callback({ error: addError });

                return;
              }

              const dataToEmit = {
                room: { roomName: newRoom.roomName },
                isProtected: typeof newRoom.password !== 'undefined' && newRoom.password !== '',
              };

              if (socket) {
                socket.broadcast.emit('room', { data: dataToEmit });
              } else if (io) {
                io.emit('room', { data: dataToEmit });
              }

              callback({ data: { room: createdRoom } });
            },
          });
        },
      });
    },
  });
}

/**
 * Joins the user's socket to all sent rooms and added standard rooms
 * @param {string[]} params.rooms Rooms for the user to join
 * @param {Object} params.socket socket.io socket
 * @param {string} [params.device] DeviceID of the user
 */
function joinRooms({ rooms, socket, deviceId }) {
  const allRooms = rooms;

  if (deviceId) {
    allRooms.push(deviceId + appConfig.deviceAppend);
  }

  allRooms.forEach(room => socket.join(room));
}

/**
 * Follow a new room on the user
 * @param {Object} params.room Room to follow
 * @param {Object} params.room.roomName Name of the room
 * @param {Object} [params.room.password] Password to the room
 * @param {Object} [params.user] User trying to follow a room. Will default to current user
 * @param {Function} params.callback Callback
 * @param {Object} [params.socket] Socket.io socket
 * @param {Object} params.io Socket.io. Used if sockket is not set
 */
function followRoom({ token, socket, io, room, callback, user: sentUser = {} }) {
  authenticator.isUserAllowed({
    token,
    matchNameTo: sentUser.userName,
    commandName: dbConfig.apiCommands.FollowRoom.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      } else if (!objectValidator.isValidData({ room }, { room: { roomName: true } })) {
        callback({ error: new errorCreator.InvalidData({ expected: '{ room: { roomName } }' }) });

        return;
      }

      const user = data.user;

      const roomCallback = ({ error: userError, data: userData }) => {
        if (userError) {
          callback({ error: userError });

          return;
        }

        const userFollowing = userData.user;
        const roomToFollow = room;
        roomToFollow.roomName = roomToFollow.roomName.toLowerCase();

        authUserToRoom({
          token,
          room: roomToFollow,
          callback: ({ error: authError, data: authData }) => {
            if (authError) {
              callback({ error: authError });

              return;
            } else if (!authData.isAllowed) {
              callback({ error: new errorCreator.NotAllowed({ name: `follow ${room.roomName}` }) });

              return;
            }

            dbUser.addRoomToUser({
              userName: userFollowing.userName,
              roomName: roomToFollow.roomName,
              callback: (addedData) => {
                if (addedData.error) {
                  callback({ error: addedData.error });

                  return;
                }

                const roomName = authData.room.roomName;
                const dataToSend = {
                  roomName,
                  userName: userFollowing.userName,
                  isFollowing: true,
                };

                if (socket) {
                  socket.broadcast.to(roomName).emit('roomFollower', { data: dataToSend });
                  socket.join(roomName);
                } else {
                  io.to(user.userName + appConfig.whisperAppend).emit('follow', { data: { room: authData.room } });
                  io.to(roomName).emit('roomFollower', { data: dataToSend });
                }

                callback({ data: { room: authData.room } });
              },
            });
          },
        });
      };

      if (user && user.userName !== data.user.userName) {
        dbUser.getUser({
          userName: user.userName,
          callback: roomCallback,
        });
      } else {
        roomCallback({ data: { user: data.user } });
      }
    },
  });
}

/**
 * Leave all rooms (except -device and public) on the socket
 * @param {Object} socket Socket.io socket
 */
function leaveSocketRooms({ socket }) {
  Object.keys(socket.rooms).forEach((roomName) => {
    if (roomName.indexOf(appConfig.deviceAppend) < 0 && roomName !== dbConfig.rooms.public.roomName) {
      socket.leave(roomName);
    }
  });
}

/**
 * Make user follow whisper room
 * @param {Object} params.user User following whisper room
 * @param {string} params.whisperTo Message receiver name
 * @param {Object} params.sender User data sent from client
 * @param {Object} params.room Whisper room
 * @param {Object} [params.socket] Socket.io socket
 * @param {Object} params.io Socket.io. Used if socket is not set
 * @param {Function} params.callback Callback
 */
function followWhisperRoom({ token, whisperTo, sender, room, socket, io, callback }) {
  authenticator.isUserAllowed({
    token,
    matchNameTo: sender.userName,
    commandName: dbConfig.apiCommands.FollowWhisperRoom.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      } else if (!objectValidator.isValidData({ room, whisperTo, sender }, { room: { roomName: true }, whisperTo: true, sender: { userName: true } })) {
        callback({ error: new errorCreator.InvalidData({ expected: '{ user: { userName: true }, room: { roomName: true }, whisperTo: true, sender: { userName: true } }' }) });

        return;
      } else if (data.user.aliases.indexOf(sender.userName) === -1 && data.user.userName !== sender.userName) {
        callback({ error: new errorCreator.NotAllowed({ name: 'alias not in user' }) });

        return;
      }

      dbUser.addWhisperRoomToUser({
        userName: sender.userName,
        roomName: room.roomName,
        callback: ({ error: whisperError }) => {
          if (whisperError) {
            callback({ error: whisperError });

            return;
          }

          const whisperToRoomName = `${whisperTo}-whisper-${sender.userName}`;

          dbUser.addWhisperRoomToUser({
            userName: whisperTo,
            roomName: whisperToRoomName,
            callback: (whisperData) => {
              if (whisperData.error) {
                callback({ error: whisperData.error });

                return;
              }

              const emitTo = `${whisperTo}${appConfig.whisperAppend}`;
              const dataToEmit = {
                whisperTo: sender.userName,
                data: whisperToRoomName,
                room: { roomName: whisperToRoomName },
                whisper: true,
              };

              if (socket) {
                socket.to(emitTo).emit('follow', { data: dataToEmit });
              } else {
                io.to(emitTo).emit('follow', { data: dataToEmit });
              }

              callback({ data: { room } });
            },
          });
        },
      });
    },
  });
}

/**
 * Unfollow room
 * @param {Object} [params.user] User that is unfollowing a room. Defaults to current user
 * @param {boolean} params.isWhisperRoom Is it a whisper room?
 * @param {Object} params.room Room to unfollow
 * @param {Function} params.callback Callback
 * @param {Object} [params.socket] Socket io socket
 * @param {Object} params.io Socket io. Will be used if socket is not set
 */
function unfollowRoom({ token, socket, io, isWhisperRoom, room, callback, user = {} }) {
  authenticator.isUserAllowed({
    token,
    matchNameTo: user.userName,
    commandName: dbConfig.apiCommands.UnfollowRoom.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      } else if (!objectValidator.isValidData({ room }, { room: { roomName: true } })) {
        callback({ error: new errorCreator.InvalidData({ expected: '{ room: { roomName } }' }) });

        return;
      } else if (isRequiredRoom({ roomName: room.roomName, socketId: socket ? socket.id : '', user })) {
        callback({ error: new errorCreator.NotAllowed({ name: 'unfollow protected room' }) });

        return;
      }

      const userUnfollowing = user || data.user;

      const roomToUnfollow = room;
      roomToUnfollow.roomName = roomToUnfollow.roomName.toLowerCase();

      dbUser.removeRoomFromUser({
        isWhisperRoom,
        userName: userUnfollowing.userName,
        roomName: roomToUnfollow.roomName,
        callback: ({ error: removeError }) => {
          if (removeError) {
            callback({ error: removeError });

            return;
          }

          const dataToEmit = {
            room: roomToUnfollow,
            userName: userUnfollowing.userName,
            isFollowing: false,
          };

          if (!isWhisperRoom) {
            if (socket) {
              socket.broadcast.to(roomToUnfollow.roomName).emit('roomFollower', { data: dataToEmit });
            } else {
              io.to(roomToUnfollow.roomName).emit('roomFollower', { data: dataToEmit });
            }
          }

          if (socket) {
            socket.leave(roomToUnfollow.roomName);
          } else {
            const allSocketIds = Object.keys(io.sockets.sockets);

            if (allSocketIds.indexOf(user.socketId) > -1) {
              io.sockets.sockets[user.socketId].leave(roomToUnfollow.roomName);
              io.to(user.userName + appConfig.whisperAppend).emit('unfollow', { data: dataToEmit });
            }
          }

          callback({ data: dataToEmit });
        },
      });
    },
  });
}

/**
 * Get rooms
 * @param {Object} [params.socket] Socket io
 * @param {Function} params.callback Callback
 */
function getRooms({ token, socket, callback }) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.GetRoom.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const user = data.user;

      dbRoom.getAllRooms({
        user,
        callback: ({ error: getError, data: roomsData }) => {
          if (getError) {
            callback({ error: getError });

            return;
          }

          const filteredRooms = roomsData.rooms.map((room) => {
            return {
              roomName: room.roomName,
              password: room.password && room.password !== '',
            };
          });

          const socketId = socket ? socket.id : user.socketId || '';
          const userRooms = socket ? Object.keys(socket.rooms) : user.rooms;
          const rooms = filteredRooms.filter(room => userRooms.indexOf(room.roomName) < 0);
          const followedRooms = messenger.filterHiddenRooms({ roomNames: userRooms, socketId }).map((roomName) => { return { roomName, password: false }; });
          const protectedRooms = filteredRooms.filter(room => room.password);
          const whisperRooms = user.whisperRooms.map((roomName) => { return { roomName, password: false }; });

          if (user.userName === '') {
            callback({
              data: {
                rooms,
                followedRooms,
                protectedRooms: [],
                ownedRooms: [],
                whisperRooms: [],
              },
            });

            return;
          }

          dbRoom.getOwnedRooms({
            user,
            callback: ({ error: ownedError, data: ownedData }) => {
              if (ownedError) {
                callback({ error: ownedError });

                return;
              }

              callback({
                data: {
                  rooms,
                  followedRooms,
                  protectedRooms,
                  whisperRooms,
                  ownedRooms: ownedData.rooms.map((room) => { return { roomName: room.roomName, password: room.password }; }),
                },
              });
            },
          });
        },
      });
    },
  });
}

/**
 * Remove room
 * @param {Object} params.user Owner of the room
 * @param {Object} params.room Room to remove
 * @param {Object} [params.socket] Socket io
 * @param {Object} params.io socket io. Will be used if socket is not set
 * @param {Function} params.callback Callback
 */
function removeRoom({ token, room, socket, io, callback }) {
  authenticator.isUserAllowed({
    token,
    matchNameTo: room.owner,
    commandName: dbConfig.apiCommands.RemoveRoom.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      } else if (isRequiredRoom({ roomName: room.roomName, socketId: socket ? socket.id : '', user: data.user })) {
        callback({ error: new errorCreator.NotAllowed({ name: 'remove protected room' }) });

        return;
      }

      const user = data.user;
      const roomToRemove = room;
      roomToRemove.roomName = roomToRemove.roomName.toLowerCase();

      dbRoom.getRoom({
        roomName: roomToRemove.roomName,
        callback: ({ error: roomError, data: roomData }) => {
          if (roomError) {
            callback({ error: roomError });

            return;
          } else if (roomData.room.owner !== user.userName && dbConfig.apiCommands.RemoveRoom.accessLevel > user.accessLevel) {
            callback({ error: new errorCreator.NotAllowed({ name: 'not owner of room' }) });

            return;
          }

          const retrievedRoom = roomData.room;

          dbRoom.removeRoom({
            roomName: retrievedRoom.roomName,
            callback: ({ error: removeError }) => {
              if (removeError) {
                callback({ error: removeError });

                return;
              }

              dbUser.removeRoomFromAllUsers({
                roomName: retrievedRoom.roomName,
                callback: ({ error: allError }) => {
                  if (allError) {
                    callback({ error: allError });

                    return;
                  }

                  const connectedIds = Object.keys(io.sockets.adapter.rooms[retrievedRoom.roomName].sockets);
                  const allSockets = io.sockets.connected;

                  connectedIds.forEach(connectedId => allSockets[connectedId].leave(retrievedRoom.roomName));

                  if (socket) {
                    socket.broadcast.to(retrievedRoom.roomName).emit('unfollow', { data: { room: retrievedRoom } });
                  } else {
                    io.to(retrievedRoom.roomName).emit('unfollow', { data: { room: retrievedRoom } });
                  }

                  callback({ data: { room: retrievedRoom } });
                },
              });
            },
          });
        },
      });
    },
  });
}

/**
 * Match sent partial room name to one or more rooms followed. Match will start from index 0
 * @param {string} params.partialName Partial room name
 * @param {Function} params.callback Callback
 */
function matchMyPartialRoomName({ token, partialName, callback }) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.GetRoom.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const user = data.user;

      const regex = new RegExp(`^${partialName}.*`);
      const rooms = messenger.filterHiddenRooms({ roomNames: user.rooms.filter(roomName => roomName.match(regex)), socketId: user.socketId });

      if (user.team) {
        rooms.push('team');
      }

      callback({
        data: { matched: rooms },
      });
    },
  });
}

/**
 * Match sent partial room name to one or more rooms. Match will start from index 0
 * @param {string} params.partialName Partial room name
 * @param {Function} params.callback Callback
 */
function matchPartialRoomName({ token, partialName, callback }) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.GetRoom.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      dbRoom.matchPartialRoom({
        partialName,
        user: data.user,
        callback: ({ error: partialError, data: partialData }) => {
          if (partialError) {
            callback({ error: partialError });

            return;
          }

          callback({
            data: {
              matched: partialData.matched.map(room => room.roomName),
            },
          });
        },
      });
    },
  });
}

/**
 * Get room
 * @param {string} params.roomName Name of the room to retrieve
 * @param {Function} params.callback Callback
 */
function getRoom({ token, roomName, callback }) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.GetRoom.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const sentRoomName = roomName.toLowerCase();

      dbRoom.getRoom({
        roomName: sentRoomName,
        callback: ({ error: roomError, data: roomData }) => {
          if (roomError) {
            callback({ error: roomError });

            return;
          } else if (data.user.accessLevel < roomData.room.visibility) {
            callback({ error: new errorCreator.NotAllowed({ name: `room ${sentRoomName}` }) });

            return;
          }

          callback({ data: roomData });
        },
      });
    },
  });
}

exports.createRoom = createRoom;
exports.joinRooms = joinRooms;
exports.getHistory = getHistory;
exports.followRoom = followRoom;
exports.leaveSocketRooms = leaveSocketRooms;
exports.isRequiredRoom = isRequiredRoom;
exports.authUserToRoom = authUserToRoom;
exports.followWhisperRoom = followWhisperRoom;
exports.unfollowRoom = unfollowRoom;
exports.getRooms = getRooms;
exports.removeRoom = removeRoom;
exports.matchMyPartialRoomName = matchMyPartialRoomName;
exports.matchPartialRoomName = matchPartialRoomName;
exports.getRoom = getRoom;
exports.createSpecialRoom = createSpecialRoom;
