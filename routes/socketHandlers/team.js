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

/**
 * Update user's team
 * @param {Object} params - Parameters
 * @param {Object} params.socket - Socket.IO socket
 * @param {string} params.userName - Name of the user
 * @param {string} params.teamName - Name of the team
 * @param {Function} params.callback - Callback
 */
function updateUserTeam({ socket, userName, teamName, callback }) {
  dbUser.updateUserTeam(userName, teamName, (err, user) => {
    if (err || user === null) {
      logger.sendSocketErrorMsg({
        socket,
        code: logger.ErrorCodes.general,
        text: [`Failed to add member ${userName} to team ${teamName}`],
        text_se: [`Misslyckades med att lägga till medlem ${userName} till teamet ${teamName}`],
        err,
      });
    } else {
      messenger.sendMsg({
        socket,
        message: {
          text: [`You have been added to the team ${teamName}`],
          text_se: [`Ni har blivit tillagd i teamet ${teamName}`],
          userName: 'SYSTEM',
        },
        sendTo: userName + appConfig.whisperAppend,
      });
    }

    if (callback) {
      callback(err, user);
    }
  });
}

/**
 * Add user to team's room
 * @param {Object} params - Parameters
 * @param {string} params.userName - Name of the user
 * @param {string} params.roomName - Name of the room
 * @param {Object} params.io - Socket.IO
 */
function addUserTeamRoom({ roomName, userName, io }) {
  dbUser.addRoomToUser(userName, roomName, (roomErr, user) => {
    if (roomErr || user === null) {
      logger.sendErrorMsg({
        code: logger.ErrorCodes.db,
        text: ['Failed to follow team room'],
        text_se: ['Misslyckades med att följa team-rummet'],
        err: roomErr,
      });

      return;
    }

    const userSocket = io.sockets.connected[user.socketId];

    if (userSocket) {
      userSocket.join(roomName);
      userSocket.emit('follow', { room: { roomName: 'team' } });
    }
  });
}

/**
 * Get team
 * @param {Object} params - Parameters
 * @param {Object} params.socket - Socket.IO socket
 * @param {Object} params.user - User
 * @param {Function} params.callback - Callback
 */
function getTeam({ socket, user, callback }) {
  dbConnector.getTeam(user.team, (err, team) => {
    let newErr;

    if (err || team === null) {
      logger.sendSocketErrorMsg({
        socket,
        code: logger.ErrorCodes.general,
        text: ['Failed to get team'],
        err,
      });
      newErr = {};
    }

    callback(newErr, team);
  });
}

/**
 * @param {object} socket - Socket.IO socket
 * @param {object} io - Socket.IO
 */
function handle(socket, io) {
  socket.on('getTeam', () => {
    manager.userAllowedCommand(socket.id, databasePopulation.commands.inviteteam.commandName, (allowErr, allowed, user) => {
      if (allowErr || !allowed) {
        return;
      }

      getTeam({
        socket,
        user,
        callback: () => {
        },
      });
    });
  });

  socket.on('teamExists', (params) => {
    if (!objectValidator.isValidData(params, { team: { teamName: true } })) {
      socket.emit('commandFail');

      return;
    }

    manager.userAllowedCommand(socket.id, databasePopulation.commands.createteam.commandName, (allowErr, allowed) => {
      if (allowErr || !allowed) {
        socket.emit('commandFail');

        return;
      }

      dbConnector.getTeam(params.team.teamName, (err, foundTeam) => {
        if (err) {
          logger.sendSocketErrorMsg({
            socket,
            code: logger.ErrorCodes.db,
            text: ['Failed to check if team exists'],
            text_se: ['Misslyckades med att försöka hitta teamet'],
            err,
          });
          socket.emit('commandFail');

          return;
        } else if (foundTeam !== null) {
          messenger.sendSelfMsg({
            socket,
            message: {
              text: ['Team with that name already exists'],
              text_se: ['Ett team med det namnet existerar redan'],
            },
          });
          socket.emit('commandFail');

          return;
        }

        socket.emit('commandSuccess', { freezeStep: true });
      });
    });
  });

  socket.on('inviteToTeam', (params) => {
    if (!objectValidator.isValidData(params, { user: { userName: true } })) {
      return;
    }

    manager.userAllowedCommand(socket.id, databasePopulation.commands.inviteteam.commandName, (allowErr, allowed, user) => {
      if (allowErr || !allowed) {
        return;
      }

      getTeam({
        socket,
        user,
        callback: (err, team) => {
          if (err) {
            return;
          } else if (team.owner !== user.userName && team.admins.indexOf(user.userName) === -1) {
            logger.sendSocketErrorMsg({
              socket,
              code: logger.ErrorCodes.general,
              text: ['You are not an admin of the team. You are not allowed to add new team members'],
              text_se: ['Ni är inte en admin av teamet. Ni har inte tillåtelse att lägga till nya medlemmar'],
              err,
            });

            return;
          }

          const userName = params.user.userName;

          dbUser.getUser(userName, (userErr, invitedUser) => {
            if (userErr) {
              return;
            } else if (invitedUser.team) {
              messenger.sendSelfMsg({
                socket,
                message: {
                  text: ['The user is already part of a team'],
                  text_se: ['Användaren är redan med i ett team'],
                },
              });

              return;
            }

            const invitation = {
              itemName: user.team,
              time: new Date(),
              invitationType: 'team',
              sender: user.userName,
            };

            dbConnector.addInvitationToList(userName, invitation, (invErr, list) => {
              if (invErr || list !== null) {
                if (list || invErr.code === 11000) {
                  messenger.sendSelfMsg({
                    socket,
                    message: {
                      text: ['You have already sent an invite to the user'],
                      text_se: ['Ni har redan skickat en inbjudan till användaren'],
                    },
                  });
                } else {
                  logger.sendSocketErrorMsg({
                    socket,
                    code: logger.ErrorCodes.general,
                    text: ['Failed to send the invite'],
                    text_se: ['Misslyckades med att skicka inbjudan'],
                    err,
                  });
                }

                return;
              }

              messenger.sendSelfMsg({
                socket,
                message: {
                  text: ['Sent an invitation to the user'],
                  text_se: ['Skickade en inbjudan till användaren'],
                },
              });
            });
          });
        },
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

    manager.userAllowedCommand(socket.id, databasePopulation.commands.createteam.commandName, (allowErr, allowed, allowedUser) => {
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
            updateUserTeam({
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
                updateUserTeam({
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

    manager.userAllowedCommand(socket.id, databasePopulation.commands.verifyteam.commandName, (allowErr, allowed) => {
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

        updateUserTeam({
          socket,
          userName: owner,
          teamName,
        });
        addUserTeamRoom({
          io,
          userName: owner,
          roomName,
        });

        if (admins) {
          for (const admin of admins) {
            updateUserTeam({
              socket,
              userName: admin,
              teamName,
            });
            addUserTeamRoom({
              io,
              userName: admin,
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
    manager.userAllowedCommand(socket.id, databasePopulation.commands.verifyteam.commandName, (allowErr, allowed) => {
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

  socket.on('unverifiedTeams', () => {
    manager.userAllowedCommand(socket.id, databasePopulation.commands.verifyteam.commandName, (allowErr, allowed) => {
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
    manager.userAllowedCommand(socket.id, databasePopulation.commands.leaveteam.commandName, (allowErr, allowed, user) => {
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

  socket.on('teamAnswer', (params) => {
    if (!objectValidator.isValidData(params, { accepted: true, invitation: { itemName: true, sender: true, invitationType: true } })) {
      return;
    }

    manager.userAllowedCommand(socket.id, databasePopulation.commands.invitations.commandName, (allowErr, allowed, allowedUser) => {
      if (allowErr || !allowed) {
        return;
      }

      const userName = allowedUser.userName;
      const invitation = params.invitation;
      const roomName = params.invitation.itemName + appConfig.teamAppend;
      invitation.time = new Date();

      if (params.accepted) {
        updateUserTeam({
          socket,
          userName,
          teamName: invitation.itemName,
          callback: (err, user) => {
            if (err || user === null) {
              return;
            }

            dbUser.addRoomToUser(userName, roomName, (errRoom) => {
              if (errRoom) {
                return;
              }

              messenger.sendSelfMsg({
                socket,
                message: {
                  text: [`Joined team ${invitation.itemName}`],
                  text_se: [`Gick med i team ${invitation.itemName}`],
                },
              });

              dbConnector.removeInvitationTypeFromList(userName, invitation.invitationType, (teamErr) => {
                if (teamErr) {
                  logger.sendErrorMsg({
                    code: logger.ErrorCodes.db,
                    text: [`Failed to remove all invitations of type ${invitation.invitationType}`],
                    text_se: [`Misslyckades med att ta bort alla inbjudan av typen ${invitation.invitationType}`],
                    err: teamErr,
                  });
                }
              });

              socket.join(roomName);
              socket.emit('follow', { room: { roomName: 'team' } });
            });
          },
        });
      } else {
        dbConnector.removeInvitationFromList(userName, invitation.itemName, invitation.invitationType, (err, list) => {
          if (err || list === null) {
            messenger.sendSelfMsg({
              socket,
              message: {
                text: ['Failed to decline invitation'],
                text_se: ['Misslyckades med att avböja inbjudan'],
              },
            });

            return;
          }

          // TODO Send message to sender of invitation

          messenger.sendSelfMsg({
            socket,
            message: {
              text: ['Successfully declined invitation'],
              text_se: ['Lyckades avböja inbjudan'],
            },
          });
        });
      }
    });
  });
}

exports.handle = handle;
