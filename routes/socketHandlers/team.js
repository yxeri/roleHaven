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
const dbConfig = require('../../config/defaults/config').databasePopulation;
const manager = require('../../helpers/manager');
const objectValidator = require('../../utils/objectValidator');
const appConfig = require('../../config/defaults/config').app;
const errorCreator = require('../../objects/error/errorCreator');

/**
 * @param {object} socket - Socket.IO socket
 * @param {object} io - Socket.IO
 */
function handle(socket, io) {
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

            manager.addUserToTeam({
              socket,
              io,
              team: verifiedTeam,
              user: { userName: verifiedTeam.owner },
              callback: (addUserData) => {
                if (addUserData.error) {
                  callback({ error: addUserData.error });

                  return;
                }

                callback({ data: addUserData.data });
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

        dbTeam.getTeams({
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
