declare function getDeviceById({ token, callback, deviceId, internalCallUser, }: {
    token: any;
    callback: any;
    deviceId: any;
    internalCallUser: any;
}): void;
declare function createDevice({ token, device, callback, io, socket, }: {
    token: any;
    device: any;
    callback: any;
    io: any;
    socket: any;
}): void;
declare function updateDevice({ token, device, deviceId, options, callback, io, socket, }: {
    token: any;
    device: any;
    deviceId: any;
    options: any;
    callback: any;
    io: any;
    socket: any;
}): void;
declare function getDevicesByUser({ token, callback, }: {
    token: any;
    callback: any;
}): void;
declare function removeDevice({ token, deviceId, callback, io, }: {
    token: any;
    deviceId: any;
    callback: any;
    io: any;
}): void;
declare function updateAccess({ token, deviceId, teamAdminIds, userAdminIds, userIds, teamIds, bannedIds, shouldRemove, callback, }: {
    token: any;
    deviceId: any;
    teamAdminIds: any;
    userAdminIds: any;
    userIds: any;
    teamIds: any;
    bannedIds: any;
    shouldRemove: any;
    callback: any;
}): void;
export { createDevice };
export { removeDevice };
export { updateDevice };
export { getDeviceById };
export { getDevicesByUser };
export { updateAccess };
