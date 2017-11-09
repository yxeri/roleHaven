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
const objectValidator = require('../utils/objectValidator');
const authenticator = require('../helpers/authenticator');
const roomManager = require('./rooms');

/**
 * Update user's team
 * @param {string} params.userId - Id of the user to add to team
 * @param {string} params.teamId - ID of the team to add user to
 * @param {Function} [params.callback] Callback
 */
function updateUserTeam({ userId, teamId, callback = () => {} }) {
  dbUser.updateUserTeam({
    teamId,
    userId,
    callback: (userData) => {
      if (userData.error) {
        callback({ error: userData.error });

        return;
      }

      callback({ data: { user: userData.data.user } });
    },
  });
}

/**
 * Add user to team
 * @param {Object} params.teamId - ID of the team to add user to
 * @param {Object} params.user - ID of the user to add team to
 * @param {Object} params.io - Socket io
 * @param {Object} params.socket - Socket io
 * @param {Function} params.callback - Callback
 */
function addUserToTeam({ teamId, userId, io, socket, callback }) {
  updateUserTeam({
    userId,
    teamId,
    callback: ({ error }) => {
      if (error) {
        callback({ error });

        return;
      }

      redisClient.getRoom({
        roomId: teamId,
        callback: (redisError, room) => {
          if (redisError) {
            callback({ error: new errorCreator.Database({ errorObject: redisError }) });

            return;
          } else if (!room) {
            callback({ error: new errorCreator.DoesNotExist({}) });

            return;
          }

          dbUser.addRoomToUser({
            userId,
            roomId: teamId,
            callback: ({ error: userError, data: userData }) => {
              if (userError) {
                callback({ error: userError });

                return;
              }

              if (socket) {
                socket.broadcast.to(teamId).emit('roomFollower', { data: dataToSend });
                socket.join(teamId);
                socket.emit('follow', { data: { room } });
              } else {
                io.to(teamId).emit('follow', { data: { room } });
                io.to(teamId).emit('roomFollower', { data: dataToSend });
              }

              callback({
                data: {
                  teamId,
                },
              });
            },
          });
        }
      });
    },
  });
}

/**
 * Create team
 * @param {Object} params.team Team to create
 * @param {Object} [params.socket] - Socket io
 * @param {Object} params.io - Socket io. Will be used if socket is not set
 * @param {string} params.token - jwt
 * @param {Function} params.callback - Callback
 */
function createTeam({ team, socket, io, callback, token }) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.CreateTeam.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      } else if (data.user.team) {
        callback({ error: new errorCreator.AlreadyExists({ name: 'already in team' }) });

        return;
      } else if (team.teamName.toLowerCase() === 'team') {
        callback({ error: new errorCreator.InvalidData({ expected: 'team name !== team' }) });

        return;
      } else if (team.teamName.length > appConfig.teamNameMaxLength || team.shortName.length > appConfig.shortTeamMaxLength) {
        callback({ error: new errorCreator.InvalidData({ name: `Team name length: ${appConfig.teamNameMaxLength} Short name length: ${appConfig.shortTeamMaxLength}` }) });

        return;
      } else if (dbConfig.protectedNames.indexOf(team.teamName.toLowerCase()) > -1 || dbConfig.protectedNames.indexOf(team.shortName.toLowerCase()) > -1) {
        callback({ error: new errorCreator.AlreadyExists({ expected: 'team name !== team' }) });

        return;
      }

      const user = data.user;
      const newTeam = team;
      newTeam.ownerId = user.userId;
      newTeam.shortName = newTeam.shortName.toLowerCase();
      newTeam.teamName = newTeam.teamName.toLowerCase();
      newTeam.isVerified = !appConfig.teamVerify;

      dbTeam.createTeam({
        team: newTeam,
        callback: ({ error: teamError, data: teamData }) => {
          if (teamError) {
            callback({ error: teamError });

            return;
          }

          const createdTeam = teamData.team;
          const wallet = {
            ownerId: teamData.team.teamId,
            teamId: teamData.team.teamId,
          };

          dbWallet.createWallet({
            wallet,
            callback: ({ error: walletError, data: walletData }) => {
              if (walletError) {
                callback({ error: walletError });

                return;
              }

              roomManager.createSpecialRoom({
                user,
                room: {
                  teamId: createdTeam.teamId,
                  ownerId: createdTeam.teamId,
                  roomName: createdTeam.teamId,
                  accessLevel: dbConfig.AccessLevels.SUPERUSER,
                  visibility: dbConfig.AccessLevels.SUPERUSER,
                },
                callback: ({ error: roomError, data: roomData }) => {
                  if (roomError) {
                    callback({ error: roomError });

                    return;
                  }

                  const dataToEmit = {
                    requiresVerify: appConfig.teamVerify,
                    team: createdTeam,
                  };

                  if (appConfig.teamVerify) {
                    if (socket) {
                      socket.broadcast.emit('team', { data: dataToEmit });
                    } else {
                      io.emit('team', { data: dataToEmit });
                    }

                    callback({
                      data: {
                        requiresVerify: appConfig.teamVerify,
                        team: createdTeam,
                        wallet: walletData.wallet,
                        room: roomData.room,
                      },
                    });
                  } else {
                    addUserToTeam({
                      socket,
                      io,
                      user,
                      team: createdTeam,
                      callback: ({ error: userError }) => {
                        if (userError) {
                          callback({ error: userError });

                          return;
                        }

                        if (socket) {
                          socket.broadcast.emit('team', { data: dataToEmit });
                        } else {
                          io.emit('team', { data: dataToEmit });
                        }

                        callback({
                          data: {
                            requiresVerify: appConfig.teamVerify,
                            team: createdTeam,
                            wallet: walletData.wallet,
                            room: roomData.room,
                          },
                        });
                      },
                    });
                  }
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
 * Invite user to team
 * @param {string} params.receiverId - ID of the user to invite
 * @param {Object} [params.socket] - Socket io
 * @param {Object} [params.io] - Socket io. Will be used if socket is not set
 * @param {Function} params.callback - Callback
 */
function inviteToTeam({ socket, receiverId, io, callback, token }) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.InviteToTeam.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      } else if (!data.user.teamId) {
        callback({ error: new errorCreator.DoesNotExist({ name: 'not part of team' }) });

        return;
      }

      redisClient.getUser({
        userId: receiverId,
        callback: (redisError, user) => {
          if (redisError) {
            callback({ error: new errorCreator.Database({ errorObject: redisError }) });

            return;
          } else if (!user) {
            callback({ error: new errorCreator.DoesNotExist({ name: 'not part of team' }) });

            return;
          }

          const senderUser = data.user;

          const invitation = {
            itemId: senderUser.teamId,
            invitationType: dbInvitation.InvitationTypes.TEAM,
            senderId: senderUser.userId,
          };

          dbInvitation.createInvitation({
            invitation,
            callback: ({ error: inviteError, data: invitationData }) => {
              if (inviteError) {
                callback({ error: inviteError });

                return;
              }

              const newInvitation = invitationData.invitation;
              const dataToSend = {
                invitation: newInvitation,
              };

              if (socket) {
                socket.broadcast.to(newInvitation.receiverId).emit('invitation', { data: dataToSend });
              } else {
                io.to(newInvitation.receiverId).emit('invitation', { data: dataToSend });
              }

              callback({ data: dataToSend });
            },
          });
        },
      });
    },
  });
}

/**
 * User accepts sent invitation and joins the team
 * @param {Object} params.user User accepting invite
 * @param {Object} params.invitation Invitation that will be accepted
 * @param {Object} params.io Socket io. Will be used if socket is not set
 * @param {Object} [params.socket] Socket io.
 * @param {Function} params.callback Callback
 */
function acceptTeamInvitation({ token, invitation, io, socket, callback }) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.AcceptInvitation.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      } else if (!objectValidator.isValidData({ invitation, io }, { invitation: { invitationType: true, itemName: true }, io: true })) {
        callback({ error: new errorCreator.InvalidData({ expected: '{ invitation: { invitationType, itemName }, io }' }) });

        return;
      }

      const user = data.user;
      const username = user.username;

      dbInvitation.getInvitations({
        username,
        callback: (invitationData) => {
          if (invitationData.error) {
            callback({ error: invitationData.error });

            return;
          }

          const retrievedInvitation = invitationData.data.list.invitations.find(inv => inv.itemName === invitation.itemName && inv.invitationType === invitation.invitationType);

          if (!retrievedInvitation) {
            callback({ error: new errorCreator.DoesNotExist({ name: `invitation ${invitation.itemName} ${invitation.invitationType} for ${username}` }) });

            return;
          }

          dbTeam.getTeam({
            teamName: retrievedInvitation.itemName,
            callback: ({ error: teamError, data: teamData }) => {
              if (teamError) {
                callback({ error: teamError });

                return;
              }

              addUserToTeam({
                socket,
                io,
                user,
                team: teamData.team,
                callback: (addUserData) => {
                  if (addUserData.error) {
                    callback({ error: addUserData.error });

                    return;
                  }

                  dbInvitation.removeInvitationTypeFromList({
                    username,
                    invitationType: 'team',
                    callback: (removeData) => {
                      if (removeData.error) {
                        callback({ error: removeData.error });

                        return;
                      }

                      callback({ data: addUserData.data });

                      if (socket) {
                        socket.broadcast.to(`${addUserData.data.team.teamName}${appConfig.teamAppend}`).emit('teamMember', { data: { user: { username: user.username } } });
                      } else {
                        io.to(`${addUserData.data.team.teamName}${appConfig.teamAppend}`).emit('teamMember', { data: { user: { username: user.username } } });
                      }
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
 * Get teams
 * @param {string} params.token jwt
 * @param {Function} params.callback Callback
 */
function getTeams({ token, callback }) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.GetTeams.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      dbTeam.getTeams({
        user: data.user,
        callback: ({ error: teamError, data: teamData }) => {
          if (teamError) {
            callback({ error: teamError });

            return;
          }

          callback({ data: teamData });
        },
      });
    },
  });
}

/**
 * Get team
 * @param {string} params.teamName Short of full team name
 * @param {string} params.token jwt
 * @param {Function} params.callback Callback
 */
function getTeam({ teamName, token, callback }) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.GetTeam.name,
    callback: ({ error }) => {
      if (error) {
        callback({ error });

        return;
      }

      dbTeam.getTeam({
        teamName,
        callback: ({ error: teamError, data: teamData }) => {
          if (teamError) {
            callback({ error: teamError });

            return;
          }

          callback({ data: teamData });
        },
      });
    },
  });
}

/**
 * Remove team from user. Removes team from all user if the user is the owner
 * @param {string} params.token jwt
 * @param {Function} params.callback Callback
 */
function leaveTeam({ token, io, socket, callback }) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.LeaveTeam.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      } else if (!data.user.team) {
        callback({ error: new errorCreator.DoesNotExist({ name: 'not part of team' }) });

        return;
      }

      const user = data.user;

      dbTeam.getTeam({
        teamName: user.team,
        callback: (teamData) => {
          if (teamData.error) {
            callback({ error: teamData.error });

            return;
          }

          const roomName = user.team + appConfig.teamAppend;
          const room = { roomName };
          const team = { teamName: user.team };

          if (teamData.data.team.owner === user.username) {
            dbTeam.removeTeam({
              user,
              teamName: user.team,
              callback: (removeTeamData) => {
                if (removeTeamData.error) {
                  callback({ error: removeTeamData.error });

                  return;
                }

                const connectedIds = Object.keys(io.sockets.adapter.rooms[roomName].sockets);
                const allSockets = io.sockets.connected;

                if (socket) {
                  socket.broadcast.to(roomName).emit('leaveTeam', { team, room });
                } else {
                  io.to(roomName).emit('leaveTeam', { team, room });
                }

                connectedIds.forEach((connectedId) => {
                  allSockets[connectedId].leave(roomName);
                });

                callback({ data: { team, room } });
              },
            });
          } else {
            dbUser.removeUserTeam({
              username: user.username,
              callback: (removeUserData) => {
                if (removeUserData.error) {
                  callback({ error: removeUserData.error });

                  return;
                }

                dbUser.removeRoomFromUser({
                  roomName,
                  username: user.username,
                  callback: (removeRoomData) => {
                    if (removeRoomData.error) {
                      callback({ error: removeRoomData.error });

                      return;
                    }

                    socket.leave(roomName);
                    callback({ data: { team, room } });
                  },
                });
              },
            });
          }
        },
      });
    },
  });
}

/**
 * Get team invitations from user
 * @param {string} params.token jwt
 * @param {Function} params.callback Callback
 */
function getTeamInvitations({ token, callback }) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.GetInvitations.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      dbInvitation.getInvitations({
        username: data.user.username,
        callback: ({ error: invitationError, data: invitationData }) => {
          if (invitationError) {
            callback({ error: invitationError });

            return;
          }

          callback({ data: { invitations: invitationData.list.invitations.filter(invitation => invitation.invitationType === 'team') } });
        },
      });
    },
  });
}

/**
 * Decline team invitation
 * @param {Object} params.invitation Invitation to remove
 * @param {string} params.token jwt
 * @param {Function} params.callback Callback
 */
function declineTeamInvitation({ invitation, token, callback }) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.DeclineInvitation.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      dbInvitation.removeInvitationFromList({
        username: data.user.username,
        itemName: invitation.itemName,
        invitationType: 'team',
        callback: ({ error: declineError }) => {
          if (declineError) {
            callback({ error: declineError });

            return;
          }

          callback({ data: { success: true } });
        },
      });
    },
  });
}

exports.updateUserTeam = updateUserTeam;
exports.addUserToTeam = addUserToTeam;
exports.createTeam = createTeam;
exports.inviteToTeam = inviteToTeam;
exports.acceptTeamInvitation = acceptTeamInvitation;
exports.getTeams = getTeams;
exports.getTeam = getTeam;
exports.leaveTeam = leaveTeam;
exports.getTeamInvitations = getTeamInvitations;
exports.declineTeamInvitation = declineTeamInvitation;
