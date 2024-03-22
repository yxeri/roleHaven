'use strict';
import { dbConfig } from '../config/defaults/config';
import errorCreator from '../error/errorCreator';
import authenticator from './authenticator';
function stripObject({ object }) {
    const modifiedObject = object;
    modifiedObject.ownerId = modifiedObject.ownerAliasId || modifiedObject.ownerId;
    modifiedObject.lastUpdated = modifiedObject.customLastUpdated || modifiedObject.lastUpdated;
    modifiedObject.timeCreated = modifiedObject.customTimeCreated || modifiedObject.timeCreated;
    modifiedObject.teamAdminIds = [];
    modifiedObject.userAdminIds = [];
    modifiedObject.userIds = [];
    modifiedObject.teamIds = [];
    modifiedObject.bannedIds = [];
    modifiedObject.customTimeCreated = undefined;
    modifiedObject.customLastUpdated = undefined;
    modifiedObject.hasFullAccess = false;
    return modifiedObject;
}
function getObjectById({ token, objectId, objectType, objectIdType, callback, dbCallFunc, commandName, needsAccess, internalCallUser, searchParams = [], }) {
    authenticator.isUserAllowed({
        token,
        internalCallUser,
        commandName,
        callback: ({ error, data, }) => {
            if (error) {
                callback({ error });
                return;
            }
            const { user: authUser } = data;
            const dbCallParams = {
                callback: ({ error: getError, data: getData, }) => {
                    if (getError) {
                        callback({ error: getError });
                        return;
                    }
                    const foundObject = getData[objectType];
                    const { canSee, hasAccess, } = authenticator.hasAccessTo({
                        objectToAccess: foundObject,
                        toAuth: authUser,
                    });
                    if (!canSee || (needsAccess && !hasAccess)) {
                        callback({ error: new errorCreator.NotAllowed({ name: `${commandName}. User: ${authUser.objectId}. Access: ${objectType} ${objectId}` }) });
                        return;
                    }
                    if (!hasAccess) {
                        const dataToReturn = { data: {} };
                        dataToReturn.data[objectType] = stripObject({ object: foundObject });
                        callback(dataToReturn);
                        return;
                    }
                    const dataToReturn = {
                        data: {
                            authUser,
                            hasAccess,
                        },
                    };
                    dataToReturn.data[objectType] = foundObject;
                    callback(dataToReturn);
                },
            };
            dbCallParams[objectIdType] = objectId;
            searchParams.forEach((param) => {
                if (param.paramValue) {
                    const { paramName, paramValue, } = param;
                    dbCallParams[paramName] = paramValue;
                }
            });
            dbCallFunc(dbCallParams);
        },
    });
}
function getObjects({ token, objectsType, callback, dbCallFunc, commandName, internalCallUser, shouldSort, sortName, fallbackSortName, ignoreAuth = false, getParams = [], }) {
    authenticator.isUserAllowed({
        token,
        internalCallUser,
        commandName,
        callback: ({ error, data, }) => {
            if (error) {
                callback({ error });
                return;
            }
            const { user: authUser } = data;
            const dbCallParams = {
                user: authUser,
                callback: ({ error: getError, data: getData, }) => {
                    if (getError) {
                        callback({ error: getError });
                        return;
                    }
                    const objects = getData[objectsType];
                    const allObjects = objects.filter((object) => {
                        if (ignoreAuth) {
                            return true;
                        }
                        const { canSee } = authenticator.hasAccessTo({
                            toAuth: authUser,
                            objectToAccess: object,
                        });
                        return canSee;
                    })
                        .map((object) => {
                        if (ignoreAuth) {
                            return object;
                        }
                        const { hasFullAccess } = authenticator.hasAccessTo({
                            toAuth: authUser,
                            objectToAccess: object,
                        });
                        if (!hasFullAccess) {
                            return stripObject({ object });
                        }
                        return object;
                    });
                    const dataToReturn = {
                        data: { authUser },
                    };
                    if (shouldSort) {
                        dataToReturn.data[objectsType] = allObjects.sort((a, b) => {
                            const aName = a[sortName] || a[fallbackSortName];
                            const bName = b[sortName] || b[fallbackSortName];
                            if (aName < bName) {
                                return -1;
                            }
                            if (aName > bName) {
                                return 1;
                            }
                            return 0;
                        });
                    }
                    else {
                        dataToReturn.data[objectsType] = allObjects;
                    }
                    callback(dataToReturn);
                },
            };
            getParams.forEach((param) => {
                dbCallParams[param] = param;
            });
            dbCallFunc(dbCallParams);
        },
    });
}
function updateObject({ objectId, token, object, commandName, objectType, dbCallFunc, emitType, io, socket, objectIdType, getDbCallFunc, getCommandName, callback, internalCallUser, options, limitAccessLevel = false, toStrip = [], }) {
    authenticator.isUserAllowed({
        token,
        commandName,
        internalCallUser,
        callback: ({ error, data, }) => {
            if (error) {
                callback({ error });
                return;
            }
            const { user: authUser } = data;
            getObjectById({
                token,
                objectId,
                objectType,
                objectIdType,
                dbCallFunc: getDbCallFunc,
                commandName: getCommandName,
                internalCallUser: authUser,
                callback: ({ error: getError, data: getData, }) => {
                    if (getError) {
                        callback({ error: getError });
                        return;
                    }
                    const foundObject = getData[objectType];
                    const { hasFullAccess, } = authenticator.hasAccessTo({
                        objectToAccess: foundObject,
                        toAuth: authUser,
                    });
                    if (!hasFullAccess) {
                        callback({ error: new errorCreator.NotAllowed({ name: `${commandName}. User: ${authUser.objectId}. Access: ${objectType} ${objectId}` }) });
                        return;
                    }
                    const dbCallParams = {
                        options,
                        callback: ({ error: updateError, data: updated, }) => {
                            if (updateError) {
                                callback({ error: updateError });
                                return;
                            }
                            const updatedObject = updated[objectType];
                            const dataToSend = {
                                data: {
                                    changeType: dbConfig.ChangeTypes.UPDATE,
                                },
                            };
                            dataToSend.data[objectType] = stripObject({ object: { ...updatedObject } });
                            toStrip.forEach((stripVar) => {
                                dataToSend.data[objectType][stripVar] = undefined;
                            });
                            const creatorDataToSend = {
                                data: {
                                    changeType: dbConfig.ChangeTypes.UPDATE,
                                },
                            };
                            creatorDataToSend.data[objectType] = updatedObject;
                            if (socket) {
                                if (limitAccessLevel) {
                                    socket.broadcast.to(dbConfig.apiCommands.CreateTriggerEvent.accessLevel.toString())
                                        .emit(emitType, dataToSend);
                                }
                                else {
                                    socket.broadcast.emit(emitType, dataToSend);
                                }
                            }
                            else if (limitAccessLevel) {
                                io.to(dbConfig.apiCommands.CreateTriggerEvent.accessLevel.toString())
                                    .emit(emitType, dataToSend);
                            }
                            else {
                                io.emit(emitType, dataToSend);
                            }
                            callback(creatorDataToSend);
                        },
                    };
                    dbCallParams[objectIdType] = objectId;
                    dbCallParams[objectType] = object;
                    dbCallFunc(dbCallParams);
                },
            });
        },
    });
}
function removeObject({ objectId, token, commandName, objectType, dbCallFunc, emitType, io, objectIdType, getDbCallFunc, getCommandName, emitTypeGenerator, callback, socket, internalCallUser, }) {
    authenticator.isUserAllowed({
        token,
        internalCallUser,
        commandName,
        callback: ({ error, data, }) => {
            if (error) {
                callback({ error });
                return;
            }
            const { user: authUser } = data;
            getObjectById({
                token,
                objectId,
                objectType,
                objectIdType,
                dbCallFunc: getDbCallFunc,
                commandName: getCommandName,
                internalCallUser: authUser,
                callback: ({ error: getError, data: getData, }) => {
                    if (getError) {
                        callback({ error: getError });
                        return;
                    }
                    const foundObject = getData[objectType];
                    const { hasFullAccess, } = authenticator.hasAccessTo({
                        objectToAccess: foundObject,
                        toAuth: authUser,
                    });
                    if (!hasFullAccess) {
                        callback({ error: new errorCreator.NotAllowed({ name: `${commandName}. User: ${authUser.objectId}. Access: ${objectType} ${objectId}` }) });
                        return;
                    }
                    const dbCallParams = {
                        callback: ({ error: removeError }) => {
                            if (removeError) {
                                callback({ error: removeError });
                                return;
                            }
                            const dataToSend = {
                                data: {
                                    changeType: dbConfig.ChangeTypes.REMOVE,
                                },
                            };
                            dataToSend.data[objectType] = { objectId };
                            if (socket) {
                                socket.broadcast.emit(emitTypeGenerator
                                    ?
                                        emitTypeGenerator(foundObject)
                                    :
                                        emitType, dataToSend);
                            }
                            else {
                                io.emit(emitTypeGenerator
                                    ?
                                        emitTypeGenerator(foundObject)
                                    :
                                        emitType, dataToSend);
                            }
                            callback(dataToSend);
                        },
                    };
                    dbCallParams[objectIdType] = objectId;
                    dbCallFunc(dbCallParams);
                },
            });
        },
    });
}
function updateAccess({ objectId, token, teamAdminIds, userAdminIds, userIds, teamIds, bannedIds, shouldRemove, commandName, objectType, dbCallFunc, emitType, io, objectIdType, getDbCallFunc, getCommandName, callback, internalCallUser, options, socket, toStrip = [], }) {
    authenticator.isUserAllowed({
        token,
        commandName,
        internalCallUser,
        callback: ({ error, data, }) => {
            if (error) {
                callback({ error });
                return;
            }
            const { user: authUser } = data;
            getObjectById({
                token,
                objectId,
                objectType,
                objectIdType,
                dbCallFunc: getDbCallFunc,
                commandName: getCommandName,
                internalCallUser: authUser,
                callback: ({ error: getError, data: getData, }) => {
                    if (getError) {
                        callback({ error: getError });
                        return;
                    }
                    const foundObject = getData[objectType];
                    const { hasFullAccess, } = authenticator.hasAccessTo({
                        objectToAccess: foundObject,
                        toAuth: authUser,
                    });
                    if (!hasFullAccess) {
                        callback({ error: new errorCreator.NotAllowed({ name: `${commandName}. User: ${authUser.objectId}. Access: ${objectType} ${objectId}` }) });
                        return;
                    }
                    const dbCallParams = {
                        options,
                        teamAdminIds,
                        userAdminIds,
                        userIds,
                        teamIds,
                        bannedIds,
                        shouldRemove,
                        callback: ({ error: updateError }) => {
                            if (updateError) {
                                callback({ error: updateError });
                                return;
                            }
                            const dataToSend = {
                                data: {
                                    changeType: dbConfig.ChangeTypes.UPDATE,
                                },
                            };
                            dataToSend.data[objectType] = stripObject({ object: { ...foundObject } });
                            toStrip.forEach((stripVar) => {
                                dataToSend.data[objectType][stripVar] = undefined;
                            });
                            const creatorDataToSend = {
                                data: {
                                    changeType: dbConfig.ChangeTypes.UPDATE,
                                },
                            };
                            creatorDataToSend.data[objectType] = foundObject;
                            if (socket) {
                                socket.broadcast.emit(emitType, dataToSend);
                            }
                            else {
                                io.emit(emitType, dataToSend);
                            }
                            callback(creatorDataToSend);
                        },
                    };
                    dbCallParams[objectIdType] = objectId;
                    dbCallFunc(dbCallParams);
                },
            });
        },
    });
}
export { stripObject };
export { removeObject };
export { getObjectById };
export { updateObject };
export { getObjects };
export { updateAccess };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFuYWdlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm1hbmFnZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsWUFBWSxDQUFDO0FBRWIsT0FBTyxFQUFFLFFBQVEsRUFBRSxNQUFNLDJCQUEyQixDQUFDO0FBQ3JELE9BQU8sWUFBWSxNQUFNLHVCQUF1QixDQUFDO0FBQ2pELE9BQU8sYUFBYSxNQUFNLGlCQUFpQixDQUFDO0FBUTVDLFNBQVMsV0FBVyxDQUFDLEVBQUUsTUFBTSxFQUFFO0lBQzdCLE1BQU0sY0FBYyxHQUFHLE1BQU0sQ0FBQztJQUU5QixjQUFjLENBQUMsT0FBTyxHQUFHLGNBQWMsQ0FBQyxZQUFZLElBQUksY0FBYyxDQUFDLE9BQU8sQ0FBQztJQUMvRSxjQUFjLENBQUMsV0FBVyxHQUFHLGNBQWMsQ0FBQyxpQkFBaUIsSUFBSSxjQUFjLENBQUMsV0FBVyxDQUFDO0lBQzVGLGNBQWMsQ0FBQyxXQUFXLEdBQUcsY0FBYyxDQUFDLGlCQUFpQixJQUFJLGNBQWMsQ0FBQyxXQUFXLENBQUM7SUFDNUYsY0FBYyxDQUFDLFlBQVksR0FBRyxFQUFFLENBQUM7SUFDakMsY0FBYyxDQUFDLFlBQVksR0FBRyxFQUFFLENBQUM7SUFDakMsY0FBYyxDQUFDLE9BQU8sR0FBRyxFQUFFLENBQUM7SUFDNUIsY0FBYyxDQUFDLE9BQU8sR0FBRyxFQUFFLENBQUM7SUFDNUIsY0FBYyxDQUFDLFNBQVMsR0FBRyxFQUFFLENBQUM7SUFDOUIsY0FBYyxDQUFDLGlCQUFpQixHQUFHLFNBQVMsQ0FBQztJQUM3QyxjQUFjLENBQUMsaUJBQWlCLEdBQUcsU0FBUyxDQUFDO0lBQzdDLGNBQWMsQ0FBQyxhQUFhLEdBQUcsS0FBSyxDQUFDO0lBRXJDLE9BQU8sY0FBYyxDQUFDO0FBQ3hCLENBQUM7QUFjRCxTQUFTLGFBQWEsQ0FBQyxFQUNyQixLQUFLLEVBQ0wsUUFBUSxFQUNSLFVBQVUsRUFDVixZQUFZLEVBQ1osUUFBUSxFQUNSLFVBQVUsRUFDVixX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