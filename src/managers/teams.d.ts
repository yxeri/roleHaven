declare function getTeamById({ teamId, token, callback, internalCallUser, needsAccess, }: {
    teamId: any;
    token: any;
    callback: any;
    internalCallUser: any;
    needsAccess: any;
}): void;
declare function addUserToTeam({ teamId, memberId, isAdmin, callback, io, ignoreSocket, }: {
    teamId: any;
    memberId: any;
    isAdmin: any;
    callback: any;
    io: any;
    ignoreSocket?: boolean | undefined;
}): void;
declare function createTeam({ team, socket, io, callback, token, }: {
    team: any;
    socket: any;
    io: any;
    callback: any;
    token: any;
}): void;
declare function verifyTeam({ token, teamId, callback, io, socket, }: {
    token: any;
    teamId: any;
    callback: any;
    io: any;
    socket: any;
}): void;
declare function inviteToTeam({ invitation, io, callback, token, socket, }: {
    invitation: any;
    io: any;
    callback: any;
    token: any;
    socket: any;
}): void;
declare function acceptTeamInvitation({ token, invitationId, io, callback, }: {
    token: any;
    invitationId: any;
    io: any;
    callback: any;
}): void;
declare function getTeamsByUser({ token, includeInactive, callback, }: {
    token: any;
    includeInactive: any;
    callback: any;
}): void;
declare function leaveTeam({ teamId, userId, token, io, callback, }: {
    teamId: any;
    userId: any;
    token: any;
    io: any;
    callback: any;
}): void;
declare function updateTeam({ teamId, team, token, io, callback, socket, }: {
    teamId: any;
    team: any;
    token: any;
    io: any;
    callback: any;
    socket: any;
}): void;
export { verifyTeam };
export { addUserToTeam };
export { createTeam };
export { updateTeam };
export { inviteToTeam };
export { acceptTeamInvitation };
export { getTeamById };
export { leaveTeam };
export { getTeamsByUser };
