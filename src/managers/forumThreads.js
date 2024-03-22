'use strict';
import dbThread from '../db/connectors/forumThread';
import { dbConfig } from '../config/defaults/config';
import errorCreator from '../error/errorCreator';
import authenticator from '../helpers/authenticator';
import forumManager from './forums';
import managerHelper from '../helpers/manager';
function getThreadById({ threadId, token, internalCallUser, needsAccess, callback, }) {
    managerHelper.getObjectById({
        token,
        internalCallUser,
        callback,
        needsAccess,
        objectId: threadId,
        objectType: 'thread',
        objectIdType: 'threadId',
        dbCallFunc: getThreadById,
        commandName: dbConfig.apiCommands.GetForumThread.name,
    });
}
function createThread({ thread, callback, token, io, socket, }) {
    authenticator.isUserAllowed({
        token,
        commandName: dbConfig.apiCommands.CreateForumThread.name,
        callback: ({ error, data, }) => {
            if (error) {
                callback({ error });
                return;
            }
            const { user: authUser } = data;
            forumManager.getForumById({
                internalCallUser: authUser,
                forumId: thread.forumId,
                needsAccess: true,
                callback: ({ error: forumError }) => {
                    if (forumError) {
                        callback({ error: forumError });
                        return;
                    }
                    const threadToCreate = thread;
                    threadToCreate.ownerId = authUser.objectId;
                    if (threadToCreate.ownerAliasId && !authUser.aliases.includes(threadToCreate.ownerAliasId)) {
                        callback({ error: new errorCreator.NotAllowed({ name: `create thread with alias ${threadToCreate.ownerAliasId}` }) });
                        return;
                    }
                    createThread({
                        thread: threadToCreate,
                        callback: ({ error: createError, data: createData, }) => {
                            if (createError) {
                                callback({ error: createError });
                                return;
                            }
                            const { thread: createdThread } = createData;
                            forumManager.updateForumTime({
                                forumId: thread.forumId,
                                callback: ({ error: updateError }) => {
                                    if (updateError) {
                                        callback({ error: updateError });
                                        return;
                                    }
                                    const dataToSend = {
                                        data: {
                                            thread: managerHelper.stripObject({ object: { ...createdThread } }),
                                            changeType: dbConfig.ChangeTypes.CREATE,
                                        },
                                    };
                                    if (socket) {
                                        socket.broadcast.emit(dbConfig.EmitTypes.FORUMTHREAD, dataToSend);
                                    }
                                    else {
                                        io.emit(dbConfig.EmitTypes.FORUMTHREAD, dataToSend);
                                        io.to(thread.ownerAliasId || authUser.objectId)
                                            .emit(dbConfig.EmitTypes.FORUMTHREAD, {
                                            data: {
                                                thread: createdThread,
                                                changeType: dbConfig.ChangeTypes.UPDATE,
                                            },
                                        });
                                    }
                                    callback({
                                        data: {
                                            thread: createdThread,
                                            changeType: dbConfig.ChangeTypes.CREATE,
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
function getForumThreadsByForum({ forumId, callback, internalCallUser, token, }) {
    managerHelper.getObjects({
        callback,
        token,
        internalCallUser,
        getParams: [forumId],
        shouldSort: true,
        sortName: 'customLastUpdated',
        fallbackSortName: 'lastUpdated',
        commandName: dbConfig.apiCommands.GetForumThread.name,
        objectsType: 'threads',
        dbCallFunc: dbThread.getThreadsByForum,
    });
}
function getThreadsByUser({ token, callback, }) {
    managerHelper.getObjects({
        callback,
        token,
        shouldSort: true,
        sortName: 'customLastUpdated',
        fallbackSortName: 'lastUpdated',
        commandName: dbConfig.apiCommands.GetForumThread.name,
        objectsType: 'threads',
        dbCallFunc: getThreadsByUser,
    });
}
function updateThread({ token, thread, threadId, options, callback, io, socket, }) {
    managerHelper.updateObject({
        callback,
        options,
        token,
        io,
        socket,
        objectId: threadId,
        object: thread,
        commandName: dbConfig.apiCommands.UpdateForumThread.name,
        objectType: 'thread',
        dbCallFunc: updateThread,
        emitType: dbConfig.EmitTypes.FORUMTHREAD,
        objectIdType: 'threadId',
        getDbCallFunc: getThreadById,
        getCommandName: dbConfig.apiCommands.GetForumThread.name,
    });
}
function removeThread({ token, threadId, callback, io, socket, }) {
    managerHelper.removeObject({
        callback,
        token,
        io,
        socket,
        getDbCallFunc: getThreadById,
        getCommandName: dbConfig.apiCommands.GetForumThread.name,
        objectId: threadId,
        commandName: dbConfig.apiCommands.RemoveForumThread.name,
        objectType: 'thread',
        dbCallFunc: removeThread,
        emitType: dbConfig.EmitTypes.FORUMTHREAD,
        objectIdType: 'threadId',
    });
}
function getAllThreads({ callback, token, }) {
    authenticator.isUserAllowed({
        token,
        commandName: dbConfig.apiCommands.GetFull.name,
        callback: ({ error }) => {
            if (error) {
                callback({ error });
                return;
            }
            getAllThreads({ callback });
        },
    });
}
function updateThreadTime({ threadId, forumId, callback, }) {
    updateThread({
        threadId,
        thread: {},
        callback: ({ error }) => {
            if (error) {
                callback({ error });
                return;
            }
            if (forumId) {
                forumManager.updateForumTime({
                    forumId,
                    callback,
                });
            }
        },
    });
}
function updateAccess({ token, threadId, teamAdminIds, userAdminIds, userIds, teamIds, bannedIds, shouldRemove, internalCallUser, callback, }) {
    authenticator.isUserAllowed({
        token,
        internalCallUser,
        commandName: dbConfig.apiCommands.UpdateForumThread.name,
        callback: ({ error, data, }) => {
            if (error) {
                callback({ error });
                return;
            }
            const { user: authUser } = data;
            getThreadById({
                threadId,
                internalCallUser: authUser,
                callback: ({ error: threadError, data: threadData, }) => {
                    if (threadError) {
                        callback({ error: threadError });
                        return;
                    }
                    const { thread } = threadData;
                    const { hasFullAccess, } = authenticator.hasAccessTo({
                        objectToAccess: thread,
                        toAuth: authUser,
                    });
                    if (!hasFullAccess) {
                        callback({ error: new errorCreator.NotAllowed({ name: `${dbConfig.apiCommands.UpdateForumThread.name}. User: ${authUser.objectId}. Access: forum thread ${threadId}` }) });
                        return;
                    }
                    updateAccess({
                        shouldRemove,
                        userIds,
                        teamIds,
                        bannedIds,
                        teamAdminIds,
                        userAdminIds,
                        threadId,
                        callback,
                    });
                },
            });
        },
    });
}
export { createThread };
export { updateThread };
export { removeThread };
export { getForumThreadsByForum };
export { getAllThreads };
export { getThreadById };
export { getThreadsByUser };
export { updateThreadTime };
export { updateAccess };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZm9ydW1UaHJlYWRzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZm9ydW1UaHJlYWRzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFlBQVksQ0FBQztBQUViLE9BQU8sUUFBUSxNQUFNLDhCQUE4QixDQUFDO0FBQ3BELE9BQU8sRUFBRSxRQUFRLEVBQUUsTUFBTSwyQkFBMkIsQ0FBQztBQUVyRCxPQUFPLFlBQVksTUFBTSx1QkFBdUIsQ0FBQztBQUNqRCxPQUFPLGFBQWEsTUFBTSwwQkFBMEIsQ0FBQztBQUNyRCxPQUFPLFlBQVksTUFBTSxVQUFVLENBQUM7QUFDcEMsT0FBTyxhQUFhLE1BQU0sb0JBQW9CLENBQUM7QUFTL0MsU0FBUyxhQUFhLENBQUMsRUFDckIsUUFBUSxFQUNSLEtBQUssRUFDTCxnQkFBZ0IsRUFDaEIsV0FBVyxFQUNYLFFBQVEsR0FDVDtJQUNDLGFBQWEsQ0FBQyxhQUFhLENBQUM7UUFDMUIsS0FBSztRQUNMLGdCQUFnQjtRQUNoQixRQUFRO1FBQ1IsV0FBVztRQUNYLFFBQVEsRUFBRSxRQUFRO1FBQ2xCLFVBQVUsRUFBRSxRQUFRO1FBQ3BCLFlBQVksRUFBRSxVQUFVO1FBQ3hCLFVBQVUsRUFBRSxhQUFhO1FBQ3pCLFdBQVcsRUFBRSxRQUFRLENBQUMsV0FBVyxDQUFDLGNBQWMsQ0FBQyxJQUFJO0tBQ3RELENBQUMsQ0FBQztBQUNMLENBQUM7QUFVRCxTQUFTLFlBQVksQ0FBQyxFQUNwQixNQUFNLEVBQ04sUUFBUSxFQUNSLEtBQUssRUFDTCxFQUFFLEVBQ0YsTUFBTSxHQUNQO0lBQ0MsYUFBYSxDQUFDLGFBQWEsQ0FBQztRQUMxQixLQUFLO1FBQ0wsV0FBVyxFQUFFLFFBQVEsQ0FBQyxXQUFXLENBQUMsaUJBQWlCLENBQUMsSUFBSTtRQUN4RCxRQUFRLEVBQUUsQ0FBQyxFQUNULEtBQUssRUFDTCxJQUFJLEdBQ0wsRUFBRSxFQUFFO1lBQ0gsSUFBSSxLQUFLLEVBQUUsQ0FBQztnQkFDVixRQUFRLENBQUMsRUFB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