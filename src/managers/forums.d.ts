declare function getForumById({ forumId, token, internalCallUser, needsAccess, callback, }: {
    forumId: any;
    token: any;
    internalCallUser: any;
    needsAccess: any;
    callback: any;
}): void;
declare function updateForumTime({ forumId, callback, }: {
    forumId: any;
    callback: any;
}): void;
declare function createForum({ forum, callback, token, io, socket, }: {
    forum: any;
    callback: any;
    token: any;
    io: any;
    socket: any;
}): void;
declare function getAllForums({ callback, token, }: {
    callback: any;
    token: any;
}): void;
declare function updateForum({ token, forum, forumId, options, callback, io, internalCallUser, socket, }: {
    token: any;
    forum: any;
    forumId: any;
    options: any;
    callback: any;
    io: any;
    internalCallUser: any;
    socket: any;
}): void;
declare function removeForum({ token, forumId, callback, io, socket, }: {
    token: any;
    forumId: any;
    callback: any;
    io: any;
    socket: any;
}): void;
declare function getForumsByUser({ token, callback, }: {
    token: any;
    callback: any;
}): void;
declare function updateAccess({ token, forumId, teamAdminIds, userAdminIds, userIds, teamIds, bannedIds, shouldRemove, internalCallUser, callback, }: {
    token: any;
    forumId: any;
    teamAdminIds: any;
    userAdminIds: any;
    userIds: any;
    teamIds: any;
    bannedIds: any;
    shouldRemove: any;
    internalCallUser: any;
    callback: any;
}): void;
export { createForum };
export { removeForum };
export { updateForum };
export { getAllForums };
export { getForumById };
export { getForumsByUser };
export { updateForumTime };
export { updateAccess };
