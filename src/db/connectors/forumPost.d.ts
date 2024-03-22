declare function createPost({ post, callback, }: {
    post: any;
    callback: any;
}): void;
declare function getPostById({ postId, callback, }: {
    postId: any;
    callback: any;
}): void;
declare function getPostsById({ postIds, callback, }: {
    postIds: any;
    callback: any;
}): void;
declare function getPostsByThreads({ threadIds, callback, }: {
    threadIds: any;
    callback: any;
}): void;
declare function getPostsByThread({ threadId, callback, }: {
    threadId: any;
    callback: any;
}): void;
declare function getPostsByUser({ user, callback, }: {
    user: any;
    callback: any;
}): void;
declare function updatePost({ postId, post, callback, options, }: {
    postId: any;
    post: any;
    callback: any;
    options?: {} | undefined;
}): void;
declare function removePostsByIds({ postIds, callback, }: {
    postIds: any;
    callback: any;
}): void;
declare function removePostById({ postId, callback, }: {
    postId: any;
    callback: any;
}): void;
declare function removePostsByThreadIds({ threadIds, callback, }: {
    threadIds: any;
    callback: any;
}): void;
declare function removePostsByThreadId({ threadId, callback, }: {
    threadId: any;
    callback: any;
}): void;
declare function updateAccess(params: any): void;
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
