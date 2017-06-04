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
  dbUser.addRoomToUser(userName, roomName, (roomErr, user) => {
    if (roomErr) {
      callback({ error: new errorCreator.Database({ errorObject: roomErr }) });

      return;
    }

    const userSocket = io.sockets.connected[user.socketId];

    if (userSocket) {
      userSocket.join(roomName);
      userSocket.emit('follow', { room: { roomName } });
    }

    callback({ data: { room: { roomName } } });
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

        dbTeam.getTeam(allowedUser.team, (err, team) => {
          if (err) {
            callback({ error: new errorCreator.Database({ errorObject: err }) });

            return;
          } else if (team.owner !== allowedUser.userName && team.admins.indexOf(allowedUser.userName) === -1) {
            callback({ error: new errorCreator.NotAllowed({ name: 'adding member to team' }) });

            return;
          }

          dbUser.getUser(user.userName, (userErr, invitedUser) => {
            if (userErr) {
              callback({ error: new errorCreator.Database({ errorObject: userErr }) });

              return;
            } else if (!invitedUser) {
              callback({ error: new errorCreator.DoesNotExist({ name: `user ${user.userName}` }) });

              return;
            } else if (invitedUser.team) {
              callback({ error: new errorCreator.AlreadyExists({ name: 'team' }) });

              return;
            }

            const invitation = {
              itemName: allowedUser.team,
              time: new Date(),
              invitationType: 'team',
              sender: allowedUser.userName,
            };

            dbConnector.addInvitationToList(invitedUser.userName, invitation, (invErr) => {
              if (invErr) {
                if (invErr.code === 11000) {
                  callback({ error: new errorCreator.AlreadyExists({ name: 'invitation' }) });
                } else {
                  callback({ error: new errorCreator.Database({ errorObject: invErr }) });
                }

                return;
              }

              socket.to(`${allowedUser.userName}${appConfig.whisperAppend}`).emit('invitation', { invitation });
              callback({ data: { invitation } });
            });
          });
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

        dbTeam.getTeam(allowedUser.team, (err, team) => {
          if (err) {
            callback({ error: new errorCreator.Database({ errorObject: err }) });
          }

          callback({ data: { team } });
        });
      },
    });
  });

  /**
   * Create a team
   * @param {Object} params.team Team
   * @param {string} params.team.teamName Full team name
   * @param {string} params.team.shortName Short name (4 chars) for the team
   */
  socket.on('createTeam', ({ team, token }, callback = () => {}) => {
    if (!objectValidator.isValidData({ team }, { team: { teamName: true, shortName: true } })) {
      callback({ error: new errorCreator.InvalidData({ expected: '{ team: { teamName, shortName } }' }) });

      return;
    } else if (team.teamName.toLowerCase() === 'team') {
      callback({ error: new errorCreator.InvalidData({ expected: 'team name !== team' }) });

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

        dbTeam.getTeamByOwner(allowedUser.userName, (ownedErr, ownedTeam) => {
          if (ownedErr) {
            callback({ error: new errorCreator.Database({ errorObject: ownedErr }) });

            return;
          } else if (ownedTeam) {
            callback({ error: new errorCreator.AlreadyExists({ name: `team ${ownedTeam.teamName}` }) });

            return;
          }

          team.owner = allowedUser.userName;
          team.verified = false;

          dbTeam.createTeam(team, (err, createdTeam) => {
            if (err || createdTeam === null) {
              callback({ error: new errorCreator.Database({ errorObject: err }) });

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

            manager.createWallet(wallet, () => {});

            dbRoom.createRoom(teamRoom, dbConfig.users.superuser, (errRoom, room) => {
              if (errRoom || room === null) {
                callback({ error: new errorCreator.Database({}) });

                return;
              }

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
                      callback({ error: new errorCreator.Database({  errorObject: updateError }) });

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
            });
          });
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

        dbTeam.verifyTeam(team.teamName, (err, verifiedTeam) => {
          if (err) {
            callback({ error: new errorCreator.Database({}) });

            return;
          } else if (!team) {
            callback({ error: new errorCreator.DoesNotExist({ name: `team ${team.teamName}` }) });

            return;
          }

          manager.updateUserTeam({
            socket,
            userName: verifiedTeam.owner,
            teamName: verifiedTeam.teamName,
            shortTeamName: verifiedTeam.shortName,
            callback: ({ error: updateError }) => {
              if (updateError) {
                callback({ error: new errorCreator.Database({ errorObject: updateError }) });

                return;
              }

              addUserTeamRoom({
                io,
                userName: verifiedTeam.owner,
                roomName: verifiedTeam.teamName + appConfig.teamAppend,
              });
            },
          });
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

        dbTeam.getUnverifiedTeams((err, teams = []) => {
          if (err) {
            callback({ error: new errorCreator.Database({ errorObject: err }) });

            return;
          }

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

        dbTeam.getAllTeams((allErr, teams) => {
          if (allErr) {
            callback({ error: new Database({ errorObject: allErr }) });

            return;
          }

          callback({
            data: {
              teams: teams.map((team) => {
                return { teamName: team.teamName, shortName: team.shortName };
              }),
            },
          });
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

        dbTeam.getTeam(allowedUser.team, (retrieveErr, retrievedTeam) => {
          if (retrieveErr) {
            callback({ error: new errorCreator.Database({ errorObject: retrieveErr }) });

            return;
          }

          const roomName = allowedUser.team + appConfig.teamAppend;
          const room = { roomName };
          const team = { teamName: allowedUser.team };

          if (retrievedTeam.owner === allowedUser.userName) {
            dbTeam.removeTeam(allowedUser.team, allowedUser, (err) => {
              if (err) {
                callback({ error: new errorCreator.Database({ errorObject: err }) });

                return;
              }

              const connectedIds = Object.keys(io.sockets.adapter.rooms[roomName].sockets);
              const allSockets = io.sockets.connected;

              socket.broadcast.to(roomName).emit('leaveTeam', { team, room });

              connectedIds.forEach((connectedId) => {
                allSockets[connectedId].leave(roomName);
              });

              callback({ data: { team, room } });
            });
          } else {
            dbUser.removeUserTeam(allowedUser.userName, (err) => {
              if (err) {
                callback({ error: new errorCreator.Database({ errorObject: err }) });

                return;
              }

              dbUser.removeRoomFromUser({
                roomName,
                userName: allowedUser.userName,
                callback: (roomErr) => {
                  if (roomErr) {
                    callback({ error: new errorCreator.Database({ errorObject: roomErr }) });

                    return;
                  }

                  socket.leave(roomName);
                  callback({ data: { team, room } });
                },
              });
            });
          }
        });
      },
    });
  });
}

exports.handle = handle;
