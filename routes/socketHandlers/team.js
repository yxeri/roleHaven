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
      callback({ error: new errorCreator.Database() });
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
  socket.on('inviteToTeam', ({ user: sentUser }, callback = () => {}) => {
    if (!objectValidator.isValidData({ user: { userName: sentUser.userName } }, { user: { userName: true } })) {
      callback({ error: new errorCreator.InvalidData({ expected: '{ user: { userName } }' }) });

      return;
    }

    sentUser.userName = sentUser.userName.toLowerCase();

    manager.userIsAllowed(socket.id, dbConfig.commands.inviteTeam.commandName, (allowErr, allowed, user) => {
      if (allowErr) {
        callback({ error: new errorCreator.Database() });

        return;
      } else if (!allowed) {
        callback({ error: new errorCreator.NotAllowed({ name: 'getTeam' }) });

        return;
      } else if (user.userName === sentUser.userName) {
        callback({ error: new errorCreator.AlreadyExists({ name: 'your team' }) });

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
          } else if (!invitedUser) {
            callback({ error: new errorCreator.DoesNotExist({ name: `user ${sentUser.userName}` }) });

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

            socket.to(`${user.userName}${appConfig.whisperAppend}`).emit('invitation', { invitation });
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

      dbTeam.getTeam(user.team, (err, team) => {
        if (err) {
          callback({ error: new errorCreator.Database() });
        }

        callback({ data: { team } });
      });
    });
  });

  /**
   * Create a team
   * @param {Object} params.team Team
   * @param {string} params.team.teamName Full team name
   * @param {string} params.team.shortName Short name (4 chars) for the team
   */
  socket.on('createTeam', ({ team }, callback = () => {}) => {
    if (!objectValidator.isValidData({ team }, { team: { teamName: true, shortName: true } })) {
      callback({ error: new errorCreator.InvalidData({ expected: '{ team: { teamName, shortName } }' }) });

      return;
    }

    manager.userIsAllowed(socket.id, dbConfig.commands.createTeam.commandName, (allowErr, allowed, allowedUser) => {
      if (allowErr) {
        callback({ error: new errorCreator.Database() });

        return;
      } else if (!allowed) {
        callback({ error: new errorCreator.NotAllowed({ name: 'createTeam' }) });

        return;
      } else if (allowedUser.team) {
        callback({ error: new errorCreator.AlreadyExists({ name: 'team' }) });

        return;
      } else if (team.teamName.toLowerCase() === 'team') {
        callback({ error: new errorCreator.InvalidData() });

        return;
      }

      dbTeam.getTeamByOwner(allowedUser.userName, (ownedErr, ownedTeam) => {
        if (ownedErr) {
          callback({ error: new errorCreator.Database() });

          return;
        } else if (ownedTeam) {
          callback({ error: new errorCreator.AlreadyExists({ name: `team ${ownedTeam.teamName}` }) });

          return;
        }

        team.owner = allowedUser.userName;
        team.verified = false;

        dbTeam.createTeam(team, (err, createdTeam) => {
          if (err || createdTeam === null) {
            callback({ error: new errorCreator.Database() });

            return;
          }

          const teamRoom = {
            roomName: team.teamName + appConfig.teamAppend,
            accessLevel: dbConfig.accessLevels.superUser,
            visibility: dbConfig.accessLevels.superUser,
          };

          dbRoom.createRoom(teamRoom, dbConfig.users.superuser, (errRoom, room) => {
            if (errRoom || room === null) {
              callback({ error: new errorCreator.Database() });

              return;
            }

            if (appConfig.teamVerify) {
              callback({ data: { requiresVerify: appConfig.teamVerify, team } });
            } else {
              manager.updateUserTeam({
                userName: team.owner,
                teamName: team.teamName,
                shortTeamName: team.shortName,
                callback: ({ error }) => {
                  if (error) {
                    callback({ error: new errorCreator.Database() });

                    return;
                  }

                  addUserTeamRoom({
                    userName: allowedUser.userName,
                    roomName: teamRoom.roomName,
                    io,
                  });
                  callback({ data: { requiresVerify: false, team } });
                },
                socket,
              });
            }
          });
        });
      });
    });
  });

  socket.on('verifyTeam', ({ team }, callback = () => {}) => {
    if (!objectValidator.isValidData({ team }, { team: { teamName: true } })) {
      callback({ error: new errorCreator.InvalidData({ expected: '{ team: { teamName } }' }) });

      return;
    }

    manager.userIsAllowed(socket.id, dbConfig.commands.verifyTeam.commandName, (allowErr, allowed) => {
      if (allowErr) {
        callback({ error: new errorCreator.Database() });

        return;
      } else if (!allowed) {
        callback({ error: new errorCreator.NotAllowed({ name: 'verifyTeam' }) });

        return;
      }

      dbTeam.verifyTeam(team.teamName, (err, verifiedTeam) => {
        if (err) {
          callback({ error: new errorCreator.Database() });

          return;
        } else if (!team) {
          callback({ error: new errorCreator.DoesNotExist({ name: `team ${team.teamName}` }) });

          return;
        }

        manager.updateUserTeam({
          userName: verifiedTeam.owner,
          teamName: verifiedTeam.teamName,
          shortTeamName: verifiedTeam.shortName,
          callback: ({ error }) => {
            if (error) {
              return;
            }

            addUserTeamRoom({
              userName: verifiedTeam.owner,
              roomName: verifiedTeam.teamName + appConfig.teamAppend,
              io,
            });
          },
          socket,
        });
      });
    });
  });

  socket.on('getUnverifiedTeams', (params, callback = () => {}) => {
    manager.userIsAllowed(socket.id, dbConfig.commands.verifyTeam.commandName, (allowErr, allowed) => {
      if (allowErr) {
        callback({ error: new errorCreator.Database() });

        return;
      } else if (!allowed) {
        callback({ error: new errorCreator.NotAllowed({ name: 'getUnverifiedTeams' }) });

        return;
      }

      dbTeam.getUnverifiedTeams((err, teams = []) => {
        if (err) {
          callback({ error: new errorCreator.Database() });

          return;
        }

        callback({ data: { teams } });
      });
    });
  });

  socket.on('leaveTeam', (params, callback = () => {}) => {
    manager.userIsAllowed(socket.id, dbConfig.commands.leaveTeam.commandName, (allowErr, allowed, user) => {
      if (allowErr) {
        callback({ error: new errorCreator.Database() });

        return;
      } else if (!allowed) {
        callback({ error: new errorCreator.NotAllowed({ name: 'getUnverifiedTeams' }) });

        return;
      } else if (!user.team) {
        callback({ error: new errorCreator.DoesNotExist({ name: 'team' }) });

        return;
      }

      const roomName = user.team + appConfig.teamAppend;

      dbUser.updateUserTeam(user.userName, null, null, (err) => {
        if (err) {
          callback({ error: new errorCreator.Database() });

          return;
        }

        dbUser.removeRoomFromUser(user.userName, roomName, (roomErr) => {
          if (roomErr) {
            callback({ error: new errorCreator.Database() });

            return;
          }

          socket.leave(roomName);
          callback({ data: { team: { teamName: user.team } } });
        });
      });
    });
  });
}

exports.handle = handle;
