'use strict';
import { appConfig, dbConfig } from '../config/defaults/config';
import errorCreator from '../error/errorCreator';
import textTools from '../utils/textTools';
import dbDocFile from '../db/connectors/docFile';
import authenticator from '../helpers/authenticator';
import objectValidator from '../utils/objectValidator';
import managerHelper from '../helpers/manager';
import imager from '../helpers/imager';
function getFileByAccess({ user, docFile, }) {
    const { hasAccess, hasFullAccess, } = authenticator.hasAccessTo({
        objectToAccess: docFile,
        toAuth: user,
    });
    if (hasFullAccess) {
        const fullDocFile = docFile;
        fullDocFile.isLocked = false;
        return {
            docFile: fullDocFile,
            isLocked: false,
        };
    }
    if (hasAccess) {
        const strippedDocFile = managerHelper.stripObject({ object: docFile });
        strippedDocFile.isLocked = false;
        return {
            docFile: strippedDocFile,
            isLocked: false,
        };
    }
    const strippedDocFile = managerHelper.stripObject({ object: docFile });
    strippedDocFile.text = undefined;
    strippedDocFile.code = undefined;
    strippedDocFile.pictures = [];
    strippedDocFile.videoCodes = [];
    strippedDocFile.isLocked = true;
    return {
        docFile: strippedDocFile,
        isLocked: true,
    };
}
function saveAndTransmitDocFile({ docFile, callback, io, socket, }) {
    createDocFile({
        docFile,
        callback: ({ error: createError, data: createData, }) => {
            if (createError) {
                callback({ error: createError });
                return;
            }
            const { docFile: newDocFile } = createData;
            const fullDocFile = { ...newDocFile };
            if (!newDocFile.isPublic) {
                newDocFile.isLocked = true;
                newDocFile.code = undefined;
                newDocFile.text = undefined;
                newDocFile.pictures = undefined;
            }
            const creatorDataToSend = {
                data: {
                    isSender: true,
                    docFile: fullDocFile,
                    changeType: dbConfig.ChangeTypes.CREATE,
                },
            };
            const dataToSend = {
                data: {
                    docFile: managerHelper.stripObject({ object: newDocFile }),
                    changeType: dbConfig.ChangeTypes.CREATE,
                },
            };
            if (socket) {
                socket.broadcast.emit(dbConfig.EmitTypes.DOCFILE, dataToSend);
            }
            else {
                io.emit(dbConfig.EmitTypes.DOCFILE, dataToSend);
                io.to(docFile.ownerAliasId || docFile.ownerId)
                    .emit(dbConfig.EmitTypes.DOCFILE, {
                    data: {
                        isSender: true,
                        docFile: fullDocFile,
                        changeType: dbConfig.ChangeTypes.UPDATE,
                    },
                });
            }
            callback(creatorDataToSend);
        },
    });
}
function getDocFile({ docFileId, code, token, callback, internalCallUser, }) {
    if (code) {
        authenticator.isUserAllowed({
            token,
            internalCallUser,
            commandName: dbConfig.apiCommands.GetDocFile.name,
            callback: ({ error, data, }) => {
                if (error) {
                    callback({ error });
                    return;
                }
                const { user: authUser } = data;
                dbDocFile.getDocFileByCode({
                    code,
                    callback: (docFileData) => {
                        if (docFileData.error) {
                            callback({ error: docFileData.error });
                            return;
                        }
                        const foundDocFile = docFileData.data.docFile;
                        const dataToSend = {
                            data: {
                                docFile: foundDocFile,
                                changeType: dbConfig.ChangeTypes.UPDATE,
                            },
                        };
                        if (foundDocFile.code !== code || foundDocFile.accessLevel > authUser.accessLevel) {
                            callback({ error: new errorCreator.NotAllowed({ name: `docFile ${code}` }) });
                            return;
                        }
                        callback(dataToSend);
                    },
                });
            },
        });
    }
    managerHelper.getObjectById({
        token,
        internalCallUser,
        callback,
        objectId: docFileId,
        objectType: 'docFile',
        objectIdType: 'docFileId',
        dbCallFunc: dbDocFile.getDocFileById,
        commandName: dbConfig.apiCommands.GetDocFile.name,
    });
}
function createDocFile({ token, io, docFile, callback, socket, internalCallUser, images, }) {
    authenticator.isUserAllowed({
        token,
        internalCallUser,
        commandName: dbConfig.apiCommands.CreateDocFile.name,
        callback: ({ error, data, }) => {
            if (error) {
                callback({ error });
                return;
            }
            if (!objectValidator.isValidData({ docFile }, {
                docFile: {
                    text: true,
                    title: true,
                },
            })) {
                callback({ error: new errorCreator.InvalidData({ expected: '{ docFile: { text, title } }' }) });
                return;
            }
            if (docFile.code && (!textTools.hasAllowedText(docFile.code) || docFile.code.length > appConfig.docFileCodeMaxLength || docFile.code < appConfig.docFileCodeMinLength)) {
                callback({ error: new errorCreator.InvalidCharacters({ expected: `Alphanumeric ${docFile.code}. Code length: ${appConfig.docFileCodeMinLength} - ${appConfig.docFileCodeMaxLength}` }) });
                return;
            }
            if (docFile.text.join('').length > appConfig.docFileMaxLength || docFile.text.join('') < appConfig.docFileMinLength) {
                callback({ error: new errorCreator.InvalidCharacters({ expected: `Text length: ${appConfig.docFileMinLength} - ${appConfig.docFileMaxLength}` }) });
                return;
            }
            if (docFile.title.length > appConfig.docFileTitleMaxLength || docFile.title < appConfig.docFileTitleMinLength) {
                callback({ error: new errorCreator.InvalidCharacters({ expected: `Title length: ${appConfig.docFileTitleMinLength} - ${appConfig.docFileTitleMaxLength}` }) });
                return;
            }
            const { user: authUser } = data;
            const newDocFile = docFile;
            newDocFile.ownerId = authUser.objectId;
            newDocFile.code = newDocFile.code || textTools.generateTextCode();
            if (newDocFile.ownerAliasId && !authUser.aliases.includes(newDocFile.ownerAliasId)) {
                callback({ error: new errorCreator.NotAllowed({ name: `create position with alias ${newDocFile.ownerAliasId}` }) });
                return;
            }
            if (images) {
                imager.createImage({
                    image: images[0],
                    callback: ({ error: imageError, data: imageData, }) => {
                        if (imageError) {
                            callback({ error: imageError });
                            return;
                        }
                        const { image: createdImage } = imageData;
                        newDocFile.images = [createdImage];
                        saveAndTransmitDocFile({
                            io,
                            callback,
                            socket,
                            docFile: newDocFile,
                        });
                    },
                });
                return;
            }
            saveAndTransmitDocFile({
                io,
                callback,
                socket,
                docFile: newDocFile,
            });
        },
    });
}
function updateDocFile({ docFile, docFileId, io, token, callback, options, socket, internalCallUser, }) {
    authenticator.isUserAllowed({
        token,
        internalCallUser,
        commandName: dbConfig.apiCommands.UpdateDocFile.name,
        callback: ({ error, data, }) => {
            if (error) {
                callback({ error });
                return;
            }
            if (docFile.text && docFile.text.join('').length > appConfig.docFileMaxLength) {
                callback({ error: new errorCreator.InvalidCharacters({ expected: `Text length: ${appConfig.docFileMaxLength}.` }) });
                return;
            }
            if (docFile.title && docFile.title.length > appConfig.docFileTitleMaxLength) {
                callback({ error: new errorCreator.InvalidCharacters({ expected: `Title length: ${appConfig.docFileTitleMaxLength}` }) });
                return;
            }
            const { user: authUser } = data;
            getDocFile({
                docFileId,
                internalCallUser: authUser,
                callback: ({ error: getDocFileError, data: getDocFileData, }) => {
                    if (getDocFileError) {
                        callback({ error: getDocFileError });
                        return;
                    }
                    const { docFile: foundDocFile } = getDocFileData;
                    const { hasFullAccess, } = authenticator.hasAccessTo({
                        objectToAccess: foundDocFile,
                        toAuth: authUser,
                    });
                    if (!hasFullAccess) {
                        callback({ error: new errorCreator.NotAllowed({ name: `${dbConfig.apiCommands.UpdateDocFile.name}. User: ${authUser.objectId}. Access: docFile ${docFileId}` }) });
                        return;
                    }
                    updateDocFile({
                        docFile,
                        options,
                        docFileId,
                        callback: ({ error: updateError, data: updateData, }) => {
                            if (updateError) {
                                callback({ error: updateError });
                                return;
                            }
                            const { docFile: updatedDocFile } = updateData;
                            const filteredDocFile = getFileByAccess({
                                user: authUser,
                                docFile: updatedDocFile,
                            }).docFile;
                            const dataToSend = {
                                data: {
                                    docFile: managerHelper.stripObject({ object: filteredDocFile }),
                                    changeType: dbConfig.ChangeTypes.UPDATE,
                                },
                            };
                            const dataToReturn = {
                                data: {
                                    docFile: updateData.docFile,
                                    changeType: dbConfig.ChangeTypes.UPDATE,
                                },
                            };
                            if (socket) {
                                socket.broadcast.emit(dbConfig.EmitTypes.DOCFILE, dataToSend);
                            }
                            else {
                                io.emit(dbConfig.EmitTypes.DOCFILE, dataToSend);
                                io.to(authUser.objectId)
                                    .emit(dbConfig.EmitTypes.DOCFILE, dataToReturn);
                            }
                            callback(dataToReturn);
                        },
                    });
                },
            });
        },
    });
}
function unlockDocFile({ io, docFileId, code, token, callback, internalCallUser, aliasId, socket, }) {
    authenticator.isUserAllowed({
        token,
        internalCallUser,
        commandName: dbConfig.apiCommands.GetDocFile.name,
        callback: ({ error, data, }) => {
            if (error) {
                callback({ error });
                return;
            }
            const { user: authUser } = data;
            dbDocFile.getDocFileById({
                docFileId,
                callback: (docFileData) => {
                    if (docFileData.error) {
                        callback({ error: docFileData.error });
                        return;
                    }
                    const foundDocFile = docFileData.data.docFile;
                    const dataToSend = {
                        data: {
                            docFile: foundDocFile,
                            changeType: dbConfig.ChangeTypes.UPDATE,
                        },
                    };
                    if (foundDocFile.code !== code || foundDocFile.accessLevel > authUser.accessLevel) {
                        callback({ error: new errorCreator.NotAllowed({ name: `docFile ${code}` }) });
                        return;
                    }
                    if (authUser.isAnonymous) {
                        if (!socket) {
                            io.to(authUser.objectId)
                                .emit(dbConfig.EmitTypes.DOCFILE, dataToSend);
                        }
                        callback(dataToSend);
                        return;
                    }
                    updateAccess({
                        docFileId: foundDocFile.objectId,
                        userIds: [aliasId || authUser.objectId],
                        callback: (accessData) => {
                            if (accessData.error) {
                                callback({ error: accessData.error });
                                return;
                            }
                            if (!socket) {
                                io.to(authUser.objectId)
                                    .emit(dbConfig.EmitTypes.DOCFILE, dataToSend);
                            }
                            callback(dataToSend);
                        },
                    });
                },
            });
        },
    });
}
function removeDocFile({ docFileId, token, callback, io, internalCallUser, socket, }) {
    managerHelper.removeObject({
        callback,
        token,
        io,
        socket,
        internalCallUser,
        getDbCallFunc: dbDocFile.getDocFileById,
        getCommandName: dbConfig.apiCommands.GetDocFile.name,
        objectId: docFileId,
        commandName: dbConfig.apiCommands.RemoveDocFile.name,
        objectType: 'docFile',
        dbCallFunc: removeDocFile,
        emitType: dbConfig.EmitTypes.DOCFILE,
        objectIdType: 'docFileId',
    });
}
function getDocFilesByUser({ token, callback, }) {
    managerHelper.getObjects({
        token,
        ignoreAuth: true,
        shouldSort: true,
        sortName: 'title',
        commandName: dbConfig.apiCommands.GetDocFile.name,
        objectsType: 'docFiles',
        dbCallFunc: getDocFilesByUser,
        callback: ({ error, data, }) => {
            if (error) {
                callback({ error });
                return;
            }
            const { authUser, docFiles, } = data;
            callback({
                data: {
                    docFiles: docFiles.map((docFile) => getFileByAccess({
                        user: authUser,
                        docFile,
                    }).docFile),
                },
            });
        },
    });
}
function updateAccess({ token, docFileId, teamAdminIds, userAdminIds, userIds, teamIds, bannedIds, shouldRemove, callback, }) {
    authenticator.isUserAllowed({
        token,
        commandName: dbConfig.apiCommands.UpdateDocFile.name,
        callback: ({ error, data, }) => {
            if (error) {
                callback({ error });
                return;
            }
            const { user: authUser } = data;
            getDocFile({
                docFileId,
                internalCallUser: authUser,
                callback: ({ error: docFileError, data: docFileData, }) => {
                    if (docFileError) {
                        callback({ error: docFileError });
                        return;
                    }
                    const { docFile } = docFileData;
                    const { hasFullAccess, } = authenticator.hasAccessTo({
                        objectToAccess: docFile,
                        toAuth: authUser,
                    });
                    if (!hasFullAccess) {
                        callback({ error: errorCreator.NotAllowed({ name: `docFile ${docFileId}` }) });
                        return;
                    }
                    updateAccess({
                        shouldRemove,
                        userIds,
                        teamIds,
                        bannedIds,
                        teamAdminIds,
                        userAdminIds,
                        docFileId,
                        callback,
                    });
                },
            });
        },
    });
}
export { createDocFile };
export { updateDocFile };
export { unlockDocFile };
export { getDocFile };
export { removeDocFile };
export { getDocFilesByUser };
export { updateAccess };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZG9jRmlsZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJkb2NGaWxlcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxZQUFZLENBQUM7QUFFYixPQUFPLEVBQUUsU0FBUyxFQUFFLFFBQVEsRUFBRSxNQUFNLDJCQUEyQixDQUFDO0FBRWhFLE9BQU8sWUFBWSxNQUFNLHVCQUF1QixDQUFDO0FBQ2pELE9BQU8sU0FBUyxNQUFNLG9CQUFvQixDQUFDO0FBQzNDLE9BQU8sU0FBUyxNQUFNLDBCQUEwQixDQUFDO0FBQ2pELE9BQU8sYUFBYSxNQUFNLDBCQUEwQixDQUFDO0FBQ3JELE9BQU8sZUFBZSxNQUFNLDBCQUEwQixDQUFDO0FBQ3ZELE9BQU8sYUFBYSxNQUFNLG9CQUFvQixDQUFDO0FBQy9DLE9BQU8sTUFBTSxNQUFNLG1CQUFtQixDQUFDO0FBTXZDLFNBQVMsZUFBZSxDQUFDLEVBQ3ZCLElBQUksRUFDSixPQUFPLEdBQ1I7SUFDQyxNQUFNLEVBQ0osU0FBUyxFQUNULGFBQWEsR0FDZCxHQUFHLGFBQWEsQ0FBQyxXQUFXLENBQUM7UUFDNUIsY0FBYyxFQUFFLE9BQU87UUFDdkIsTUFBTSxFQUFFLElBQUk7S0FDYixDQUFDLENBQUM7SUFFSCxJQUFJLGFBQWEsRUFBRSxDQUFDO1FBQ2xCLE1BQU0sV0FBVyxHQUFHLE9BQU8sQ0FBQztRQUM1QixXQUFXLENBQUMsUUFBUSxHQUFHLEtBQUssQ0FBQztRQUU3QixPQUFPO1lBQ0wsT0FBTyxFQUFFLFdBQVc7WUFDcEIsUUFBUSxFQUFFLEtBQUs7U0FDaEIsQ0FBQztJQUNKLENBQUM7SUFFRCxJQUFJLFNBQVMsRUFBRSxDQUFDO1FBQ2QsTUFBTSxlQUFlLEdBQUcsYUFBYSxDQUFDLFdBQVcsQ0FBQyxFQUFFLE1BQU0sRUFBRSxPQUFPLEVBQUUsQ0FBQyxDQUFDO1FBQ3ZFLGVBQWUsQ0FBQyxRQUFRLEdBQUcsS0FBSyxDQUFDO1FBRWpDLE9BQU87WUFDTCxPQUFPLEVBQUUsZUFBZTtZQUN4QixR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