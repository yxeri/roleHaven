'use strict';
import dbAlias from '../db/connectors/alias';
import { appConfig, dbConfig } from '../config/defaults/config';
import errorCreator from '../error/errorCreator';
import textTools from '../utils/textTools';
import authenticator from '../helpers/authenticator';
import dbRoom from '../db/connectors/room';
import socketUtils from '../utils/socketIo';
import dbWallet from '../db/connectors/wallet';
import managerHelper from '../helpers/manager';
import imager from '../helpers/imager';
function createAlias({ token, io, alias, socket, image, callback, }) {
    authenticator.isUserAllowed({
        token,
        commandName: dbConfig.apiCommands.CreateAlias.name,
        callback: ({ error, data, }) => {
            if (error) {
                callback({ error });
                return;
            }
            const { user: authUser } = data;
            if (alias.aliasName.length > appConfig.usernameMaxLength || alias.aliasName.length < appConfig.usernameMinLength) {
                callback({ error: new errorCreator.InvalidCharacters({ name: `Alias length: ${appConfig.usernameMinLength}-${appConfig.usernameMaxLength}` }) });
                return;
            }
            if (!textTools.isAllowedFull(alias.aliasName)) {
                callback({
                    error: new errorCreator.InvalidCharacters({ name: `Alias: ${alias.aliasName}.` }),
                });
                return;
            }
            if (dbConfig.protectedNames.includes(alias.aliasName.toLowerCase())) {
                callback({
                    error: new errorCreator.InvalidCharacters({
                        name: `protected name ${alias.aliasName}`,
                        extraData: { param: 'aliasName' },
                    }),
                });
                return;
            }
            if (alias.visibility && authUser.accessLevel < dbConfig.apiCommands.UpdateAliasVisibility.accessLevel) {
                callback({ error: new errorCreator.NotAllowed({ name: 'Set alias visibility' }) });
                return;
            }
            const aliasToSave = alias;
            aliasToSave.ownerId = authUser.objectId;
            aliasToSave.aliasName = textTools.trimSpace(aliasToSave.aliasName);
            aliasToSave.aliasNameLowerCase = aliasToSave.aliasName.toLowerCase();
            aliasToSave.accessLevel = dbConfig.AccessLevels.STANDARD;
            const aliasCallback = () => {
                createAlias({
                    alias: aliasToSave,
                    callback: ({ error: aliasError, data: aliasData, }) => {
                        if (aliasError) {
                            callback({ error: aliasError });
                            return;
                        }
                        const { alias: createdAlias } = aliasData;
                        dbRoom.createRoom({
                            options: { setId: true },
                            room: {
                                objectId: createdAlias.objectId,
                                ownerId: authUser.objectId,
                                roomName: createdAlias.objectId,
                                roomId: createdAlias.objectId,
                                accessLevel: dbConfig.AccessLevels.SUPERUSER,
                                visibility: dbConfig.AccessLevels.SUPERUSER,
                                isUser: true,
                                nameIsLocked: true,
                            },
                            callback: ({ error: roomError, data: roomData, }) => {
                                if (roomError) {
                                    callback({ error: roomError });
                                    return;
                                }
                                const wallet = {
                                    objectId: createdAlias.objectId,
                                    ownerId: authUser.objectId,
                                    ownerAliasId: createdAlias.objectId,
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
                                        const createdWallet = walletData.wallet;
                                        const createdRoom = roomData.room;
                                        const dataToSend = {
                                            data: {
                                                user: managerHelper.stripObject({ object: createdAlias }),
                                                changeType: dbConfig.ChangeTypes.CREATE,
                                            },
                                        };
                                        const creatorDataToSend = {
                                            data: {
                                                isSender: true,
                                                wallet: createdWallet,
                                                room: createdRoom,
                                                alias: createdAlias,
                                                changeType: dbConfig.ChangeTypes.CREATE,
                                            },
                                        };
                                        const roomDataToSend = {
                                            data: {
                                                room: managerHelper.stripObject({ object: createdRoom }),
                                                changeType: dbConfig.ChangeTypes.CREATE,
                                            },
                                        };
                                        const creatorRoomData = {
                                            data: {
                                                room: createdRoom,
                                                changeType: dbConfig.ChangeTypes.CREATE,
                                            },
                                        };
                                        const walletDataToSend = {
                                            data: {
                                                wallet: managerHelper.stripObject({ object: createdWallet }),
                                                changeType: dbConfig.ChangeTypes.CREATE,
                                            },
                                        };
                                        const creatorWalletData = {
                                            data: {
                                                wallet: createdWallet,
                                                changeType: dbConfig.ChangeTypes.CREATE,
                                            },
                                        };
                                        if (socket) {
                                            socket.join(createdAlias.objectId);
                                            io.to(authUser.objectId)
                                                .emit(dbConfig.EmitTypes.ROOM, creatorRoomData);
                                            io.to(authUser.objectId)
                                                .emit(dbConfig.EmitTypes.WALLET, creatorWalletData);
                                            io.to(authUser.objectId)
                                                .emit(dbConfig.EmitTypes.USER, {
                                                data: {
                                                    user: {
                                                        objectId: authUser.objectId,
                                                        aliases: authUser.aliases.concat([createdAlias.objectId]),
                                                    },
                                                    changeType: dbConfig.ChangeTypes.UPDATE,
                                                },
                                            });
                                            socket.broadcast.emit(dbConfig.EmitTypes.WALLET, walletDataToSend);
                                            socket.broadcast.emit(dbConfig.EmitTypes.ROOM, roomDataToSend);
                                            socket.broadcast.emit(dbConfig.EmitTypes.USER, dataToSend);
                                        }
                                        else {
                                            const userSocket = socketUtils.getUserSocket({
                                                io,
                                                socketId: authUser.socketId,
                                            });
                                            if (userSocket) {
                                                userSocket.join(createdAlias.objectId);
                                            }
                                            io.emit(dbConfig.EmitTypes.ROOM, roomDataToSend);
                                            io.emit(dbConfig.EmitTypes.WALLET, walletDataToSend);
                                            io.emit(dbConfig.EmitTypes.USER, dataToSend);
                                            io.to(createdAlias.objectId)
                                                .emit(dbConfig.EmitTypes.ALIAS, creatorDataToSend);
                                            io.to(authUser.objectId)
                                                .emit(dbConfig.EmitTypes.WALLET, creatorWalletData);
                                            io.to(authUser.objectId)
                                                .emit(dbConfig.EmitTypes.ROOM, creatorRoomData);
                                            io.to(authUser.objectId)
                                                .emit(dbConfig.EmitTypes.USER, {
                                                data: {
                                                    user: {
                                                        objectId: authUser.objectId,
                                                        aliases: authUser.aliases.concat([createdAlias.objectId]),
                                                    },
                                                    changeType: dbConfig.ChangeTypes.UPDATE,
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
                        aliasToSave.image = createdImage;
                        aliasCallback();
                    },
                });
                return;
            }
            aliasCallback();
        },
    });
}
function getAliasById({ token, aliasId, aliasName, callback, internalCallUser, }) {
    authenticator.isUserAllowed({
        token,
        internalCallUser,
        commandName: dbConfig.apiCommands.GetAliases.name,
        callback: ({ error, data, }) => {
            if (error) {
                callback({ error });
                return;
            }
            const { user } = data;
            getAliasById({
                aliasId,
                aliasName,
                callback: ({ error: getAliasError, data: getAliasData, }) => {
                    if (getAliasError) {
                        callback({ error: getAliasError });
                        return;
                    }
                    const { alias } = getAliasData;
                    const { canSee, hasAccess, } = authenticator.hasAccessTo({
                        objectToAccess: alias,
                        toAuth: user,
                    });
                    if (!canSee) {
                        callback({ error: errorCreator.NotAllowed({ name: `alias ${aliasName || aliasId}` }) });
                        return;
                    }
                    if (!hasAccess) {
                        callback({ data: { alias: managerHelper.stripObject({ object: alias }) } });
                        return;
                    }
                    callback({ data: { alias } });
                },
            });
        },
    });
}
function getAliasesByUser({ token, callback, }) {
    authenticator.isUserAllowed({
        token,
        commandName: dbConfig.apiCommands.GetAliases.name,
        callback: ({ error, data, }) => {
            if (error) {
                callback({ error });
                return;
            }
            const { user: authUser } = data;
            getAliasesByUser({
                user: authUser,
                callback: ({ error: getAliasesError, data: getAliasesData, }) => {
                    if (getAliasesError) {
                        callback({ error: getAliasesError });
                        return;
                    }
                    const { aliases } = getAliasesData;
                    const allAliases = aliases.filter((alias) => {
                        const { canSee } = authenticator.hasAccessTo({
                            toAuth: authUser,
                            objectToAccess: alias,
                        });
                        return canSee;
                    })
                        .map((alias) => {
                        const { hasFullAccess } = authenticator.hasAccessTo({
                            toAuth: authUser,
                            objectToAccess: alias,
                        });
                        if (!hasFullAccess) {
                            return managerHelper.stripObject({ object: alias });
                        }
                        return alias;
                    })
                        .sort((a, b) => {
                        const aName = a.aliasName;
                        const bName = b.aliasName;
                        if (aName < bName) {
                            return -1;
                        }
                        if (aName > bName) {
                            return 1;
                        }
                        return 0;
                    });
                    callback({ data: { aliases: allAliases } });
                },
            });
        },
    });
}
function updateAlias({ token, callback, alias, options, aliasId, io, socket, image, }) {
    authenticator.isUserAllowed({
        token,
        commandName: dbConfig.apiCommands.UpdateAlias.name,
        callback: ({ error, data, }) => {
            if (error) {
                callback({ error });
                return;
            }
            const { user: authUser } = data;
            const aliasUpdate = alias;
            getAliasById({
                aliasId,
                token,
                callback: ({ error: aliasError, data: aliasData, }) => {
                    if (aliasError) {
                        callback({ error: aliasError });
                        return;
                    }
                    const { alias: foundAlias } = aliasData;
                    const { hasFullAccess, } = authenticator.hasAccessTo({
                        objectToAccess: foundAlias,
                        toAuth: authUser,
                    });
                    if (!hasFullAccess) {
                        callback({ error: new errorCreator.NotAllowed({ name: `alias ${aliasId}` }) });
                        return;
                    }
                    const updateCallback = () => {
                        updateAlias({
                            options,
                            aliasId,
                            alias: aliasUpdate,
                            callback: ({ error: updateAliasError, data: updateAliasData, }) => {
                                if (updateAliasError) {
                                    callback({ error: updateAliasError });
                                    return;
                                }
                                const { alias: updatedAlias } = updateAliasData;
                                const aliasToSend = { ...updatedAlias };
                                aliasToSend.username = aliasToSend.aliasName;
                                aliasToSend.aliasName = undefined;
                                const aliasDataToSend = {
                                    data: {
                                        isSender: true,
                                        alias: updatedAlias,
                                        changeType: dbConfig.ChangeTypes.UPDATE,
                                    },
                                };
                                const dataToSend = {
                                    data: {
                                        user: managerHelper.stripObject({ object: aliasToSend }),
                                        changeType: dbConfig.ChangeTypes.UPDATE,
                                    },
                                };
                                if (socket) {
                                    socket.broadcast.emit(dbConfig.EmitTypes.USER, dataToSend);
                                }
                                else {
                                    io.emit(dbConfig.EmitTypes.USER, dataToSend);
                                    io.to(updatedAlias.objectId)
                                        .emit(dbConfig.EmitTypes.ALIAS, aliasDataToSend);
                                }
                                callback(aliasDataToSend);
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
                                aliasUpdate.image = createdImage;
                                updateCallback();
                            },
                        });
                        return;
                    }
                    updateCallback();
                },
            });
        },
    });
}
function updateAccess({ token, aliasId, teamAdminIds, userAdminIds, userIds, teamIds, bannedIds, shouldRemove, io, callback, }) {
    authenticator.isUserAllowed({
        token,
        commandName: dbConfig.apiCommands.UpdateAlias.name,
        callback: ({ error, data, }) => {
            if (error) {
                callback({ error });
                return;
            }
            const { user } = data;
            getAliasById({
                aliasId,
                internalCallUser: user,
                callback: ({ error: aliasError, data: aliasData, }) => {
                    if (aliasError) {
                        callback({ error: aliasError });
                        return;
                    }
                    const { alias } = aliasData;
                    const { hasFullAccess, } = authenticator.hasAccessTo({
                        objectToAccess: alias,
                        toAuth: user,
                    });
                    if (!hasFullAccess) {
                        callback({ error: new errorCreator.NotAllowed({ name: `alias ${aliasId}` }) });
                        return;
                    }
                    const dbFunc = shouldRemove
                        ?
                            dbAlias.removeAccess
                        :
                            dbAlias.addAccess;
                    dbFunc({
                        userIds,
                        teamIds,
                        bannedIds,
                        teamAdminIds,
                        userAdminIds,
                        aliasId,
                        callback: ({ error: accessError, data: accessData, }) => {
                            if (accessError) {
                                callback({ error: accessError });
                                return;
                            }
                            const { alias: updatedAlias } = accessData;
                            const creatorDataToSend = {
                                data: {
                                    docFile: updatedAlias,
                                    isSender: true,
                                    changeType: dbConfig.ChangeTypes.UPDATE,
                                },
                            };
                            const dataToSend = {
                                data: {
                                    docFile: managerHelper.stripObject({ object: updatedAlias }),
                                    changeType: dbConfig.ChangeTypes.UPDATE,
                                },
                            };
                            io.emit(dbConfig.EmitTypes.USER, dataToSend);
                            io.to(updatedAlias.ownerId)
                                .emit(dbConfig.EmitTypes.USER, creatorDataToSend);
                            callback(creatorDataToSend);
                        },
                    });
                },
            });
        },
    });
}
function getAllAliases({ token, internalCallUser, callback, }) {
    authenticator.isUserAllowed({
        token,
        internalCallUser,
        commandName: dbConfig.apiCommands.GetFull.name,
        callback: ({ error }) => {
            if (error) {
                callback({ error });
                return;
            }
            getAllAliases({ callback });
        },
    });
}
export { createAlias };
export { updateAlias };
export { getAliasById };
export { getAliasesByUser };
export { updateAccess };
export { getAllAliases };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWxpYXNlcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImFsaWFzZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsWUFBWSxDQUFDO0FBRWIsT0FBTyxPQUFPLE1BQU0sd0JBQXdCLENBQUM7QUFDN0MsT0FBTyxFQUFFLFNBQVMsRUFBRSxRQUFRLEVBQUUsTUFBTSwyQkFBMkIsQ0FBQztBQUVoRSxPQUFPLFlBQVksTUFBTSx1QkFBdUIsQ0FBQztBQUNqRCxPQUFPLFNBQVMsTUFBTSxvQkFBb0IsQ0FBQztBQUMzQyxPQUFPLGFBQWEsTUFBTSwwQkFBMEIsQ0FBQztBQUNyRCxPQUFPLE1BQU0sTUFBTSx1QkFBdUIsQ0FBQztBQUMzQyxPQUFPLFdBQVcsTUFBTSxtQkFBbUIsQ0FBQztBQUM1QyxPQUFPLFFBQVEsTUFBTSx5QkFBeUIsQ0FBQztBQUMvQyxPQUFPLGFBQWEsTUFBTSxvQkFBb0IsQ0FBQztBQUMvQyxPQUFPLE1BQU0sTUFBTSxtQkFBbUIsQ0FBQztBQVN2QyxTQUFTLFdBQVcsQ0FBQyxFQUNuQixLQUFLLEVBQ0wsRUFBRSxFQUNGLEtBQUssRUFDTCxNQUFNLEVBQ04sS0FBSyxFQUNMLFFBQVEsR0FDVDtJQUNDLGFBQWEsQ0FBQyxhQUFhLENBQUM7UUFDMUIsS0FBSztRQUNMLFdBQVcsRUFBRSxRQUFRLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxJQUFJO1FBQ2xELFFBQVEsRUFBRSxDQUFDLEVBQ1QsS0FBSyxFQUNMLElBQUksR0FDTCxFQUFFLEVBQUU7WUFDSCxJQUFJLEtBQUssRUFBRSxDQUFDO2dCQUNWLFFBQVEsQ0FBQyxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUM7Z0JBRXBCLE9BQU87WUFDVCxDQUFDO1lBRUQsTUFBTSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsR0FBRyxJQUFJLENBQUM7WUFFaEMsSUFBSSxLQUFLLENBQUMsU0FBUyxDQUFDLE1BQU0sR0FBRyxTQUFTLENBQUMsaUJBQWlCLElBQUksS0FBSyxDQUFD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