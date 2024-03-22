declare function getDocFile({ docFileId, code, token, callback, internalCallUser, }: {
    docFileId: any;
    code: any;
    token: any;
    callback: any;
    internalCallUser: any;
}): void;
declare function createDocFile({ token, io, docFile, callback, socket, internalCallUser, images, }: {
    token: any;
    io: any;
    docFile: any;
    callback: any;
    socket: any;
    internalCallUser: any;
    images: any;
}): void;
declare function updateDocFile({ docFile, docFileId, io, token, callback, options, socket, internalCallUser, }: {
    docFile: any;
    docFileId: any;
    io: any;
    token: any;
    callback: any;
    options: any;
    socket: any;
    internalCallUser: any;
}): void;
declare function unlockDocFile({ io, docFileId, code, token, callback, internalCallUser, aliasId, socket, }: {
    io: any;
    docFileId: any;
    code: any;
    token: any;
    callback: any;
    internalCallUser: any;
    aliasId: any;
    socket: any;
}): void;
declare function removeDocFile({ docFileId, token, callback, io, internalCallUser, socket, }: {
    docFileId: any;
    token: any;
    callback: any;
    io: any;
    internalCallUser: any;
    socket: any;
}): void;
declare function getDocFilesByUser({ token, callback, }: {
    token: any;
    callback: any;
}): void;
declare function updateAccess({ token, docFileId, teamAdminIds, userAdminIds, userIds, teamIds, bannedIds, shouldRemove, callback, }: {
    token: any;
    docFileId: any;
    teamAdminIds: any;
    userAdminIds: any;
    userIds: any;
    teamIds: any;
    bannedIds: any;
    shouldRemove: any;
    callback: any;
}): void;
export { createDocFile };
export { updateDocFile };
export { unlockDocFile };
export { getDocFile };
export { removeDocFile };
export { getDocFilesByUser };
export { updateAccess };
