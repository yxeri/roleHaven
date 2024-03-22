import { dbConfig } from '../config/defaults/config';
import dbTriggerEvent from '../db/connectors/triggerEvent';
import dbUser from '../db/connectors/user';
import errorCreator from '../error/errorCreator';
import authenticator from '../helpers/authenticator';
import managerHelper from '../helpers/manager';
import docFileManager from './docFiles';
import messageManager from './messages';
import positionManager from './positions';
const timedTriggers = new Map();
let baseIo;
function updateTriggerEvent({ eventId, triggerEvent, token, io, callback, socket, internalCallUser, options = {}, }) {
    managerHelper.updateObject({
        options,
        token,
        io,
        socket,
        internalCallUser,
        objectId: eventId,
        object: triggerEvent,
        commandName: dbConfig.apiCommands.UpdateTriggerEvent.name,
        objectType: 'triggerEvent',
        dbCallFunc: updateTriggerEvent,
        emitType: dbConfig.EmitTypes.TRIGGEREVENT,
        objectIdType: 'eventId',
        getDbCallFunc: getTriggerEventById,
        getCommandName: dbConfig.apiCommands.GetTriggerEvents.name,
        callback: ({ error, data, }) => {
            if (error) {
                callback({ error });
                return;
            }
            const { triggerEvent: updatedTriggerEvent } = data;
            if (!triggerEvent.isRecurring && !triggerEvent.endTime && !triggerEvent.startTime) {
                timedTriggers.delete(eventId);
            }
            else if (triggerEvent.startTime || triggerEvent.endTime || triggerEvent.isRecurring) {
                updatedTriggerEvent.updating = false;
                timedTriggers.set(eventId, updatedTriggerEvent);
            }
            callback({ data });
        },
    });
}
function getTriggerEventsByOwner({ token, callback, }) {
    managerHelper.getObjects({
        callback,
        token,
        commandName: dbConfig.apiCommands.GetTriggerEvents.name,
        objectsType: 'triggerEvents',
        dbCallFunc: getTriggerEventsByOwner,
    });
}
function removeTriggerEvent({ eventId, token, callback, io, socket, internalCallUser, }) {
    timedTriggers.delete(eventId);
    managerHelper.removeObject({
        callback,
        token,
        io,
        socket,
        internalCallUser,
        getDbCallFunc: getTriggerEventById,
        getCommandName: dbConfig.apiCommands.GetTriggerEvents.name,
        objectId: eventId,
        commandName: dbConfig.apiCommands.RemoveTriggerEvent.name,
        objectType: 'triggerEvent',
        dbCallFunc: removeTriggerEvent,
        emitType: dbConfig.EmitTypes.TRIGGEREVENT,
        objectIdType: 'eventId',
    });
}
function createTriggerEvent({ triggerEvent, token, io, internalCallUser, callback, socket, }) {
    authenticator.isUserAllowed({
        token,
        internalCallUser,
        commandName: dbConfig.apiCommands.CreateTriggerEvent.name,
        callback: ({ error, data, }) => {
            if (error) {
                callback({ error });
                return;
            }
            if (!Object.values(dbConfig.TriggerEventTypes)
                .includes(triggerEvent.eventType)) {
                callback({
                    error: new errorCreator.InvalidData({
                        expected: `Event type ${Object.values(dbConfig.TriggerEventTypes)
                            .toString()}`,
                    }),
                });
                return;
            }
            if (!Object.values(dbConfig.TriggerChangeTypes)
                .includes(triggerEvent.changeType)) {
                callback({
                    error: new errorCreator.InvalidData({
                        expected: `Change type ${Object.values(dbConfig.TriggerChangeTypes)
                            .toString()}`,
                    }),
                });
                return;
            }
            const { user: authUser } = data;
            const newTriggerEvent = triggerEvent;
            newTriggerEvent.ownerId = authUser.objectId;
            if (!newTriggerEvent.startTime && (newTriggerEvent.terminationTime || newTriggerEvent.isRecurring)) {
                newTriggerEvent.startTime = new Date();
            }
            if (newTriggerEvent.isRecurring) {
                newTriggerEvent.singleUse = false;
                if (!newTriggerEvent.iterations) {
                    newTriggerEvent.iterations = 2;
                }
            }
            if (newTriggerEvent.triggerType) {
                if (newTriggerEvent.triggerType === dbConfig.TriggerTypes.PROXIMITY) {
                    if (!newTriggerEvent.coordinates) {
                        callback({ error: new errorCreator.InvalidData({ expected: 'Coordinates { longitude, latitude, radius }' }) });
                        return;
                    }
                }
            }
            createTriggerEvent({
                triggerEvent: newTriggerEvent,
                callback: ({ error: updateError, data: eventData, }) => {
                    if (updateError) {
                        callback({ error: updateError });
                        return;
                    }
                    const { triggerEvent: createdEvent } = eventData;
                    const dataToSend = {
                        data: {
                            triggerEvent: managerHelper.stripObject({ object: { ...createdEvent } }),
                            changeType: dbConfig.ChangeTypes.CREATE,
                        },
                    };
                    const ioRoom = Number.parseInt(dbConfig.apiCommands.CreateTriggerEvent.accessLevel, 10);
                    if ([dbConfig.TriggerTypes.TIMED, dbConfig.TriggerTypes.PROXIMITY].includes(triggerEvent.triggerType)
                        && (createdEvent.isRecurring || createdEvent.startTime || createdEvent.terminationTime)) {
                        timedTriggers.set(createdEvent.objectId, createdEvent);
                    }
                    if (socket) {
                        socket.to(ioRoom)
                            .broadcast
                            .emit(dbConfig.EmitTypes.TRIGGEREVENT, dataToSend);
                    }
                    else {
                        io.to(ioRoom)
                            .emit(dbConfig.EmitTypes.TRIGGEREVENT, dataToSend);
                    }
                    callback({
                        data: {
                            triggerEvent: createdEvent,
                            changeType: dbConfig.ChangeTypes.CREATE,
                        },
                    });
                },
            });
        },
    });
}
function getTriggerEventById({ eventId, token, callback, internalCallUser, }) {
    managerHelper.getObjectById({
        token,
        internalCallUser,
        callback,
        objectId: eventId,
        objectType: 'triggerEvent',
        objectIdType: 'eventId',
        dbCallFunc: getTriggerEventById,
        commandName: dbConfig.apiCommands.GetTriggerEvents.name,
    });
}
function runEvent({ eventId, callback, }) {
    getTriggerEventById({
        eventId,
        callback: ({ error, data, }) => {
            if (error) {
                callback({ error });
                return;
            }
            const { triggerEvent } = data;
            dbUser.getUserById({
                userId: triggerEvent.ownerId,
                callback: ({ error: userError, data: userData, }) => {
                    if (userError) {
                        callback({ error: userError });
                        return;
                    }
                    const { user } = userData;
                    const io = baseIo;
                    if (triggerEvent.changeType === dbConfig.TriggerChangeTypes.CREATE) {
                        if (triggerEvent.eventType === dbConfig.TriggerEventTypes.CHATMSG) {
                            const { image, message, } = triggerEvent.content;
                            messageManager.sendChatMsg({
                                callback: () => {
                                },
                                io,
                                message,
                                image,
                                internalCallUser: user,
                            });
                        }
                        else if (triggerEvent.eventType === dbConfig.TriggerEventTypes.DOCFILE) {
                            docFileManager.createDocFile({
                                io,
                                callback: () => {
                                },
                                internalCallUser: user,
                                docFile: triggerEvent.content.docFile,
                            });
                        }
                        else if (triggerEvent.eventType === dbConfig.TriggerEventTypes.POSITION) {
                            positionManager.createPosition({
                                io,
                                callback: () => {
                                },
                                internalCallUser: user,
                                position: triggerEvent.content.position,
                            });
                        }
                    }
                    else if (triggerEvent.changeType === dbConfig.TriggerChangeTypes.UPDATE) {
                        if (triggerEvent.eventType === dbConfig.TriggerEventTypes.CHATMSG) {
                            const { messageId, message, } = triggerEvent.content;
                            messageManager.updateMessage({
                                io,
                                message,
                                messageId,
                                callback: () => {
                                },
                                internalCallUser: user,
                            });
                        }
                        else if (triggerEvent.eventType === dbConfig.TriggerEventTypes.DOCFILE) {
                            const { docFileId, docFile, } = triggerEvent.content;
                            docFileManager.updateDocFile({
                                docFile,
                                docFileId,
                                callback: () => {
                                },
                                io,
                                internalCallUser: user,
                            });
                        }
                        else if (triggerEvent.eventType === dbConfig.TriggerEventTypes.POSITION) {
                            const { positionId, position, } = triggerEvent.content;
                            positionManager.updatePosition({
                                position,
                                positionId,
                                io,
                                callback: () => {
                                },
                                internalCallUser: user,
                            });
                        }
                    }
                    else if (triggerEvent.changeType === dbConfig.TriggerChangeTypes.REMOVE) {
                        if (triggerEvent.eventType === dbConfig.TriggerEventTypes.CHATMSG) {
                            const { messageId, } = triggerEvent.content;
                            messageManager.removeMesssage({
                                io,
                                messageId,
                                callback: () => {
                                },
                                internalCallUser: user,
                            });
                        }
                        else if (triggerEvent.eventType === dbConfig.TriggerEventTypes.DOCFILE) {
                            const { docFileId, } = triggerEvent.content;
                            docFileManager.removeDocFile({
                                docFileId,
                                callback: () => {
                                },
                                io,
                                internalCallUser: user,
                            });
                        }
                        else if (triggerEvent.eventType === dbConfig.TriggerEventTypes.POSITION) {
                            const { positionId, } = triggerEvent.content;
                            positionManager.removePosition({
                                positionId,
                                io,
                                callback: () => {
                                },
                                internalCallUser: user,
                            });
                        }
                    }
                    if ((triggerEvent.isRecurring || triggerEvent.iterations) && triggerEvent.iterations > 0) {
                        updateTriggerEvent({
                            eventId,
                            io,
                            triggerEvent: {
                                iterations: triggerEvent.iterations - 1,
                                startTime: triggerEvent.isRecurring
                                    ? new Date()
                                    : undefined,
                            },
                            internalCallUser: user,
                            callback: ({ error: updateError, data: updateData, }) => {
                                if (updateError) {
                                    callback({ error: updateError });
                                    return;
                                }
                                timedTriggers.get(triggerEvent.objectId).updating = false;
                                callback({ data: updateData });
                            },
                        });
                    }
                    else if (triggerEvent.singleUse || triggerEvent.iterations <= 0) {
                        removeTriggerEvent({
                            eventId,
                            io,
                            callback,
                            internalCallUser: user,
                        });
                    }
                },
            });
        },
    });
}
function startTriggers(io) {
    baseIo = io;
    dbTriggerEvent.getTimedTriggerEvents({
        callback: ({ error, data, }) => {
            if (error) {
                return;
            }
            const { triggerEvents } = data;
            triggerEvents.forEach((triggerEvent) => {
                timedTriggers.set(triggerEvent.objectId, triggerEvent);
            });
            setInterval(() => {
                timedTriggers.forEach((triggerEvent) => {
                    const { objectId: eventId, } = triggerEvent;
                    const now = new Date();
                    const startTime = new Date(triggerEvent.startTime);
                    if (now > startTime && !triggerEvent.updating) {
                        const future = new Date(startTime);
                        future.setSeconds(future.getSeconds() + (triggerEvent.duration || 0));
                        if (triggerEvent.terminationTime && now > triggerEvent.terminationTime) {
                            dbUser.getUserById({
                                userId: triggerEvent.ownerId,
                                callback: ({ error: userError, data: userData, }) => {
                                    if (userError) {
                                        return;
                                    }
                                    const { user } = userData;
                                    removeTriggerEvent({
                                        eventId,
                                        io,
                                        internalCallUser: user,
                                        callback: ({ error: runError }) => {
                                            if (runError) {
                                                timedTriggers.delete(eventId);
                                            }
                                        },
                                    });
                                },
                            });
                        }
                        else if (triggerEvent.singleUse || (triggerEvent.isRecurring && now > future)) {
                            timedTriggers.get(eventId).updating = true;
                            runEvent({
                                eventId,
                                callback: ({ error: runError }) => {
                                    if (runError) {
                                        timedTriggers.delete(eventId);
                                    }
                                },
                            });
                        }
                    }
                });
            }, 100);
        },
    });
}
export { updateTriggerEvent };
export { getTriggerEventsByOwner };
export { removeTriggerEvent };
export { createTriggerEvent };
export { getTriggerEventById };
export { runEvent };
export { startTriggers };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHJpZ2dlckV2ZW50cy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInRyaWdnZXJFdmVudHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLFFBQVEsRUFBRSxNQUFNLDJCQUEyQixDQUFDO0FBRXJELE9BQU8sY0FBYyxNQUFNLCtCQUErQixDQUFDO0FBQzNELE9BQU8sTUFBTSxNQUFNLHVCQUF1QixDQUFDO0FBQzNDLE9BQU8sWUFBWSxNQUFNLHVCQUF1QixDQUFDO0FBQ2pELE9BQU8sYUFBYSxNQUFNLDBCQUEwQixDQUFDO0FBQ3JELE9BQU8sYUFBYSxNQUFNLG9CQUFvQixDQUFDO0FBQy9DLE9BQU8sY0FBYyxNQUFNLFlBQVksQ0FBQztBQUN4QyxPQUFPLGNBQWMsTUFBTSxZQUFZLENBQUM7QUFDeEMsT0FBTyxlQUFlLE1BQU0sYUFBYSxDQUFDO0FBRTFDLE1BQU0sYUFBYSxHQUFHLElBQUksR0FBRyxFQUFFLENBQUM7QUFDaEMsSUFBSSxNQUFNLENBQUM7QUFZWCxTQUFTLGtCQUFrQixDQUFDLEVBQzFCLE9BQU8sRUFDUCxZQUFZLEVBQ1osS0FBSyxFQUNMLEVBQUUsRUFDRixRQUFRLEVBQ1IsTUFBTSxFQUNOLGdCQUFnQixFQUNoQixPQUFPLEdBQUcsRUFBRSxHQUNiO0lBQ0MsYUFBYSxDQUFDLFlBQVksQ0FBQztRQUN6QixPQUFPO1FBQ1AsS0FBSztRQUNMLEVBQUU7UUFDRixNQUFNO1FBQ04sZ0JBQWdCO1FBQ2hCLFFBQVEsRUFBRSxPQUFPO1FBQ2pCLE1BQU0sRUFBRSxZQUFZO1FBQ3BCLFdBQVcsRUFBRSxRQUFRLENBQUMsV0FBVyxDQUFDLGtCQUFrQixDQUFDLElBQUk7UUFDekQsVUFBVSxFQUFFLGNBQWM7UUFDMUIsVUFBVSxFQUFFLGtCQUFrQjtRQUM5QixRQUFRLEVBQUUsUUFBUSxDQUFDLFNBQVMsQ0FBQyxZQUFZO1FBQ3pDLFlBQVksRUFBRSxTQUFTO1FBQ3ZCLGFBQWEsRUFBRSxtQkFBbUI7UUFDbEMs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