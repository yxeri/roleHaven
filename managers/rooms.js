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

const appConfig = require('../config/defaults/config').app;
const dbConfig = require('../config/defaults/config').databasePopulation;
const errorCreator = require('../objects/error/errorCreator');
const textTools = require('../utils/textTools');
const objectValidator = require('../utils/objectValidator');
const authenticator = require('../helpers/authenticator');
const dbRoom = require('../db/connectors/room');
const aliasManager = require('./aliases');
const socketUtils = require('../utils/socketIo');

/**
 * Create a whisper room and give access to the participants.
 * @param {Object} params - Parameters.
 * @param {string[]} params.participantIds - User IDs of the users send private messages to each other.
 * @param {string} params.user - The user creating the room.
 * @param {Function} params.callback - Callback.
 * @param {Object} params.socket - Socket.io.
 * @param {Object} params.io - Socket.io. Used if socket is not set.
 */
function createAndFollowWhisperRoom({
  participantIds,
  user,
  callback,
  socket,
  io,
}) {
  const room = {
    participantIds,
    isWhisper: true,
    accessLevel: dbConfig.AccessLevels.SUPERUSER,
    visibility: dbConfig.AccessLevels.SUPERUSER,
  };

  dbRoom.createRoom({
    room,
    options: { shouldSetIdToName: true },
    callback: (roomData) => {
      if (roomData.error) {
        callback({ error: roomData.error });

        return;
      }

      dbRoom.addAccess({
        roomId: roomData.data.room.roomId,
        userIds: participantIds,
        callback: (accessdata) => {
          if (accessdata.error) {
            callback({ error: accessdata.error });

            return;
          }

          const newRoom = accessdata.data.room;
          const newRoomId = newRoom.roomId;
          const senderId = newRoom.participantIds[0];
          const receiverId = newRoom.participantIds[1];
          const dataToSend = {
            data: {
              room: {
                roomId: newRoomId,
                isWhisper: true,
                participantIds: newRoom.participantIds,
              },
              changeType: dbConfig.ChangeTypes.CREATE,
            },
          };

          if (socket) {
            socket.join(newRoomId);
            socket.broadcast.to(senderId).emit(dbConfig.EmitTypes.ROOM, dataToSend, callback);
            socket.broadcast.to(receiverId).emit(dbConfig.EmitTypes.ROOM, dataToSend, callback);
          } else {
            const userSocket = socketUtils.getUserSocket({ io, socketId: user.socketId });

            if (userSocket) { userSocket.join(newRoomId); }

            io.to(senderId).emit(dbConfig.EmitTypes.ROOM, dataToSend, callback);
            io.to(receiverId).emit(dbConfig.EmitTypes.ROOM, dataToSend, callback);
          }
        },
      });
    },
  });
}

/**
 * Get room by ID and check if the user has access to it.
 * @param {Object} params - Parameters.
 * @param {Object} params.user - User retrieving the room.
 * @param {string} params.roomId - ID of the room to retrieve.
 * @param {Function} params.callback - Callback.
 * @param {string} [params.errorContentText] - Text to be printed on error.
 * @param {boolean} [params.shouldBeAdmin] - Does the user have to be an admin?
 * @param {string} [params.password] - Password to unlock the room.
 */
function getAccessibleRoom({
  user,
  roomId,
  password,
  callback,
  shouldBeAdmin,
  errorContentText = `roomId ${roomId}`,
}) {
  dbRoom.getRoomById({
    roomId,
    callback: (roomData) => {
      if (roomData.error) {
        callback({ error: roomData.error });

        return;
      }

      const { room } = roomData.data;

      if (!room.isSystemRoom && !authenticator.hasAccessTo({
        shouldBeAdmin,
        toAuth: user,
        objectToAccess: room,
      }) && (!room.password || !password || room.password !== password)) {
        callback({ error: new errorCreator.NotAllowed({ name: errorContentText }) });

        return;
      }

      callback(roomData);
    },
  });
}

/**
 * Checks if a room exists with the sent participants.
 * @param {Object} params - Parameters.
 * @param {string[]} params.participantIds - IDs of the users.
 * @param {Function} params.callback - Callback.
 */
function getWhisperRoom({ participantIds, callback }) {
  dbRoom.getWhisperRoom({
    participantIds,
    callback,
  });
}

/**
 * Add access to the room for users or teams.
 * @param {Object} params - Parameters.
 * @param {string} params.roomId - ID of the room.
 * @param {string[]} [params.userIds] - ID of the users.
 * @param {string[]} [params.teamIds] - ID of the teams.
 * @param {string[]} [params.bannedIds] - ID of the blocked Ids to add.
 * @param {string[]} [params.teamAdminIds] - Id of the teams to give admin access to. They will also be added to teamIds.
 * @param {string[]} [params.userAdminIds] - Id of the users to give admin access to. They will also be added to userIds.
 * @param {Function} params.callback - Callback.
 */
function addAccess({
  token,
  roomId,
  userId,
  teamAdminIds,
  userAdminIds,
  userIds,
  teamIds,
  bannedIds,
  callback,
}) {
  authenticator.isUserAllowed({
    token,
    matchToId: userId,
    commandName: dbConfig.apiCommands.UpdateRoom,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const authUser = data.user;

      getAccessibleRoom({
        roomId,
        shouldBeAdmin: true,
        user: authUser,
        errorContentText: `add access room id ${roomId}`,
        callback: (aliasData) => {
          if (aliasData.error) {
            callback({ error: aliasData.error });

            return;
          }

          dbRoom.addAccess({
            userIds,
            teamIds,
            bannedIds,
            teamAdminIds,
            userAdminIds,
            callback,
            roomId,
          });
        },
      });
    },
  });
}

/**
 * Remove access to the room for user or team.
 * @param {Object} params - Parameters.
 * @param {string} params.roomId - ID of the room.
 * @param {string[]} [params.userIds] - ID of the users to remove.
 * @param {string[]} [params.teamIds] - ID of the teams to remove.
 * @param {string[]} [params.bannedIds] - Blocked IDs to remove.
 * @param {string[]} [params.teamAdminIds] - Id of the teams to remove admin access from. They will not be removed from teamIds.
 * @param {string[]} [params.userAdminIds] - Id of the users to remove admin access from. They will not be removed from userIds.
 * @param {Function} params.callback - Callback.
 */
function removeAccess({
  token,
  roomId,
  userId,
  teamAdminIds,
  userAdminIds,
  userIds,
  teamIds,
  bannedIds,
  callback,
}) {
  authenticator.isUserAllowed({
    token,
    matchToId: userId,
    commandName: dbConfig.apiCommands.UpdateRoom,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const authUser = data.user;

      getAccessibleRoom({
        roomId,
        shouldBeAdmin: true,
        user: authUser,
        errorContentText: `add access room id ${roomId}`,
        callback: (aliasData) => {
          if (aliasData.error) {
            callback({ error: aliasData.error });

            return;
          }

          dbRoom.removeAccess({
            userIds,
            teamIds,
            teamAdminIds,
            userAdminIds,
            bannedIds,
            callback,
            roomId,
          });
        },
      });
    },
  });
}

/**
 * Creates a new chat room and adds the user who created it to it.
 * @param {Object} params - Parameters.
 * @param {Object} params.room - New room.
 * @param {Object} params.userId - ID of the user who is creating the new room.
 * @param {Object} params.io - Socket.io. Used if socket isn't set.
 * @param {Object} params.options - Update options.
 * @param {Function} params.callback - callback.
 * @param {Object} [params.socket] - Socket io.
 */
function createRoom({
  room,
  userId,
  options,
  token,
  socket,
  io,
  callback,
}) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.CreateRoom.name,
    matchToId: userId,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      } else if (!objectValidator.isValidData({ room }, { room: { roomName: true } })) {
        callback({ error: new errorCreator.InvalidData({ expected: '{ room: { roomName } }' }) });

        return;
      } else if (room.roomName.length > appConfig.roomNameMaxLength || !textTools.hasAllowedText(room.roomName)) {
        callback({ error: new errorCreator.InvalidCharacters({ expected: 'a-z 0-9 length: 10' }) });

        return;
      } else if (dbConfig.protectedRoomNames.indexOf(room.roomName.toLowerCase()) > -1) {
        callback({ error: new errorCreator.InvalidCharacters({ expected: 'not protected words' }) });

        return;
      } else if (!authenticator.isAllowedAccessLevel({ objectToCreate: room, toAuth: data.user })) {
        callback({ error: new errorCreator.NotAllowed({ name: 'too high access level or visibility' }) });

        return;
      }

      const newRoom = room;
      const authUser = data.user;
      newRoom.ownerId = authUser.userId;

      dbRoom.createRoom({
        room,
        options,
        callback: (roomData) => {
          if (roomData.error) {
            callback({ error: roomData.error });

            return;
          }

          const createdRoom = roomData.data.room;
          const { visibility } = createdRoom;
          const dataToSend = {
            data: {
              room: roomData.data.room,
              changeType: dbConfig.ChangeTypes.CREATE,
            },
          };

          if (socket) {
            socket.join(createdRoom.roomId);
            socket.broadcast.to(visibility.toString()).emit(dbConfig.EmitTypes.ROOM, dataToSend);
          } else {
            const userSocket = socketUtils.getUserSocket({ io, socketId: authUser.socketId });

            if (userSocket) { userSocket.join(createdRoom.roomId); }

            io.to(visibility.toString()).emit(dbConfig.EmitTypes.ROOM, dataToSend);
          }

          callback(dataToSend);
        },
      });
    },
  });
}

/**
 * Is the room protected? Protected rooms should not be unfollowed.
 * @param {Object} params - Parameters.
 * @param {string} params.roomId - ID of the room.
 * @param {Object} [params.socket] - Socket.io.
 * @return {boolean} - Is the room protected?
 */
function isProtectedRoom({ roomId, socket }) {
  const deviceRegExp = new RegExp(`^${dbConfig.deviceRoomPrepend}`);

  return !dbConfig.requiredRooms.includes(roomId) && (socket && roomId !== socket.id) && roomId.match(deviceRegExp);
}

/**
 * Leave all rooms, except the required ones, on the socket
 * @param {Object} socket - Socket.io socket
 */
function leaveSocketRooms(socket) {
  Object.keys(socket.rooms).forEach((roomId) => {
    if (!isProtectedRoom(socket)) {
      socket.leave(roomId);
    }
  });
}

/**
 * Follow room and update user's access to it.
 * @param {Object} params - Parameters.
 * @param {string} params.userId - ID that will start following the room.
 * @param {string} params.roomId - ID of the room to follow.
 * @param {Function} params.callback - Callback.
 * @param {Object} params.io - Socket.io. Used if socket is not set.
 * @param {Object} params.user - User trying to follow a room.
 * @param {Object} [params.socket] - Socket.io socket.
 */
function follow({
  userId,
  user,
  roomId,
  socket,
  io,
  callback,
}) {
  dbRoom.addAccess({
    roomId,
    userIds: [userId],
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const toReturn = {
        data: {
          user: { userId },
          room: data.room,
          changeType: dbConfig.ChangeTypes.CREATE,
        },
      };
      const toSend = {
        data: {
          user: { userId },
          room: { roomId },
          changeType: dbConfig.ChangeTypes.CREATE,
        },
      };

      if (socket) {
        socket.join(roomId);
        socket.broadcast.to(roomId).emit(dbConfig.EmitTypes.FOLLOWER, toSend);
      } else {
        const userSocket = socketUtils.getUserSocket({ io, socketId: user.socketId });

        if (userSocket) { userSocket.join(roomId); }

        io.to(userId).emit(dbConfig.EmitTypes.FOLLOW, toReturn);
        io.to(roomId).emit(dbConfig.EmitTypes.FOLLOWER, toSend);
      }

      callback(toReturn);
    },
  });
}

/**
 * Unfollow room and update user's access to it.
 * @param {Object} params - Parameters.
 * @param {string} params.userId - ID that will unfollow the room.
 * @param {string} params.roomId - ID of the room to unfollow.
 * @param {Function} params.callback - Callback.
 * @param {Object} params.io - Socket.io. Used if socket is not set.
 * @param {Object} params.user - User trying to unfollow a room.
 * @param {Object} [params.socket] - Socket.io socket.
 */
function unfollow({
  userId,
  user,
  roomId,
  socket,
  io,
  callback,
}) {
  const toSend = {
    data: {
      user: { userId },
      room: { roomId },
      changeType: dbConfig.ChangeTypes.REMOVE,
    },
  };

  if (socket) {
    socket.join(roomId);
    socket.broadcast.to(roomId).emit(dbConfig.EmitTypes.FOLLOWER, toSend);
  } else {
    if (user.socketId) {
      const userSocket = socketUtils.getUserSocket({ io, socketId: user.socketId });

      if (userSocket) { userSocket.join(roomId); }
    }

    io.to(userId).emit(dbConfig.EmitTypes.FOLLOW, toSend);
    io.to(roomId).emit(dbConfig.EmitTypes.FOLLOWER, toSend);
  }

  callback(toSend);
}

/**
 * Follow a new room on the user.
 * @param {Object} params - Parameters.
 * @param {string} params.roomId - Id of the room to follow.
 * @param {Function} params.callback - Callback.
 * @param {Object} params.io - Socket.io. Used if socket is not set.
 * @param {string} [params.aliasId] - Id of the alias that the user is using to follow the room.
 * @param {Object} [params.socket] - Socket.io socket.
 * @param {string} [params.password] - Password to the room.
 */
function followRoom({
  token,
  socket,
  io,
  roomId,
  password,
  callback,
  userId,
  aliasId,
}) {
  authenticator.isUserAllowed({
    token,
    matchToId: userId,
    commandName: dbConfig.apiCommands.FollowRoom.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const { user } = data;

      const roomCallback = () => {
        getAccessibleRoom({
          roomId,
          password,
          user,
          callback: (accessData) => {
            if (accessData.error) {
              callback({ error: accessData.error });

              return;
            }

            follow({
              roomId,
              socket,
              io,
              callback,
              user,
              userId: aliasId || userId,
            });
          },
        });
      };

      if (aliasId) {
        aliasManager.getAccessibleAlias({
          aliasId,
          user,
          callback: ({ error: aliasError }) => {
            if (aliasError) {
              callback({ error: aliasError });

              return;
            }

            roomCallback();
          },
        });

        return;
      }

      roomCallback();
    },
  });
}

/**
 * Unfollow room.
 * @param {Object} params - Parameters.
 * @param {Object} params.userId - ID of the user that is unfollowing a room.
 * @param {Object} params.roomId - ID of the room to unfollow.
 * @param {Function} params.callback - Callback.
 * @param {Object} params.io - Socket io. Will be used if socket is not set.
 * @param {Object} [params.socket] - Socket.io.
 * @param {string} [params.aliasId] - ID of the alias that the user is using to unfollow the room.
 */
function unfollowRoom({
  token,
  socket,
  io,
  roomId,
  callback,
  userId,
  aliasId,
}) {
  authenticator.isUserAllowed({
    token,
    matchToId: userId,
    commandName: dbConfig.apiCommands.UnfollowRoom.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      } else if (isProtectedRoom({ roomId, socket })) {
        callback({ error: new errorCreator.NotAllowed({ name: 'unfollow protected room' }) });

        return;
      }

      const authUser = data.user;

      const roomCallback = () => {
        dbRoom.removeAccess({
          roomId,
          userIds: [userId],
          callback: () => {
            if (error) {
              callback({ error });

              return;
            }

            unfollow({
              roomId,
              socket,
              io,
              callback,
              userId: aliasId || userId,
              user: authUser,
            });
          },
        });
      };

      if (aliasId) {
        aliasManager.getAccessibleAlias({
          aliasId,
          user: authUser,
          callback: ({ error: aliasError }) => {
            if (aliasError) {
              callback({ error: aliasError });

              return;
            }

            roomCallback();
          },
        });

        return;
      }

      roomCallback();
    },
  });
}

/**
 * Get room.
 * @param {Object} params - Parameters.
 * @param {string} params.token - jwt.
 * @param {string} params.roomId - ID of the room to retrieve.
 * @param {string} params.userId - ID of the user retrieving the room.
 * @param {Function} params.callback - Callback.
 */
function getRoom({
  token,
  roomId,
  userId,
  callback,
}) {
  authenticator.isUserAllowed({
    token,
    matchToId: userId,
    commandName: dbConfig.apiCommands.GetRoom.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      getAccessibleRoom({
        roomId,
        callback,
        user: data.user,
      });
    },
  });
}

/**
 * Get all the rooms that the user has access to, either directly or through the teams that the user is part of.
 * @param {Object} params - Parameters.
 * @param {string} params.token - jwt.
 * @param {string} params.userId - ID of the user that is retrieving the rooms.
 * @param {Function} params.callback - Callback.
 */
function getRoomsByUser({ token, userId, callback }) {
  authenticator.isUserAllowed({
    token,
    matchToId: userId,
    commandName: dbConfig.apiCommands.GetRoom.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      dbRoom.getRoomsByUser({
        callback,
        user: data.user,
      });
    },
  });
}

/**
 * Get all the rooms followed by the users.
 * @param {Object} params - Parameters.
 * @param {string} params.token - jwt.
 * @param {string} params.userId - ID of the user that is retrieving the rooms.
 * @param {Function} params.callback - Callback.
 */
function getFollowedRooms({ token, userId, callback }) {
  authenticator.isUserAllowed({
    token,
    matchToId: userId,
    commandName: dbConfig.apiCommands.GetRoom.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      dbRoom.getRoomsByIds({
        callback,
        roomIds: data.user.followingRooms,
      });
    },
  });
}

/**
 * Get all rooms.
 * @param {Object} params - Parameters.
 * @param {string} params.token - jwt.
 * @param {Function} params.callback Callback.
 */
function getAllRooms({ token, callback }) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.GetAll.name,
    callback: ({ error }) => {
      if (error) {
        callback({ error });

        return;
      }

      dbRoom.getAllRooms({ callback });
    },
  });
}

/**
 * Remove room.
 * @param {Object} params - Parameters.
 * @param {string} params.token - jwt.
 * @param {string} params.roomId - ID of the room to remove.
 * @param {string} params.userId - ID of the user trying to remove the room.
 * @param {Object} params.io - Socket.io. Will be used if socket is not set.
 * @param {Function} params.callback - Callback
 * @param {Object} [params.socket] - Socket.io.
 */
function removeRoom({
  token,
  roomId,
  userId,
  socket,
  io,
  callback,
}) {
  authenticator.isUserAllowed({
    token,
    matchToId: userId,
    commandName: dbConfig.apiCommands.RemoveRoom.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      } else if (isProtectedRoom({ roomId, socket })) {
        callback({ error: new errorCreator.NotAllowed({ name: `remove protected room ${roomId}` }) });

        return;
      }

      getAccessibleRoom({
        roomId,
        shouldBeAdmin: true,
        user: data.user,
        callback: ({ error: accessError }) => {
          if (accessError) {
            callback({ error: accessError });

            return;
          }

          dbRoom.removeRoom({
            roomId,
            fullRemoval: true,
            callback: () => {
              const dataToSend = {
                data: {
                  room: { roomId },
                  changeType: dbConfig.ChangeTypes.RemoveRoom,
                },
              };

              socketUtils.getSocketsByRoom({ io, roomId }).forEach((roomSocket) => {
                roomSocket.leave(roomId);
              });

              if (socket) {
                socket.broadcast.emit(dbConfig.EmitTypes.ROOM, dataToSend);
              } else {
                io.emit(dbConfig.EmitTypes.ROOM, dataToSend);
              }

              callback(dataToSend);
            },
          });
        },
      });
    },
  });
}

/**
 * Update room.
 * @param {Object} params - Parameters.
 * @param {Object} params.room - Room.
 * @param {string} params.roomId - ID of the room to update.
 * @param {Object} params.options - Update options.
 * @param {Function} params.callback - Callback.
 * @param {Object} params.io - Socket io. Will be used if socket is not set.
 * @param {Object} [params.socket] - Socket io.
 */
function updateRoom({
  token,
  room,
  roomId,
  options,
  callback,
  socket,
  io,
}) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.UpdateRoom.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      getAccessibleRoom({
        roomId,
        shouldBeAdmin: true,
        user: data.user,
        errorContentText: `update room id ${roomId}`,
        callback: (roomData) => {
          if (roomData.error) {
            callback({ error: roomData.error });

            return;
          }

          dbRoom.updateRoom({
            options,
            room,
            roomId,
            callback: (updateData) => {
              if (updateData.error) {
                callback({ error: updateData.error });

                return;
              }

              const updatedRoom = updateData.data.room;
              const { visibility } = updatedRoom;
              const dataToSend = {
                data: {
                  room: updatedRoom,
                  changeType: dbConfig.ChangeTypes.UPDATE,
                },
              };

              if (socket) {
                socket.broadcast.to(visibility.toString()).to(updatedRoom.roomId).emit(dbConfig.EmitTypes.ROOM, dataToSend);
              } else {
                io.to(visibility.toString()).to(updatedRoom.roomId).emit(dbConfig.EmitTypes.ROOM, dataToSend);
              }

              callback(dataToSend);
            },
          });
        },
      });
    },
  });
}

exports.createRoom = createRoom;
exports.updateRoom = updateRoom;
exports.removeRoom = removeRoom;
exports.addAccess = addAccess;
exports.removeAccess = removeAccess;
exports.getRoom = getRoom;
exports.unfollowRoom = unfollowRoom;
exports.leaveSocketRooms = leaveSocketRooms;
exports.followRoom = followRoom;
exports.getWhisperRoom = getWhisperRoom;
exports.getAccessibleRoom = getAccessibleRoom;
exports.createAndFollowWhisperRoom = createAndFollowWhisperRoom;
exports.getAllRooms = getAllRooms;
exports.getRoomsByUser = getRoomsByUser;
exports.getFollowedRooms = getFollowedRooms;
