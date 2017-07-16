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

const dbConfig = require('../../config/defaults/config').databasePopulation;
const manager = require('../../socketHelpers/manager');
const dbInvitation = require('../../db/connectors/invitationList');
const objectValidator = require('../../utils/objectValidator');
const errorCreator = require('../../objects/error/errorCreator');
const dbTeam = require('../../db/connectors/team');
const dbUser = require('../../db/connectors/user');
const appConfig = require('../../config/defaults/config').app;

/**
 * @param {Object} socket Socket.io socket
 * @param {Object} io Socket io
 */
function handle(socket, io) {
  socket.on('acceptInvitation', ({ invitation, token }, callback = () => {}) => {
    if (!objectValidator.isValidData({ invitation }, { invitation: { invitationType: true, itemName: true } })) {
      callback({ error: new errorCreator.InvalidData({ expected: '{ invitation: { invitationType, itemName } }' }) });

      return;
    }

    manager.userIsAllowed({
      token,
      commandName: dbConfig.commands.invitations.commandName,
      callback: ({ error, allowedUser }) => {
        if (error) {
          callback({ error });

          return;
        }

        dbInvitation.getInvitations({
          userName: allowedUser.userName,
          callback: (invitationData) => {
            if (invitationData.error) {
              callback({ error: invitationData.error });

              return;
            }

            const retrievedInvitation = invitationData.data.list.invitations.find(inv => inv.itemName === invitation.itemName && inv.invitationType === invitation.invitationType);

            if (!retrievedInvitation) {
              callback({ error: new errorCreator.DoesNotExist({ name: `invitation ${invitation.itemName} ${invitation.invitationType} for ${allowedUser.userName}` }) });

              return;
            }

            switch (retrievedInvitation.invitationType) {
              case 'team': {
                dbTeam.getTeam({
                  teamName: retrievedInvitation.itemName,
                  callback: (teamData) => {
                    if (teamData.error) {
                      callback({ error: teamData.error });

                      return;
                    }

                    manager.addUserToTeam({
                      socket,
                      io,
                      team: teamData.data.team,
                      user: allowedUser,
                      callback: (addUserData) => {
                        if (addUserData.error) {
                          callback({ error: addUserData.error });

                          return;
                        }

                        dbInvitation.removeInvitationTypeFromList({
                          userName: allowedUser.userName,
                          invitationType: retrievedInvitation.invitationType,
                          callback: (removeData) => {
                            if (removeData.error) {
                              callback({ error });

                              return;
                            }

                            callback({ data: addUserData.data });

                            socket.broadcast.to(`${addUserData.data.team.teamName}${appConfig.teamAppend}`).emit('teamMember', { user: allowedUser });
                          },
                        });
                      },
                    });
                  },
                });

                return;
              }
              default: {
                callback({ error: new errorCreator.InvalidData({ expected: 'team' }) });
              }
            }
          },
        });
      },
    });
  });

  socket.on('getInvitations', ({ token }, callback = () => {}) => {
    manager.userIsAllowed({
      token,
      commandName: dbConfig.commands.invitations.commandName,
      callback: ({ error, allowedUser }) => {
        if (error) {
          callback({ error });

          return;
        }

        dbInvitation.getInvitations({
          userName: allowedUser.userName,
          callback: ({ error: errorInvite, data }) => {
            if (errorInvite) {
              callback({ error: errorInvite });

              return;
            }

            callback({ data: { invitations: data.list.invitations } });
          },
        });
      },
    });
  });

  socket.on('removeInvitation', ({ invitation, token }, callback = () => {}) => {
    if (!objectValidator.isValidData({ invitation }, { invitation: { invitationType: true, itemName: true } })) {
      callback({ error: new errorCreator.InvalidData({ expected: '{ invitation: { invitationType, itemName } }' }) });

      return;
    }

    manager.userIsAllowed({
      token,
      commandName: dbConfig.commands.invitations.commandName,
      callback: ({ error, allowedUser }) => {
        if (error) {
          callback({ error });

          return;
        }

        dbInvitation.removeInvitationFromList({
          userName: allowedUser.userName,
          invitationType: invitation.invitationType,
          itemName: invitation.itemName,
          callback: (invitationData) => {
            if (invitationData.error) {
              callback({ error: invitationData.error });

              return;
            }

            callback({ data: { success: true } });
          },
        });
      },
    });
  });

  socket.on('inviteToTeam', ({ user, token }, callback = () => {}) => {
    if (!objectValidator.isValidData({ user }, { user: { userName: true } })) {
      callback({ error: new errorCreator.InvalidData({ expected: '{ user: { userName } }' }) });

      return;
    }

    const invitedUser = user;
    invitedUser.userName = invitedUser.userName.toLowerCase();

    manager.userIsAllowed({
      token,
      commandName: dbConfig.commands.inviteTeam.commandName,
      callback: ({ error, allowedUser }) => {
        if (error) {
          callback({ error });

          return;
        } else if (allowedUser.userName === invitedUser.userName) {
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
              userName: invitedUser.userName,
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
                const to = userData.data.user.userName;

                dbInvitation.addInvitationToList({
                  invitation,
                  userName: userData.data.user.userName,
                  callback: ({ error: inviteError, data: invitationData }) => {
                    if (inviteError) {
                      callback({ error: inviteError });

                      return;
                    }

                    const newInvitation = invitationData.list.invitations[invitationData.list.invitation.length - 1];

                    socket.to(`${to}${appConfig.whisperAppend}`).emit('invitation', { invitation: newInvitation });
                    callback({ data: { invitation: newInvitation } });
                  },
                });
              },
            });
          },
        });
      },
    });
  });
}

exports.handle = handle;
