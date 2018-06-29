/*
 Copyright 2017 Aleksandar Jankovic

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

'use strict';

const dbUser = require('../db/connectors/user');
const dbWallet = require('../db/connectors/wallet');
const { appConfig, dbConfig } = require('../config/defaults/config');
const errorCreator = require('../error/errorCreator');
const dbInvitation = require('../db/connectors/invitation');
const dbTeam = require('../db/connectors/team');
const authenticator = require('../helpers/authenticator');
const dbRoom = require('../db/connectors/room');
const socketUtils = require('../utils/socketIo');
const managerHelper = require('../helpers/manager');

/**
 * Get a team.
 * @param {Object} params - Parameters.
 * @param {string} params.teamId - Id of the team.
 * @param {string} params.token - jwt.
 * @param {Function} params.callback - Callback.
 */
function getTeamById({
  teamId,
  token,
  callback,
  internalCallUser,
}) {
  authenticator.isUserAllowed({
    token,
    internalCallUser,
    commandName: dbConfig.apiCommands.GetTeam.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const { user: authUser } = data;

      dbTeam.getTeamById({
        teamId,
        callback: ({ error: teamError, data: teamData }) => {
          if (teamError) {
            callback({ error: teamError });

            return;
          }

          const { team: foundTeam } = teamData;
          const {
            hasAccess,
            canSee,
          } = authenticator.hasAccessTo({
            objectToAccess: foundTeam,
            toAuth: authUser,
          });

          if (!canSee) {
            callback({ error: errorCreator.NotAllowed({ name: `get team ${teamId}` }) });

            return;
          } else if (!hasAccess) {
            callback({ data: { team: managerHelper.stripObject({ object: foundTeam }) } });

            return;
          }

          callback({ data: teamData });
        },
      });
    },
  });
}

/**
 * Emits team to clients.
 * @param {Object} params - Parameters.
 * @param {Object} params.room - Team room.
 * @param {Object} params.wallet - Team wallet.
 * @param {Object} params.team - Team.
 * @param {Object} params.user - User who created the team.
 * @param {Function} params.callback - Callback.
 * @param {Object} params.io - Socket.io.
 */
function emitTeam({
  room,
  wallet,
  team,
  user,
  callback,
  io,
}) {
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
      team: managerHelper.stripObject({ object: team }),
      changeType: dbConfig.ChangeTypes.CREATE,
    },
  };

  if (team.isVerified) {
    const userSocket = socketUtils.getUserSocket({
      io,
      socketId: user.socketId,
    });

    if (userSocket) {
      userSocket.join(room.objectId);
    }

    io.emit(dbConfig.EmitTypes.TEAM, dataToSend);
    io.to(user.objectId).emit(dbConfig.EmitTypes.TEAM, creatorDataToSend);
  }

  callback(creatorDataToSend);
}

/**
 * Create the team, together with the team's wallet and room.
 * @private
 * @param {Object} params - Parameters.
 * @param {Object} params.team - The team to save.
 * @param {Function} params.callback - Callback.
 */
function createTeamAndDependencies({
  team,
  callback,
}) {
  dbTeam.createTeam({
    team,
    callback: ({ error: createTeamError, data: createTeamData }) => {
      if (createTeamError) {
        callback({ error: createTeamError });

        return;
      }

      const { team: newTeam } = createTeamData;

      const {
        ownerAliasId,
        ownerId,
        objectId: teamId,
      } = newTeam;
      const wallet = {
        ownerId,
        ownerAliasId,
      };

      dbWallet.createWallet({
        wallet,
        callback: ({ error: walletError, data: walletData }) => {
          if (walletError) {
            callback({ error: walletError });

            return;
          }

          const roomToCreate = {
            ownerId,
            ownerAliasId,
            roomName: teamId,
            roomId: teamId,
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
            callback: ({ error: roomError, data: roomData }) => {
              if (roomError) {
                callback({ error: roomError });

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
}

/**
 * Create a team.
 * @param {Object} params - Parameters.
 * @param {Object} params.team Team to create.
 * @param {Object} params.io - Socket io. Will be used if socket is not set.
 * @param {string} params.token - jwt.
 * @param {Function} params.callback - Callback.
 * @param {Object} [params.socket] - Socket io.
 */
function createTeam({
  team,
  socket,
  io,
  callback,
  token,
}) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.CreateTeam.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      } else if (team.teamName.length > appConfig.teamNameMaxLength || team.shortName.length > appConfig.shortTeamMaxLength) {
        callback({ error: new errorCreator.InvalidData({ name: `Team name length: ${appConfig.teamNameMaxLength} Short name length: ${appConfig.shortTeamMaxLength}` }) });

        return;
      } else if (dbConfig.protectedNames.indexOf(team.teamName.toLowerCase()) > -1 || dbConfig.protectedNames.indexOf(team.shortName.toLowerCase()) > -1) {
        callback({ error: new errorCreator.AlreadyExists({ expected: 'not protected name' }) });

        return;
      }

      const { user: authUser } = data;
      const { ownerAliasId } = team;
      const newTeam = team;
      newTeam.ownerId = authUser.objectId;
      newTeam.isVerified = !appConfig.teamVerify;

      if (ownerAliasId && !authUser.aliases.includes(ownerAliasId)) {
        callback({ error: new errorCreator.NotAllowed({ name: `create team with alias ${ownerAliasId}` }) });

        return;
      }

      createTeamAndDependencies({
        socket,
        io,
        user: authUser,
        team: newTeam,
        callback: ({ error: teamError, data: teamData }) => {
          if (teamError) {
            callback({ error: teamError });

            return;
          }

          const {
            room,
            wallet,
            team: teamToEmit,
          } = teamData;

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

/**
 * Verify a team.
 * @param {Object} params - Parameters.
 * @param {string} params.token - jwt.
 * @param {string} params.teamId - Id of the team to verify.
 * @param {Function} params.callback - Callback.
 * @param {Object} params.io - Socket.io.
 */
function verifyTeam({
  token,
  teamId,
  callback,
  io,
}) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.VerifyTeam.name,
    callback: ({ error }) => {
      if (error) {
        callback({ error });

        return;
      }

      dbTeam.verifyTeam({
        teamId,
        callback: ({ error: teamError, data: teamData }) => {
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

          io.emit(dbConfig.EmitTypes.TEAM, dataToSend);

          callback(dataToSend);
        },
      });
    },
  });
}

/**
 * Invite a user to a team.
 * @param {Object} params - Parameters.
 * @param {Object} params.invitation - The invitation to create.
 * @param {Function} params.callback - Callback.
 * @param {Object} params.io - Socket io.
 */
function inviteToTeam({
  invitation,
  io,
  callback,
  token,
}) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.InviteToTeam.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const { user: authUser } = data;

      getTeamById({
        internalCallUser: authUser,
        teamId: invitation.itemId,
        callback: ({ error: teamError, data: teamData }) => {
          if (teamError) {
            callback({ error: teamError });

            return;
          }

          const { team: foundTeam } = teamData;
          const { ownerAliasId, receiverId: memberId } = invitation;

          if (ownerAliasId && !authUser.aliases.includes(ownerAliasId)) {
            callback({ error: new errorCreator.NotAllowed({ name: `invite to team ${invitation.itemId} with alias ${ownerAliasId}` }) });

            return;
          } else if (foundTeam.members.includes(memberId)) {
            callback({ error: new errorCreator.AlreadyExists({ name: `invite to team ${invitation.itemId}. User ${invitation.receiverId} already a member` }) });

            return;
          }

          const invitationToCreate = invitation;
          invitationToCreate.ownerId = authUser.objectId;
          invitationToCreate.invitationType = dbConfig.InvitationTypes.TEAM;

          // TODO Check if user receiver id exists

          dbInvitation.createInvitation({
            invitation: invitationToCreate,
            callback: ({ error: inviteError, data: invitationData }) => {
              if (inviteError) {
                callback({ error: inviteError });

                return;
              }

              const { invitation: newInvitation } = invitationData;
              const dataToSend = {
                data: {
                  invitation: newInvitation,
                  changeType: dbConfig.ChangeTypes.CREATE,
                },
              };

              io.to(newInvitation.receiverId).emit(dbConfig.EmitTypes.INVITATION, dataToSend);
              io.to(newInvitation.senderId).emit(dbConfig.EmitTypes.INVITATION, dataToSend);

              callback(dataToSend);
            },
          });
        },
      });
    },
  });
}

/**
 * Add a user to a team.
 * @private
 * @param {Object} params - Parameters.
 * @param {string} params.teamId - ID of the team.
 * @param {string} params.memberId - ID of the user.
 * @param {Object} params.user - User being added to the team.
 * @param {Function} params.callback - Callback
 * @param {Object} params.io - Socket.io.
 * @param {boolean} [params.isAdmin] - Should the user be set as an admin of the team?
 */
function addUserToTeam({
  teamId,
  memberId,
  isAdmin,
  user,
  callback,
  io,
}) {
  dbUser.addToTeam({
    teamId,
    isAdmin,
    userIds: [memberId],
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const { user: updatedUser } = data;

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

      const userSocket = socketUtils.getUserSocket({ io, socketId: user.socketId });

      if (userSocket) { userSocket.join(teamId); }

      io.emit(dbConfig.EmitTypes.TEAMMEMBER, dataToSend);

      callback(dataToSend);
    },
  });
}

/**
 * User accepts sent invitation and joins the team.
 * @param {Object} params - Parameters.
 * @param {Object} params.invitationId - ID of the invitation that will be accepted.
 * @param {Object} params.io - Socket io. Will be used if socket is not set.
 * @param {Function} params.callback - Callback.
 */
function acceptTeamInvitation({
  token,
  invitationId,
  io,
  callback,
}) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.AcceptInvitation.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const { user } = data;

      dbInvitation.useInvitation({
        invitationId,
        callback: ({ error: invitationError, data: invitationData }) => {
          if (invitationError) {
            callback({ error: invitationError });

            return;
          }

          const { invitation } = invitationData;

          addUserToTeam({
            io,
            callback,
            user,
            memberId: invitation.receiverId,
            teamId: invitation.itemId,
          });
        },
      });
    },
  });
}

/**
 * Get teams that the user has access to.
 * @param {Object} params - Parameters.
 * @param {string} params.token - jwt.
 * @param {Function} params.callback - Callback.
 * @param {boolean} [params.includeInactive] - Should unverified teams be returned?
 */
function getTeamsByUser({
  token,
  includeInactive,
  callback,
}) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.GetTeams.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const { user: authUser } = data;

      dbTeam.getTeamsByUser({
        includeInactive,
        user: authUser,
        callback: ({ error: getTeamsError, data: getTeamsData }) => {
          if (getTeamsError) {
            callback({ error: getTeamsError });

            return;
          }

          const { teams } = getTeamsData;
          const allTeams = teams.map((teamItem) => {
            const {
              hasFullAccess,
            } = authenticator.hasAccessTo({
              toAuth: authUser,
              objectToAccess: teamItem,
            });

            if (!hasFullAccess) {
              return managerHelper.stripObject({ object: teamItem });
            }

            return teamItem;
          }).sort((a, b) => {
            const aName = a.teamName;
            const bName = b.teamName;

            if (aName < bName) {
              return -1;
            } else if (aName > bName) {
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

/**
 * Remove a user from a team.
 * @param {Object} params - Parameters.
 * @param {string} params.userId - Id of the user or alias that is leaving a team.
 * @param {string} params.token - jwt.
 * @param {Object} params.io - Socket io.
 * @param {Function} params.callback - Callback.
 */
function leaveTeam({
  teamId,
  userId,
  token,
  io,
  callback,
}) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.LeaveTeam.name,
    callback: ({ error, data }) => {
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

              socketUtils.leaveRooms({
                io,
                roomIds: [teamId],
                socketId: authUser.socketId,
              });

              io.to(teamId).emit(dbConfig.EmitTypes.TEAMMEMBER, dataToSend);

              callback(dataToSend);
            },
          });
        },
      });
    },
  });
}

/**
 * Decline team invitation.
 * @param {Object} params - Parameters.
 * @param {string} params.invitationId - Id of the invitation to decline.
 * @param {string} params.token - jwt.
 * @param {Object} params.io - Socket.io. Will be used if socket is not set.
 * @param {Function} params.callback - Callback.
 * @param {Object} [params.socket] Socket.io.
 */
function declineTeamInvitation({
  invitationId,
  token,
  callback,
  socket,
  io,
}) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.DeclineInvitation.name,
    callback: ({ error }) => {
      if (error) {
        callback({ error });

        return;
      }

      dbInvitation.useInvitation({
        invitationId,
        callback: ({ error: invitationError, data: invitationData }) => {
          if (invitationError) {
            callback({ error: invitationError });

            return;
          }

          const { receiverId, itemId, invitationType } = invitationData;
          const dataToSend = {
            data: {
              invitation: {
                receiverId,
                invitationType,
              },
              changeType: dbConfig.ChangeTypes.REMOVE,
            },
          };

          if (socket) {
            socket.broadcast.to(itemId).emit(dbConfig.EmitTypes.INVITATION, dataToSend);
          } else {
            io.to(itemId).emit(dbConfig.EmitTypes.INVITATION, dataToSend);
          }

          callback(dataToSend);
        },
      });
    },
  });
}

/**
 * Update a team.
 * @param {Object} params - Parameters.
 * @param {string} params.teamId ID of the team to update.
 * @param {Object} params.team - New team parameters.
 * @param {Object} params.token - jwt.
 * @param {Object} params.io - Socket.io.
 * @param {Function} params.callback - Callback.
 */
function updateTeam({
  teamId,
  team,
  token,
  io,
  callback,
}) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.UpdateTeam.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const { user: authUser } = data;

      getTeamById({
        teamId,
        internalCallUser: authUser,
        callback: ({ error: accessError, data: foundTeamData }) => {
          if (accessError) {
            callback({ error: accessError });

            return;
          }

          const { team: foundTeam } = foundTeamData;
          const {
            hasFullAccess,
          } = authenticator.hasAccessTo({
            objectToAccess: foundTeam,
            toAuth: authUser,
          });

          if (!hasFullAccess) {
            callback({ error: new errorCreator.NotAllowed({ name: `team ${teamId}` }) });

            return;
          }

          dbTeam.updateTeam({
            teamId,
            team,
            callback: ({ error: teamError, data: teamData }) => {
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

              io.emit(dbConfig.EmitTypes.TEAM, dataToSend);

              callback(dataToSend);
            },
          });
        },
      });
    },
  });
}

exports.verifyTeam = verifyTeam;
exports.addUserToTeam = addUserToTeam;
exports.createTeam = createTeam;
exports.updateTeam = updateTeam;
exports.inviteToTeam = inviteToTeam;
exports.acceptTeamInvitation = acceptTeamInvitation;
exports.getTeamById = getTeamById;
exports.leaveTeam = leaveTeam;
exports.declineTeamInvitation = declineTeamInvitation;
exports.getTeamsByUser = getTeamsByUser;
