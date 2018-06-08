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

const { appConfig, dbConfig } = require('../config/defaults/config');
const errorCreator = require('../error/errorCreator');
const textTools = require('../utils/textTools');
const objectValidator = require('../utils/objectValidator');
const authenticator = require('../helpers/authenticator');
const dbRoom = require('../db/connectors/room');
const aliasManager = require('./aliases');
const socketUtils = require('../utils/socketIo');
const dbUser = require('../db/connectors/user');

/**
 * Create a whisper room and give access to the participants.
 * @param {Object} params - Parameters.
 * @param {string[]} params.participantIds - User Ids of the users send private messages to each other.
 * @param {Function} params.callback - Callback.
 * @param {Object} params.socket - Socket.io.
 * @param {Object} params.io - Socket.io. Used if socket is not set.
 */
function createAndFollowWhisperRoom({
  participantIds,
  callback,
  socket,
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

  dbRoom.createRoom({
    room,
    skipExistsCheck: true,
    callback: (roomData) => {
      if (roomData.error) {
        callback({ error: roomData.error });

        return;
      }
      const { objectId: roomId } = roomData.data.room;

      dbRoom.addAccess({
        roomId,
        userIds: participantIds,
        callback: (accessdata) => {
          if (accessdata.error) {
            callback({ error: accessdata.error });

            return;
          }

          dbUser.followRoom({
            roomId,
            userId: user.objectId,
            callback: (senderFollowData) => {
              if (senderFollowData.error) {
                callback({ error: senderFollowData.error });

                return;
              }

              dbUser.getUserById({
                userId: participantIds[1],
                aliasId: participantIds[1],
                callback: (identityData) => {
                  if (identityData.error) {
                    callback({ error: identityData.error });

                    return;
                  }

                  const { alias: identityAlias, user: identityUser } = identityData.data;
                  const identityId = identityUser ? identityUser.objectId : identityAlias.ownerId;

                  dbUser.followRoom({
                    roomId,
                    userId: identityId,
                    callback: () => {
                      const newRoom = accessdata.data.room;
                      const newRoomId = newRoom.objectId;
                      const senderId = user.objectId;
                      const receiverId = identityId;
                      const dataToSend = {
                        data: {
                          room: {
                            objectId: newRoomId,
                            isWhisper: true,
                            participantIds: newRoom.participantIds,
                          },
                          changeType: dbConfig.ChangeTypes.CREATE,
                        },
                      };

                      const receiverSocket = socketUtils.getUserSocket({ io, socketId: receiverId });

                      if (receiverSocket) { receiverSocket.join(newRoomId); }

                      if (socket) {
                        socket.join(newRoomId);
                      } else {
                        const senderSocket = socketUtils.getUserSocket({ io, socketId: senderId });

                        if (senderSocket) { senderSocket.join(newRoomId); }
                      }

                      io.to(senderId).emit(dbConfig.EmitTypes.ROOM, dataToSend);
                      io.to(receiverId).emit(dbConfig.EmitTypes.ROOM, dataToSend);
                    },
                  });
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
 * Get room by Id and check if the user has access to it.
 * @param {Object} params - Parameters.
 * @param {Object} params.user - User retrieving the room.
 * @param {string} params.roomId - Id of the room to retrieve.
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
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const { room } = data;

      if (!room.isSystemRoom && !authenticator.hasAccessTo({
        shouldBeAdmin,
        toAuth: user,
        objectToAccess: room,
      }) && (!room.password || !password || room.password !== password)) {
        callback({ error: new errorCreator.NotAllowed({ name: errorContentText }) });

        return;
      }

      callback({ data: { room } });
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
  teamAdminIds,
  userAdminIds,
  userIds,
  teamIds,
  bannedIds,
  callback,
}) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.UpdateRoom.name,
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
  teamAdminIds,
  userAdminIds,
  userIds,
  teamIds,
  bannedIds,
  callback,
}) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.UpdateRoom.name,
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
          } else {
            const userSocket = socketUtils.getUserSocket({ io, socketId: user.socketId });

            if (userSocket) { userSocket.join(createdRoom.objectId); }
          }

          io.to(dbConfig.rooms.public.objectId).emit(dbConfig.EmitTypes.ROOM, dataToSend);

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

      dbRoom.addFollowers({
        roomId,
        userIds: [userId],
        callback: (followerData) => {
          if (followerData.error) {
            callback({ error: followerData.error });

            return;
          }

          console.log('follower func done', userId, roomId);

          dbUser.followRoom({
            roomId,
            userId,
            callback: (followData) => {
              if (followData.error) {
                callback({ error: followData.error });

                return;
              }

              console.log('follow room func done', userId, roomId);

              const toReturn = {
                data: {
                  user: { objectId: userId },
                  room: data.room,
                  changeType: dbConfig.ChangeTypes.CREATE,
                },
              };
              const toSend = {
                data: {
                  user: { objectId: userId },
                  room: { objectId: roomId },
                  changeType: dbConfig.ChangeTypes.CREATE,
                },
              };

              if (socket) {
                socket.join(roomId);
              } else {
                const userSocket = socketUtils.getUserSocket({ io, socketId: user.socketId });

                if (userSocket) { userSocket.join(roomId); }
              }

              io.to(userId).emit(dbConfig.EmitTypes.FOLLOW, toReturn);
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
              userId: aliasId || user.objectId,
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
        callback({ error: new errorCreator.NotAllowed({ name: 'unfollow protected room' }) });

        return;
      }

      const { user } = data.user;

      const roomCallback = () => {
        dbRoom.removeAccess({
          roomId,
          userIds: [user.objectId],
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
              user,
              userId: aliasId || user.objectId,
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
 * Get room.
 * @param {Object} params - Parameters.
 * @param {string} params.token - jwt.
 * @param {string} params.roomId - Id of the room to retrieve.
 * @param {Function} params.callback - Callback.
 * @param {boolean} [params.full] - Full.
 */
function getRoom({
  token,
  roomId,
  full,
  callback,
}) {
  authenticator.isUserAllowed({
    token,
    commandName: full ? dbConfig.apiCommands.GetFull.name : dbConfig.apiCommands.GetRoom.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const { user } = data;

      getAccessibleRoom({
        roomId,
        callback,
        user,
        full,
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
  full,
  token,
  callback,
}) {
  authenticator.isUserAllowed({
    token,
    commandName: full ? dbConfig.apiCommands.GetFull.name : dbConfig.apiCommands.GetRoom.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const { user } = data;

      dbRoom.getRoomsByUser({
        callback,
        user,
        full,
      });
    },
  });
}

/**
 * Get a list of rooms that the user has access to.
 * @param {Object} params - Parameters.
 * @param {string} params.token - jwt.
 * @param {Function} params.callback - Callback.
 */
function getRoomsList({ token, callback }) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.GetRoom.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const { user } = data;

      dbRoom.getAllRooms({
        user,
        callback: ({ error: roomsError, data: roomsData }) => {
          if (roomsError) {
            callback({ error: roomsError });

            return;
          }

          const { rooms } = roomsData;
          const modifiedRooms = rooms.map((room) => {
            const newRoom = {
              roomId: room.objectId,
              roomName: room.roomName,
              ownerId: room.ownerAliasId || room.ownerId,
            };

            if (room.isPublic || authenticator.hasAccessTo({
              objectToAccess: room,
              toAuth: user,
            })) {
              newRoom.followers = room.followers;
            }

            return newRoom;
          });

          callback({ data: { rooms: modifiedRooms } });
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
function getAllRooms({ token, callback }) {
  authenticator.isUserAllowed({
    token,
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

      const { user } = data;

      getAccessibleRoom({
        roomId,
        user,
        shouldBeAdmin: true,
        callback: ({ error: accessError }) => {
          if (accessError) {
            callback({ error: accessError });

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

      const { user } = data;

      getAccessibleRoom({
        roomId,
        user,
        shouldBeAdmin: true,
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
              const dataToSend = {
                data: {
                  room: updatedRoom,
                  changeType: dbConfig.ChangeTypes.UPDATE,
                },
              };

              if (socket) {
                socket.broadcast.to(dbConfig.rooms.public).emit(dbConfig.EmitTypes.ROOM, dataToSend);
              } else {
                io.to(dbConfig.rooms.public.objectId).emit(dbConfig.EmitTypes.ROOM, dataToSend);
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
exports.getRoomsList = getRoomsList;
exports.doesWhisperRoomExist = doesWhisperRoomExist;
