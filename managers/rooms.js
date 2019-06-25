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

const bcrypt = require('bcrypt');
const { appConfig, dbConfig } = require('../config/defaults/config');
const errorCreator = require('../error/errorCreator');
const objectValidator = require('../utils/objectValidator');
const authenticator = require('../helpers/authenticator');
const dbRoom = require('../db/connectors/room');
const socketUtils = require('../utils/socketIo');
const dbUser = require('../db/connectors/user');
const managerHelper = require('../helpers/manager');
const dbInvitation = require('../db/connectors/invitation');

/**
 * Get room by Id or name.
 * @param {Object} params Parameter.
 * @param {Function} params.callback Callback.
 * @param {string} [params.token] jwt.
 * @param {string} [params.roomId] Id of the room.
 * @param {string} [params.roomName] Name of the room.
 * @param {string} [params.password] Password for the room.
 * @param {Object} [params.internalCallUser] User to use on authentication. It will bypass token authentication.
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
  authenticator.isUserAllowed({
    internalCallUser,
    token,
    commandName: dbConfig.apiCommands.GetRoom.name,
    callback: ({ error: authError, data: authData }) => {
      if (authError) {
        callback({ error: authError });

        return;
      }

      const { user: authUser } = authData;
      const returnFunc = ({
        callback: returnCallback,
        room: roomToReturn,
        hasFullAccess: accessedFullAccess,
      }) => {
        const dataToReturn = {
          data: {
            room: !accessedFullAccess
              ? managerHelper.stripObject({ object: roomToReturn })
              : roomToReturn,
          },
        };

        returnCallback(dataToReturn);
      };

      dbRoom.getRoomById({
        roomId,
        roomName,
        getPassword: true,
        callback: ({ error, data }) => {
          if (error) {
            callback({ error });

            return;
          }

          const { room } = data;

          const {
            canSee,
            hasAccess,
            hasFullAccess,
          } = authenticator.hasAccessTo({
            objectToAccess: room,
            toAuth: authUser,
          });

          if (!canSee || (needsAccess && !hasAccess)) {
            const accessError = new errorCreator.NotAllowed({ name: `${dbConfig.apiCommands.GetRoom.name}. User: ${authUser.objectId}. Access: 'Room' ${room.objectId}` });

            callback({ error: accessError });

            return;
          }

          if (room.password && !hasAccess) {
            if (!password) {
              const accessError = new errorCreator.NotAllowed({
                name: `${dbConfig.apiCommands.GetRoom.name}. User: ${authUser.objectId}. Access: 'Room' ${room.objectId}`,
                extraData: { param: 'password' },
              });

              callback({ error: accessError });

              return;
            }

            bcrypt.compare(password, room.password, (hashError, result) => {
              if (hashError) {
                callback({ error: new errorCreator.Internal({ errorObject: hashError }) });

                return;
              }

              if (!result) {
                const accessError = new errorCreator.NotAllowed({
                  name: `${dbConfig.apiCommands.GetRoom.name}. User: ${authUser.objectId}. Access: 'Room' ${room.objectId}`,
                  extraData: { param: 'password' },
                });

                callback({ error: accessError });

                return;
              }

              returnFunc({
                callback,
                room,
                hasFullAccess,
              });
            });

            return;
          }

          returnFunc({
            callback,
            room,
            hasFullAccess,
          });
        },
      });
    },
  });
}

/**
 * Update access to the room for users or teams.
 * @param {Object} params Parameters.
 * @param {string} params.roomId Id of the room.
 * @param {Function} params.callback Callback.
 * @param {boolean} [params.shouldRemove] Should access be removed from the users or teams?
 * @param {string[]} [params.userIds] Id of the users.
 * @param {string[]} [params.teamIds] Id of the teams.
 * @param {string[]} [params.bannedIds] Id of the blocked Ids to add.
 * @param {string[]} [params.teamAdminIds] Id of the teams to change admin access for.
 * @param {string[]} [params.userAdminIds] Id of the users to change admin access for.
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
 * @param {Object} params Parameters.
 * @param {string[]} params.participantIds User Ids of the users send private messages to each other.
 * @param {Function} params.callback Callback.
 * @param {Object} params.io Socket.io.
 */
function createAndFollowWhisperRoom({
  participantIds,
  callback,
  io,
  user,
}) {
  const room = {
    participantIds,
    roomName: Date.now().toString(),
    isWhisper: true,
    accessLevel: dbConfig.AccessLevels.SUPERUSER,
    visibility: dbConfig.AccessLevels.SUPERUSER,
  };

  const followCallback = ({ users = [] }) => {
    if (users.length !== participantIds.length) {
      callback({ error: new errorCreator.DoesNotExist({ name: `create and follow whisper room. User/Alias Ids ${participantIds} does not exist.` }) });

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
              userIds: users.map(foundUser => foundUser.objectId).concat([user.objectId]),
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
  };

  dbUser.getUsersByAliases({
    aliasIds: participantIds,
    callback: ({ error: aliasError, data: aliasData }) => {
      if (aliasError) {
        callback({ error: aliasError });

        return;
      }

      const { users } = aliasData;

      followCallback({ users });
    },
  });
}

/**
 * Retrieve whisper room.
 * @param {Object} params Parameters.
 * @param {string[]} params.participantIds Ids of the users.
 * @param {Function} params.callback Callback.
 */
function getWhisperRoom({ participantIds, callback }) {
  dbRoom.getWhisperRoom({
    participantIds,
    callback,
  });
}

/**
 * Does the whisper room exist?
 * @param {Object} params Parameters.
 * @param {string[]} participantIds Ids of the users.
 * @param {Function} callback Callback.
 */
function doesWhisperRoomExist({ participantIds, callback }) {
  dbRoom.doesWhisperRoomExist({
    participantIds,
    callback,
  });
}

/**
 * Creates a new chat room and adds the user who created it to it.
 * @param {Object} params Parameters.
 * @param {Object} params.room New room.
 * @param {Object} params.io Socket.io. Used if socket isn't set.
 * @param {Object} params.options Update options.
 * @param {Function} params.callback callback.
 * @param {Object} [params.socket] Socket io.
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
      }

      if (!objectValidator.isValidData({ room }, { room: { roomName: true } })) {
        callback({ error: new errorCreator.InvalidData({ expected: '{ room: { roomName } }' }) });

        return;
      }

      if (room.roomName.length > appConfig.roomNameMaxLength) {
        callback({ error: new errorCreator.InvalidCharacters({ expected: 'a-z 0-9 length: 20' }) });

        return;
      }

      if (dbConfig.protectedRoomNames.indexOf(room.roomName.toLowerCase()) > -1) {
        callback({ error: new errorCreator.InvalidCharacters({ expected: 'not protected words' }) });

        return;
      }

      if (!authenticator.isAllowedAccessLevel({ objectToCreate: room, toAuth: data.user })) {
        callback({ error: new errorCreator.NotAllowed({ name: 'too high access level or visibility' }) });

        return;
      }

      if (room.password && room.password.length > appConfig.passwordMaxLength) {
        callback({ error: new errorCreator.InvalidCharacters({ expected: 'password too long' }) });

        return;
      }

      const newRoom = room;
      const { user } = data;
      newRoom.ownerId = user.objectId;
      newRoom.roomNameLowerCase = newRoom.roomName.toLowerCase();
      newRoom.password = newRoom.password && newRoom.password !== ''
        ? newRoom.password
        : undefined;

      const roomCallback = () => {
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
      };

      if (newRoom.password) {
        bcrypt.hash(newRoom.password, 10, (hashError, hash) => {
          if (hashError) {
            callback({ error: new errorCreator.Internal({ errorObject: hashError }) });

            return;
          }

          newRoom.password = hash;

          roomCallback();
        });

        return;
      }

      roomCallback();
    },
  });
}

/**
 * Is the room protected? Protected rooms should not be unfollowed.
 * @param {Object} params Parameters.
 * @param {string} params.roomId Id of the room.
 * @param {Object} [params.socket] Socket.io.
 * @return {boolean} Is the room protected?
 */
function isProtectedRoom({ roomId, socket }) {
  return dbConfig.requiredRooms.includes(roomId) || (socket && roomId === socket.id);
}

/**
 * Leave all rooms, except the required ones, on the socket
 * @param {Object} socket Socket.io socket
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
 * @param {Object} params Parameters.
 * @param {string} params.userId ID that will start following the room.
 * @param {string} params.roomId ID of the room to follow.
 * @param {Function} params.callback Callback.
 * @param {Object} params.io Socket.io. Used if socket is not set.
 * @param {Object} params.user User trying to follow a room.
 */
function follow({
  userId,
  aliasId,
  user,
  roomId,
  io,
  callback,
  socket,
  addParticipants,
  invited = false,
}) {
  const idToAdd = aliasId || userId;

  dbRoom.updateAccess({
    roomId,
    userIds: [idToAdd],
    callback: ({ error }) => {
      if (error) {
        callback({ error });

        return;
      }

      dbRoom.addFollowers({
        roomId,
        addParticipants,
        userIds: [idToAdd],
        callback: (followerData) => {
          if (followerData.error) {
            callback({ error: followerData.error });

            return;
          }

          const { room: updatedRoom } = followerData.data;

          dbUser.followRoom({
            roomId,
            userIds: [userId],
            callback: (followData) => {
              if (followData.error) {
                callback({ error: followData.error });

                return;
              }

              const { users } = followData.data;

              const toReturn = {
                data: {
                  invited,
                  user: { objectId: idToAdd },
                  room: updatedRoom,
                  changeType: dbConfig.ChangeTypes.UPDATE,
                },
              };
              const userToReturn = {
                data: {
                  user: users[0] || { objectId: userId },
                  changeType: dbConfig.ChangeTypes.UPDATE,
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

                  clients.map(socketId => io.sockets.connected[socketId]).forEach((connectedSocket) => {
                    connectedSocket.join(roomId);
                  });
                });
              }

              if (socket) {
                socket.to(idToAdd).emit(dbConfig.EmitTypes.USER, userToReturn);
                socket.to(roomId).emit(dbConfig.EmitTypes.ROOM, toReturn);

                if (invited) {
                  socket.to(idToAdd).emit(dbConfig.EmitTypes.FOLLOW, toReturn);
                }
              } else {
                io.to(idToAdd).emit(dbConfig.EmitTypes.FOLLOW, toReturn);
                io.to(idToAdd).emit(dbConfig.EmitTypes.USER, userToReturn);
                io.to(roomId).emit(dbConfig.EmitTypes.ROOM, toReturn);
              }

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
 * @param {Object} params Parameters.
 * @param {string} params.userId ID that will unfollow the room.
 * @param {string} params.roomId ID of the room to unfollow.
 * @param {Function} params.callback Callback.
 * @param {Object} params.io Socket.io. Used if socket is not set.
 * @param {Object} params.user User trying to unfollow a room.
 * @param {Object} [params.socket] Socket.io socket.
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
 * @param {Object} params Parameters.
 * @param {string} params.roomId Id of the room to follow.
 * @param {Function} params.callback Callback.
 * @param {Object} params.io Socket.io. Used if socket is not set.
 * @param {string} [params.aliasId] Id of the alias that the user is using to follow the room.
 * @param {Object} [params.socket] Socket.io socket.
 * @param {string} [params.password] Password to the room.
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
 * @param {Object} params Parameters.
 * @param {Object} params.roomId Id of the room to unfollow.
 * @param {Function} params.callback Callback.
 * @param {Object} params.io Socket io. Will be used if socket is not set.
 * @param {Object} [params.socket] Socket.io.
 * @param {string} [params.aliasId] Id of the alias that the user is using to unfollow the room.
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
      }

      if (isProtectedRoom({ roomId, socket })) {
        callback({ error: new errorCreator.NotAllowed({ name: `unfollow protected room ${roomId}` }) });

        return;
      }

      const { user: authUser } = data;

      if (aliasId && !authUser.aliases.includes(aliasId)) {
        callback({ error: new errorCreator.NotAllowed({ name: `unfollow room ${roomId} with alias ${aliasId}` }) });

        return;
      }

      dbRoom.removeFollowers({
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
 * @param {Object} params Parameters.
 * @param {string} params.token jwt.
 * @param {Function} params.callback Callback.
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
            }

            if (aName > bName) {
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
 * @param {Object} params Parameters.
 * @param {string} params.token jwt.
 * @param {Function} params.callback Callback.
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
 * @param {Object} params Parameters.
 * @param {string} params.token jwt.
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
 * @param {Object} params Parameters.
 * @param {string} params.token jwt.
 * @param {string} params.roomId Id of the room to remove.
 * @param {Object} params.io Socket.io. Will be used if socket is not set.
 * @param {Function} params.callback Callback
 * @param {Object} [params.socket] Socket.io.
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
      }

      if (isProtectedRoom({ roomId, socket })) {
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
 * @param {Object} params Parameters.
 * @param {Object} params.room Room.
 * @param {string} params.roomId ID of the room to update.
 * @param {Object} params.options Update options.
 * @param {Function} params.callback Callback.
 * @param {Object} params.io Socket io.
 */
function updateRoom({
  token,
  room,
  roomId,
  options,
  callback,
  io,
  socket,
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

              if (socket) {
                socket.broadcast.emit(dbConfig.EmitTypes.ROOM, dataToSend);
                socket.broadcast.to(roomId).emit(dbConfig.EmitTypes.ROOM, creatorDataToSend);
              } else {
                io.emit(dbConfig.EmitTypes.ROOM, dataToSend);
                io.to(roomId).emit(dbConfig.EmitTypes.ROOM, creatorDataToSend);
              }

              callback(creatorDataToSend);
            },
          });
        },
      });
    },
  });
}

/**
 * Invite users and aliases to a room.
 * @param {Object} params Parameters.
 * @param {string} params.roomId Id of the room.
 * @param {string[]} params.followerIds Ids of the users and aliases to invite.
 * @param {Object} [params.socket] Socket.Io.
 * @param {Object} params.io Socket.Io.
 * @param {string} params.token JWT.
 * @param {Function} params.callback Callback.
 */
function inviteToRoom({
  roomId,
  followerIds,
  socket,
  io,
  token,
  callback,
}) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.InviteToRoom.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const { user: authUser } = data;

      getRoomById({
        roomId,
        internalCallUser: authUser,
        needsAccess: true,
        callback: ({ error: roomError, data: roomData }) => {
          if (roomError) {
            callback({ error: roomError });

            return;
          }

          const { room } = roomData;

          dbUser.getUsersByAliases({
            aliasIds: followerIds,
            callback: ({ error: aliasError, data: aliasData }) => {
              if (aliasError) {
                callback({ error: aliasError });

                return;
              }

              const { users: foundUsers } = aliasData;
              const followers = followerIds.filter(id => !room.followers.includes(id)).map((id) => {
                const user = foundUsers.find((foundUser) => {
                  return foundUser.objectId === id || foundUser.aliases.includes(id);
                });

                return {
                  user,
                  aliasId: id,
                };
              });
              room.followers = room.followers.concat(followers.map(follower => follower.aliasId));

              followers.forEach(({ user, aliasId }) => {
                follow({
                  aliasId,
                  user,
                  roomId,
                  io,
                  socket,
                  invited: true,
                  addParticipants: room.isWhisper,
                  callback: () => {},
                  userId: user.objectId,
                });
              });

              callback({
                data: {
                  room,
                  changeType: dbConfig.ChangeTypes.UPDATE,
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
 * Invite users to a room.
 * @param {Object} params Parameters.
 * @param {Function} params.callback Callback.
 * @param {Object} params.io Socket io.
 */
function sendInvitationToRoom({
  aliasId,
  followerIds,
  roomId,
  io,
  callback,
  token,
  socket,
}) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.InviteToRoom.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const { user: authUser } = data;

      if (aliasId && !authUser.aliases.includes(aliasId)) {
        callback({ error: new errorCreator.NotAllowed({ name: `invite to room ${followerIds} with alias ${aliasId}` }) });

        return;
      }

      getRoomById({
        roomId,
        needsAccess: true,
        internalCallUser: authUser,
        callback: ({ error: roomError, data: roomData }) => {
          if (roomError) {
            callback({ error: roomError });

            return;
          }

          const { room: foundRoom } = roomData;

          followerIds.filter(followerId => !foundRoom.followers.includes(followerId)).forEach((followerId) => {
            const invitationToCreate = {
              receiverId: followerId,
              itemId: roomId,
              ownerId: authUser.objectId,
              ownerAliasId: aliasId,
              invitationType: dbConfig.InvitationTypes.ROOM,
            };

            dbInvitation.createInvitation({
              invitation: invitationToCreate,
              callback: ({ error: inviteError, data: invitationData }) => {
                if (inviteError) {
                  callback({ error: inviteError });

                  return;
                }

                const { invitation: newInvitation } = invitationData;
                const dataToSend = {
                  data: {
                    invitation: newInvitation,
                    changeType: dbConfig.ChangeTypes.CREATE,
                  },
                };

                if (!socket) {
                  io.to(newInvitation.ownerAliasId || newInvitation.ownerId).emit(dbConfig.EmitTypes.INVITATION, dataToSend);
                }

                io.to(newInvitation.receiverId).emit(dbConfig.EmitTypes.INVITATION, dataToSend);

                callback(dataToSend);
              },
            });
          });
        },
      });
    },
  });
}

/**
 * User accepts sent invitation and joins the room.
 * @param {Object} params Parameters.
 * @param {Object} params.invitationId ID of the invitation that will be accepted.
 * @param {Object} params.io Socket io.
 * @param {Function} params.callback Callback.
 */
function acceptRoomInvitation({
  token,
  invitationId,
  io,
  socket,
  callback,
}) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.AcceptInvitation.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const { user: authUser } = data;

      dbInvitation.useInvitation({
        invitationId,
        callback: ({ error: invitationError, data: invitationData }) => {
          if (invitationError) {
            callback({ error: invitationError });

            return;
          }

          const { invitation } = invitationData;

          follow({
            io,
            callback,
            socket,
            roomId: invitation.itemId,
            userId: authUser.objectId,
            aliasId: authUser.aliases.includes(invitation.receiverId)
              ? invitation.receiverId
              : undefined,
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
exports.sendInvitationToRoom = sendInvitationToRoom;
exports.acceptRoomInvitation = acceptRoomInvitation;
exports.inviteToRoom = inviteToRoom;
