/*
 Copyright 2017 Carmilla Mina Jankovic

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

const { appConfig, dbConfig } = require('../config/defaults/config');
const errorCreator = require('../error/errorCreator');
const textTools = require('../utils/textTools');
const objectValidator = require('../utils/objectValidator');
const authenticator = require('../helpers/authenticator');
const dbRoom = require('../db/connectors/room');
const socketUtils = require('../utils/socketIo');
const dbUser = require('../db/connectors/user');
const managerHelper = require('../helpers/manager');

/**
 * Get room by Id or name.
 * @param {Object} params - Parameter.
 * @param {string} params.token - jwt.
 * @param {Function} params.callback - Callback.
 * @param {string} [params.roomId] - Id of the room.
 * @param {string} [params.roomName] - Name of the room.
 * @param {string} [params.password] - Password for the room.
 * @param {Object} [params.internalCallUser] - User to use on authentication. It will bypass token authentication.
 */
function getRoomById({
  token,
  roomId,
  roomName,
  password,
  callback,
  internalCallUser,
  needsAccess,
}) {
  managerHelper.getObjectById({
    token,
    internalCallUser,
    callback,
    needsAccess,
    objectId: roomId,
    searchParams: [{
      paramValue: roomName,
      paramName: 'roomName',
    }, {
      paramValue: password,
      paramName: 'password',
    }],
    objectType: 'room',
    objectIdType: 'roomId',
    dbCallFunc: dbRoom.getRoomById,
    commandName: dbConfig.apiCommands.GetRoom.name,
  });
}

/**
 * Update access to the room for users or teams.
 * @param {Object} params - Parameters.
 * @param {string} params.roomId - Id of the room.
 * @param {Function} params.callback - Callback.
 * @param {boolean} [params.shouldRemove] - Should access be removed from the users or teams?
 * @param {string[]} [params.userIds] - Id of the users.
 * @param {string[]} [params.teamIds] - Id of the teams.
 * @param {string[]} [params.bannedIds] - Id of the blocked Ids to add.
 * @param {string[]} [params.teamAdminIds] - Id of the teams to change admin access for.
 * @param {string[]} [params.userAdminIds] - Id of the users to change admin access for.
 */
function updateAccess({
  token,
  roomId,
  teamAdminIds,
  userAdminIds,
  userIds,
  teamIds,
  bannedIds,
  shouldRemove,
  internalCallUser,
  callback,
}) {
  authenticator.isUserAllowed({
    token,
    internalCallUser,
    commandName: dbConfig.apiCommands.UpdateRoom.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const { user: authUser } = data;

      getRoomById({
        roomId,
        internalCallUser: authUser,
        callback: ({ error: roomError, data: roomData }) => {
          if (roomError) {
            callback({ error: roomError });

            return;
          }

          const { room } = roomData;

          const {
            hasFullAccess,
          } = authenticator.hasAccessTo({
            objectToAccess: room,
            toAuth: authUser,
          });

          if (!hasFullAccess) {
            callback({ error: new errorCreator.NotAllowed({ name: `update room ${roomId}` }) });

            return;
          }

          dbRoom.updateAccess({
            shouldRemove,
            userIds,
            teamIds,
            bannedIds,
            teamAdminIds,
            userAdminIds,
            roomId,
            callback,
          });
        },
      });
    },
  });
}

/**
 * Create a whisper room and give access to the participants.
 * @param {Object} params - Parameters.
 * @param {string[]} params.participantIds - User Ids of the users send private messages to each other.
 * @param {Function} params.callback - Callback.
 * @param {Object} params.io - Socket.io.
 */
function createAndFollowWhisperRoom({
  participantIds,
  callback,
  io,
  user,
}) {
  const room = {
    participantIds,
    roomName: participantIds.join(''),
    isWhisper: true,
    accessLevel: dbConfig.AccessLevels.SUPERUSER,
    visibility: dbConfig.AccessLevels.SUPERUSER,
  };

  const followCallback = ({ users = [] }) => {
    if (users.length === 0) {
      callback({ error: new errorCreator.DoesNotExist({ name: `create and follow whisper room. User/Alias Id ${participantIds[1]} does not exist.` }) });

      return;
    }

    dbRoom.createRoom({
      room,
      skipExistsCheck: true,
      callback: (roomData) => {
        if (roomData.error) {
          callback({ error: roomData.error });

          return;
        }
        const { objectId: roomId } = roomData.data.room;

        dbRoom.updateAccess({
          roomId,
          userIds: participantIds,
          callback: (accessdata) => {
            if (accessdata.error) {
              callback({ error: accessdata.error });

              return;
            }

            dbUser.followRoom({
              roomId,
              userIds: [user.objectId],
              callback: (senderFollowData) => {
                if (senderFollowData.error) {
                  callback({ error: senderFollowData.error });

                  return;
                }

                dbUser.followRoom({
                  roomId,
                  userIds: users.map(foundUser => foundUser.objectId),
                  callback: (receiverFollowData) => {
                    if (receiverFollowData.error) {
                      callback({ error: receiverFollowData.error });

                      return;
                    }

                    const newRoom = accessdata.data.room;
                    const newRoomId = newRoom.objectId;
                    const dataToSend = {
                      data: {
                        room: newRoom,
                        changeType: dbConfig.ChangeTypes.CREATE,
                      },
                    };

                    users.forEach((foundUser) => {
                      const receiverSocket = socketUtils.getUserSocket({ io, socketId: foundUser.socketId });

                      if (receiverSocket) {
                        receiverSocket.join(newRoomId);
                      }
                    });

                    const senderSocket = socketUtils.getUserSocket({ io, socketId: user.socketId });

                    if (senderSocket) {
                      senderSocket.join(newRoomId);
                    }

                    io.to(newRoomId).emit(dbConfig.EmitTypes.ROOM, dataToSend);

                    callback(roomData);
                  },
                });
              },
            });
          },
        });
      },
    });
  };

  dbUser.getUserById({
    userId: participantIds[1],
    supressExistError: true,
    callback: ({ error: userError, data: userData }) => {
      if (userError) {
        if (userError.type && userError.type === errorCreator.ErrorTypes.DOESNOTEXIST) {
          dbUser.getUsersByAlias({
            aliasId: participantIds[1],
            callback: ({ error: aliasError, data: aliasData }) => {
              if (aliasError) {
                callback({ error: aliasError });

                return;
              }

              const { users } = aliasData;

              followCallback({ users });
            },
          });

          return;
        }

        callback({ error: userError });

        return;
      }

      const { user: foundUser } = userData;

      followCallback({ users: [foundUser] });
    },
  });
}

/**
 * Retrieve whisper room.
 * @param {Object} params - Parameters.
 * @param {string[]} params.participantIds - Ids of the users.
 * @param {Function} params.callback - Callback.
 */
function getWhisperRoom({ participantIds, callback }) {
  dbRoom.getWhisperRoom({
    participantIds,
    callback,
  });
}

/**
 * Does the whisper room exist?
 * @param {Object} params - Parameters.
 * @param {string[]} participantIds - Ids of the users.
 * @param {Function} callback - Callback.
 */
function doesWhisperRoomExist({ participantIds, callback }) {
  dbRoom.doesWhisperRoomExist({
    participantIds,
    callback,
  });
}

/**
 * Creates a new chat room and adds the user who created it to it.
 * @param {Object} params - Parameters.
 * @param {Object} params.room - New room.
 * @param {Object} params.io - Socket.io. Used if socket isn't set.
 * @param {Object} params.options - Update options.
 * @param {Function} params.callback - callback.
 * @param {Object} [params.socket] - Socket io.
 */
function createRoom({
  room,
  options,
  token,
  socket,
  io,
  callback,
}) {
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
      const { user } = data;
      newRoom.ownerId = user.objectId;
      newRoom.password = newRoom.password && newRoom.password !== '' ?
        newRoom.password :
        undefined;

      dbRoom.createRoom({
        room,
        options,
        callback: ({ error: roomError, data: roomData }) => {
          if (roomError) {
            callback({ error: roomError });

            return;
          }

          const createdRoom = roomData.room;
          const dataToSend = {
            data: {
              room: createdRoom,
              changeType: dbConfig.ChangeTypes.CREATE,
            },
          };

          if (socket) {
            socket.join(createdRoom.objectId);
            socket.broadcast.emit(dbConfig.EmitTypes.ROOM, dataToSend);
          } else {
            const userSocket = socketUtils.getUserSocket({ io, socketId: user.socketId });

            if (userSocket) { userSocket.join(createdRoom.objectId); }

            io.emit(dbConfig.EmitTypes.ROOM, dataToSend);
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
 * @param {string} params.roomId - Id of the room.
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
    if (!isProtectedRoom({ roomId, socket })) {
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
 */
function follow({
  userId,
  aliasId,
  user,
  roomId,
  io,
  callback,
}) {
  const idToAdd = aliasId || userId;

  dbRoom.updateAccess({
    roomId,
    userIds: [idToAdd],
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      dbRoom.addFollowers({
        roomId,
        userIds: [idToAdd],
        callback: (followerData) => {
          if (followerData.error) {
            callback({ error: followerData.error });

            return;
          }

          dbUser.followRoom({
            roomId,
            userIds: [idToAdd],
            callback: (followData) => {
              if (followData.error) {
                callback({ error: followData.error });

                return;
              }

              const toReturn = {
                data: {
                  user: { objectId: idToAdd },
                  room: data.room,
                  changeType: dbConfig.ChangeTypes.CREATE,
                },
              };
              const toSend = {
                data: {
                  user: { objectId: idToAdd },
                  room: { objectId: roomId },
                  changeType: dbConfig.ChangeTypes.CREATE,
                },
              };

              const userSocket = socketUtils.getUserSocket({ io, socketId: user.socketId });

              if (userSocket) { userSocket.join(roomId); }

              if (aliasId) {
                io.in(aliasId).clients((ioError, clients) => {
                  if (ioError) {
                    console.log(`Failed to emit follow alias id to room ${roomId}`, ioError);

                    return;
                  }

                  clients.map(socketId => io.sockets.connected[socketId]).forEach((socket) => {
                    socket.join(roomId);
                  });
                });
              }

              io.to(idToAdd).emit(dbConfig.EmitTypes.FOLLOW, toReturn);
              io.to(roomId).emit(dbConfig.EmitTypes.FOLLOWER, toSend);

              callback(toReturn);
            },
          });
        },
      });
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
      user: { objectId: userId },
      room: { objectId: roomId },
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
  aliasId,
}) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.FollowRoom.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const { user: authUser } = data;

      if (aliasId && !authUser.aliases.includes(aliasId)) {
        callback({ error: new errorCreator.NotAllowed(`follow room ${roomId} with alias ${aliasId}`) });

        return;
      }

      getRoomById({
        roomId,
        password,
        internalCallUser: authUser,
        callback: ({ error: getError }) => {
          if (getError) {
            callback({ error: getError });

            return;
          }

          follow({
            roomId,
            socket,
            io,
            callback,
            aliasId,
            user: authUser,
            userId: authUser.objectId,
          });
        },
      });
    },
  });
}

/**
 * Unfollow room.
 * @param {Object} params - Parameters.
 * @param {Object} params.roomId - Id of the room to unfollow.
 * @param {Function} params.callback - Callback.
 * @param {Object} params.io - Socket io. Will be used if socket is not set.
 * @param {Object} [params.socket] - Socket.io.
 * @param {string} [params.aliasId] - Id of the alias that the user is using to unfollow the room.
 */
function unfollowRoom({
  token,
  socket,
  io,
  roomId,
  callback,
  aliasId,
}) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.UnfollowRoom.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      } else if (isProtectedRoom({ roomId, socket })) {
        callback({ error: new errorCreator.NotAllowed({ name: `unfollow protected room ${roomId}` }) });

        return;
      }

      const { user: authUser } = data.user;

      if (aliasId && !authUser.aliases.includes(aliasId)) {
        callback({ error: new errorCreator.NotAllowed({ name: `unfollow room ${roomId} with alias ${aliasId}` }) });

        return;
      }

      dbRoom.updateAccess({
        roomId,
        userIds: [aliasId || authUser.objectId],
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
            user: authUser,
            userId: aliasId || authUser.objectId,
          });
        },
      });
    },
  });
}

/**
 * Get rooms that the user has access to.
 * @param {Object} params - Parameters.
 * @param {string} params.token - jwt.
 * @param {Function} params.callback - Callback.
 */
function getRoomsByUser({
  token,
  callback,
}) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.GetRoom.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const { user: authUser } = data;

      dbRoom.getRoomsByUser({
        user: authUser,
        callback: ({ error: getError, data: getData }) => {
          if (getError) {
            callback({ error: getError });

            return;
          }

          const { rooms } = getData;
          const allRooms = rooms.map((room) => {
            const { hasFullAccess } = authenticator.hasAccessTo({
              toAuth: authUser,
              objectToAccess: room,
            });

            if (!hasFullAccess) {
              return managerHelper.stripObject({ object: room });
            }

            return room;
          }).sort((a, b) => {
            const aName = a.roomName;
            const bName = b.roomName;

            if (aName < bName) {
              return -1;
            } else if (aName > bName) {
              return 1;
            }

            return 0;
          });

          callback({ data: { rooms: allRooms } });
        },
      });
    },
  });
}

/**
 * Get all the rooms followed by the user.
 * @param {Object} params - Parameters.
 * @param {string} params.token - jwt.
 * @param {Function} params.callback - Callback.
 */
function getFollowedRooms({ token, callback }) {
  authenticator.isUserAllowed({
    token,
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
function getAllRooms({
  token,
  internalCallUser,
  callback,
}) {
  authenticator.isUserAllowed({
    token,
    internalCallUser,
    commandName: dbConfig.apiCommands.GetFull.name,
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
 * @param {string} params.roomId - Id of the room to remove.
 * @param {Object} params.io - Socket.io. Will be used if socket is not set.
 * @param {Function} params.callback - Callback
 * @param {Object} [params.socket] - Socket.io.
 */
function removeRoom({
  token,
  roomId,
  socket,
  io,
  callback,
}) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.RemoveRoom.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      } else if (isProtectedRoom({ roomId, socket })) {
        callback({ error: new errorCreator.NotAllowed({ name: `remove protected room ${roomId}` }) });

        return;
      }

      const { user: authUser } = data;

      getRoomById({
        roomId,
        internalCallUser: authUser,
        callback: ({ error: getError, data: getData }) => {
          if (getError) {
            callback({ error: getError });

            return;
          }

          const { room: foundRoom } = getData;

          const {
            hasFullAccess,
          } = authenticator.hasAccessTo({
            objectToAccess: foundRoom,
            toAuth: authUser,
          });

          if (!hasFullAccess) {
            callback({ error: new errorCreator.NotAllowed({ name: `remove room ${roomId}` }) });

            return;
          }

          dbRoom.removeRoom({
            roomId,
            fullRemoval: true,
            callback: ({ error: removeError }) => {
              if (removeError) {
                callback({ error: removeError });

                return;
              }

              const dataToSend = {
                data: {
                  room: { objectId: roomId },
                  changeType: dbConfig.ChangeTypes.REMOVE,
                },
              };

              socketUtils.getSocketsByRoom({ io, roomId }).forEach((roomSocket) => {
                roomSocket.leave(roomId);
              });

              io.emit(dbConfig.EmitTypes.ROOM, dataToSend);

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
 * @param {Object} params.io - Socket io.
 */
function updateRoom({
  token,
  room,
  roomId,
  options,
  callback,
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

      const { user: authUser } = data;

      getRoomById({
        roomId,
        internalCallUser: authUser,
        callback: ({ error: getError, data: getData }) => {
          if (getError) {
            callback({ error: getError });

            return;
          }

          const { room: foundRoom } = getData;
          const {
            hasFullAccess,
          } = authenticator.hasAccessTo({
            objectToAccess: foundRoom,
            toAuth: authUser,
          });

          if (!hasFullAccess) {
            callback({ error: new errorCreator.NotAllowed({ name: `update room ${roomId}` }) });

            return;
          }

          dbRoom.updateRoom({
            options,
            room,
            roomId,
            callback: ({ error: updateError, data: updateData }) => {
              if (updateError) {
                callback({ error: updateError });

                return;
              }

              const { room: updatedRoom } = updateData;
              const dataToSend = {
                data: {
                  room: managerHelper.stripObject({ object: Object.assign({}, updatedRoom) }),
                  changeType: dbConfig.ChangeTypes.UPDATE,
                },
              };
              const creatorDataToSend = {
                data: {
                  room: updatedRoom,
                  changeType: dbConfig.ChangeTypes.UPDATE,
                },
              };

              io.emit(dbConfig.EmitTypes.ROOM, dataToSend);
              io.to(roomId).emit(dbConfig.EmitTypes.ROOM, creatorDataToSend);

              callback(creatorDataToSend);
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
exports.updateAccess = updateAccess;
exports.getRoomById = getRoomById;
exports.unfollowRoom = unfollowRoom;
exports.leaveSocketRooms = leaveSocketRooms;
exports.followRoom = followRoom;
exports.getWhisperRoom = getWhisperRoom;
exports.createAndFollowWhisperRoom = createAndFollowWhisperRoom;
exports.getAllRooms = getAllRooms;
exports.getRoomsByUser = getRoomsByUser;
exports.getFollowedRooms = getFollowedRooms;
exports.doesWhisperRoomExist = doesWhisperRoomExist;
