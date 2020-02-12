/*
 Copyright 2017 Carmilla Mina Jankovic

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
const textTools = require('../utils/textTools');
const userManager = require('./users');
const roomManager = require('./rooms');
const imager = require('../helpers/imager');

/**
 * Get a team.
 * @param {Object} params Parameters.
 * @param {string} params.teamId Id of the team.
 * @param {string} params.token jwt.
 * @param {Function} params.callback Callback.
 */
function getTeamById({
  teamId,
  token,
  callback,
  internalCallUser,
  needsAccess,
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

/**
 * Emits team to clients.
 * @param {Object} params Parameters.
 * @param {Object} params.room Team room.
 * @param {Object} params.wallet Team wallet.
 * @param {Object} params.team Team.
 * @param {Object} params.user User who created the team.
 * @param {Function} params.callback Callback.
 * @param {Object} params.io Socket.io.
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
    } else {
      const userSocket = socketUtils.getUserSocket({
        io,
        socketId: user.socketId,
      });

      if (userSocket) {
        userSocket.join(room.objectId);
      }

      io.to(user.objectId).emit(dbConfig.EmitTypes.TEAM, creatorDataToSend);
    }

    io.to(user.objectId).emit(dbConfig.EmitTypes.USER, creatorDataToSend);
    io.emit(dbConfig.EmitTypes.ROOM, roomToSend);
    io.emit(dbConfig.EmitTypes.WALLET, walletToSend);
  }

  callback(creatorDataToSend);
}

/**
 * Add a user to a team.
 * @private
 * @param {Object} params Parameters.
 * @param {string} params.teamId Id of the team.
 * @param {string} params.memberId Id of the user.
 * @param {Function} params.callback Callback
 * @param {Object} params.io Socket.io.
 * @param {boolean} [params.isAdmin] Should the user be set as an admin of the team?
 */
function addUserToTeam({
  teamId,
  memberId,
  isAdmin,
  callback,
  io,
  socket,
  ignoreSocket = false,
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

      const { users } = data;
      const updatedUser = users[0];

      roomManager.follow({
        io,
        socket,
        user: updatedUser,
        invited: true,
        userId: memberId,
        roomId: teamId,
        callback: ({ error: roomError }) => {
          if (roomError) {
            callback({ error: roomError });

            return;
          }

          const dataToSend = {
            data: {
              room: { objectId: teamId },
              team: { objectId: teamId },
              user: {
                objectId: memberId,
                partOfTeams: updatedUser.partOfTeams,
              },
              changeType: dbConfig.ChangeTypes.UPDATE,
            },
          };

          if (!ignoreSocket) {
            const userSocket = socketUtils.getUserSocket({ io, socketId: updatedUser.socketId });

            if (userSocket) { userSocket.join(teamId); }

            io.to(teamId).emit(dbConfig.EmitTypes.TEAMMEMBER, dataToSend);
            io.emit(dbConfig.EmitTypes.USER, dataToSend);
          }

          callback(dataToSend);
        },
      });
    },
  });
}

/**
 * Create the team, together with the team's wallet and room.
 * @private
 * @param {Object} params Parameters.
 * @param {Object} params.team The team to save.
 * @param {Function} params.callback Callback.
 */
function createTeamAndDependencies({
  team,
  io,
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
        objectId: teamId,
      };

      dbWallet.createWallet({
        wallet,
        options: { setId: true },
        callback: ({ error: walletError, data: walletData }) => {
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
            callback: ({ error: roomError, data: roomData }) => {
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

/**
 * Create a team.
 * @param {Object} params Parameters.
 * @param {Object} params.team Team to create.
 * @param {Object} params.io Socket io. Will be used if socket is not set.
 * @param {string} params.token jwt.
 * @param {Function} params.callback Callback.
 * @param {Object} [params.socket] Socket io.
 */
function createTeam({
  team,
  socket,
  io,
  callback,
  token,
  image,
}) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.CreateTeam.name,
    callback: ({ error, data }) => {
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

      const teamCallback = () => {
        createTeamAndDependencies({
          io,
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
      };

      if (image) {
        imager.createImage({
          image,
          callback: ({ error: imageError, data: imageData }) => {
            if (imageError) {
              callback({ error: imageError });

              return;
            }

            const { image: createdImage } = imageData;

            newTeam.image = createdImage;

            teamCallback();
          },
        });

        return;
      }

      teamCallback();
    },
  });
}

/**
 * Verify a team.
 * @param {Object} params Parameters.
 * @param {string} params.token jwt.
 * @param {string} params.teamId Id of the team to verify.
 * @param {Function} params.callback Callback.
 * @param {Object} params.io Socket.io.
 */
function verifyTeam({
  token,
  teamId,
  callback,
  io,
  socket,
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
 * Invite a user to a team.
 * @param {Object} params Parameters.
 * @param {Object} params.invitation The invitation to create.
 * @param {Function} params.callback Callback.
 * @param {Object} params.io Socket io.
 */
function inviteToTeam({
  invitation,
  io,
  callback,
  token,
  socket,
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
        needsAccess: true,
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
          }

          if (foundTeam.members.includes(memberId)) {
            callback({ error: new errorCreator.AlreadyExists({ name: `invite to team ${invitation.itemId}. User ${invitation.receiverId} already a member` }) });

            return;
          }

          userManager.getUserById({
            token,
            internalCallUser: authUser,
            userId: memberId,
            callback: ({ error: getError, data: userData }) => {
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

/**
 * User accepts sent invitation and joins the team.
 * @param {Object} params Parameters.
 * @param {Object} params.invitationId ID of the invitation that will be accepted.
 * @param {Object} params.io Socket io. Will be used if socket is not set.
 * @param {Function} params.callback Callback.
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

/**
 * Get teams that the user has access to.
 * @param {Object} params Parameters.
 * @param {string} params.token jwt.
 * @param {Function} params.callback Callback.
 * @param {boolean} [params.includeInactive] Should unverified teams be returned?
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

/**
 * Remove a user from a team.
 * @param {Object} params Parameters.
 * @param {string} params.token jwt.
 * @param {Object} params.io Socket io.
 * @param {Function} params.callback Callback.
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

              dbTeam.removeTeamMembers({
                teamId,
                memberIds: [userId],
                callback: ({ error: removeTeamError, data: updatedData }) => {
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

                  io.to(teamId).emit(dbConfig.EmitTypes.TEAMMEMBER, dataToSend);
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

/**
 * Increase or decrease team score.
 * @param {Object} params Parameters.
 * @param {string} params.teamId Id of the team to update.
 * @param {string} params.value Amount.
 * @param {boolean} params.shouldIncrease Should the score be increased?
 * @param {Object} params.io Socket.io.
 * @param {Function} params.callback Callback.
 */
function updateTeamScore({
  teamId,
  value,
  shouldIncrease,
  io,
  callback,
}) {
  dbTeam.updateTeamScore({
    teamId,
    value,
    shouldIncrease,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const { team } = data;

      io.emit(dbConfig.EmitTypes.TEAM, {
        data: {
          team: managerHelper.stripObject({ object: team }),
          changeType: dbConfig.ChangeTypes.UPDATE,
        },
      });
    },
  });
}

/**
 * Update a team.
 * @param {Object} params Parameters.
 * @param {string} params.teamId ID of the team to update.
 * @param {Object} params.team New team parameters.
 * @param {Object} params.token jwt.
 * @param {Object} params.io Socket.io.
 * @param {Function} params.callback Callback.
 */
function updateTeam({
  teamId,
  team,
  token,
  io,
  callback,
  socket,
  image,
  internalCallUser,
}) {
  authenticator.isUserAllowed({
    token,
    internalCallUser,
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

          const teamUpdate = team;

          const teamCallback = () => {
            dbTeam.updateTeam({
              teamId,
              team: teamUpdate,
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

          if (image) {
            imager.createImage({
              image,
              callback: ({ error: imageError, data: imageData }) => {
                if (imageError) {
                  callback({ error: imageError });

                  return;
                }

                const { image: createdImage } = imageData;

                teamUpdate.image = createdImage;

                teamCallback();
              },
            });

            return;
          }

          teamCallback();
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
exports.getTeamsByUser = getTeamsByUser;
exports.updateTeamScore = updateTeamScore;
