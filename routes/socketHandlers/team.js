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
const dbConfig = require('../../config/defaults/config').databasePopulation;
const manager = require('../../socketHelpers/manager');
const logger = require('../../utils/logger');
const objectValidator = require('../../utils/objectValidator');
const messenger = require('../../socketHelpers/messenger');
const appConfig = require('../../config/defaults/config').app;
const errorCreator = require('../../objects/error/errorCreator');

/**
 * Add user to team's room
 * @param {string} params.userName Name of the user
 * @param {string} params.roomName Name of the room
 * @param {Object} params.io Socket.IO
 * @param {Function} params.callback Callback
 */
function addUserTeamRoom({ roomName, userName, io, callback }) {
  dbUser.addRoomToUser(userName, roomName, (roomErr, user) => {
    if (roomErr) {
      callback({ error: new errorCreator.Database() });
    }

    const userSocket = io.sockets.connected[user.socketId];

    if (userSocket) {
      userSocket.join(roomName);
      userSocket.emit('follow', { room: { roomName: 'team' } });
    }

    callback({ data: { room: { roomName } } });
  });
}

/**
 * @param {object} socket - Socket.IO socket
 * @param {object} io - Socket.IO
 */
function handle(socket, io) {
  socket.on('inviteToTeam', ({ user: sentUser }, callback = () => {}) => {
    if (!objectValidator.isValidData({ user: { userName: sentUser.userName } }, { user: { userName: true } })) {
      callback({ error: new errorCreator.InvalidData({ expected: '{ user: { userName } }' }) });

      return;
    }

    manager.userIsAllowed(socket.id, dbConfig.commands.inviteTeam.commandName, (allowErr, allowed, user) => {
      if (allowErr) {
        callback({ error: new errorCreator.Database() });

        return;
      } else if (!allowed) {
        callback({ error: new errorCreator.NotAllowed({ name: 'getTeam' }) });

        return;
      }

      dbTeam.getTeam(user.team, (err, team) => {
        if (err) {
          callback({ error: new errorCreator.Database() });

          return;
        } else if (team.owner !== user.userName && team.admins.indexOf(user.userName) === -1) {
          callback({ error: new errorCreator.NotAllowed({ name: 'adding member to team' }) });

          return;
        }

        dbUser.getUser(sentUser.userName, (userErr, invitedUser) => {
          if (userErr) {
            callback({ error: new errorCreator.Database() });

            return;
          } else if (invitedUser.team) {
            callback({ error: new errorCreator.AlreadyExists({ name: 'team' }) });

            return;
          }

          const invitation = {
            itemName: user.team,
            time: new Date(),
            invitationType: 'team',
            sender: user.userName,
          };

          dbConnector.addInvitationToList(invitedUser.userName, invitation, (invErr) => {
            if (invErr) {
              if (invErr.code === 11000) {
                callback({ error: new errorCreator.AlreadyExists({ name: 'invitation' }) });
              } else {
                callback({ error: new errorCreator.Database() });
              }

              return;
            }

            callback({ data: { invitation } });
          });
        });
      });
    });
  });

  socket.on('getTeam', (params, callback = () => {}) => {
    manager.userIsAllowed(socket.id, dbConfig.commands.getTeam.commandName, (allowErr, allowed, user) => {
      if (allowErr) {
        callback({ error: new errorCreator.Database() });

        return;
      } else if (!allowed) {
        callback({ error: new errorCreator.NotAllowed({ name: 'getTeam' }) });

        return;
      }

      dbteam.getTeam(user.team, (err, team) => {
        if (err) {
          callback({ error: new errorCreator.Database() });
        }

        callback({ data: { team } });
      });
    });
  });

  socket.on('getTeamMembers', (params, callback = () => {}) => {
    manager.userIsAllowed(socket.id, dbConfig.commands.getTeam.commandName, (allowErr, allowed, user) => {
      if (allowErr) {
        callback({ error: new errorCreator.Database() });

        return;
      } else if (!allowed) {
        callback({ error: new errorCreator.NotAllowed({ name: 'getTeam' }) });

        return;
      }

      dbUser.getTeamUsers(user, (err, users = []) => {
        if (err) {
          callback({ error: new errorCreator.Database() });

          return;
        }

        callback({ users });
      });
    });
  });

  /**
   * Create a team
   * @param {Object} params.team Team
   * @param {string} params.team.shortName Short name (4 chars) for the team
   * @param {string} params.team.owner Owner of the team
   * @param {string} params.team.admins Admins of the team
   */
  socket.on('createTeam', ({ team }, callback = () => {}) => {
    if (!objectValidator.isValidData({ team }, { team: { teamName: true, owner: true, shortName: true } })) {
      callback({ error: new errorCreator.InvalidData({ expected: '{ team: { teamName, shortName, owner } }' }) });

      return;
    }

    manager.userIsAllowed(socket.id, dbConfig.commands.createTeam.commandName, (allowErr, allowed, allowedUser) => {
      if (allowErr) {
        callback({ error: new errorCreator.Database() });

        return;
      } else if (!allowed) {
        callback({ error: new errorCreator.NotAllowed({ name: 'getTeam' }) });

        return;
      } else if (allowedUser.team) {
        callback({ error: new errorCreator.AlreadyExists({ name: 'team' }) });

        return;
      } else if (team.teamName.toLowerCase() === 'team') {
        callback({ error: new errorCreator.InvalidData() });

        return;
      }

      team.verified = false;

      dbUser.getUser(team.owner, (userErr, user) => {
        if (userErr) {
          callback({ error: new errorCreator.Database() });

          return;
        } else if (user === null) {
          callback({ error: new errorCreator.DoesNotExist({ name: `user ${team.owner}` }) });

          return;
        }

        dbteam.createTeam(team, (err, createdTeam) => {
          if (err || createdTeam === null) {
            callback({ error: new errorCreator.Database() });

            return;
          }

          const teamRoom = {
            roomName: createdTeam.teamName + appConfig.teamAppend,
            accessLevel: dbConfig.accessLevels.superUser,
            visibility: dbConfig.accessLevels.superUser,
          };

          dbRoom.createRoom(teamRoom, dbConfig.users.superuser, (errRoom, room) => {
            if (errRoom || room === null) {
              callback({ error: new errorCreator.Database() });

              return;
            }

            if (appConfig.teamVerify) {
              callback({ data: { requiresVerify: appConfig.teamVerify, success: true } });
            } else {
              manager.updateUserTeam({
                socket,
                userName: team.owner,
                teamName: team.teamName,
                callback: ({ error }) => {
                  if (error) {
                    callback({ error: new errorCreator.Database() });

                    return;
                  }

                  addUserTeamRoom({
                    userName: user.userName,
                    roomName: teamRoom.roomName,
                    io,
                  });
                  callback({ data: { requiresVerify: false, success: true } });
                },
              });

              if (team.admins) {
                team.admins.forEach((admin) => {
                  manager.updateUserTeam({
                    socket,
                    userName: admin,
                    teamName: team.teamName,
                    callback: () => {
                      addUserTeamRoom({
                        userName: admin,
                        roomName: teamRoom.roomName,
                        io,
                      });
                    },
                  });
                });
              }
            }
          });
        });
      });
    });
  });

  socket.on('verifyTeam', (params) => {
    if (!objectValidator.isValidData(params, { team: { teamName: true } })) {
      return;
    }

    manager.userIsAllowed(socket.id, dbConfig.commands.verifyTeam.commandName, (allowErr, allowed) => {
      if (allowErr || !allowed) {
        return;
      }

      dbteam.verifyTeam(params.team.teamName, (err, team) => {
        if (err || team === null) {
          logger.sendSocketErrorMsg({
            socket,
            code: logger.ErrorCodes.general,
            text: ['Failed to verify team'],
            text_se: ['Misslyckades med att verifiera teamet'],
            err,
          });

          return;
        }

        const teamName = team.teamName;
        const owner = team.owner;
        const admins = team.admins;
        const roomName = teamName + appConfig.teamAppend;

        manager.updateUserTeam({
          userName: owner,
          socket,
          teamName,
        });
        addUserTeamRoom({
          userName: owner,
          io,
          roomName,
        });

        if (admins) {
          admins.forEach((admin) => {
            manager.updateUserTeam({
              userName: admin,
              socket,
              teamName,
            });
            addUserTeamRoom({
              userName: admin,
              io,
              roomName,
            });
          });
        }

        messenger.sendSelfMsg({
          socket,
          message: {
            text: [`Team ${teamName} has been verified`],
            text_se: [`Teamet ${teamName} har blivit verifierad`],
          },
        });
      });
    });
  });

  socket.on('verifyAllTeams', () => {
    manager.userIsAllowed(socket.id, dbConfig.commands.verifyTeam.commandName, (allowErr, allowed) => {
      if (allowErr || !allowed) {
        return;
      }

      dbUser.getUnverifiedUsers((err, teams) => {
        if (err || teams === null) {
          logger.sendSocketErrorMsg({
            socket,
            code: logger.ErrorCodes.general,
            text: ['Failed to verify all user'],
            text_se: ['Misslyckades med att verifiera alla användare'],
            err,
          });

          return;
        }

        dbteam.verifyAllTeams((verifyErr) => {
          if (verifyErr) {
            logger.sendSocketErrorMsg({
              socket,
              code: logger.ErrorCodes.general,
              text: ['Failed to verify all teams'],
              text_se: ['Misslyckades med att verifiera alla team'],
              err: verifyErr,
            });

            return;
          }

          messenger.sendSelfMsg({
            socket,
            message: {
              text: ['Teams have been verified'],
              text_se: ['Teamen har blivit verifierade'],
            },
          });
          // TODO Send message to verified user
        });
      });
    });
  });

  socket.on('getUnverifiedTeams', () => {
    manager.userIsAllowed(socket.id, dbConfig.commands.verifyTeam.commandName, (allowErr, allowed) => {
      if (allowErr || !allowed) {
        return;
      }

      dbteam.getUnverifiedTeams((err, teams) => {
        if (err || teams === null) {
          logger.sendSocketErrorMsg({
            socket,
            code: logger.ErrorCodes.general,
            text: ['Failed to get unverified teams'],
            text_se: ['Misslyckades med hämtningen av icke-verifierade team'],
            err,
          });

          return;
        }

        messenger.sendSelfMsg({
          socket,
          message: {
            text: teams.map(team => `Team: ${team.teamName}. Owner: ${team.owner}`),
          },
        });
      });
    });
  });

  socket.on('leaveTeam', () => {
    manager.userIsAllowed(socket.id, dbConfig.commands.leaveTeam.commandName, (allowErr, allowed, user) => {
      if (allowErr || !allowed) {
        return;
      }

      if (!user.team) {
        messenger.sendSelfMsg({
          socket,
          message: {
            text: ['You are not part of a team'],
          },
        });

        return;
      }

      const roomName = `${user.team}-team`;

      dbUser.updateUserTeam(user.userName, '', (err) => {
        if (err) {
          logger.sendSocketErrorMsg({
            socket,
            code: logger.ErrorCodes.db,
            text: ['Failed to leave team'],
            err,
          });

          return;
        }

        dbUser.removeRoomFromUser(user.userName, roomName, (roomErr) => {
          if (roomErr) {
            logger.sendSocketErrorMsg({
              socket,
              code: logger.ErrorCodes.db,
              text: ['Failed to unfollow room'],
              text_se: ['Misslyckades med att följa rummet'],
              roomErr,
            });

            return;
          }

          socket.leave(roomName);
          socket.emit('unfollow', { room: { roomName }, silent: true });
          messenger.sendSelfMsg({
            socket,
            message: {
              text: ['You have left the team'],
            },
          });
          socket.emit('reboot');
        });
      });
    });
  });
}

exports.handle = handle;
