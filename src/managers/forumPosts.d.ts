declare function getPostById({ postId, callback, token, internalCallUser, needsAccess, }: {
    postId: any;
    callback: any;
    token: any;
    internalCallUser: any;
    needsAccess: any;
}): void;
declare function createPost({ post, callback, token, io, socket, }: {
    post: any;
    callback: any;
    token: any;
    io: any;
    socket: any;
}): void;
declare function updatePost({ post, postId, callback, token, io, options, internalCallUser, socket, }: {
    post: any;
    postId: any;
    callback: any;
    token: any;
    io: any;
    options: any;
    internalCallUser: any;
    socket: any;
}): void;
declare function getPostsByUser({ token, callback, }: {
    token: any;
    callback: any;
}): void;
declare function getPostsByThreads({ token, callback, internalCallUser, threadIds, }: {
    token: any;
    callback: any;
    internalCallUser: any;
    threadIds?: never[] | undefined;
}): void;
declare function getPostsByForum({ forumId, callback, token, }: {
    forumId: any;
    callback: any;
    token: any;
}): void;
declare function removePost({ token, postId, callback, io, socket, }: {
    token: any;
    postId: any;
    callback: any;
    io: any;
    socket: any;
}): void;
export { createPost };
export { updatePost };
export { removePost };
export { getPostsByForum };
export { getPostsByThreads };
export { getPostById };
export { getPostsByUser };
