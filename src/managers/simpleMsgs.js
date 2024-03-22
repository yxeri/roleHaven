'use strict';
import { appConfig, dbConfig } from '../config/defaults/config';
import errorCreator from '../error/errorCreator';
import objectValidator from '../utils/objectValidator';
import authenticator from '../helpers/authenticator';
import dbSimpleMsg from '../db/connectors/simpleMsg';
import managerHelper from '../helpers/manager';
function getSimpleMsgById({ token, callback, simpleMsgId, internalCallUser, }) {
    authenticator.isUserAllowed({
        commandName: dbConfig.apiCommands.GetSimpleMsgs.name,
        token,
        internalCallUser,
        callback: ({ error, data, }) => {
            if (error) {
                callback({ error });
                return;
            }
            const { user: authUser } = data;
            getSimpleMsgById({
                simpleMsgId,
                callback: ({ error: msgError, data: msgData, }) => {
                    if (msgError) {
                        callback({ error: msgError });
                        return;
                    }
                    const { simpleMsg: foundSimpleMsg } = msgData;
                    const { hasAccess, canSee, } = authenticator.hasAccessTo({
                        objectToAccess: foundSimpleMsg,
                        toAuth: authUser,
                    });
                    if (!canSee) {
                        callback({ error: new errorCreator.NotAllowed({ name: `get simplemsg ${simpleMsgId}` }) });
                        return;
                    }
                    if (!hasAccess) {
                        callback({ data: { simpleMsg: managerHelper.stripObject({ object: foundSimpleMsg }) } });
                        return;
                    }
                    callback({ data: msgData });
                },
            });
        },
    });
}
function sendSimpleMsg({ text, io, token, callback, socket, }) {
    authenticator.isUserAllowed({
        token,
        commandName: dbConfig.apiCommands.SendSimpleMsg.name,
        callback: ({ data, error, }) => {
            if (error) {
                callback({ error });
                return;
            }
            if (!objectValidator.isValidData({ text }, { text: true })) {
                callback({ error: new errorCreator.InvalidData({ expected: '{ text }' }) });
                return;
            }
            if (text.length === 0 || text.length > appConfig.messageMaxLength) {
                callback({ error: new errorCreator.InvalidCharacters({ expected: `text length 1-${appConfig.messageMaxLength}` }) });
                return;
            }
            const { user } = data;
            const simpleMsg = {
                text,
                ownerId: user.objectId,
            };
            dbSimpleMsg.createSimpleMsg({
                simpleMsg,
                callback: ({ error: createError, data: newData, }) => {
                    if (createError) {
                        callback({ error: createError });
                        return;
                    }
                    const dataToSend = {
                        data: {
                            simpleMsg: newData.simpleMsg,
                            changeType: dbConfig.ChangeTypes.CREATE,
                        },
                    };
                    if (socket) {
                        socket.broadcast.emit(dbConfig.EmitTypes.SIMPLEMSG, dataToSend);
                    }
                    else {
                        io.emit(dbConfig.EmitTypes.SIMPLEMSG, dataToSend);
                    }
                    callback(dataToSend);
                },
            });
        },
    });
}
function updateSimpleMsg({ token, callback, simpleMsgId, simpleMsg, io, options, socket, }) {
    authenticator.isUserAllowed({
        token,
        commandName: dbConfig.apiCommands.UpdateSimpleMsg.name,
        callback: ({ error, data, }) => {
            if (error) {
                callback({ error });
                return;
            }
            const { user: authUser } = data;
            getSimpleMsgById({
                simpleMsgId,
                internalCallUser: authUser,
                callback: ({ error: getError, data: getData, }) => {
                    if (getError) {
                        callback({ error: getError });
                        return;
                    }
                    const { simpleMsg: foundSimpleMsg } = getData;
                    const { hasFullAccess, } = authenticator.hasAccessTo({
                        objectToAccess: foundSimpleMsg,
                        toAuth: authUser,
                    });
                    if (!hasFullAccess) {
                        callback({ error: new errorCreator.NotAllowed({ name: `update simpleMsg ${simpleMsgId}` }) });
                        return;
                    }
                    updateSimpleMsg({
                        simpleMsgId,
                        simpleMsg,
                        options,
                        callback: ({ error: updateError, data: updateData, }) => {
                            if (updateError) {
                                callback({ error: updateError });
                                return;
                            }
                            const { simpleMsg: updatedMessage } = updateData;
                            const dataToSend = {
                                data: {
                                    simpleMsg: updatedMessage,
                                    changeType: dbConfig.ChangeTypes.UPDATE,
                                },
                            };
                            if (socket) {
                                socket.broadcast.emit(dbConfig.EmitTypes.SIMPLEMSG, dataToSend);
                            }
                            else {
                                io.emit(dbConfig.EmitTypes.SIMPLEMSG, dataToSend);
                            }
                            callback(dataToSend);
                        },
                    });
                },
            });
        },
    });
}
function removeSimpleMsg({ token, callback, simpleMsgId, io, socket, }) {
    authenticator.isUserAllowed({
        token,
        commandName: dbConfig.apiCommands.RemoveSimpleMsg.name,
        callback: ({ error, data, }) => {
            if (error) {
                callback({ error });
                return;
            }
            const { user: authUser } = data;
            getSimpleMsgById({
                simpleMsgId,
                internalCallUser: authUser,
                callback: ({ error: accessError, data: msgData, }) => {
                    if (accessError) {
                        callback({ error: accessError });
                        return;
                    }
                    const { simpleMsg } = msgData;
                    const { hasFullAccess, } = authenticator.hasAccessTo({
                        objectToAccess: simpleMsg,
                        toAuth: authUser,
                    });
                    if (!hasFullAccess) {
                        callback({ error: new errorCreator.NotAllowed({ name: `remove simpleMsg ${simpleMsgId}` }) });
                        return;
                    }
                    removeSimpleMsg({
                        simpleMsgId,
                        callback: ({ error: removeError }) => {
                            if (removeError) {
                                callback({ error: removeError });
                                return;
                            }
                            const dataToSend = {
                                data: {
                                    simpleMsg: { objectId: simpleMsgId },
                                    changeType: dbConfig.ChangeTypes.REMOVE,
                                },
                            };
                            if (socket) {
                                socket.broadcast.emit(dbConfig.EmitTypes.SIMPLEMSG, dataToSend);
                            }
                            else {
                                io.emit(dbConfig.EmitTypes.SIMPLEMSG, dataToSend);
                            }
                            callback(dataToSend);
                        },
                    });
                },
            });
        },
    });
}
function getSimpleMsgsByUser({ token, callback, }) {
    authenticator.isUserAllowed({
        token,
        commandName: dbConfig.apiCommands.GetSimpleMsgs.name,
        callback: ({ error, data, }) => {
            if (error) {
                callback({ error });
                return;
            }
            const { user: authUser } = data;
            dbSimpleMsg.getAllSimpleMsgs({
                callback: ({ error: getError, data: getData, }) => {
                    if (getError) {
                        callback({ error: getError });
                        return;
                    }
                    const { simpleMsgs } = getData;
                    const allSimpleMsgs = simpleMsgs.map((simpleMsg) => {
                        const { hasFullAccess } = authenticator.hasAccessTo({
                            toAuth: authUser,
                            objectToAccess: simpleMsg,
                        });
                        if (!hasFullAccess) {
                            return managerHelper.stripObject({ object: simpleMsg });
                        }
                        return simpleMsg;
                    });
                    callback({ data: { simpleMsgs: allSimpleMsgs } });
                },
            });
        },
    });
}
export { sendSimpleMsg };
export { getSimpleMsgsByUser };
export { updateSimpleMsg };
export { removeSimpleMsg };
export { getSimpleMsgById };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2ltcGxlTXNncy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInNpbXBsZU1zZ3MudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsWUFBWSxDQUFDO0FBRWIsT0FBTyxFQUFFLFNBQVMsRUFBRSxRQUFRLEVBQUUsTUFBTSwyQkFBMkIsQ0FBQztBQUVoRSxPQUFPLFlBQVksTUFBTSx1QkFBdUIsQ0FBQztBQUNqRCxPQUFPLGVBQWUsTUFBTSwwQkFBMEIsQ0FBQztBQUN2RCxPQUFPLGFBQWEsTUFBTSwwQkFBMEIsQ0FBQztBQUNyRCxPQUFPLFdBQVcsTUFBTSw0QkFBNEIsQ0FBQztBQUNyRCxPQUFPLGFBQWEsTUFBTSxvQkFBb0IsQ0FBQztBQVMvQyxTQUFTLGdCQUFnQixDQUFDLEVBQ3hCLEtBQUssRUFDTCxRQUFRLEVBQ1IsV0FBVyxFQUNYLGdCQUFnQixHQUNqQjtJQUNDLGFBQWEsQ0FBQyxhQUFhLENBQUM7UUFDMUIsV0FBVyxFQUFFLFFBQVEsQ0FBQyxXQUFXLENBQUMsYUFBYSxDQUFDLElBQUk7UUFDcEQsS0FBSztRQUNMLGdCQUFnQjtRQUNoQixRQUFRLEVBQUUsQ0FBQyxFQUNULEtBQUssRUFDTCxJQUFJLEdBQ0wsRUFBRSxFQUFFO1lBQ0gsSUFBSSxLQUFLLEVBQUUsQ0FBQztnQkFDVixRQUFRLENBQUMsRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDO2dCQUVwQixPQUFPO1lBQ1QsQ0FBQztZQUVELE1BQU0sRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLEdBQUcsSUFBSSxDQUFDO1lBRWhDLGdCQUFnQixDQUFDO2dCQUNmLFdBQVc7Z0JBQ1gsUUFBUSxFQUFFLENBQUMsRUFDVCxLQUFLLEVBQUUsUUFBUSxFQUNmLElBQUksRUFBRSxPQUFPLEdBQ2QsRUFBRSxFQUFFO29CQUNILElBQUksUUFBUSxFQUFFLENBQUM7d0JBQ2IsUUFBUSxDQUFDLEVBQUUsS0FBSyxFQUFFLFFBQVEsRUFBRSxDQUFDLENBQUM7d0JBRTlCLE9BQU87b0JBQ1Qs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