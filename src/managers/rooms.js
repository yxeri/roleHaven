'use strict';
import bcrypt from 'bcrypt';
import { appConfig, dbConfig } from '../config/defaults/config';
import errorCreator from '../error/errorCreator';
import objectValidator from '../utils/objectValidator';
import authenticator from '../helpers/authenticator';
import dbRoom from '../db/connectors/room';
import socketUtils from '../utils/socketIo';
import dbUser from '../db/connectors/user';
import managerHelper from '../helpers/manager';
import dbInvitation from '../db/connectors/invitation';
function getRoomById({ token, roomId, roomName, password, callback, internalCallUser, needsAccess, }) {
    authenticator.isUserAllowed({
        internalCallUser,
        token,
        commandName: dbConfig.apiCommands.GetRoom.name,
        callback: ({ error: authError, data: authData, }) => {
            if (authError) {
                callback({ error: authError });
                return;
            }
            const { user: authUser } = authData;
            const returnFunc = ({ callback: returnCallback, room: roomToReturn, hasFullAccess: accessedFullAccess, }) => {
                const dataToReturn = {
                    data: {
                        room: !accessedFullAccess
                            ?
                                managerHelper.stripObject({ object: roomToReturn })
                            :
                                roomToReturn,
                    },
                };
                returnCallback(dataToReturn);
            };
            getRoomById({
                roomId,
                roomName,
                getPassword: true,
                callback: ({ error, data, }) => {
                    if (error) {
                        callback({ error });
                        return;
                    }
                    const { room } = data;
                    const { canSee, hasAccess, hasFullAccess, } = authenticator.hasAccessTo({
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
function updateAccess({ token, roomId, teamAdminIds, userAdminIds, userIds, teamIds, bannedIds, shouldRemove, internalCallUser, callback, }) {
    authenticator.isUserAllowed({
        token,
        internalCallUser,
        commandName: dbConfig.apiCommands.UpdateRoom.name,
        callback: ({ error, data, }) => {
            if (error) {
                callback({ error });
                return;
            }
            const { user: authUser } = data;
            getRoomById({
                roomId,
                internalCallUser: authUser,
                callback: ({ error: roomError, data: roomData, }) => {
                    if (roomError) {
                        callback({ error: roomError });
                        return;
                    }
                    const { room } = roomData;
                    const { hasFullAccess, } = authenticator.hasAccessTo({
                        objectToAccess: room,
                        toAuth: authUser,
                    });
                    if (!hasFullAccess) {
                        callback({ error: new errorCreator.NotAllowed({ name: `update room ${roomId}` }) });
                        return;
                    }
                    updateAccess({
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
function createAndFollowWhisperRoom({ participantIds, callback, io, user, }) {
    const room = {
        participantIds,
        roomName: Date.now()
            .toString(),
        isWhisper: true,
        accessLevel: dbConfig.AccessLevels.SUPERUSER,
        visibility: dbConfig.AccessLevels.SUPERUSER,
    };
    const followCallback = ({ users = [] }) => {
        if (users.length !== participantIds.length) {
            callback({ error: new errorCreator.DoesNotExist({ name: `create and follow whisper room. User/Alias Ids ${participantIds} does not exist.` }) });
            return;
        }
        createRoom({
            room,
            skipExistsCheck: true,
            callback: (roomData) => {
                if (roomData.error) {
                    callback({ error: roomData.error });
                    return;
                }
                const { objectId: roomId } = roomData.data.room;
                updateAccess({
                    roomId,
                    userIds: participantIds,
                    callback: (accessdata) => {
                        if (accessdata.error) {
                            callback({ error: accessdata.error });
                            return;
                        }
                        followRoom({
                            roomId,
                            userIds: users.map((foundUser) => foundUser.objectId)
                                .concat([user.objectId]),
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
                                    const receiverSocket = socketUtils.getUserSocket({
                                        io,
                                        socketId: foundUser.socketId,
                                    });
                                    if (receiverSocket) {
                                        receiverSocket.join(newRoomId);
                                    }
                                });
                                const senderSocket = socketUtils.getUserSocket({
                                    io,
                                    socketId: user.socketId,
                                });
                                if (senderSocket) {
                                    senderSocket.join(newRoomId);
                                }
                                io.to(newRoomId)
                                    .emit(dbConfig.EmitTypes.ROOM, dataToSend);
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
        callback: ({ error: aliasError, data: aliasData, }) => {
            if (aliasError) {
                callback({ error: aliasError });
                return;
            }
            const { users } = aliasData;
            followCallback({ users });
        },
    });
}
function getWhisperRoom({ participantIds, callback, }) {
    getWhisperRoom({
        participantIds,
        callback,
    });
}
function doesWhisperRoomExist({ participantIds, callback, }) {
    doesWhisperRoomExist({
        participantIds,
        callback,
    });
}
function createRoom({ room, options, token, socket, io, callback, }) {
    authenticator.isUserAllowed({
        token,
        commandName: dbConfig.apiCommands.CreateRoom.name,
        callback: ({ error, data, }) => {
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
            if (!authenticator.isAllowedAccessLevel({
                objectToCreate: room,
                toAuth: data.user,
            })) {
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
                ?
                    newRoom.password
                :
                    undefined;
            const roomCallback = () => {
                createRoom({
                    room,
                    options,
                    callback: ({ error: roomError, data: roomData, }) => {
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
                        }
                        else {
                            const userSocket = socketUtils.getUserSocket({
                                io,
                                socketId: user.socketId,
                            });
                            if (userSocket) {
                                userSocket.join(createdRoom.objectId);
                            }
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
function isProtectedRoom({ roomId, socket, }) {
    return dbConfig.requiredRooms.includes(roomId) || (socket && roomId === socket.id);
}
function leaveSocketRooms(socket) {
    Object.keys(socket.rooms)
        .forEach((roomId) => {
        if (!isProtectedRoom({
            roomId,
            socket,
        })) {
            socket.leave(roomId);
        }
    });
}
function follow({ userId, aliasId, user, roomId, io, callback, socket, addParticipants, invited = false, }) {
    const idToAdd = aliasId || userId;
    updateAccess({
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
                    followRoom({
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
                            const userSocket = socketUtils.getUserSocket({
                                io,
                                socketId: user.socketId,
                            });
                            if (userSocket) {
                                userSocket.join(roomId);
                            }
                            if (aliasId) {
                                io.in(aliasId)
                                    .clients((ioError, clients) => {
                                    if (ioError) {
                                        console.log(`Failed to emit follow alias id to room ${roomId}`, ioError);
                                        return;
                                    }
                                    clients.map((socketId) => io.sockets.connected[socketId])
                                        .forEach((connectedSocket) => {
                                        connectedSocket.join(roomId);
                                    });
                                });
                            }
                            if (socket) {
                                socket.to(idToAdd)
                                    .emit(dbConfig.EmitTypes.USER, userToReturn);
                                socket.to(roomId)
                                    .emit(dbConfig.EmitTypes.ROOM, toReturn);
                                if (invited) {
                                    socket.to(idToAdd)
                                        .emit(dbConfig.EmitTypes.FOLLOW, toReturn);
                                }
                            }
                            else {
                                io.to(idToAdd)
                                    .emit(dbConfig.EmitTypes.FOLLOW, toReturn);
                                io.to(idToAdd)
                                    .emit(dbConfig.EmitTypes.USER, userToReturn);
                                io.to(roomId)
                                    .emit(dbConfig.EmitTypes.ROOM, toReturn);
                            }
                            callback(toReturn);
                        },
                    });
                },
            });
        },
    });
}
function unfollow({ userId, user, roomId, socket, io, callback, }) {
    const toSend = {
        data: {
            user: { objectId: userId },
            room: { objectId: roomId },
            changeType: dbConfig.ChangeTypes.REMOVE,
        },
    };
    if (socket) {
        socket.join(roomId);
        socket.broadcast.to(roomId)
            .emit(dbConfig.EmitTypes.FOLLOWER, toSend);
    }
    else {
        if (user.socketId) {
            const userSocket = socketUtils.getUserSocket({
                io,
                socketId: user.socketId,
            });
            if (userSocket) {
                userSocket.join(roomId);
            }
        }
        io.to(userId)
            .emit(dbConfig.EmitTypes.FOLLOW, toSend);
        io.to(roomId)
            .emit(dbConfig.EmitTypes.FOLLOWER, toSend);
    }
    callback(toSend);
}
function followRoom({ token, socket, io, roomId, password, callback, aliasId, }) {
    authenticator.isUserAllowed({
        token,
        commandName: dbConfig.apiCommands.FollowRoom.name,
        callback: ({ error, data, }) => {
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
function unfollowRoom({ token, socket, io, roomId, callback, aliasId, }) {
    authenticator.isUserAllowed({
        token,
        commandName: dbConfig.apiCommands.UnfollowRoom.name,
        callback: ({ error, data, }) => {
            if (error) {
                callback({ error });
                return;
            }
            if (isProtectedRoom({
                roomId,
                socket,
            })) {
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
function getRoomsByUser({ token, callback, }) {
    authenticator.isUserAllowed({
        token,
        commandName: dbConfig.apiCommands.GetRoom.name,
        callback: ({ error, data, }) => {
            if (error) {
                callback({ error });
                return;
            }
            const { user: authUser } = data;
            getRoomsByUser({
                user: authUser,
                callback: ({ error: getError, data: getData, }) => {
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
                    })
                        .sort((a, b) => {
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
function getFollowedRooms({ token, callback, }) {
    authenticator.isUserAllowed({
        token,
        commandName: dbConfig.apiCommands.GetRoom.name,
        callback: ({ error, data, }) => {
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
function getAllRooms({ token, internalCallUser, callback, }) {
    authenticator.isUserAllowed({
        token,
        internalCallUser,
        commandName: dbConfig.apiCommands.GetFull.name,
        callback: ({ error }) => {
            if (error) {
                callback({ error });
                return;
            }
            getAllRooms({ callback });
        },
    });
}
function removeRoom({ token, roomId, socket, io, callback, }) {
    authenticator.isUserAllowed({
        token,
        commandName: dbConfig.apiCommands.RemoveRoom.name,
        callback: ({ error, data, }) => {
            if (error) {
                callback({ error });
                return;
            }
            if (isProtectedRoom({
                roomId,
                socket,
            })) {
                callback({ error: new errorCreator.NotAllowed({ name: `remove protected room ${roomId}` }) });
                return;
            }
            const { user: authUser } = data;
            getRoomById({
                roomId,
                internalCallUser: authUser,
                callback: ({ error: getError, data: getData, }) => {
                    if (getError) {
                        callback({ error: getError });
                        return;
                    }
                    const { room: foundRoom } = getData;
                    const { hasFullAccess, } = authenticator.hasAccessTo({
                        objectToAccess: foundRoom,
                        toAuth: authUser,
                    });
                    if (!hasFullAccess) {
                        callback({ error: new errorCreator.NotAllowed({ name: `remove room ${roomId}` }) });
                        return;
                    }
                    removeRoom({
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
                            socketUtils.getSocketsByRoom({
                                io,
                                roomId,
                            })
                                .forEach((roomSocket) => {
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
function updateRoom({ token, room, roomId, options, callback, io, socket, }) {
    authenticator.isUserAllowed({
        token,
        commandName: dbConfig.apiCommands.UpdateRoom.name,
        callback: ({ error, data, }) => {
            if (error) {
                callback({ error });
                return;
            }
            const { user: authUser } = data;
            getRoomById({
                roomId,
                internalCallUser: authUser,
                callback: ({ error: getError, data: getData, }) => {
                    if (getError) {
                        callback({ error: getError });
                        return;
                    }
                    const { room: foundRoom } = getData;
                    const { hasFullAccess, } = authenticator.hasAccessTo({
                        objectToAccess: foundRoom,
                        toAuth: authUser,
                    });
                    if (!hasFullAccess) {
                        callback({ error: new errorCreator.NotAllowed({ name: `update room ${roomId}` }) });
                        return;
                    }
                    updateRoom({
                        options,
                        room,
                        roomId,
                        callback: ({ error: updateError, data: updateData, }) => {
                            if (updateError) {
                                callback({ error: updateError });
                                return;
                            }
                            const { room: updatedRoom } = updateData;
                            const dataToSend = {
                                data: {
                                    room: managerHelper.stripObject({ object: { ...updatedRoom } }),
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
                                socket.broadcast.to(roomId)
                                    .emit(dbConfig.EmitTypes.ROOM, creatorDataToSend);
                            }
                            else {
                                io.emit(dbConfig.EmitTypes.ROOM, dataToSend);
                                io.to(roomId)
                                    .emit(dbConfig.EmitTypes.ROOM, creatorDataToSend);
                            }
                            callback(creatorDataToSend);
                        },
                    });
                },
            });
        },
    });
}
function inviteToRoom({ roomId, followerIds, socket, io, token, callback, }) {
    authenticator.isUserAllowed({
        token,
        commandName: dbConfig.apiCommands.InviteToRoom.name,
        callback: ({ error, data, }) => {
            if (error) {
                callback({ error });
                return;
            }
            const { user: authUser } = data;
            getRoomById({
                roomId,
                internalCallUser: authUser,
                needsAccess: true,
                callback: ({ error: roomError, data: roomData, }) => {
                    if (roomError) {
                        callback({ error: roomError });
                        return;
                    }
                    const { room } = roomData;
                    dbUser.getUsersByAliases({
                        aliasIds: followerIds,
                        callback: ({ error: aliasError, data: aliasData, }) => {
                            if (aliasError) {
                                callback({ error: aliasError });
                                return;
                            }
                            const { users: foundUsers } = aliasData;
                            const followers = followerIds.filter((id) => !room.followers.includes(id))
                                .map((id) => {
                                const user = foundUsers.find((foundUser) => {
                                    return foundUser.objectId === id || foundUser.aliases.includes(id);
                                });
                                return {
                                    user,
                                    aliasId: id,
                                };
                            });
                            room.followers = room.followers.concat(followers.map((follower) => follower.aliasId));
                            followers.forEach(({ user, aliasId, }) => {
                                follow({
                                    aliasId,
                                    user,
                                    roomId,
                                    io,
                                    socket,
                                    invited: true,
                                    addParticipants: room.isWhisper,
                                    callback: () => {
                                    },
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
function sendInvitationToRoom({ aliasId, followerIds, roomId, io, callback, token, socket, }) {
    authenticator.isUserAllowed({
        token,
        commandName: dbConfig.apiCommands.InviteToRoom.name,
        callback: ({ error, data, }) => {
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
                callback: ({ error: roomError, data: roomData, }) => {
                    if (roomError) {
                        callback({ error: roomError });
                        return;
                    }
                    const { room: foundRoom } = roomData;
                    followerIds.filter((followerId) => !foundRoom.followers.includes(followerId))
                        .forEach((followerId) => {
                        const invitationToCreate = {
                            receiverId: followerId,
                            itemId: roomId,
                            ownerId: authUser.objectId,
                            ownerAliasId: aliasId,
                            invitationType: dbConfig.InvitationTypes.ROOM,
                        };
                        dbInvitation.createInvitation({
                            invitation: invitationToCreate,
                            callback: ({ error: inviteError, data: invitationData, }) => {
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
                                    io.to(newInvitation.ownerAliasId || newInvitation.ownerId)
                                        .emit(dbConfig.EmitTypes.INVITATION, dataToSend);
                                }
                                io.to(newInvitation.receiverId)
                                    .emit(dbConfig.EmitTypes.INVITATION, dataToSend);
                                callback(dataToSend);
                            },
                        });
                    });
                },
            });
        },
    });
}
function acceptRoomInvitation({ token, invitationId, io, socket, callback, }) {
    authenticator.isUserAllowed({
        token,
        commandName: dbConfig.apiCommands.AcceptInvitation.name,
        callback: ({ error, data, }) => {
            if (error) {
                callback({ error });
                return;
            }
            const { user: authUser } = data;
            dbInvitation.useInvitation({
                invitationId,
                callback: ({ error: invitationError, data: invitationData, }) => {
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
                            ?
                                invitation.receiverId
                            :
                                undefined,
                    });
                },
            });
        },
    });
}
export { createRoom };
export { updateRoom };
export { removeRoom };
export { updateAccess };
export { getRoomById };
export { unfollowRoom };
export { leaveSocketRooms };
export { followRoom };
export { getWhisperRoom };
export { createAndFollowWhisperRoom };
export { getAllRooms };
export { getRoomsByUser };
export { getFollowedRooms };
export { doesWhisperRoomExist };
export { sendInvitationToRoom };
export { acceptRoomInvitation };
export { inviteToRoom };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm9vbXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJyb29tcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxZQUFZLENBQUM7QUFFYixPQUFPLE1BQU0sTUFBTSxRQUFRLENBQUM7QUFDNUIsT0FBTyxFQUFFLFNBQVMsRUFBRSxRQUFRLEVBQUUsTUFBTSwyQkFBMkIsQ0FBQztBQUVoRSxPQUFPLFlBQVksTUFBTSx1QkFBdUIsQ0FBQztBQUNqRCxPQUFPLGVBQWUsTUFBTSwwQkFBMEIsQ0FBQztBQUN2RCxPQUFPLGFBQWEsTUFBTSwwQkFBMEIsQ0FBQztBQUNyRCxPQUFPLE1BQU0sTUFBTSx1QkFBdUIsQ0FBQztBQUMzQyxPQUFPLFdBQVcsTUFBTSxtQkFBbUIsQ0FBQztBQUM1QyxPQUFPLE1BQU0sTUFBTSx1QkFBdUIsQ0FBQztBQUMzQyxPQUFPLGFBQWEsTUFBTSxvQkFBb0IsQ0FBQztBQUMvQyxPQUFPLFlBQVksTUFBTSw2QkFBNkIsQ0FBQztBQVl2RCxTQUFTLFdBQVcsQ0FBQyxFQUNuQixLQUFLLEVBQ0wsTUFBTSxFQUNOLFFBQVEsRUFDUixRQUFRLEVBQ1IsUUFBUSxFQUNSLGdCQUFnQixFQUNoQixXQUFXLEdBQ1o7SUFDQyxhQUFhLENBQUMsYUFBYSxDQUFDO1FBQzFCLGdCQUFnQjtRQUNoQixLQUFLO1FBQ0wsV0FBVyxFQUFFLFFBQVEsQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLElBQUk7UUFDOUMsUUFBUSxFQUFFLENBQUMsRUFDVCxLQUFLLEVBQUUsU0FBUyxFQUNoQixJQUFJLEVBQUUsUUFBUSxHQUNmLEVBQUUsRUFBRTtZQUNILElBQUksU0FBUyxFQUFFLENBQUM7Z0JBQ2QsUUFBUSxDQUFDLEVBQUUsS0FBSyxFQUFFLFNBQVMsRUFBRSxDQUFDLENBQUM7Z0JBRS9CLE9BQU87WUFDVCxDQUFDO1lBRUQsTUFBTSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsR0FBRyxRQUFRLENBQUM7WUFDcEMsTUFBTSxVQUFVLEdBQUcs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