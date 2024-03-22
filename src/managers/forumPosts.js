'use strict';
import dbPost from '../db/connectors/forumPost';
import { dbConfig } from '../config/defaults/config';
import errorCreator from '../error/errorCreator';
import authenticator from '../helpers/authenticator';
import forumManager from './forums';
import threadManager from './forumThreads';
import managerHelper from '../helpers/manager';
function getPostById({ postId, callback, token, internalCallUser, needsAccess, }) {
    managerHelper.getObjectById({
        token,
        internalCallUser,
        callback,
        needsAccess,
        objectId: postId,
        objectType: 'post',
        objectIdType: 'postId',
        dbCallFunc: getPostById,
        commandName: dbConfig.apiCommands.GetForumPost.name,
    });
}
function createPost({ post, callback, token, io, socket, }) {
    authenticator.isUserAllowed({
        token,
        commandName: dbConfig.apiCommands.CreateForumPost.name,
        callback: ({ error, data, }) => {
            if (error) {
                callback({ error });
                return;
            }
            const { user: authUser } = data;
            const postToCreate = post;
            postToCreate.ownerId = authUser.objectId;
            if (postToCreate.ownerAliasId && !authUser.aliases.includes(postToCreate.ownerAliasId)) {
                callback({ error: new errorCreator.NotAllowed({ name: `create forum post with alias ${postToCreate.ownerAliasId}` }) });
                return;
            }
            threadManager.getThreadById({
                token,
                needsAccess: true,
                threadId: postToCreate.threadId,
                internalCallUser: authUser,
                callback: ({ error: threadError, data: threadData, }) => {
                    if (threadError) {
                        callback({ error: threadError });
                        return;
                    }
                    const { thread } = threadData;
                    createPost({
                        post: postToCreate,
                        callback: ({ error: postError, data: postData, }) => {
                            if (postError) {
                                callback({ error: postError });
                                return;
                            }
                            threadManager.updateThreadTime({
                                forumId: thread.forumId,
                                threadId: postToCreate.threadId,
                                callback: ({ error: updateError }) => {
                                    if (updateError) {
                                        callback({ error: updateError });
                                        return;
                                    }
                                    const { post: createdPost } = postData;
                                    const dataToSend = {
                                        data: {
                                            post: managerHelper.stripObject({ object: { ...createdPost } }),
                                            changeType: dbConfig.ChangeTypes.CREATE,
                                        },
                                    };
                                    if (socket) {
                                        socket.broadcast.emit(dbConfig.EmitTypes.FORUMPOST, dataToSend);
                                    }
                                    else {
                                        io.emit(dbConfig.EmitTypes.FORUMPOST, dataToSend);
                                        io.to(createdPost.ownerAliasId || authUser.objectId)
                                            .emit(dbConfig.EmitTypes.FORUMPOST, {
                                            data: {
                                                post: createdPost,
                                                changeType: dbConfig.ChangeTypes.UPDATE,
                                            },
                                        });
                                    }
                                    callback({
                                        data: {
                                            post: createdPost,
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
function updatePost({ post, postId, callback, token, io, options, internalCallUser, socket, }) {
    managerHelper.updateObject({
        callback,
        options,
        token,
        io,
        internalCallUser,
        socket,
        objectId: postId,
        object: post,
        commandName: dbConfig.apiCommands.UpdateForumPost.name,
        objectType: 'post',
        dbCallFunc: updatePost,
        emitType: dbConfig.EmitTypes.FORUMPOST,
        objectIdType: 'postId',
        getDbCallFunc: getPostById,
        getCommandName: dbConfig.apiCommands.GetForumPost.name,
    });
}
function getPostsByUser({ token, callback, }) {
    managerHelper.getObjects({
        callback,
        token,
        shouldSort: true,
        sortName: 'customLastUpdated',
        fallbackSortName: 'lastUpdated',
        commandName: dbConfig.apiCommands.GetForumPost.name,
        objectsType: 'posts',
        dbCallFunc: getPostsByUser,
    });
}
function getPostsByThreads({ token, callback, internalCallUser, threadIds = [], }) {
    managerHelper.getObjects({
        callback,
        token,
        internalCallUser,
        getParams: [threadIds],
        shouldSort: true,
        sortName: 'customLastUpdated',
        fallbackSortName: 'lastUpdated',
        commandName: dbConfig.apiCommands.GetForumPost.name,
        objectsType: 'posts',
        dbCallFunc: getPostsByThreads,
    });
}
function getPostsByForum({ forumId, callback, token, }) {
    authenticator.isUserAllowed({
        token,
        commandName: dbConfig.apiCommands.GetForumPost.name,
        callback: ({ error, data, }) => {
            if (error) {
                callback({ error });
                return;
            }
            const { user: authUser } = data;
            forumManager.getForumById({
                forumId,
                needsAccess: true,
                user: authUser,
                callback: ({ error: forumError }) => {
                    if (forumError) {
                        callback({ error: forumError });
                        return;
                    }
                    threadManager.getForumThreadsByForum({
                        forumId,
                        token,
                        internalCallUser: authUser,
                        callback: ({ error: threadsError, data: threadsData, }) => {
                            if (threadsError) {
                                callback({ error: threadsError });
                                return;
                            }
                            const { threads } = threadsData;
                            const threadIds = threads.map((thread) => thread.objectId);
                            getPostsByThreads({
                                threadIds,
                                callback,
                                internalCallUser: authUser,
                            });
                        },
                    });
                },
            });
        },
    });
}
function removePost({ token, postId, callback, io, socket, }) {
    managerHelper.removeObject({
        callback,
        token,
        io,
        socket,
        getDbCallFunc: getPostById,
        getCommandName: dbConfig.apiCommands.GetForumPost.name,
        objectId: postId,
        commandName: dbConfig.apiCommands.RemoveForumPost.name,
        objectType: 'post',
        dbCallFunc: dbPost.removePostById,
        emitType: dbConfig.EmitTypes.FORUMPOST,
        objectIdType: 'postId',
    });
}
export { createPost };
export { updatePost };
export { removePost };
export { getPostsByForum };
export { getPostsByThreads };
export { getPostById };
export { getPostsByUser };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZm9ydW1Qb3N0cy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImZvcnVtUG9zdHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsWUFBWSxDQUFDO0FBRWIsT0FBTyxNQUFNLE1BQU0sNEJBQTRCLENBQUM7QUFDaEQsT0FBTyxFQUFFLFFBQVEsRUFBRSxNQUFNLDJCQUEyQixDQUFDO0FBRXJELE9BQU8sWUFBWSxNQUFNLHVCQUF1QixDQUFDO0FBQ2pELE9BQU8sYUFBYSxNQUFNLDBCQUEwQixDQUFDO0FBQ3JELE9BQU8sWUFBWSxNQUFNLFVBQVUsQ0FBQztBQUNwQyxPQUFPLGFBQWEsTUFBTSxnQkFBZ0IsQ0FBQztBQUMzQyxPQUFPLGFBQWEsTUFBTSxvQkFBb0IsQ0FBQztBQVMvQyxTQUFTLFdBQVcsQ0FBQyxFQUNuQixNQUFNLEVBQ04sUUFBUSxFQUNSLEtBQUssRUFDTCxnQkFBZ0IsRUFDaEIsV0FBVyxHQUNaO0lBQ0MsYUFBYSxDQUFDLGFBQWEsQ0FBQztRQUMxQixLQUFLO1FBQ0wsZ0JBQWdCO1FBQ2hCLFFBQVE7UUFDUixXQUFXO1FBQ1gsUUFBUSxFQUFFLE1BQU07UUFDaEIsVUFBVSxFQUFFLE1BQU07UUFDbEIsWUFBWSxFQUFFLFFBQVE7UUFDdEIsVUFBVSxFQUFFLFdBQVc7UUFDdkIsV0FBVyxFQUFFLFFBQVEsQ0FBQyxXQUFXLENBQUMsWUFBWSxDQUFDLElBQUk7S0FDcEQsQ0FBQyxDQUFDO0FBQ0wsQ0FBQztBQVVELFNBQVMsVUFBVSxDQUFDLEVBQ2xCLElBQUksRUFDSixRQUFRLEVBQ1IsS0FBSyxFQUNMLEVBQUUsRUFDRixNQUFNLEdBQ1A7SUFDQyxhQUFhLENBQUMsYUFBYSxDQUFDO1FBQzFCLEtBQUs7UUFDTCxXQUFXLEVBQUUsUUFBUSxDQUFDLFdBQVcsQ0FBQyxlQUFlLENBQUMsSUFBSTtRQUN0RCxRQUFRLEVBQUUsQ0FBQyxFQUNULEtBQUssRUFDTCxJQUFJLEdBQ0wsRUFBRSxFQUFFO1lBQ0gsSUFBSSxLQUFLLEVB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