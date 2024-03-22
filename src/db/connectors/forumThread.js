import mongoose from 'mongoose';
import dbForum from 'src/db/connectors/forum.js';
import dbForumPost from 'src/db/connectors/forumPost.js';
import dbConnector from 'src/db/databaseConnector.js';
import errorCreator from 'src/error/errorCreator.js';
const forumThreadSchema = new mongoose.Schema({
    forumId: String,
    title: String,
    text: {
        type: [String],
        default: [],
    },
    postIds: {
        type: [String],
        default: [],
    },
    likes: {
        type: Number,
        default: 0,
    },
    dislikes: {
        type: Number,
        default: 0,
    },
    images: [dbConnector.imageSchema],
}, { collection: 'forumThreads' });
const ForumThread = mongoose.model('ForumThread', forumThreadSchema);
async function getThreads({ filter, query, }) {
    const { error, data } = await dbConnector.getObjects({
        query,
        filter,
        object: ForumThread,
    });
    if (error) {
        return { error };
    }
    return {
        data: {
            threads: data?.objects,
        },
    };
}
function getThread({ query, callback, }) {
    dbConnector.getObject({
        query,
        object: ForumThread,
        callback: ({ error, data, }) => {
            if (error) {
                callback({ error });
                return;
            }
            if (!data.object) {
                callback({ error: new errorCreator.DoesNotExist({ name: `forumThread ${JSON.stringify(query, null, 4)}` }) });
                return;
            }
            callback({ data: { thread: data.object } });
        },
    });
}
function updateObject({ threadId, update, callback, }) {
    dbConnector.updateObject({
        update,
        object: ForumThread,
        query: { _id: threadId },
        errorNameContent: 'updateThread',
        callback: ({ error, data, }) => {
            if (error) {
                callback({ error });
                return;
            }
            callback({ data: { thread: data.object } });
        },
    });
}
function createThread({ thread, callback, }) {
    dbConnector.saveObject({
        object: new ForumThread(thread),
        objectType: 'ForumThread',
        callback: (threadData) => {
            if (threadData.error) {
                callback({ error: threadData.error });
                return;
            }
            callback({ data: { thread: threadData.data.savedObject } });
        },
    });
}
function getThreadById({ threadId, callback, }) {
    getThread({
        callback,
        query: { _id: threadId },
    });
}
function getThreadsByForum({ forumId, callback, }) {
    getThreads({
        callback,
        query: { forumId },
    });
}
function getThreadsByForums({ forumIds, callback, }) {
    getThreads({
        callback,
        query: { forumId: { $in: forumIds } },
    });
}
function updateThread({ threadId, thread, callback, options = {}, }) {
    const update = {};
    const set = {};
    const unset = {};
    if (thread.forumId) {
        set.forumId = thread.forumId;
    }
    if (thread.title) {
        set.title = thread.title;
    }
    if (thread.text) {
        set.text = thread.text;
    }
    if (options.resetOwnerAliasId) {
        unset.ownerAliasId = '';
    }
    else if (thread.ownerAliasId) {
        set.ownerAliasId = thread.ownerAliasId;
    }
    if (Object.keys(set).length > 0) {
        update.$set = set;
    }
    if (Object.keys(unset).length > 0) {
        update.$unset = unset;
    }
    updateObject({
        update,
        threadId,
        callback,
    });
}
function removeThreads({ threadIds, fullRemoval, callback, }) {
    dbConnector.removeObject({
        object: ForumThread,
        query: { _id: { $in: threadIds } },
        callback: ({ error }) => {
            if (error) {
                callback({ error });
                return;
            }
            if (fullRemoval) {
                dbForumPost.removePostsByThreadIds({
                    threadIds,
                    callback,
                });
                return;
            }
            callback({ data: { success: true } });
        },
    });
}
function removeThread({ threadId, fullRemoval, callback, }) {
    dbConnector.removeObject({
        object: ForumThread,
        query: { _id: threadId },
        callback: ({ error }) => {
            if (error) {
                callback({ error });
                return;
            }
            if (fullRemoval) {
                dbForumPost.removePostsByThreadId({
                    threadId,
                    callback,
                });
                return;
            }
            callback({ data: { success: true } });
        },
    });
}
function removeThreadsByForum({ forumId, fullRemoval, callback, }) {
    const removeFunc = () => {
        dbConnector.removeObjects({
            callback,
            object: ForumThread,
            query: { forumId },
        });
    };
    if (fullRemoval) {
        getThreads({
            query: { forumId },
            callback: (threadsData) => {
                if (threadsData.error) {
                    callback({ error: threadsData.error });
                    return;
                }
                dbForumPost.removePostsByThreadIds({
                    threadIds: threadsData.data.threads.map((thread) => thread.objectId),
                    callback: ({ error }) => {
                        if (error) {
                            callback({ error });
                            return;
                        }
                        removeFunc();
                    },
                });
            },
        });
        return;
    }
    removeFunc();
}
function updateAccess(params) {
    const { callback } = params;
    const accessParams = params;
    accessParams.objectId = params.threadId;
    accessParams.object = ForumThread;
    accessParams.callback = ({ error, data, }) => {
        if (error) {
            callback({ error });
            return;
        }
        callback({ data: { thread: data.object } });
    };
    if (params.shouldRemove) {
        dbConnector.removeObjectAccess(params);
    }
    else {
        dbConnector.addObjectAccess(params);
    }
}
function getAllThreads({ callback }) {
    getThreads({ callback });
}
function getThreadsByUser({ user, callback, }) {
    dbForum.getForumsByUser({
        user,
        callback: ({ error, data, }) => {
            if (error) {
                callback({ error });
                return;
            }
            const forumIds = data.forums.map((forum) => forum.objectId);
            const query = dbConnector.createUserQuery({ user });
            query.forumId = { $in: forumIds };
            getThreads({
                callback,
                query,
            });
        },
    });
}
export { createThread };
export { getThreadById };
export { getThreadsByForum };
export { getThreadsByForums };
export { removeThreads };
export { updateThread };
export { removeThreadsByForum };
export { updateAccess };
export { getAllThreads };
export { removeThread };
export { getThreadsByUser };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZm9ydW1UaHJlYWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJmb3J1bVRocmVhZC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLFFBQVEsTUFBTSxVQUFVLENBQUM7QUFDaEMsT0FBTyxPQUFPLE1BQU0sNEJBQTRCLENBQUM7QUFDakQsT0FBTyxXQUFXLE1BQU0sZ0NBQWdDLENBQUM7QUFDekQsT0FBTyxXQUF3QyxNQUFNLDZCQUE2QixDQUFDO0FBQ25GLE9BQU8sWUFBWSxNQUFNLDJCQUEyQixDQUFDO0FBWXJELE1BQU0saUJBQWlCLEdBQUcsSUFBSSxRQUFRLENBQUMsTUFBTSxDQUFvQjtJQUMvRCxPQUFPLEVBQUUsTUFBTTtJQUNmLEtBQUssRUFBRSxNQUFNO0lBQ2IsSUFBSSxFQUFFO1FBQ0osSUFBSSxFQUFFLENBQUMsTUFBTSxDQUFDO1FBQ2QsT0FBTyxFQUFFLEVBQUU7S0FDWjtJQUNELE9BQU8sRUFBRTtRQUNQLElBQUksRUFBRSxDQUFDLE1BQU0sQ0FBQztRQUNkLE9BQU8sRUFBRSxFQUFFO0tBQ1o7SUFDRCxLQUFLLEVBQUU7UUFDTCxJQUFJLEVBQUUsTUFBTTtRQUNaLE9BQU8sRUFBRSxDQUFDO0tBQ1g7SUFDRCxRQUFRLEVBQUU7UUFDUixJQUFJLEVBQUUsTUFBTTtRQUNaLE9BQU8sRUFBRSxDQUFDO0tBQ1g7SUFDRCxNQUFNLEVBQUUsQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDO0NBQ2xDLEVBQUUsRUFBRSxVQUFVLEVBQUUsY0FBYyxFQUFFLENBQUMsQ0FBQztBQUVuQyxNQUFNLFdBQVcsR0FBRyxRQUFRLENBQUMsS0FBSyxDQUFDLGFBQWEsRUFBRSxpQkFBaUIsQ0FBQyxDQUFDO0FBRXJFLEtBQUssVUFBVSxVQUFVLENBQUMsRUFDeEIsTUFBTSxFQUNOLEtBQUssR0FJTjtJQUNDLE1BQU0sRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLEdBQUcsTUFBTSxXQUFXLENBQUMsVUFBVSxDQUFDO1FBQ25ELEtBQUs7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