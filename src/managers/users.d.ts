declare function createUser({ token, user, callback, io, options, socket, image, }: {
    token: any;
    user: any;
    callback: any;
    io: any;
    options: any;
    socket: any;
    image: any;
}): void;
declare function getUsersByUser({ token, includeInactive, callback, }: {
    token: any;
    includeInactive?: boolean | undefined;
    callback: any;
}): void;
declare function getUserById({ token, userId, username, internalCallUser, callback, }: {
    token: any;
    userId: any;
    username: any;
    internalCallUser: any;
    callback: any;
}): void;
declare function changePassword({ token, userId, password, callback, }: {
    token: any;
    userId: any;
    password: any;
    callback: any;
}): void;
declare function login({ user, socket, io, callback, }: {
    user: any;
    socket: any;
    io: any;
    callback: any;
}): void;
declare function logout({ token, socket, callback, }: {
    token: any;
    socket: any;
    callback: any;
}): void;
declare function unbanUser({ token, bannedUserId, callback, io, }: {
    token: any;
    bannedUserId: any;
    callback: any;
    io: any;
}): void;
declare function banUser({ banUserId, reason, io, token, callback, }: {
    banUserId: any;
    reason: any;
    io: any;
    token: any;
    callback: any;
}): void;
declare function verifyUser({ userIdToVerify, token, io, callback, }: {
    userIdToVerify: any;
    token: any;
    io: any;
    callback: any;
}): void;
declare function updateUser({ token, io, callback, userId, options, socket, image, user, }: {
    token: any;
    io: any;
    callback: any;
    userId: any;
    options: any;
    socket: any;
    image: any;
    user?: {} | undefined;
}): void;
declare function updateId({ token, io, socket, callback, }: {
    token: any;
    io: any;
    socket: any;
    callback: any;
}): void;
declare function getAllUsers({ token, internalCallUser, callback, }: {
    token: any;
    internalCallUser: any;
    callback: any;
}): void;
export { createUser };
export { getUserById };
export { changePassword };
export { login };
export { logout };
export { banUser };
export { unbanUser };
export { verifyUser };
export { updateUser };
export { getUsersByUser };
export { updateId };
export { getAllUsers };
