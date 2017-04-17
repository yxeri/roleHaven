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

const dbConnector = require('../../db/databaseConnector');
const dbUser = require('../../db/connectors/user');
const dbRoom = require('../../db/connectors/room');
const databasePopulation = require('../../config/defaults/config').databasePopulation;
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
  socket.on('getTeam', (params, callback = () => {}) => {
    manager.userIsAllowed(socket.id, databasePopulation.commands.getTeam.commandName, (allowErr, allowed, user) => {
      if (allowErr) {
        callback({ error: new errorCreator.Database() });

        return;
      } else if (!allowed) {
        callback({ error: new errorCreator.NotAllowed({ name: 'getTeam' }) });

        return;
      }

      dbConnector.getTeam(user.team, (err, team) => {
        if (err) {
          callback({ error: new errorCreator.Database() });
        }

        callback({ data: { team } });
      });
    });
  });

  /**
   * Create a team
   * @param {Object} params - Parameters
   * @param {Object} params.team - Team
   * @param {string} params.team.owner - Owner of the team
   * @param {string} params.team.admins - Admins of the team
   */
  socket.on('createTeam', (params) => {
    if (!objectValidator.isValidData(params, { team: { teamName: true, owner: true } })) {
      return;
    }

    manager.userIsAllowed(socket.id, databasePopulation.commands.createTeam.commandName, (allowErr, allowed, allowedUser) => {
      if (allowErr || !allowed) {
        return;
      } else if (allowedUser.team) {
        messenger.sendSelfMsg({
          socket,
          message: {
            text: ['You are already a member of a team. Failed to create team'],
            text_se: ['Ni är redan medlem i ett team. Misslyckades med att skapa teamet'],
          },
        });

        return;
      }

      const teamName = params.team.teamName;
      const owner = params.team.owner;
      const admins = params.team.admins;
      const team = params.team;
      team.verified = false;

      if (teamName.toLowerCase() === 'team') {
        messenger.sendSelfMsg({
          socket,
          message: {
            text: ['Team already exists. Failed to create team'],
            text_se: ['Teamet existerar redan. Misslyckades med att skapa teamet'],
          },
        });

        return;
      }

      dbUser.getUser(owner, (userErr, user) => {
        if (userErr) {
          logger.sendSocketErrorMsg({
            socket,
            code: logger.ErrorCodes.db,
            text: ['Failed to create team'],
            text_se: ['Misslyckades med att skapa teamet'],
            err: userErr,
          });

          return;
        } else if (user === null) {
          logger.sendSocketErrorMsg({
            socket,
            code: logger.ErrorCodes.general,
            text: [`User with the name ${owner} does not exist. Failed to create team`],
            text_se: [`Användare med namnet ${owner} existerar inte. Misslyckades med att skapa teamet`],
          });

          return;
        }

        dbConnector.createTeam(params.team, (err, createdTeam) => {
          if (err || createdTeam === null) {
            logger.sendSocketErrorMsg({
              socket,
              code: logger.ErrorCodes.db,
              text: ['Failed to create team'],
              text_se: ['Misslyckades med att skapa teamet'],
              err,
            });

            return;
          }

          const teamRoom = {
            roomName: createdTeam.teamName + appConfig.teamAppend,
            accessLevel: databasePopulation.accessLevels.superUser,
            visibility: databasePopulation.accessLevels.superUser,
          };

          dbRoom.createRoom(teamRoom, databasePopulation.users.superuser, (errRoom, room) => {
            if (errRoom || room === null) {
              return;
            }

            messenger.sendSelfMsg({
              socket,
              message: {
                text: ['Team has been created'],
                text_se: ['Teamet har skapats'],
              },
            });
          });

          if (appConfig.teamVerify) {
            const message = {};
            message.time = new Date();
            message.roomName = databasePopulation.rooms.admin.roomName;

            messenger.sendMsg({
              socket,
              message: {
                userName: 'SYSTEM',
                text: [`Team ${createdTeam.teamName} needs to be verified`],
                text_se: [`Teamet ${createdTeam.teamName} måste bli verifierad`],
              },
              sendTo: message.roomName,
            });

            messenger.sendSelfMsg({
              socket,
              message: {
                text: ['Your team has to be verified before it can be used'],
                text_se: ['Ert team måste bli verifierad innan det kan användas'],
              },
            });
          } else {
            manager.updateUserTeam({
              socket,
              userName: owner,
              teamName,
            });
            addUserTeamRoom({
              io,
              userName: user.userName,
              roomName: teamRoom.roomName,
            });

            if (admins) {
              for (const admin of admins) {
                manager.updateUserTeam({
                  socket,
                  userName: admin,
                  teamName,
                });
                addUserTeamRoom({
                  io,
                  userName: admin,
                  roomName: teamRoom.roomName,
                });
              }
            }
          }
        });
      });
    });
  });

  socket.on('verifyTeam', (params) => {
    if (!objectValidator.isValidData(params, { team: { teamName: true } })) {
      return;
    }

    manager.userIsAllowed(socket.id, databasePopulation.commands.verifyTeam.commandName, (allowErr, allowed) => {
      if (allowErr || !allowed) {
        return;
      }

      dbConnector.verifyTeam(params.team.teamName, (err, team) => {
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
          for (const admin of admins) {
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
          }
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
    manager.userIsAllowed(socket.id, databasePopulation.commands.verifyTeam.commandName, (allowErr, allowed) => {
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

        dbConnector.verifyAllTeams((verifyErr) => {
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
    manager.userIsAllowed(socket.id, databasePopulation.commands.verifyTeam.commandName, (allowErr, allowed) => {
      if (allowErr || !allowed) {
        return;
      }

      dbConnector.getUnverifiedTeams((err, teams) => {
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
    manager.userIsAllowed(socket.id, databasePopulation.commands.leaveTeam.commandName, (allowErr, allowed, user) => {
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

  socket.on('getTeamMembers', (params, callback = () => {}) => {
    manager.userIsAllowed(socket.id, databasePopulation.commands.getTeam.commandName, (allowErr, allowed, user) => {
      if (allowErr || !allowed || !user) {
        callback({ error: new errorCreator.Database() });

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
}

exports.handle = handle;
