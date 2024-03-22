import mongoose from 'mongoose';
import errorCreator from '../../error/errorCreator';
import dbConnector from '../databaseConnector';
import dbForumThread from './forumThread';
import dbForum from './forum';
const forumPostSchema = new mongoose.Schema(dbConnector.createSchema({
    threadId: String,
    parentPostId: String,
    text: {
        type: [String],
        default: [],
    },
    depth: {
        type: Number,
        default: 0,
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
}), { collection: 'forumPosts' });
const ForumPost = mongoose.model('ForumPost', forumPostSchema);
function getPosts({ query, callback, filter = {}, }) {
    dbConnector.getObjects({
        query,
        filter,
        object: ForumPost,
        callback: ({ error, data, }) => {
            if (error) {
                callback({ error });
                return;
            }
            callback({
                data: {
                    posts: data.objects,
                },
            });
        },
    });
}
function getPost({ query, callback, filter, }) {
    dbConnector.getObject({
        query,
        filter,
        object: ForumPost,
        callback: ({ error, data, }) => {
            if (error) {
                callback({ error });
                return;
            }
            if (!data.object) {
                callback({ error: new errorCreator.DoesNotExist({ name: `forumPost ${JSON.stringify(query, null, 4)}` }) });
                return;
            }
            callback({ data: { post: data.object } });
        },
    });
}
function updateObject({ postId, update, callback, }) {
    dbConnector.updateObject({
        update,
        object: ForumPost,
        query: { _id: postId },
        errorNameContent: 'updateForumPost',
        callback: ({ error, data, }) => {
            if (error) {
                callback({ error });
                return;
            }
            callback({ data: { post: data.object } });
        },
    });
}
function createPost({ post, callback, }) {
    const forumPostToSave = post;
    const parentPostIsSet = typeof forumPostToSave.parentPostId !== 'undefined';
    if (parentPostIsSet) {
        forumPostToSave.depth = 1;
    }
    const savePost = (saveForumPostCallback) => {
        dbForumThread.getThreadById({
            threadId: forumPostToSave.threadId,
            callback: (threadData) => {
                if (threadData.error) {
                    callback({ error: threadData.error });
                    return;
                }
                const foundThread = threadData.data.thread;
                forumPostToSave.adminIds = post.adminIds
                    ?
                        post.adminIds
                    :
                        foundThread.adminIds;
                forumPostToSave.userIds = post.userIds
                    ?
                        post.userIds
                    :
                        foundThread.userIds;
                forumPostToSave.teamIds = post.teamIds
                    ?
                        post.teamIds
                    :
                        foundThread.teamIds;
                dbConnector.saveObject({
                    object: new ForumPost(forumPostToSave),
                    objectType: ForumPost,
                    callback: ({ error: saveError, data: saveData, }) => {
                        if (saveError) {
                            saveForumPostCallback({
                                error: new errorCreator.Database({
                                    errorObject: saveError,
                                    name: 'createPost',
                                }),
                            });
                            return;
                        }
                        callback({ data: { post: saveData.savedObject } });
                    },
                });
            },
        });
    };
    if (parentPostIsSet) {
        getPost({
            query: { _id: forumPostToSave.parentPostId },
            callback: (forumData) => {
                const foundPost = forumData.data.post;
                if (forumData.error) {
                    callback({ error: forumData.error });
                    return;
                }
                if (foundPost.depth > 0) {
                    callback({ error: new errorCreator.Incorrect({ name: `forumPost ${foundPost.objectId} depth ${foundPost.depth}` }) });
                    return;
                }
                forumPostToSave.adminIds = post.adminIds
                    ?
                        post.adminIds
                    :
                        foundPost.adminIds;
                forumPostToSave.userIds = post.userIds
                    ?
                        post.userIds
                    :
                        foundPost.userIds;
                forumPostToSave.teamIds = post.teamIds
                    ?
                        post.teamIds
                    :
                        foundPost.teamIds;
                savePost(callback);
            },
        });
        return;
    }
    savePost(callback);
}
function getPostById({ postId, callback, }) {
    getPost({
        callback,
        query: { _id: postId },
    });
}
function getPostsById({ postIds, callback, }) {
    getPosts({
        callback,
        query: { _id: { $in: postIds } },
    });
}
function getPostsByThreads({ threadIds, callback, }) {
    getPosts({
        callback,
        query: { threadId: { $in: threadIds } },
    });
}
function getPostsByThread({ threadId, callback, }) {
    getPosts({
        callback,
        query: { threadId },
    });
}
function getPostsByUser({ user, callback, }) {
    dbForum.getForumsByUser({
        user,
        callback: ({ error: forumError, data: forumData, }) => {
            if (forumError) {
                callback({ error: forumError });
                return;
            }
            const forumIds = forumData.forums.map((forum) => forum.objectId);
            dbForumThread.getThreadsByForums({
                forumIds,
                callback: ({ error: threadError, data: threadData, }) => {
                    if (threadError) {
                        callback({ error: threadError });
                        return;
                    }
                    const threadIds = threadData.threads.map((thread) => thread.objectId);
                    const query = dbConnector.createUserQuery({ user });
                    query.threadId = { $in: threadIds };
                    getPosts({
                        callback,
                        query,
                    });
                },
            });
        },
    });
}
function updatePost({ postId, post, callback, options = {}, }) {
    const update = {};
    const set = {};
    const unset = {};
    if (options.resetOwnerAliasId) {
        unset.ownerAliasId = '';
    }
    else if (post.ownerAliasId) {
        set.ownerAliasId = post.ownerAliasId;
    }
    if (post.text) {
        set.text = post.text;
    }
    if (Object.keys(set).length > 0) {
        update.$set = set;
    }
    if (Object.keys(unset).length > 0) {
        update.$unset = unset;
    }
    updateObject({
        update,
        postId,
        callback,
    });
}
function removePostsByIds({ postIds, callback, }) {
    dbConnector.removeObjects({
        callback,
        object: ForumPost,
        query: { _id: { $in: postIds } },
    });
}
function removePostById({ postId, callback, }) {
    dbConnector.removeObject({
        callback,
        object: ForumPost,
        query: { _id: postId },
    });
}
function removePostsByThreadIds({ threadIds, callback, }) {
    dbConnector.removeObjects({
        callback,
        object: ForumPost,
        query: { threadId: { $in: threadIds } },
    });
}
function removePostsByThreadId({ threadId, callback, }) {
    dbConnector.removeObjects({
        callback,
        object: ForumPost,
        query: { threadId },
    });
}
function updateAccess(params) {
    const accessParams = params;
    const { callback } = params;
    accessParams.objectId = params.postId;
    accessParams.object = ForumPost;
    accessParams.callback = ({ error, data, }) => {
        if (error) {
            callback({ error });
            return;
        }
        callback({ data: { forumPost: data.object } });
    };
    if (params.shouldRemove) {
        dbConnector.removeObjectAccess(params);
    }
    else {
        dbConnector.addObjectAccess(params);
    }
}
export { getPostsByThreads };
export { createPost };
export { getPostById };
export { removePostsByIds };
export { getPostsById };
export { updatePost };
export { removePostsByThreadIds };
export { updateAccess };
export { removePostById };
export { getPostsByThread };
export { removePostsByThreadId };
export { getPostsByUser };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZm9ydW1Qb3N0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZm9ydW1Qb3N0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sUUFBUSxNQUFNLFVBQVUsQ0FBQztBQUNoQyxPQUFPLFlBQVksTUFBTSwwQkFBMEIsQ0FBQztBQUNwRCxPQUFPLFdBQVcsTUFBTSxzQkFBc0IsQ0FBQztBQUMvQyxPQUFPLGFBQWEsTUFBTSxlQUFlLENBQUM7QUFDMUMsT0FBTyxPQUFPLE1BQU0sU0FBUyxDQUFDO0FBRTlCLE1BQU0sZUFBZSxHQUFHLElBQUksUUFBUSxDQUFDLE1BQU0sQ0FBQyxXQUFXLENBQUMsWUFBWSxDQUFDO0lBQ25FLFFBQVEsRUFBRSxNQUFNO0lBQ2hCLFlBQVksRUFBRSxNQUFNO0lBQ3BCLElBQUksRUFBRTtRQUNKLElBQUksRUFBRSxDQUFDLE1BQU0sQ0FBQztRQUNkLE9BQU8sRUFBRSxFQUFFO0tBQ1o7SUFDRCxLQUFLLEVBQUU7UUFDTCxJQUFJLEVBQUUsTUFBTTtRQUNaLE9BQU8sRUFBRSxDQUFDO0tBQ1g7SUFDRCxLQUFLLEVBQUU7UUFDTCxJQUFJLEVBQUUsTUFBTTtRQUNaLE9BQU8sRUFBRSxDQUFDO0tBQ1g7SUFDRCxRQUFRLEVBQUU7UUFDUixJQUFJLEVBQUUsTUFBTTtRQUNaLE9BQU8sRUFBRSxDQUFDO0tBQ1g7SUFDRCxNQUFNLEVBQUUsQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDO0NBQ2xDLENBQUMsRUFBRSxFQUFFLFVBQVUsRUFBRSxZQUFZLEVBQUUsQ0FBQyxDQUFDO0FBRWxDLE1BQU0sU0FBUyxHQUFHLFFBQVEsQ0FBQyxLQUFLLENBQUMsV0FBVyxFQUFFLGVBQWUsQ0FBQyxDQUFDO0FBUy9ELFNBQVMsUUFBUSxDQUFDLEVBQ2hCLEtBQUssRUFDTCxRQUFRLEVBQ1IsTUFBTSxHQUFHLEVBQUUsR0FDWjtJQUNDLFdBQVcsQ0FBQyxVQUFVLENBQUM7UUFDckIsS0FBSztRQUNMLE1BQU07UUFDTixNQUFNLEVB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