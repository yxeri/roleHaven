'use strict';
import { dbConfig } from '../config/defaults/config';
import errorCreator from '../error/errorCreator';
import authenticator from '../helpers/authenticator';
import managerHelper from '../helpers/manager';
function getForumById({ forumId, token, internalCallUser, needsAccess, callback, }) {
    managerHelper.getObjectById({
        token,
        callback,
        internalCallUser,
        needsAccess,
        objectId: forumId,
        objectType: 'forum',
        objectIdType: 'forumId',
        dbCallFunc: getForumById,
        commandName: dbConfig.apiCommands.GetForum.name,
    });
}
function updateForumTime({ forumId, callback, }) {
    updateForum({
        forumId,
        callback,
        forum: {},
    });
}
function createForum({ forum, callback, token, io, socket, }) {
    authenticator.isUserAllowed({
        token,
        commandName: dbConfig.apiCommands.CreateForum.name,
        callback: ({ error, data, }) => {
            if (error) {
                callback({ error });
                return;
            }
            const { user: authUser } = data;
            const forumToCreate = forum;
            forumToCreate.ownerId = authUser.objectId;
            if (forumToCreate.ownerAliasId && !authUser.aliases.includes(forumToCreate.ownerAliasId)) {
                callback({ error: new errorCreator.NotAllowed({ name: `create forum with alias ${forumToCreate.ownerAliasId}` }) });
                return;
            }
            createForum({
                forum: forumToCreate,
                callback: ({ error: createError, data: createData, }) => {
                    if (createError) {
                        callback({ error: createError });
                        return;
                    }
                    const { forum: createdForum } = createData;
                    const dataToSend = {
                        data: {
                            forum: managerHelper.stripObject({ object: { ...createdForum } }),
                            changeType: dbConfig.ChangeTypes.CREATE,
                        },
                    };
                    if (socket) {
                        socket.broadcast.emit(dbConfig.EmitTypes.FORUM, dataToSend);
                    }
                    else {
                        io.emit(dbConfig.EmitTypes.FORUM, dataToSend);
                        io.to(authUser.objectId)
                            .emit(dbConfig.EmitTypes.FORUM, {
                            data: {
                                forum: createdForum,
                                changeType: dbConfig.ChangeTypes.UPDATE,
                            },
                        });
                    }
                    callback({
                        data: {
                            forum: createdForum,
                            changeType: dbConfig.ChangeTypes.CREATE,
                        },
                    });
                },
            });
        },
    });
}
function getAllForums({ callback, token, }) {
    authenticator.isUserAllowed({
        token,
        commandName: dbConfig.apiCommands.GetFull.name,
        callback: ({ error }) => {
            if (error) {
                callback({ error });
                return;
            }
            getAllForums({ callback });
        },
    });
}
function updateForum({ token, forum, forumId, options, callback, io, internalCallUser, socket, }) {
    managerHelper.updateObject({
        callback,
        options,
        token,
        io,
        internalCallUser,
        socket,
        objectId: forumId,
        object: forum,
        commandName: dbConfig.apiCommands.UpdateForum.name,
        objectType: 'forum',
        dbCallFunc: updateForum,
        emitType: dbConfig.EmitTypes.FORUM,
        objectIdType: 'forumId',
        getDbCallFunc: getForumById,
        getCommandName: dbConfig.apiCommands.GetForum.name,
    });
}
function removeForum({ token, forumId, callback, io, socket, }) {
    managerHelper.removeObject({
        callback,
        token,
        io,
        socket,
        getDbCallFunc: getForumById,
        getCommandName: dbConfig.apiCommands.GetForum.name,
        objectId: forumId,
        commandName: dbConfig.apiCommands.RemoveForum.name,
        objectType: 'forum',
        dbCallFunc: removeForum,
        emitType: dbConfig.EmitTypes.FORUM,
        objectIdType: 'forumId',
    });
}
function getForumsByUser({ token, callback, }) {
    managerHelper.getObjects({
        callback,
        token,
        shouldSort: true,
        sortName: 'title',
        commandName: dbConfig.apiCommands.GetForum.name,
        objectsType: 'forums',
        dbCallFunc: getForumsByUser,
    });
}
function updateAccess({ token, forumId, teamAdminIds, userAdminIds, userIds, teamIds, bannedIds, shouldRemove, internalCallUser, callback, }) {
    authenticator.isUserAllowed({
        token,
        internalCallUser,
        commandName: dbConfig.apiCommands.UpdateForum.name,
        callback: ({ error, data, }) => {
            if (error) {
                callback({ error });
                return;
            }
            const { user: authUser } = data;
            getForumById({
                forumId,
                internalCallUser: authUser,
                callback: ({ error: forumError, data: forumData, }) => {
                    if (forumError) {
                        callback({ error: forumError });
                        return;
                    }
                    const { forum } = forumData;
                    const { hasFullAccess, } = authenticator.hasAccessTo({
                        objectToAccess: forum,
                        toAuth: authUser,
                    });
                    if (!hasFullAccess) {
                        callback({ error: new errorCreator.NotAllowed({ name: `${dbConfig.apiCommands.UpdateForum.name}. User: ${authUser.objectId}. Access: forum ${forumId}` }) });
                        return;
                    }
                    updateAccess({
                        shouldRemove,
                        userIds,
                        teamIds,
                        bannedIds,
                        teamAdminIds,
                        userAdminIds,
                        forumId,
                        callback,
                    });
                },
            });
        },
    });
}
export { createForum };
export { removeForum };
export { updateForum };
export { getAllForums };
export { getForumById };
export { getForumsByUser };
export { updateForumTime };
export { updateAccess };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZm9ydW1zLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZm9ydW1zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFlBQVksQ0FBQztBQUViLE9BQU8sRUFBRSxRQUFRLEVBQUUsTUFBTSwyQkFBMkIsQ0FBQztBQUVyRCxPQUFPLFlBQVksTUFBTSx1QkFBdUIsQ0FBQztBQUNqRCxPQUFPLGFBQWEsTUFBTSwwQkFBMEIsQ0FBQztBQUNyRCxPQUFPLGFBQWEsTUFBTSxvQkFBb0IsQ0FBQztBQVMvQyxTQUFTLFlBQVksQ0FBQyxFQUNwQixPQUFPLEVBQ1AsS0FBSyxFQUNMLGdCQUFnQixFQUNoQixXQUFXLEVBQ1gsUUFBUSxHQUNUO0lBQ0MsYUFBYSxDQUFDLGFBQWEsQ0FBQztRQUMxQixLQUFLO1FBQ0wsUUFBUTtRQUNSLGdCQUFnQjtRQUNoQixXQUFXO1FBQ1gsUUFBUSxFQUFFLE9BQU87UUFDakIsVUFBVSxFQUFFLE9BQU87UUFDbkIsWUFBWSxFQUFFLFNBQVM7UUFDdkIsVUFBVSxFQUFFLFlBQVk7UUFDeEIsV0FBVyxFQUFFLFFBQVEsQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLElBQUk7S0FDaEQsQ0FBQyxDQUFDO0FBQ0wsQ0FBQztBQVFELFNBQVMsZUFBZSxDQUFDLEVBQ3ZCLE9BQU8sRUFDUCxRQUFRLEdBQ1Q7SUFDQyxXQUFXLENBQUM7UUFDVixPQUFPO1FBQ1AsUUFBUTtRQUNSLEtBQUssRUFBRSxFQUFFO0tBQ1YsQ0FBQyxDQUFDO0FBQ0wsQ0FBQztBQVVELFNBQVMsV0FBVyxDQUFDLEVBQ25CLEtBQUssRUFDTCxRQUFRLEVBQ1IsS0FBSyxFQUNMLEVBQUUsRUFDRixNQUFNLEdBQ1A7SUFDQyxhQUFhLENBQUMsYUFBYSxDQUFDO1FBQzFCLEtBQUs7UUFDTCxXQUFXLEVBQUUsUUFBUSxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsSUFBSTtRQUNsRCxRQUFRLEVBQUUsQ0FBQyxFQUNULEtBQUssRUFDTCxJQUFJLEdBQ0wsRUFBRSxF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