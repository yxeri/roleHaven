declare function getThreadById({ threadId, token, internalCallUser, needsAccess, callback, }: {
    threadId: any;
    token: any;
    internalCallUser: any;
    needsAccess: any;
    callback: any;
}): void;
declare function createThread({ thread, callback, token, io, socket, }: {
    thread: any;
    callback: any;
    token: any;
    io: any;
    socket: any;
}): void;
declare function getForumThreadsByForum({ forumId, callback, internalCallUser, token, }: {
    forumId: any;
    callback: any;
    internalCallUser: any;
    token: any;
}): void;
declare function getThreadsByUser({ token, callback, }: {
    token: any;
    callback: any;
}): void;
declare function updateThread({ token, thread, threadId, options, callback, io, socket, }: {
    token: any;
    thread: any;
    threadId: any;
    options: any;
    callback: any;
    io: any;
    socket: any;
}): void;
declare function removeThread({ token, threadId, callback, io, socket, }: {
    token: any;
    threadId: any;
    callback: any;
    io: any;
    socket: any;
}): void;
declare function getAllThreads({ callback, token, }: {
    callback: any;
    token: any;
}): void;
declare function updateThreadTime({ threadId, forumId, callback, }: {
    threadId: any;
    forumId: any;
    callback: any;
}): void;
declare function updateAccess({ token, threadId, teamAdminIds, userAdminIds, userIds, teamIds, bannedIds, shouldRemove, internalCallUser, callback, }: {
    token: any;
    threadId: any;
    teamAdminIds: any;
    userAdminIds: any;
    userIds: any;
    teamIds: any;
    bannedIds: any;
    shouldRemove: any;
    internalCallUser: any;
    callback: any;
}): void;
export { createThread };
export { updateThread };
export { removeThread };
export { getForumThreadsByForum };
export { getAllThreads };
export { getThreadById };
export { getThreadsByUser };
export { updateThreadTime };
export { updateAccess };
