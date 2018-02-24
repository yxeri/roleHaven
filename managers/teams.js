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
const appConfig = require('../config/defaults/config').app;
const dbConfig = require('../config/defaults/config').databasePopulation;
const errorCreator = require('../objects/error/errorCreator');
const dbInvitation = require('../db/connectors/invitation');
const dbTeam = require('../db/connectors/team');
const authenticator = require('../helpers/authenticator');
const aliasManager = require('./aliases');
const dbRoom = require('../db/connectors/room');
const socketUtils = require('../utils/socketIo');

/**
 * Get team by Id and check if the user has access to it.
 * @param {Object} params - Parameters.
 * @param {Object} params.user - User retrieving the team.
 * @param {string} params.teamId - Id of the team to retrieve.
 * @param {Function} params.callback - Callback.
 * @param {string} [params.errorContentText] - Text to be printed on error.
 * @param {boolean} [params.shouldBeAdmin] - Does the user have to be an admin?
 */
function getAccessibleTeam({
  user,
  teamId,
  callback,
  shouldBeAdmin,
  full,
  errorContentText = `teamId ${teamId}`,
}) {
  dbTeam.getTeamById({
    teamId,
    callback: ({ error: teamError, data: teamData }) => {
      if (teamError) {
        callback({ error: teamError });

        return;
      } else if (!authenticator.hasAccessTo({
        shouldBeAdmin,
        toAuth: user,
        objectToAccess: teamData.team,
      })) {
        callback({ error: new errorCreator.NotAllowed({ name: errorContentText }) });

        return;
      }

      const foundTeam = teamData.team;
      const filteredTeam = {
        objectId: foundTeam.objectId,
        teamName: foundTeam.teamName,
        shortName: foundTeam.shortName,
        lastUpdated: foundTeam.lastUpdated,
      };

      callback({
        data: {
          team: full ? foundTeam : filteredTeam,
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
 * @param {Object} params.io - Socket.io. Will be used if socket is not set.
 * @param {Object} [params.socket] - Socket.io.
 */
function emitTeam({
  room,
  wallet,
  team,
  user,
  callback,
  io,
  socket,
}) {
  const dataToSend = {
    data: {
      wallet,
      room,
      team,
      changeType: dbConfig.ChangeTypes.CREATE,
    },
  };

  if (team.isVerified) {
    if (socket) {
      socket.join(room.objectId);
      socket.broadcast.to(team.accessLevel).emit(dbConfig.EmitTypes.TEAM, dataToSend);
    } else {
      const userSocket = socketUtils.getUserSocket({
        io,
        socketId: user.socketId,
      });

      if (userSocket) { userSocket.join(room.objectId); }

      io.to(team.accessLevel).emit(dbConfig.EmitTypes.TEAM, dataToSend);
    }
  }

  callback(dataToSend);
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
    callback: (createData) => {
      if (createData.error) {
        callback({ error: createData.error });

        return;
      }

      const newTeam = createData.data.team;

      const wallet = {
        ownerId: team.ownerId,
        ownerAliasId: team.ownerAliasId,
      };

      dbWallet.createWallet({
        wallet,
        callback: ({ error: walletError, data: walletData }) => {
          if (walletError) {
            callback({ error: walletError });

            return;
          }

          const roomToCreate = {
            ownerId: newTeam.ownerId,
            ownerAliasId: newTeam.ownerAliasId,
            roomName: newTeam.objectId,
            roomId: newTeam.objectId,
            accessLevel: dbConfig.AccessLevels.SUPERUSER,
            visibility: dbConfig.AccessLevels.SUPERUSER,
            nameIsLocked: true,
          };

          if (team.ownerAliasId) {
            roomToCreate.ownerAliasId = team.ownerAliasId;
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

      const authUser = data.user;
      const newTeam = team;
      newTeam.ownerId = authUser.objectId;
      newTeam.isVerified = !appConfig.teamVerify;

      if (newTeam.ownerAliasId) {
        aliasManager.getAccessibleAlias({
          user: authUser,
          aliasId: newTeam.ownerAliasId,
          callback: ({ error: aliasError }) => {
            if (aliasError.error) {
              callback({ error: aliasError });

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

                emitTeam({
                  socket,
                  io,
                  callback,
                  room: teamData.room,
                  wallet: teamData.wallet,
                  team: teamData.team,
                  user: authUser,
                });
              },
            });
          },
        });

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

          emitTeam({
            socket,
            io,
            callback,
            room: teamData.room,
            wallet: teamData.wallet,
            team: teamData.team,
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
 * @param {string} params.teamId - ID of the team to verify.
 * @param {Function} params.callback - Callback.
 * @param {Object} params.io - Socket.io. Will be used if socket is not set.
 * @param {Object} params.socket - Socket.io.
 */
function verifyTeam({
  token,
  teamId,
  callback,
  socket,
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

          // TODO Join all members to team, set team to all members.

          if (socket) {
            socket.broadcast.to(team.visibility).emit(dbConfig.EmitTypes.TEAM, dataToSend);
          } else {
            io.to(team.visibility).emit(dbConfig.EmitTypes.TEAM, dataToSend);
          }

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
 * @param {Object} params.io - Socket io. Will be used if socket is not set.
 * @param {Object} [params.socket] - Socket io.
 */
function inviteToTeam({
  socket,
  invitation,
  io,
  callback,
  token,
}) {
  const createCallback = (toCreate) => {
    dbInvitation.createInvitation({
      invitation: toCreate,
      callback: ({ error: inviteError, data: invitationData }) => {
        if (inviteError) {
          callback({ error: inviteError });

          return;
        }

        const newInvitation = invitationData.invitation;
        const dataToSend = {
          data: {
            invitation: newInvitation,
            changeType: dbConfig.ChangeTypes.CREATE,
          },
        };

        if (socket) {
          socket.broadcast.to(newInvitation.receiverId).emit(dbConfig.EmitTypes.INVITATION, dataToSend);
        } else {
          io.to(newInvitation.receiverId).emit(dbConfig.EmitTypes.INVITATION, dataToSend);
        }

        callback(dataToSend);
      },
    });
  };

  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.InviteToTeam.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const { user } = data;

      getAccessibleTeam({
        user,
        teamId: invitation.itemId,
        callback: ({ error: teamError }) => {
          if (teamError) {
            callback({ error: teamError });

            return;
          }

          // TODO Check if user receiver id exists

          const invitationToCreate = invitation;
          invitationToCreate.ownerAliasId = user.objectId;
          invitationToCreate.invitationType = dbConfig.InvitationTypes.TEAM;

          if (invitationToCreate.ownerAliasId) {
            aliasManager.getAccessibleAlias({
              user,
              aliasId: invitationToCreate.ownerAliasId,
              callback: ({ error: aliasError }) => {
                if (aliasError) {
                  callback({ error: aliasError });

                  return;
                }

                createCallback(invitationToCreate);
              },
            });

            return;
          }

          createCallback(invitationToCreate);
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
 * @param {Object} params.io - Socket.io. Will be used if socket is not set.
 * @param {boolean} [params.isAdmin] - Should the user be set as an admin of the team?
 * @param {Object} [params.socket] - Socket.io.
 */
function addUserToTeam({
  teamId,
  memberId,
  isAdmin,
  user,
  callback,
  socket,
  io,
}) {
  dbUser.addToTeam({
    teamId,
    isAdmin,
    userIds: [memberId],
    callback: ({ error }) => {
      if (error) {
        callback({ error });

        return;
      }

      const dataToSend = {
        data: {
          user: {
            objectId: memberId,
            partOfTeams: user.partOfTeams.concat(teamId),
          },
          changeType: dbConfig.ChangeTypes.UPDATE,
        },
      };
      const teamDataToSend = dataToSend;
      teamDataToSend.data.changeType = dbConfig.ChangeTypes.CREATE;

      const userSocket = socketUtils.getUserSocket({ io, socketId: user.socketId });

      if (userSocket) { userSocket.join(teamId); }

      if (socket) {
        socket.broadcast.to(teamId).emit(dbConfig.EmitTypes.TEAMMEMBER, teamDataToSend);
        socket.broadcast.emit(dbConfig.EmitTypes.USER, dataToSend);
      } else {
        io.to(teamId).emit(dbConfig.EmitTypes.TEAMMEMBER, teamDataToSend);
        io.emit(dbConfig.EmitTypes.USER, dataToSend);
      }

      callback(teamDataToSend);
    },
  });
}

/**
 * User accepts sent invitation and joins the team.
 * @param {Object} params - Parameters.
 * @param {Object} params.invitationId - ID of the invitation that will be accepted.
 * @param {Object} params.io - Socket io. Will be used if socket is not set.
 * @param {Function} params.callback - Callback.
 * @param {Object} [params.socket] Socket io.
 */
function acceptTeamInvitation({
  token,
  invitationId,
  io,
  socket,
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
            socket,
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
 * @param {boolean} [params.full] - Should access information be returned?
 */
function getTeamsByUser({
  full,
  token,
  includeInactive,
  callback,
}) {
  authenticator.isUserAllowed({
    token,
    commandName: full ? dbConfig.apiCommands.GetFull.name : dbConfig.apiCommands.GetTeams.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const { user } = data;

      dbTeam.getTeamsByUser({
        user,
        full,
        includeInactive,
        callback,
      });
    },
  });
}

/**
 * Get a team.
 * @param {Object} params - Parameters.
 * @param {string} params.teamId - ID of the team
 * @param {string} params.token - jwt.
 * @param {Function} params.callback - Callback.
 * @param {boolean} [params.full] - Should all parameters be returned in the result?
 */
function getTeamById({
  teamId,
  token,
  callback,
  full,
}) {
  authenticator.isUserAllowed({
    token,
    commandName: full ? dbConfig.apiCommands.GetFull.name : dbConfig.apiCommands.GetTeam.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const { user } = data;

      getAccessibleTeam({
        full,
        teamId,
        user,
        callback,
      });
    },
  });
}

/**
 * Remove a user from a team.
 * @param {Object} params - Parameters.
 * @param {string} params.userId - Id of the user or alias that is leaving a team.
 * @param {string} params.token - jwt.
 * @param {Object} params.io - Socket io. Will be used if socket is not set.
 * @param {Function} params.callback - Callback.
 * @param {Object} [params.socket] Socket io.
 */
function leaveTeam({
  teamId,
  userId,
  token,
  io,
  socket,
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

      const authUser = data.user;

      getAccessibleTeam({
        teamId,
        user: authUser,
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

              if (socket) {
                socket.broadcast.to(teamId).emit(dbConfig.EmitTypes.TEAMMEMBER, dataToSend);
              } else {
                io.to(teamId).emit(dbConfig.EmitTypes.TEAMMEMBER, dataToSend);
              }

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
 * Remove a team.
 * @param {Object} params - Parameters.
 * @param {string} params.teamId - ID of the team to remove.
 * @param {string} params.token - jwt.
 * @param {Object} params.io - Socket.io. Will be used if socket is not set.
 * @param {Function} params.callback - Callback.
 * @param {Object} [params.socket] - Socket.io.
 */
function removeTeam({
  teamId,
  token,
  io,
  socket,
  callback,
}) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.RemoveTeam.name,
    callback: ({ error }) => {
      if (error) {
        callback({ error });

        return;
      }

      dbTeam.removeTeam({
        teamId,
        callback: ({ error: teamError }) => {
          if (teamError) {
            callback({ error: teamError });

            return;
          }

          const dataToSend = {
            data: {
              team: { objectId: teamId },
              changeType: dbConfig.ChangeTypes.REMOVE,
            },
          };

          if (socket) {
            socket.broadcast.emit(dbConfig.EmitTypes.TEAM, dataToSend);
          } else {
            io.emit(dbConfig.EmitTypes.TEAM, dataToSend);
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
 * @param {Object} params.io - Socket.io. Will be used if socket is not set.
 * @param {Function} params.callback - Callback.
 * @param {Object} [params.socket] - Socket.io.
 */
function updateTeam({
  teamId,
  team,
  token,
  io,
  socket,
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

      const { user } = data;

      getAccessibleTeam({
        user,
        teamId,
        shouldBeAdmin: true,
        callback: ({ error: accessError }) => {
          if (accessError) {
            callback({ error: accessError });

            return;
          }

          const updateCallback = () => {
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

                if (socket) {
                  socket.broadcast.emit(dbConfig.EmitTypes.TEAM, dataToSend);
                } else {
                  io.emit(dbConfig.EmitTypes.TEAM, dataToSend);
                }

                callback(dataToSend);
              },
            });
          };
          const authUser = data.user;

          if (team.ownerAliasId) {
            aliasManager.getAccessibleAlias({
              callback,
              user: authUser,
              aliasId: team.ownerAliasId,
            });

            updateCallback();

            return;
          }

          updateCallback();
        },
      });
    },
  });
}

exports.verifyTeam = verifyTeam;
exports.addUserToTeam = addUserToTeam;
exports.createTeam = createTeam;
exports.removeTeam = removeTeam;
exports.updateTeam = updateTeam;
exports.inviteToTeam = inviteToTeam;
exports.acceptTeamInvitation = acceptTeamInvitation;
exports.getTeamById = getTeamById;
exports.leaveTeam = leaveTeam;
exports.declineTeamInvitation = declineTeamInvitation;
exports.getTeamsByUser = getTeamsByUser;
