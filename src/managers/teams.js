'use strict';
import dbUser from '../db/connectors/user';
import dbWallet from '../db/connectors/wallet';
import { appConfig, dbConfig } from '../config/defaults/config';
import errorCreator from '../error/errorCreator';
import dbInvitation from '../db/connectors/invitation';
import dbTeam from '../db/connectors/team';
import authenticator from '../helpers/authenticator';
import dbRoom from '../db/connectors/room';
import socketUtils from '../utils/socketIo';
import managerHelper from '../helpers/manager';
import textTools from '../utils/textTools';
import userManager from './users';
function getTeamById({ teamId, token, callback, internalCallUser, needsAccess, }) {
    authenticator.isUserAllowed({
        token,
        internalCallUser,
        commandName: dbConfig.apiCommands.GetTeam.name,
        callback: ({ error, data, }) => {
            if (error) {
                callback({ error });
                return;
            }
            const { user: authUser } = data;
            getTeamById({
                teamId,
                callback: ({ error: teamError, data: teamData, }) => {
                    if (teamError) {
                        callback({ error: teamError });
                        return;
                    }
                    const { team: foundTeam } = teamData;
                    const { hasAccess, canSee, } = authenticator.hasAccessTo({
                        objectToAccess: foundTeam,
                        toAuth: authUser,
                    });
                    if (!canSee || (needsAccess && !hasAccess)) {
                        callback({ error: errorCreator.NotAllowed({ name: `get team ${teamId}` }) });
                        return;
                    }
                    if (!hasAccess) {
                        callback({ data: { team: managerHelper.stripObject({ object: foundTeam }) } });
                        return;
                    }
                    callback({ data: teamData });
                },
            });
        },
    });
}
function emitTeam({ room, wallet, team, user, callback, io, socket, }) {
    const creatorDataToSend = {
        data: {
            wallet,
            room,
            team,
            changeType: dbConfig.ChangeTypes.CREATE,
        },
    };
    const dataToSend = {
        data: {
            team: managerHelper.stripObject({ object: { ...team } }),
            changeType: dbConfig.ChangeTypes.CREATE,
        },
    };
    const roomToSend = {
        data: {
            room,
            changeType: dbConfig.ChangeTypes.CREATE,
        },
    };
    const walletToSend = {
        data: {
            wallet,
            changeType: dbConfig.ChangeTypes.CREATE,
        },
    };
    if (team.isVerified) {
        io.emit(dbConfig.EmitTypes.TEAM, dataToSend);
        if (socket) {
            socket.join(room.objectId);
            socket.broadcast.emit(dbConfig.EmitTypes.TEAM, dataToSend);
        }
        else {
            const userSocket = socketUtils.getUserSocket({
                io,
                socketId: user.socketId,
            });
            if (userSocket) {
                userSocket.join(room.objectId);
            }
            io.to(user.objectId)
                .emit(dbConfig.EmitTypes.TEAM, creatorDataToSend);
        }
        io.to(user.objectId)
            .emit(dbConfig.EmitTypes.USER, creatorDataToSend);
        io.emit(dbConfig.EmitTypes.ROOM, roomToSend);
        io.emit(dbConfig.EmitTypes.WALLET, walletToSend);
    }
    callback(creatorDataToSend);
}
function addUserToTeam({ teamId, memberId, isAdmin, callback, io, ignoreSocket = false, }) {
    dbUser.addToTeam({
        teamId,
        isAdmin,
        userIds: [memberId],
        callback: ({ error, data, }) => {
            if (error) {
                callback({ error });
                return;
            }
            const { users } = data;
            const updatedUser = users[0];
            const dataToSend = {
                data: {
                    team: { objectId: teamId },
                    user: {
                        objectId: memberId,
                        partOfTeams: updatedUser.partOfTeams,
                    },
                    changeType: dbConfig.ChangeTypes.UPDATE,
                },
            };
            if (!ignoreSocket) {
                const userSocket = socketUtils.getUserSocket({
                    io,
                    socketId: updatedUser.socketId,
                });
                if (userSocket) {
                    userSocket.join(teamId);
                }
                io.to(teamId)
                    .emit(dbConfig.EmitTypes.TEAMMEMBER, dataToSend);
                io.emit(dbConfig.EmitTypes.USER, dataToSend);
            }
            callback(dataToSend);
        },
    });
}
function createTeamAndDependencies({ team, io, callback, }) {
    createTeam({
        team,
        callback: ({ error: createTeamError, data: createTeamData, }) => {
            if (createTeamError) {
                callback({ error: createTeamError });
                return;
            }
            const { team: newTeam } = createTeamData;
            const { ownerAliasId, ownerId, objectId: teamId, } = newTeam;
            const wallet = {
                ownerId,
                ownerAliasId,
                objectId: teamId,
            };
            dbWallet.createWallet({
                wallet,
                options: { setId: true },
                callback: ({ error: walletError, data: walletData, }) => {
                    if (walletError) {
                        callback({ error: walletError });
                        return;
                    }
                    const roomToCreate = {
                        ownerId,
                        ownerAliasId,
                        roomName: `${team.teamName}-team`,
                        objectId: teamId,
                        accessLevel: dbConfig.AccessLevels.SUPERUSER,
                        visibility: dbConfig.AccessLevels.SUPERUSER,
                        nameIsLocked: true,
                        isTeam: true,
                    };
                    if (ownerAliasId) {
                        roomToCreate.ownerAliasId = ownerAliasId;
                    }
                    dbRoom.createRoom({
                        options: { setId: true },
                        room: roomToCreate,
                        callback: ({ error: roomError, data: roomData, }) => {
                            if (roomError) {
                                callback({ error: roomError });
                                return;
                            }
                            addUserToTeam({
                                teamId,
                                io,
                                isAdmin: true,
                                memberId: ownerAliasId || ownerId,
                                callback: ({ error: addError }) => {
                                    if (addError) {
                                        callback({ error: addError });
                                        return;
                                    }
                                    callback({
                                        data: {
                                            room: roomData.room,
                                            wallet: walletData.wallet,
                                            team: newTeam,
                                        },
                                    });
                                },
                            });
                        },
                    });
                },
            });
        },
    });
}
function createTeam({ team, socket, io, callback, token, }) {
    authenticator.isUserAllowed({
        token,
        commandName: dbConfig.apiCommands.CreateTeam.name,
        callback: ({ error, data, }) => {
            if (error) {
                callback({ error });
                return;
            }
            if (team.teamName.length > appConfig.teamNameMaxLength || team.shortName.length > appConfig.shortTeamMaxLength) {
                callback({ error: new errorCreator.InvalidData({ name: `Team name length: ${appConfig.teamNameMaxLength}. Short name length: ${appConfig.shortTeamMaxLength}` }) });
                return;
            }
            if (dbConfig.protectedNames.indexOf(team.teamName.toLowerCase()) > -1 || dbConfig.protectedNames.indexOf(team.shortName.toLowerCase()) > -1) {
                callback({ error: new errorCreator.AlreadyExists({ expected: 'not protected name' }) });
                return;
            }
            const { user: authUser } = data;
            const { ownerAliasId } = team;
            const newTeam = team;
            newTeam.teamName = textTools.trimSpace(newTeam.teamName);
            newTeam.shortName = textTools.trimSpace(newTeam.shortName);
            newTeam.ownerId = authUser.objectId;
            newTeam.isVerified = !appConfig.teamVerify;
            if (ownerAliasId && !authUser.aliases.includes(ownerAliasId)) {
                callback({ error: new errorCreator.NotAllowed({ name: `Creating team with alias ${ownerAliasId}. User ${authUser.objectId} does not have access to the alias` }) });
                return;
            }
            if (authUser.partOfTeams > appConfig.maxUserTeam) {
                callback({
                    error: new errorCreator.InvalidLength({
                        expected: `User is part of ${authUser.partOfTeams.length}. Max allowed: ${appConfig.maxUserTeam}`,
                        extraData: { paramName: 'maxUserTeam' },
                    }),
                });
                return;
            }
            createTeamAndDependencies({
                io,
                team: newTeam,
                callback: ({ error: teamError, data: teamData, }) => {
                    if (teamError) {
                        callback({ error: teamError });
                        return;
                    }
                    const { room, wallet, team: teamToEmit, } = teamData;
                    emitTeam({
                        socket,
                        io,
                        callback,
                        room,
                        wallet,
                        team: teamToEmit,
                        user: authUser,
                    });
                },
            });
        },
    });
}
function verifyTeam({ token, teamId, callback, io, socket, }) {
    authenticator.isUserAllowed({
        token,
        commandName: dbConfig.apiCommands.VerifyTeam.name,
        callback: ({ error }) => {
            if (error) {
                callback({ error });
                return;
            }
            verifyTeam({
                teamId,
                callback: ({ error: teamError, data: teamData, }) => {
                    if (teamError) {
                        callback({ error: teamError });
                        return;
                    }
                    const { team } = teamData;
                    const dataToSend = {
                        data: {
                            team,
                            changeType: dbConfig.ChangeTypes.CREATE,
                        },
                    };
                    if (socket) {
                        socket.broadcast.emit(dbConfig.EmitTypes.TEAM, dataToSend);
                    }
                    else {
                        io.emit(dbConfig.EmitTypes.TEAM, dataToSend);
                    }
                    callback(dataToSend);
                },
            });
        },
    });
}
function inviteToTeam({ invitation, io, callback, token, socket, }) {
    authenticator.isUserAllowed({
        token,
        commandName: dbConfig.apiCommands.InviteToTeam.name,
        callback: ({ error, data, }) => {
            if (error) {
                callback({ error });
                return;
            }
            const { user: authUser } = data;
            getTeamById({
                needsAccess: true,
                internalCallUser: authUser,
                teamId: invitation.itemId,
                callback: ({ error: teamError, data: teamData, }) => {
                    if (teamError) {
                        callback({ error: teamError });
                        return;
                    }
                    const { team: foundTeam } = teamData;
                    const { ownerAliasId, receiverId: memberId, } = invitation;
                    if (ownerAliasId && !authUser.aliases.includes(ownerAliasId)) {
                        callback({ error: new errorCreator.NotAllowed({ name: `invite to team ${invitation.itemId} with alias ${ownerAliasId}` }) });
                        return;
                    }
                    if (foundTeam.members.includes(memberId)) {
                        callback({ error: new errorCreator.AlreadyExists({ name: `invite to team ${invitation.itemId}. User ${invitation.receiverId} already a member` }) });
                        return;
                    }
                    userManager.getUserById({
                        token,
                        internalCallUser: authUser,
                        userId: memberId,
                        callback: ({ error: getError, data: userData, }) => {
                            if (getError) {
                                callback({ error: getError });
                                return;
                            }
                            const { user: foundUser } = userData;
                            if (foundUser.partOfTeams.length >= appConfig.maxUserTeam) {
                                callback({ error: new errorCreator.AlreadyExists({ name: `invite to team ${invitation.itemId}. User ${invitation.receiverId} already a member` }) });
                                return;
                            }
                            addUserToTeam({
                                io,
                                callback,
                                socket,
                                memberId: invitation.receiverId,
                                teamId: invitation.itemId,
                            });
                        },
                    });
                },
            });
        },
    });
}
function acceptTeamInvitation({ token, invitationId, io, callback, }) {
    authenticator.isUserAllowed({
        token,
        commandName: dbConfig.apiCommands.AcceptInvitation.name,
        callback: ({ error }) => {
            if (error) {
                callback({ error });
                return;
            }
            dbInvitation.useInvitation({
                invitationId,
                callback: ({ error: invitationError, data: invitationData, }) => {
                    if (invitationError) {
                        callback({ error: invitationError });
                        return;
                    }
                    const { invitation } = invitationData;
                    addUserToTeam({
                        io,
                        callback,
                        memberId: invitation.receiverId,
                        teamId: invitation.itemId,
                    });
                },
            });
        },
    });
}
function getTeamsByUser({ token, includeInactive, callback, }) {
    authenticator.isUserAllowed({
        token,
        commandName: dbConfig.apiCommands.GetTeams.name,
        callback: ({ error, data, }) => {
            if (error) {
                callback({ error });
                return;
            }
            const { user: authUser } = data;
            getTeamsByUser({
                includeInactive,
                user: authUser,
                callback: ({ error: getTeamsError, data: getTeamsData, }) => {
                    if (getTeamsError) {
                        callback({ error: getTeamsError });
                        return;
                    }
                    const { teams } = getTeamsData;
                    const allTeams = teams.map((teamItem) => {
                        const { hasFullAccess, } = authenticator.hasAccessTo({
                            toAuth: authUser,
                            objectToAccess: teamItem,
                        });
                        if (!hasFullAccess) {
                            return managerHelper.stripObject({ object: teamItem });
                        }
                        return teamItem;
                    })
                        .sort((a, b) => {
                        const aName = a.teamName;
                        const bName = b.teamName;
                        if (aName < bName) {
                            return -1;
                        }
                        if (aName > bName) {
                            return 1;
                        }
                        return 0;
                    });
                    callback({ data: { teams: allTeams } });
                },
            });
        },
    });
}
function leaveTeam({ teamId, userId, token, io, callback, }) {
    authenticator.isUserAllowed({
        token,
        commandName: dbConfig.apiCommands.LeaveTeam.name,
        callback: ({ error, data, }) => {
            if (error) {
                callback({ error });
                return;
            }
            const { user: authUser } = data;
            getTeamById({
                teamId,
                internalCallUser: authUser,
                callback: ({ error: teamError }) => {
                    if (teamError) {
                        callback({ error: teamError });
                        return;
                    }
                    const dataToSend = {
                        data: {
                            user: {
                                objectId: userId,
                            },
                            changeType: dbConfig.ChangeTypes.REMOVE,
                        },
                    };
                    dbUser.removeFromTeam({
                        userId,
                        teamId,
                        callback: ({ error: removeError }) => {
                            if (removeError) {
                                callback({ error: removeError });
                                return;
                            }
                            dbTeam.removeTeamMembers({
                                teamId,
                                memberIds: [userId],
                                callback: ({ error: removeTeamError, data: updatedData, }) => {
                                    if (removeTeamError) {
                                        callback({ error: removeTeamError });
                                        return;
                                    }
                                    const { team: updatedTeam } = updatedData;
                                    const teamToSend = {
                                        data: {
                                            team: {
                                                objectId: teamId,
                                                members: updatedTeam.members,
                                            },
                                            changeType: dbConfig.ChangeTypes.UPDATE,
                                        },
                                    };
                                    socketUtils.leaveRooms({
                                        io,
                                        roomIds: [teamId],
                                        socketId: authUser.socketId,
                                    });
                                    io.to(teamId)
                                        .emit(dbConfig.EmitTypes.TEAMMEMBER, dataToSend);
                                    io.emit(dbConfig.EmitTypes.TEAM, teamToSend);
                                    callback(dataToSend);
                                },
                            });
                        },
                    });
                },
            });
        },
    });
}
function updateTeam({ teamId, team, token, io, callback, socket, }) {
    authenticator.isUserAllowed({
        token,
        commandName: dbConfig.apiCommands.UpdateTeam.name,
        callback: ({ error, data, }) => {
            if (error) {
                callback({ error });
                return;
            }
            const { user: authUser } = data;
            getTeamById({
                teamId,
                internalCallUser: authUser,
                callback: ({ error: accessError, data: foundTeamData, }) => {
                    if (accessError) {
                        callback({ error: accessError });
                        return;
                    }
                    const { team: foundTeam } = foundTeamData;
                    const { hasFullAccess, } = authenticator.hasAccessTo({
                        objectToAccess: foundTeam,
                        toAuth: authUser,
                    });
                    if (!hasFullAccess) {
                        callback({ error: new errorCreator.NotAllowed({ name: `team ${teamId}` }) });
                        return;
                    }
                    updateTeam({
                        teamId,
                        team,
                        callback: ({ error: teamError, data: teamData, }) => {
                            if (teamError) {
                                callback({ error: teamError });
                                return;
                            }
                            const dataToSend = {
                                data: {
                                    team: teamData.team,
                                    changeType: dbConfig.ChangeTypes.UPDATE,
                                },
                            };
                            if (socket) {
                                socket.broadcast.emit(dbConfig.EmitTypes.TEAM, dataToSend);
                            }
                            else {
                                io.emit(dbConfig.EmitTypes.TEAM, dataToSend);
                            }
                            callback(dataToSend);
                        },
                    });
                },
            });
        },
    });
}
export { verifyTeam };
export { addUserToTeam };
export { createTeam };
export { updateTeam };
export { inviteToTeam };
export { acceptTeamInvitation };
export { getTeamById };
export { leaveTeam };
export { getTeamsByUser };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVhbXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJ0ZWFtcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxZQUFZLENBQUM7QUFFYixPQUFPLE1BQU0sTUFBTSx1QkFBdUIsQ0FBQztBQUMzQyxPQUFPLFFBQVEsTUFBTSx5QkFBeUIsQ0FBQztBQUMvQyxPQUFPLEVBQUUsU0FBUyxFQUFFLFFBQVEsRUFBRSxNQUFNLDJCQUEyQixDQUFDO0FBRWhFLE9BQU8sWUFBWSxNQUFNLHVCQUF1QixDQUFDO0FBQ2pELE9BQU8sWUFBWSxNQUFNLDZCQUE2QixDQUFDO0FBQ3ZELE9BQU8sTUFBTSxNQUFNLHVCQUF1QixDQUFDO0FBQzNDLE9BQU8sYUFBYSxNQUFNLDBCQUEwQixDQUFDO0FBQ3JELE9BQU8sTUFBTSxNQUFNLHVCQUF1QixDQUFDO0FBQzNDLE9BQU8sV0FBVyxNQUFNLG1CQUFtQixDQUFDO0FBQzVDLE9BQU8sYUFBYSxNQUFNLG9CQUFvQixDQUFDO0FBQy9DLE9BQU8sU0FBUyxNQUFNLG9CQUFvQixDQUFDO0FBQzNDLE9BQU8sV0FBVyxNQUFNLFNBQVMsQ0FBQztBQVNsQyxTQUFTLFdBQVcsQ0FBQyxFQUNuQixNQUFNLEVBQ04sS0FBSyxFQUNMLFFBQVEsRUFDUixnQkFBZ0IsRUFDaEIsV0FBVyxHQUNaO0lBQ0MsYUFBYSxDQUFDLGFBQWEsQ0FBQztRQUMxQixLQUFLO1FBQ0wsZ0JBQWdCO1FBQ2hCLFdBQVcsRUFBRSxRQUFRLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxJQUFJO1FBQzlDLFFBQVEsRUFBRSxDQUFDLEVBQ1QsS0FBSyxFQUNMLElBQUksR0FDTCxFQUFFLEVBQUU7WUFDSCxJQUFJLEtBQUssRUFBRSxDQUFDO2dCQUNWLFFBQVEsQ0FBQyxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUM7Z0JBRXBCLE9BQU87WUFDVCxDQUFDO1lBRUQsTUFBTSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsR0FBRyxJQUFJLENBQUM7WUFFaEMs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