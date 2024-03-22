declare function createAlias({ token, io, alias, socket, image, callback, }: {
    token: any;
    io: any;
    alias: any;
    socket: any;
    image: any;
    callback: any;
}): void;
declare function getAliasById({ token, aliasId, aliasName, callback, internalCallUser, }: {
    token: any;
    aliasId: any;
    aliasName: any;
    callback: any;
    internalCallUser: any;
}): void;
declare function getAliasesByUser({ token, callback, }: {
    token: any;
    callback: any;
}): void;
declare function updateAlias({ token, callback, alias, options, aliasId, io, socket, image, }: {
    token: any;
    callback: any;
    alias: any;
    options: any;
    aliasId: any;
    io: any;
    socket: any;
    image: any;
}): void;
declare function updateAccess({ token, aliasId, teamAdminIds, userAdminIds, userIds, teamIds, bannedIds, shouldRemove, io, callback, }: {
    token: any;
    aliasId: any;
    teamAdminIds: any;
    userAdminIds: any;
    userIds: any;
    teamIds: any;
    bannedIds: any;
    shouldRemove: any;
    io: any;
    callback: any;
}): void;
declare function getAllAliases({ token, internalCallUser, callback, }: {
    token: any;
    internalCallUser: any;
    callback: any;
}): void;
export { createAlias };
export { updateAlias };
export { getAliasById };
export { getAliasesByUser };
export { updateAccess };
export { getAllAliases };
