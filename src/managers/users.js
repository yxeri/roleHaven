'use strict';
import bcrypt from 'bcrypt';
import dbUser from '../db/connectors/user';
import dbWallet from '../db/connectors/wallet';
import { appConfig, dbConfig } from '../config/defaults/config';
import errorCreator from '../error/errorCreator';
import textTools from '../utils/textTools';
import authenticator from '../helpers/authenticator';
import roomManager from './rooms';
import dbRoom from '../db/connectors/room';
import socketUtils from '../utils/socketIo';
import dbForum from '../db/connectors/forum';
import managerHelper from '../helpers/manager';
import positionManager from './positions';
import imager from '../helpers/imager';
import messageManager from './messages';
function createUser({ token, user, callback, io, options, socket, image, }) {
    let command;
    if (appConfig.mode === appConfig.Modes.TEST) {
        command = dbConfig.apiCommands.AnonymousCreation;
    }
    else if (appConfig.disallowUserRegister) {
        command = dbConfig.apiCommands.CreateDisallowedUser;
    }
    else {
        command = dbConfig.apiCommands.CreateUser;
    }
    authenticator.isUserAllowed({
        token,
        commandName: command.name,
        callback: ({ error, data, }) => {
            if (error) {
                callback({ error });
                return;
            }
            const { user: authUser } = data;
            if (appConfig.requireOffName && !user.offName) {
                callback({
                    error: new errorCreator.InvalidData({
                        expected: 'offName',
                        extraData: { param: 'offName' },
                    }),
                });
                return;
            }
            if (!textTools.isAllowedFull(user.username)) {
                callback({
                    error: new errorCreator.InvalidCharacters({
                        name: `User name: ${user.username}.`,
                        extraData: { param: 'characters' },
                    }),
                });
                return;
            }
            if (user.username.length < appConfig.usernameMinLength || user.username.length > appConfig.usernameMaxLength) {
                callback({
                    error: new errorCreator.InvalidLength({
                        name: `User name length: ${appConfig.usernameMinLength}-${appConfig.usernameMaxLength}`,
                        extraData: { param: 'username' },
                    }),
                });
                return;
            }
            if (user.offName && (user.offName.length < appConfig.offNameMinLength || user.offName.length > appConfig.offNameNameMaxLength)) {
                callback({
                    error: new errorCreator.InvalidLength({
                        name: `Off name length: ${appConfig.offNameMinLength}-${appConfig.offNameNameMaxLength}`,
                        extraData: { param: 'offName' },
                    }),
                });
                return;
            }
            if (user.password.length < appConfig.passwordMinLength || user.password.length > appConfig.passwordMaxLength) {
                callback({
                    error: new errorCreator.InvalidLength({
                        name: `Password length: ${appConfig.passwordMinLength}-${appConfig.passwordMaxLength}`,
                        extraData: { param: 'password' },
                    }),
                });
                return;
            }
            if (user.registerDevice.length > appConfig.deviceIdLength) {
                callback({
                    error: new errorCreator.InvalidLength({
                        name: `Device length: ${appConfig.deviceIdLength}`,
                        extraData: { param: 'device' },
                    }),
                });
                return;
            }
            if (dbConfig.protectedNames.includes(user.username.toLowerCase())) {
                callback({
                    error: new errorCreator.InvalidCharacters({
                        name: `protected name ${user.username}`,
                        extraData: { param: 'username' },
                    }),
                });
                return;
            }
            if (user.description && user.description.join('').length > appConfig.userDescriptionMaxLength) {
                callback({
                    error: new errorCreator.InvalidLength({
                        name: `Description length: ${appConfig.userDescriptionMaxLength}`,
                        extraData: { param: 'description' },
                    }),
                });
                return;
            }
            if (user.accessLevel && (authUser.accessLevel < dbConfig.apiCommands.UpdateUserAccess.accessLevel)) {
                callback({ error: new errorCreator.NotAllowed({ name: 'Set user access level' }) });
                return;
            }
            if (user.visibility && (authUser.accessLevel < dbConfig.apiCommands.UpdateUserVisibility.accessLevel)) {
                callback({ error: new errorCreator.NotAllowed({ name: 'Set user visibility' }) });
                return;
            }
            const newUser = user;
            newUser.username = textTools.trimSpace(newUser.username);
            newUser.usernameLowerCase = newUser.username.toLowerCase();
            newUser.isVerified = !appConfig.userVerify;
            newUser.followingRooms = dbConfig.requiredRooms;
            newUser.accessLevel = newUser.accessLevel || dbConfig.AccessLevels.STANDARD;
            newUser.mailAddress = newUser.mailAddress
                ?
                    newUser.mailAddress.toLowerCase()
                :
                    undefined;
            const userCallback = () => {
                createUser({
                    options,
                    user: newUser,
                    callback: ({ error: userError, data: userData, }) => {
                        if (userError) {
                            callback({ error: userError });
                            return;
                        }
                        const { user: createdUser } = userData;
                        dbRoom.createRoom({
                            room: {
                                ownerId: createdUser.objectId,
                                roomName: createdUser.objectId,
                                objectId: createdUser.objectId,
                                visibility: dbConfig.AccessLevels.STANDARD,
                                accessLevel: dbConfig.AccessLevels.SUPERUSER,
                                isUser: true,
                            },
                            options: {
                                setId: true,
                            },
                            callback: ({ error: roomError, data: roomData, }) => {
                                if (roomError) {
                                    callback({ error: roomError });
                                    return;
                                }
                                const wallet = {
                                    objectId: createdUser.objectId,
                                    accessLevel: createdUser.accessLevel,
                                    ownerId: createdUser.objectId,
                                    amount: appConfig.defaultWalletAmount,
                                };
                                const walletOptions = { setId: true };
                                dbWallet.createWallet({
                                    wallet,
                                    options: walletOptions,
                                    callback: ({ error: walletError, data: walletData, }) => {
                                        if (walletError) {
                                            callback({ error: walletError });
                                            return;
                                        }
                                        positionManager.createPosition({
                                            io,
                                            position: {
                                                objectId: createdUser.objectId,
                                                positionName: createdUser.objectId,
                                                positionType: dbConfig.PositionTypes.USER,
                                            },
                                            internalCallUser: createdUser,
                                            isUserPosition: true,
                                            callback: ({ error: positionError }) => {
                                                if (positionError) {
                                                    callback({ error: positionError });
                                                    return;
                                                }
                                                const forum = {
                                                    title: newUser.fullName || newUser.username,
                                                    isPersonal: true,
                                                    objectId: createdUser.objectId,
                                                    ownerId: createdUser.objectId,
                                                };
                                                const forumOptions = { setId: true };
                                                dbForum.createForum({
                                                    forum,
                                                    options: forumOptions,
                                                    callback: ({ error: forumError, data: forumData, }) => {
                                                        if (forumError) {
                                                            callback({ error: forumError });
                                                            return;
                                                        }
                                                        const createdRoom = roomData.room;
                                                        const createdWallet = walletData.wallet;
                                                        const createdForum = forumData.forum;
                                                        const creatorDataToSend = {
                                                            data: {
                                                                wallet: createdWallet,
                                                                room: createdRoom,
                                                                user: createdUser,
                                                                forum: createdForum,
                                                                isSender: true,
                                                                changeType: dbConfig.ChangeTypes.CREATE,
                                                            },
                                                        };
                                                        const dataToSend = {
                                                            data: {
                                                                user: managerHelper.stripObject({ object: { ...createdUser } }),
                                                                changeType: dbConfig.ChangeTypes.CREATE,
                                                            },
                                                        };
                                                        const roomDataToSend = {
                                                            data: {
                                                                room: managerHelper.stripObject({ object: { ...createdRoom } }),
                                                                changeType: dbConfig.ChangeTypes.CREATE,
                                                            },
                                                        };
                                                        const walletDataToSend = {
                                                            data: {
                                                                wallet: managerHelper.stripObject({ object: { ...createdWallet } }),
                                                                changeType: dbConfig.ChangeTypes.CREATE,
                                                            },
                                                        };
                                                        const forumDataToSend = {
                                                            data: {
                                                                forum: managerHelper.stripObject({ object: { ...createdForum } }),
                                                            },
                                                        };
                                                        if (!socket) {
                                                            io.to(createdUser.objectId)
                                                                .emit(dbConfig.EmitTypes.USER, creatorDataToSend);
                                                        }
                                                        if (socket) {
                                                            socket.join(createdUser.objectId);
                                                            socket.broadcast.emit(dbConfig.EmitTypes.USER, dataToSend);
                                                        }
                                                        else {
                                                            const userSocket = socketUtils.getUserSocket({
                                                                io,
                                                                socketId: user.socketId,
                                                            });
                                                            if (userSocket) {
                                                                userSocket.join(createdRoom.objectId);
                                                            }
                                                            io.emit(dbConfig.EmitTypes.USER, dataToSend);
                                                        }
                                                        io.emit(dbConfig.EmitTypes.FORUM, forumDataToSend);
                                                        io.emit(dbConfig.EmitTypes.ROOM, roomDataToSend);
                                                        io.emit(dbConfig.EmitTypes.WALLET, walletDataToSend);
                                                        if (!createdUser.isVerified) {
                                                            messageManager.sendChatMsg({
                                                                io,
                                                                socket,
                                                                message: {
                                                                    roomId: dbConfig.rooms.admin.objectId,
                                                                    text: [`User ${createdUser.username} (${createdUser.objectId}) needs to be verified.`],
                                                                },
                                                                internalCallUser: dbConfig.users.systemUser,
                                                                callback: () => {
                                                                },
                                                            });
                                                        }
                                                        callback(creatorDataToSend);
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
            };
            bcrypt.hash(newUser.password, 10, (hashError, hash) => {
                if (hashError) {
                    callback({ error: new errorCreator.Internal({ errObject: hashError }) });
                    return;
                }
                newUser.password = hash;
                if (image) {
                    imager.createImage({
                        image,
                        callback: ({ error: imageError, data: imageData, }) => {
                            if (imageError) {
                                callback({ error: imageError });
                                return;
                            }
                            const { image: createdImage } = imageData;
                            newUser.image = createdImage;
                            userCallback();
                        },
                    });
                    return;
                }
                userCallback();
            });
        },
    });
}
function getUsersByUser({ token, includeInactive = false, callback, }) {
    authenticator.isUserAllowed({
        token,
        commandName: dbConfig.apiCommands.GetUsers.name,
        callback: ({ error, data, }) => {
            if (error) {
                callback({ error });
                return;
            }
            const { user: authUser } = data;
            getUsersByUser({
                user: authUser,
                includeInactive: authUser.accessLevel >= dbConfig.AccessLevels.MODERATOR
                    ?
                        true
                    :
                        includeInactive,
                includeOff: authUser.accessLevel >= dbConfig.apiCommands.IncludeOff.accessLevel,
                callback: ({ error: userError, data: userData, }) => {
                    if (userError) {
                        callback({ error: userError });
                        return;
                    }
                    const { users } = userData;
                    const allUsers = users.filter((user) => {
                        const { canSee } = authenticator.hasAccessTo({
                            toAuth: authUser,
                            objectToAccess: user,
                        });
                        return canSee;
                    })
                        .map((user) => {
                        const { hasFullAccess } = authenticator.hasAccessTo({
                            toAuth: authUser,
                            objectToAccess: user,
                        });
                        const userObject = user;
                        if (!hasFullAccess) {
                            return managerHelper.stripObject({ object: userObject });
                        }
                        return userObject;
                    })
                        .sort((a, b) => {
                        const aName = a.username;
                        const bName = b.username;
                        if (aName < bName) {
                            return -1;
                        }
                        if (aName > bName) {
                            return 1;
                        }
                        return 0;
                    });
                    callback({ data: { users: allUsers } });
                },
            });
        },
    });
}
function getUserById({ token, userId, username, internalCallUser, callback, }) {
    authenticator.isUserAllowed({
        token,
        internalCallUser,
        commandName: dbConfig.apiCommands.GetUser.name,
        callback: ({ error, data, }) => {
            if (error) {
                callback({ error });
                return;
            }
            const { user: authUser } = data;
            if (userId === authUser.objectId) {
                callback({ data });
                return;
            }
            getUserById({
                username,
                userId,
                callback: ({ error: userError, data: userData, }) => {
                    if (userError) {
                        callback({ error: userError });
                        return;
                    }
                    const { user: foundUser } = userData;
                    const { hasAccess, canSee, } = authenticator.hasAccessTo({
                        objectToAccess: foundUser,
                        toAuth: authUser,
                    });
                    if (!canSee) {
                        callback({ error: errorCreator.NotAllowed({ name: `user ${username || userId}` }) });
                        return;
                    }
                    if (!hasAccess) {
                        callback({ data: { user: managerHelper.stripObject({ object: foundUser }) } });
                        return;
                    }
                    callback({ data: userData });
                },
            });
        },
    });
}
function changePassword({ token, userId, password, callback, }) {
    authenticator.isUserAllowed({
        token,
        commandName: dbConfig.apiCommands.ChangePassword.name,
        callback: ({ error, data, }) => {
            if (error) {
                callback({ error });
                return;
            }
            const { user } = data;
            getUserById({
                token,
                userId,
                internalCallUser: user,
                callback: ({ error: getUserError, data: getUserData, }) => {
                    if (getUserError) {
                        callback({ error: getUserError });
                        return;
                    }
                    const { user: foundUser } = getUserData;
                    const { hasFullAccess, } = authenticator.hasAccessTo({
                        objectToAccess: foundUser,
                        toAuth: user,
                    });
                    if (!hasFullAccess) {
                        callback({ error: errorCreator.NotAllowed({ name: `change password ${userId}` }) });
                        return;
                    }
                    if (!password) {
                        const generatedPassword = textTools.generateTextCode(10);
                        bcrypt.hash(generatedPassword, 10, (hashError, hash) => {
                            if (hashError) {
                                callback({ error: new errorCreator.Internal({ errObject: hashError }) });
                                return;
                            }
                            dbUser.updateUserPassword({
                                userId,
                                password: hash,
                                callback: ({ error: passwordError }) => {
                                    if (passwordError) {
                                        callback({ error: passwordError });
                                        return;
                                    }
                                    callback({
                                        data: {
                                            success: true,
                                            user: {
                                                objectId: userId,
                                                password: generatedPassword,
                                            },
                                        },
                                    });
                                },
                            });
                        });
                        return;
                    }
                    bcrypt.hash(password, 10, (hashError, hash) => {
                        if (hashError) {
                            callback({ error: new errorCreator.Internal({ errObject: hashError }) });
                            return;
                        }
                        dbUser.updateUserPassword({
                            password: hash,
                            userId: foundUser.objectId,
                            callback: ({ error: updateError }) => {
                                if (updateError) {
                                    callback({ error: updateError });
                                    return;
                                }
                                callback({
                                    data: {
                                        success: true,
                                        user: { objectId: userId },
                                    },
                                });
                            },
                        });
                    });
                },
            });
        },
    });
}
function login({ user, socket, io, callback, }) {
    authenticator.createToken({
        username: user.username,
        password: user.password,
        callback: ({ error, data, }) => {
            if (error) {
                callback({ error });
                return;
            }
            const { token, user: authUser, } = data;
            const { accessLevel, partOfTeams = [], objectId: userId, followingRooms: roomIds, } = authUser;
            const socketId = socket.id;
            dbUser.updateOnline({
                userId,
                socketId,
                isOnline: true,
                callback: (socketData) => {
                    if (socketData.error) {
                        callback({ error: socketData.error });
                        return;
                    }
                    socketUtils.joinRooms({
                        io,
                        socketId,
                        userId,
                        roomIds: roomIds.concat(partOfTeams),
                    });
                    socketUtils.joinRequiredRooms({
                        io,
                        userId,
                        socketId,
                        socket,
                        accessLevel,
                    });
                    socketUtils.joinAliasRooms({
                        io,
                        socketId,
                        aliases: authUser.aliases,
                    });
                    callback({
                        data: {
                            user: authUser,
                            token,
                        },
                    });
                },
            });
        },
    });
}
function logout({ token, socket, callback, }) {
    authenticator.isUserAllowed({
        token,
        commandName: dbConfig.apiCommands.Logout.name,
        callback: ({ error, data, }) => {
            if (error) {
                callback({ error });
                return;
            }
            const { objectId: userId } = data.user;
            dbUser.updateOnline({
                userId,
                isOnline: false,
                callback: ({ error: socketError }) => {
                    if (socketError) {
                        callback({ error: socketError });
                        return;
                    }
                    positionManager.updatePosition({
                        positionId: userId,
                        position: {},
                        options: { resetConnectedToUser: true },
                        callback: () => {
                        },
                    });
                    roomManager.leaveSocketRooms(socket);
                    callback({ data: { success: true } });
                },
            });
        },
    });
}
function unbanUser({ token, bannedUserId, callback, io, }) {
    authenticator.isUserAllowed({
        token,
        commandName: dbConfig.apiCommands.UnbanUser.name,
        callback: ({ error }) => {
            if (error) {
                callback({ error });
                return;
            }
            dbUser.updateBanUser({
                shouldBan: false,
                userId: bannedUserId,
                callback: ({ error: unbanError }) => {
                    if (unbanError) {
                        callback({ error: unbanError });
                        return;
                    }
                    const dataToSend = {
                        data: {
                            user: {
                                objectId: bannedUserId,
                                isBanned: false,
                            },
                            changeType: dbConfig.ChangeTypes.UPDATE,
                        },
                    };
                    io.emit(dbConfig.EmitTypes.USER, dataToSend);
                    callback(dataToSend);
                },
            });
        },
    });
}
function banUser({ banUserId, reason, io, token, callback, }) {
    authenticator.isUserAllowed({
        token,
        commandName: dbConfig.apiCommands.BanUser.name,
        callback: ({ error, data, }) => {
            if (error) {
                callback({ error });
                return;
            }
            if (banUserId === data.user.objectId) {
                callback({ error: new errorCreator.InvalidData({ name: 'cannot ban self' }) });
                return;
            }
            const { user } = data;
            getUserById({
                token,
                userId: banUserId,
                internalCallUser: user,
                callback: ({ error: getUserError }) => {
                    if (getUserError) {
                        callback({ error: getUserError });
                        return;
                    }
                    dbUser.updateBanUser({
                        userId: banUserId,
                        shouldBan: true,
                        callback: ({ error: banError }) => {
                            if (banError) {
                                callback({ error: banError });
                                return;
                            }
                            const bannedSocket = io.sockets.connected[banUserId];
                            const banDataToSend = {
                                data: {
                                    reason,
                                    user: {
                                        isBanned: true,
                                        objectId: banUserId,
                                    },
                                    changeType: dbConfig.ChangeTypes.UPDATE,
                                },
                            };
                            const dataToSend = {
                                data: {
                                    user: {
                                        objectId: banUserId,
                                        isBanned: true,
                                    },
                                    changeType: dbConfig.ChangeTypes.UPDATE,
                                },
                            };
                            if (bannedSocket) {
                                roomManager.leaveSocketRooms(bannedSocket);
                            }
                            io.to(banUserId)
                                .emit(dbConfig.EmitTypes.BAN, banDataToSend);
                            io.emit(dbConfig.EmitTypes.USER, dataToSend);
                            callback(dataToSend);
                        },
                    });
                },
            });
        },
    });
}
function verifyUser({ userIdToVerify, token, io, callback, }) {
    authenticator.isUserAllowed({
        token,
        commandName: dbConfig.apiCommands.VerifyUser.name,
        callback: ({ error }) => {
            if (error) {
                callback({ error });
                return;
            }
            verifyUser({
                userId: userIdToVerify,
                callback: ({ error: verifyError }) => {
                    if (verifyError) {
                        callback({ error: verifyError });
                        return;
                    }
                    const dataToSend = {
                        data: {
                            user: {
                                objectId: userIdToVerify,
                                isVerified: true,
                            },
                            changeType: dbConfig.ChangeTypes.UPDATE,
                        },
                    };
                    io.emit(dbConfig.EmitTypes.USER, dataToSend);
                    callback(dataToSend);
                },
            });
        },
    });
}
function updateUser({ token, io, callback, userId, options, socket, image, user = {}, }) {
    authenticator.isUserAllowed({
        token,
        commandName: dbConfig.apiCommands.UpdateUser.name,
        callback: ({ error, data, }) => {
            if (error) {
                callback({ error });
                return;
            }
            const { user: authUser } = data;
            const userUpdate = user;
            const updateUserCallback = () => {
                getUserById({
                    token,
                    userId,
                    internalCallUser: authUser,
                    callback: ({ error: getUserError, data: getUserData, }) => {
                        if (getUserError) {
                            callback({ error: getUserError });
                            return;
                        }
                        if (userId === authUser.userId && dbConfig.apiCommands.UpdateSelf.accessLevel > authUser.accessLevel) {
                            callback({ error: new errorCreator.NotAllowed({ name: 'update self' }) });
                            return;
                        }
                        const { user: foundUser } = getUserData;
                        const { hasFullAccess, } = authenticator.hasAccessTo({
                            objectToAccess: foundUser,
                            toAuth: authUser,
                        });
                        if (!hasFullAccess) {
                            callback({ error: new errorCreator.NotAllowed({ name: `update user ${userId}` }) });
                            return;
                        }
                        if (user.accessLevel && (authUser.accessLevel < dbConfig.AccessLevels.ADMIN || user.accessLevel > dbConfig.AccessLevels.ADMIN)) {
                            callback({ error: new errorCreator.NotAllowed({ name: `update access level user ${userId}` }) });
                            return;
                        }
                        updateUser({
                            options,
                            userId,
                            user: userUpdate,
                            callback: ({ error: updateError, data: updateData, }) => {
                                if (updateError) {
                                    callback({ error: updateError });
                                    return;
                                }
                                const { user: updatedUser } = updateData;
                                const dataToSend = {
                                    data: {
                                        user: managerHelper.stripObject({ object: { ...updatedUser } }),
                                        changeType: dbConfig.ChangeTypes.UPDATE,
                                    },
                                };
                                const creatorDataToSend = {
                                    data: {
                                        user: updatedUser,
                                        changeType: dbConfig.ChangeTypes.UPDATE,
                                    },
                                };
                                if (socket) {
                                    socket.broadcast.emit(dbConfig.EmitTypes.USER, dataToSend);
                                }
                                else {
                                    io.emit(dbConfig.EmitTypes.USER, dataToSend);
                                }
                                callback(creatorDataToSend);
                            },
                        });
                    },
                });
            };
            if (image) {
                imager.createImage({
                    image,
                    callback: ({ error: imageError, data: imageData, }) => {
                        if (imageError) {
                            callback({ error: imageError });
                            return;
                        }
                        const { image: createdImage } = imageData;
                        userUpdate.image = createdImage;
                        updateUserCallback();
                    },
                });
                return;
            }
            updateUserCallback();
        },
    });
}
function updateId({ token, io, socket, callback, }) {
    authenticator.isUserAllowed({
        token,
        commandName: dbConfig.apiCommands.UpdateId.name,
        callback: ({ error, data, }) => {
            if (error) {
                callback({ error });
                return;
            }
            const { user: authUser } = data;
            const { accessLevel, partOfTeams = [], objectId: userId, followingRooms: roomIds, } = authUser;
            const socketId = socket.id;
            if (authUser.isAnonymous) {
                socketUtils.joinRequiredRooms({
                    io,
                    userId,
                    socketId,
                    socket,
                    accessLevel: 0,
                });
                callback({ data: { user: authUser } });
                return;
            }
            dbUser.updateOnline({
                userId,
                socketId,
                isOnline: true,
                callback: (socketData) => {
                    if (socketData.error) {
                        callback({ error: socketData.error });
                        return;
                    }
                    socketUtils.joinRooms({
                        io,
                        socketId,
                        userId,
                        roomIds: roomIds.concat(partOfTeams),
                    });
                    socketUtils.joinRequiredRooms({
                        io,
                        userId,
                        socketId,
                        socket,
                        accessLevel,
                    });
                    socketUtils.joinAliasRooms({
                        io,
                        socketId,
                        aliases: authUser.aliases,
                    });
                    callback({ data: { user: authUser } });
                },
            });
        },
    });
}
function getAllUsers({ token, internalCallUser, callback, }) {
    authenticator.isUserAllowed({
        token,
        internalCallUser,
        commandName: dbConfig.apiCommands.GetFull.name,
        callback: ({ error }) => {
            if (error) {
                callback({ error });
                return;
            }
            getAllUsers({ callback });
        },
    });
}
export { createUser };
export { getUserById };
export { changePassword };
export { login };
export { logout };
export { banUser };
export { unbanUser };
export { verifyUser };
export { updateUser };
export { getUsersByUser };
export { updateId };
export { getAllUsers };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXNlcnMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJ1c2Vycy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxZQUFZLENBQUM7QUFFYixPQUFPLE1BQU0sTUFBTSxRQUFRLENBQUM7QUFDNUIsT0FBTyxNQUFNLE1BQU0sdUJBQXVCLENBQUM7QUFDM0MsT0FBTyxRQUFRLE1BQU0seUJBQXlCLENBQUM7QUFDL0MsT0FBTyxFQUFFLFNBQVMsRUFBRSxRQUFRLEVBQUUsTUFBTSwyQkFBMkIsQ0FBQztBQUVoRSxPQUFPLFlBQVksTUFBTSx1QkFBdUIsQ0FBQztBQUNqRCxPQUFPLFNBQVMsTUFBTSxvQkFBb0IsQ0FBQztBQUMzQyxPQUFPLGFBQWEsTUFBTSwwQkFBMEIsQ0FBQztBQUNyRCxPQUFPLFdBQVcsTUFBTSxTQUFTLENBQUM7QUFDbEMsT0FBTyxNQUFNLE1BQU0sdUJBQXVCLENBQUM7QUFDM0MsT0FBTyxXQUFXLE1BQU0sbUJBQW1CLENBQUM7QUFDNUMsT0FBTyxPQUFPLE1BQU0sd0JBQXdCLENBQUM7QUFDN0MsT0FBTyxhQUFhLE1BQU0sb0JBQW9CLENBQUM7QUFDL0MsT0FBTyxlQUFlLE1BQU0sYUFBYSxDQUFDO0FBQzFDLE9BQU8sTUFBTSxNQUFNLG1CQUFtQixDQUFDO0FBQ3ZDLE9BQU8sY0FBYyxNQUFNLFlBQVksQ0FBQztBQVN4QyxTQUFTLFVBQVUsQ0FBQyxFQUNsQixLQUFLLEVBQ0wsSUFBSSxFQUNKLFFBQVEsRUFDUixFQUFFLEVBQ0YsT0FBTyxFQUNQLE1BQU0sRUFDTixLQUFLLEdBQ047SUFDQyxJQUFJLE9BQU8sQ0FBQztJQUVaLElBQUksU0FBUyxDQUFDLElBQUksS0FBSyxTQUFTLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxDQUFDO1FBQzVDLE9BQU8sR0FBRyxRQUFRLENBQUMsV0FBVyxDQUFDLGlCQUFpQixDQUFDO0lBQ25ELENBQUM7U0FBTSxJQUFJLFNBQVMsQ0FBQyxvQkFBb0IsRUFBRSxDQUFDO1FBQzFDLE9B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