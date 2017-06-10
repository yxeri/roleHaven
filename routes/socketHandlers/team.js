/*
 Copyright 2015 Aleksandar Jankovic

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

const dbTeam = require('../../db/connectors/team');
const dbUser = require('../../db/connectors/user');
const dbRoom = require('../../db/connectors/room');
const dbConnector = require('../../db/databaseConnector');
const dbConfig = require('../../config/defaults/config').databasePopulation;
const manager = require('../../socketHelpers/manager');
const objectValidator = require('../../utils/objectValidator');
const appConfig = require('../../config/defaults/config').app;
const errorCreator = require('../../objects/error/errorCreator');

/**
 * Add user to team's room
 * @param {string} params.userName Name of the user
 * @param {string} params.roomName Name of the room
 * @param {Object} params.io Socket.IO
 * @param {Function} params.callback Callback
 */
function addUserTeamRoom({ roomName, userName, io, callback = () => {} }) {
  dbUser.addRoomToUser({
    userName,
    roomName,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const userSocket = io.sockets.connected[data.user.socketId];

      if (userSocket) {
        userSocket.join(roomName);
        userSocket.emit('follow', { room: { roomName } });
      }

      callback({ data: { room: { roomName } } });
    },
  });
}

/**
 * @param {object} socket - Socket.IO socket
 * @param {object} io - Socket.IO
 */
function handle(socket, io) {
  socket.on('inviteToTeam', ({ user, token }, callback = () => {}) => {
    if (!objectValidator.isValidData({ user }, { user: { userName: true } })) {
      callback({ error: new errorCreator.InvalidData({ expected: '{ user: { userName } }' }) });

      return;
    }

    user.userName = user.userName.toLowerCase();

    manager.userIsAllowed({
      token,
      commandName: dbConfig.commands.inviteTeam.commandName,
      callback: ({ error, allowedUser }) => {
        if (error) {
          callback({ error });

          return;
        } else if (allowedUser.userName === user.userName) {
          callback({ error: new errorCreator.AlreadyExists({ name: 'your team' }) });

          return;
        }

        dbTeam.getTeam({
          teamName: allowedUser.team,
          callback: (teamData) => {
            if (teamData.error) {
              callback({ error: teamData.error });

              return;
            } else if (teamData.data.team.owner !== allowedUser.userName && teamData.data.team.admins.indexOf(allowedUser.userName) === -1) {
              callback({ error: new errorCreator.NotAllowed({ name: 'adding member to team' }) });

              return;
            }

            dbUser.getUser({
              userName: user.userName,
              callback: (userData) => {
                if (userData.error) {
                  callback({ error: userData.error });

                  return;
                } else if (userData.data.user.team) {
                  callback({ error: new errorCreator.AlreadyExists({ name: 'team' }) });

                  return;
                }

                const invitation = {
                  itemName: allowedUser.team,
                  time: new Date(),
                  invitationType: 'team',
                  sender: allowedUser.userName,
                };

                dbConnector.addInvitationToList({
                  invitation,
                  userName: userData.data.user.userName,
                  callback: ({ error: inviteError }) => {
                    if (inviteError) {
                      callback({ error: inviteError });

                      return;
                    }

                    socket.to(`${allowedUser.userName}${appConfig.whisperAppend}`).emit('invitation', { invitation });
                    callback({ data: { invitation } });
                  },
                });
              },
            });
          },
        });
      },
    });
  });

  socket.on('getTeam', ({ token }, callback = () => {}) => {
    manager.userIsAllowed({
      token,
      socketId: socket.id,
      commandName: dbConfig.commands.getTeam.commandName,
      callback: ({ error, allowedUser }) => {
        if (error) {
          callback({ error });

          return;
        }

        dbTeam.getTeam({
          teamName: allowedUser.team,
          callback: (teamData) => {
            if (teamData.error) {
              callback({ error: teamData.error });
            }

            callback({ data: teamData.data });
          },
        });
      },
    });
  });

  /**
   * Create a team
   * @param {Object} params.team Team
   * @param {string} params.team.teamName Full team name
   * @param {string} params.team.shortName Short name (5 chars) for the team
   */
  socket.on('createTeam', ({ team, token }, callback = () => {}) => {
    if (!objectValidator.isValidData({ team }, { team: { teamName: true, shortName: true } })) {
      callback({ error: new errorCreator.InvalidData({ expected: '{ team: { teamName, shortName } }' }) });

      return;
    } else if (team.teamName.toLowerCase() === 'team') {
      callback({ error: new errorCreator.InvalidData({ expected: 'team name !== team' }) });

      return;
    } else if (team.teamName.length > appConfig.teamNameMaxLength || team.shortName.length > appConfig.shortTeamMaxLength) {
      callback({ error: new errorCreator.InvalidCharacters({ name: `Team name length: ${appConfig.teamNameMaxLength} Short name length: ${appConfig.shortTeamMaxLength}` }) });

      return;
    }

    manager.userIsAllowed({
      token,
      commandName: dbConfig.commands.createTeam.commandName,
      callback: ({ error, allowedUser }) => {
        if (error) {
          callback({ error });

          return;
        } else if (allowedUser.team) {
          callback({ error: new errorCreator.AlreadyExists({ name: 'team' }) });

          return;
        }

        dbTeam.getTeamByOwner({
          owner: allowedUser.userName,
          callback: (teamData) => {
            if (teamData.error) {
              if (teamData.error.type === errorCreator.ErrorTypes.DOESNOTEXIST) {
                team.owner = allowedUser.userName;
                team.verified = false;

                dbTeam.createTeam({
                  team,
                  callback: (createRoomData) => {
                    if (createRoomData.error) {
                      callback({ error: createRoomData.error });

                      return;
                    }

                    const teamRoom = {
                      roomName: team.teamName + appConfig.teamAppend,
                      accessLevel: dbConfig.accessLevels.superUser,
                      visibility: dbConfig.accessLevels.superUser,
                    };
                    const wallet = {
                      owner: team.teamName + appConfig.teamAppend,
                      team: team.teamName,
                    };

                    manager.createWallet({ wallet, callback: () => {} });

                    dbRoom.createRoom({
                      room: teamRoom,
                      user: dbConfig.users.superuser,
                      callback: (teamRoomData) => {
                        if (teamRoomData.error) {
                          callback({ error: teamRoomData.error });

                          return;
                        }

                        socket.broadcast.emit('team', { team: { teamName: team.teamName } });

                        if (appConfig.teamVerify) {
                          callback({ data: { requiresVerify: appConfig.teamVerify, team } });
                        } else {
                          manager.updateUserTeam({
                            socket,
                            userName: team.owner,
                            teamName: team.teamName,
                            shortTeamName: team.shortName,
                            callback: ({ error: updateError }) => {
                              if (updateError) {
                                callback({ error: new errorCreator.Database({ errorObject: updateError, name: 'create team update user' }) });

                                return;
                              }

                              addUserTeamRoom({
                                io,
                                userName: allowedUser.userName,
                                roomName: teamRoom.roomName,
                              });
                              callback({
                                data: {
                                  team,
                                  requiresVerify: false,
                                },
                              });
                            },
                          });
                        }
                      },
                    });
                  },
                });

                return;
              }

              callback({ error: teamData.error });
            } else if (teamData.data.team) {
              callback({ error: new errorCreator.AlreadyExists({ name: `team ${teamData.data.team.teamName}` }) });
            }
          },
        });
      },
    });
  });

  socket.on('verifyTeam', ({ team, token }, callback = () => {}) => {
    if (!objectValidator.isValidData({ team }, { team: { teamName: true } })) {
      callback({ error: new errorCreator.InvalidData({ expected: '{ team: { teamName } }' }) });

      return;
    }

    manager.userIsAllowed({
      token,
      commandName: dbConfig.commands.verifyTeam.commandName,
      callback: ({ error }) => {
        if (error) {
          callback({ error });

          return;
        }

        dbTeam.verifyTeam({
          teamName: team.teamName,
          callback: (verifyData) => {
            if (verifyData.error) {
              callback({ error: verifyData.error });

              return;
            }

            const { team: verifiedTeam } = verifyData.data;

            manager.updateUserTeam({
              socket,
              userName: verifiedTeam.owner,
              teamName: verifiedTeam.teamName,
              shortTeamName: verifiedTeam.shortName,
              callback: ({ error: updateError }) => {
                if (updateError) {
                  callback({ error: updateError });

                  return;
                }

                addUserTeamRoom({
                  io,
                  userName: verifiedTeam.owner,
                  roomName: verifiedTeam.teamName + appConfig.teamAppend,
                });
              },
            });
          },
        });
      },
    });
  });

  socket.on('getUnverifiedTeams', ({ token }, callback = () => {}) => {
    manager.userIsAllowed({
      token,
      commandName: dbConfig.commands.verifyTeam.commandName,
      callback: ({ error }) => {
        if (error) {
          callback({ error });

          return;
        }

        dbTeam.getUnverifiedTeams((unverifyData) => {
          if (unverifyData.error) {
            callback({ error: unverifyData.error });

            return;
          }

          const { teams } = unverifyData.data;

          callback({ data: { teams } });
        });
      },
    });
  });

  socket.on('listTeams', ({ token }, callback = () => {}) => {
    manager.userIsAllowed({
      token,
      commandName: dbConfig.commands.listTeams.commandName,
      callback: ({ error }) => {
        if (error) {
          callback({ error });

          return;
        }

        dbTeam.getAllTeams({
          callback: (teamsData) => {
            if (teamsData.error) {
              callback({ error: teamsData.error });

              return;
            }

            const { teams } = teamsData.data;

            callback({
              data: {
                teams: teams.map((team) => {
                  return { teamName: team.teamName, shortName: team.shortName };
                }),
              },
            });
          },
        });
      },
    });
  });

  socket.on('leaveTeam', ({ token }, callback = () => {}) => {
    manager.userIsAllowed({
      token,
      commandName: dbConfig.commands.leaveTeam.commandName,
      callback: ({ error, allowedUser }) => {
        if (error) {
          callback({ error });

          return;
        } else if (!allowedUser.team) {
          callback({ error: new errorCreator.DoesNotExist({ name: 'team' }) });

          return;
        }

        dbTeam.getTeam({
          teamName: allowedUser.team,
          callback: (teamData) => {
            if (teamData.error) {
              callback({ error: teamData.error });

              return;
            }

            const roomName = allowedUser.team + appConfig.teamAppend;
            const room = { roomName };
            const team = { teamName: allowedUser.team };

            if (teamData.data.team.owner === allowedUser.userName) {
              dbTeam.removeTeam({
                teamName: allowedUser.team,
                user: allowedUser,
                callback: (removeTeamData) => {
                  if (removeTeamData.error) {
                    callback({ error: removeTeamData.error });

                    return;
                  }

                  const connectedIds = Object.keys(io.sockets.adapter.rooms[roomName].sockets);
                  const allSockets = io.sockets.connected;

                  socket.broadcast.to(roomName).emit('leaveTeam', { team, room });

                  connectedIds.forEach((connectedId) => {
                    allSockets[connectedId].leave(roomName);
                  });

                  callback({ data: { team, room } });
                },
              });
            } else {
              dbUser.removeUserTeam({
                userName: allowedUser.userName,
                callback: (removeUserData) => {
                  if (removeUserData.error) {
                    callback({ error: removeUserData.error });

                    return;
                  }

                  dbUser.removeRoomFromUser({
                    roomName,
                    userName: allowedUser.userName,
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
  });
}

exports.handle = handle;
