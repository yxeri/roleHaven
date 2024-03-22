declare function getRoomById({ token, roomId, roomName, password, callback, internalCallUser, needsAccess, }: {
    token: any;
    roomId: any;
    roomName: any;
    password: any;
    callback: any;
    internalCallUser: any;
    needsAccess: any;
}): void;
declare function updateAccess({ token, roomId, teamAdminIds, userAdminIds, userIds, teamIds, bannedIds, shouldRemove, internalCallUser, callback, }: {
    token: any;
    roomId: any;
    teamAdminIds: any;
    userAdminIds: any;
    userIds: any;
    teamIds: any;
    bannedIds: any;
    shouldRemove: any;
    internalCallUser: any;
    callback: any;
}): void;
declare function createAndFollowWhisperRoom({ participantIds, callback, io, user, }: {
    participantIds: any;
    callback: any;
    io: any;
    user: any;
}): void;
declare function getWhisperRoom({ participantIds, callback, }: {
    participantIds: any;
    callback: any;
}): void;
declare function doesWhisperRoomExist({ participantIds, callback, }: {
    participantIds: any;
    callback: any;
}): void;
declare function createRoom({ room, options, token, socket, io, callback, }: {
    room: any;
    options: any;
    token: any;
    socket: any;
    io: any;
    callback: any;
}): void;
declare function leaveSocketRooms(socket: any): void;
declare function followRoom({ token, socket, io, roomId, password, callback, aliasId, }: {
    token: any;
    socket: any;
    io: any;
    roomId: any;
    password: any;
    callback: any;
    aliasId: any;
}): void;
declare function unfollowRoom({ token, socket, io, roomId, callback, aliasId, }: {
    token: any;
    socket: any;
    io: any;
    roomId: any;
    callback: any;
    aliasId: any;
}): void;
declare function getRoomsByUser({ token, callback, }: {
    token: any;
    callback: any;
}): void;
declare function getFollowedRooms({ token, callback, }: {
    token: any;
    callback: any;
}): void;
declare function getAllRooms({ token, internalCallUser, callback, }: {
    token: any;
    internalCallUser: any;
    callback: any;
}): void;
declare function removeRoom({ token, roomId, socket, io, callback, }: {
    token: any;
    roomId: any;
    socket: any;
    io: any;
    callback: any;
}): void;
declare function updateRoom({ token, room, roomId, options, callback, io, socket, }: {
    token: any;
    room: any;
    roomId: any;
    options: any;
    callback: any;
    io: any;
    socket: any;
}): void;
declare function inviteToRoom({ roomId, followerIds, socket, io, token, callback, }: {
    roomId: any;
    followerIds: any;
    socket: any;
    io: any;
    token: any;
    callback: any;
}): void;
declare function sendInvitationToRoom({ aliasId, followerIds, roomId, io, callback, token, socket, }: {
    aliasId: any;
    followerIds: any;
    roomId: any;
    io: any;
    callback: any;
    token: any;
    socket: any;
}): void;
declare function acceptRoomInvitation({ token, invitationId, io, socket, callback, }: {
    token: any;
    invitationId: any;
    io: any;
    socket: any;
    callback: any;
}): void;
export { createRoom };
export { updateRoom };
export { removeRoom };
export { updateAccess };
export { getRoomById };
export { unfollowRoom };
export { leaveSocketRooms };
export { followRoom };
export { getWhisperRoom };
export { createAndFollowWhisperRoom };
export { getAllRooms };
export { getRoomsByUser };
export { getFollowedRooms };
export { doesWhisperRoomExist };
export { sendInvitationToRoom };
export { acceptRoomInvitation };
export { inviteToRoom };
