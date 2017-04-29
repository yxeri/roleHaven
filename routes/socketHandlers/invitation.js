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

const dbConnector = require('../../db/databaseConnector');
const dbUser = require('../../db/connectors/user');
const dbTeam = require('../../db/connectors/team');
const databasePopulation = require('../../config/defaults/config').databasePopulation;
const manager = require('../../socketHelpers/manager');
const logger = require('../../utils/logger');
const objectValidator = require('../../utils/objectValidator');
const messenger = require('../../socketHelpers/messenger');
const appConfig = require('../../config/defaults/config').app;
const errorCreator = require('../../objects/error/errorCreator');

/**
 * @param {Object} socket Socket.io socket
 */
function handle(socket) {
  // TODO Unused
  socket.on('teamAnswer', (params) => {
    if (!objectValidator.isValidData(params, { accepted: true, invitation: { itemName: true, sender: true, invitationType: true } })) {
      return;
    }

    manager.userIsAllowed(socket.id, databasePopulation.commands.invitations.commandName, (allowErr, allowed, allowedUser) => {
      if (allowErr || !allowed) {
        return;
      }

      const userName = allowedUser.userName;
      const invitation = params.invitation;
      const roomName = params.invitation.itemName + appConfig.teamAppend;
      invitation.time = new Date();

      if (params.accepted) {
        manager.updateUserTeam({
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

  // TODO Unused
  socket.on('roomInviteAnswer', ({ invitation, accepted }, callback = () => {}) => {
    if (!objectValidator.isValidData({ invitation, accepted }, { accepted: true, invitation: { itemName: true, sender: true, invitationType: true } })) {
      callback({ error: new errorCreator.InvalidData({ expected: '{ accepted, invitation: { itemName, sender, invitationType } }' }) });

      return;
    }

    manager.userIsAllowed(socket.id, databasePopulation.commands.invitations.commandName, (allowErr, allowed, allowedUser) => {
      if (allowErr) {
        callback({ error: new errorCreator.Database() });

        return;
      } else if (!allowed) {
        callback({ error: new errorCreator.NotAllowed({ name: 'roomInviteAnswer' }) });

        return;
      }

      const userName = allowedUser.userName;
      const roomName = invitation.itemName;
      invitation.time = new Date();

      if (accepted) {
        dbUser.addRoomToUser(userName, roomName, (roomErr) => {
          if (roomErr) {
            callback({ error: new errorCreator.Database() });

            return;
          }

          manager.followRoom({ room: { roomName }, socket, userName, callback });
          dbConnector.removeInvitationFromList(userName, roomName, invitation.invitationType, () => {
          });
        });
      } else {
        dbConnector.removeInvitationFromList(userName, invitation.itemName, invitation.invitationType, (err) => {
          if (err) {
            callback({ error: new errorCreator.Database() });

            return;
          }

          callback({ data: { success: true } });
        });
      }
    });
  });

  // TODO Unused
  socket.on('inviteToRoom', ({ user, room }, callback = () => {}) => {
    if (!objectValidator.isValidData({ user, room }, { user: { userName: true }, room: { roomName: true } })) {
      callback({ error: new errorCreator.InvalidData({ expected: '{ user: { userName }, room: { roomName } }' }) });

      return;
    }

    manager.userIsAllowed(socket.id, databasePopulation.commands.inviteRoom.commandName, (allowErr, allowed, allowedUser) => {
      if (allowErr) {
        callback({ error: new errorCreator.Database() });

        return;
      } else if (!allowed) {
        callback({ error: new errorCreator.NotAllowed({ name: 'inviteToRoom' }) });

        return;
      }

      const userName = user.userName.toLowerCase();
      const roomName = room.roomName.toLowerCase();

      dbUser.getUser(userName, (userErr, invitedUser) => {
        if (userErr) {
          callback({ error: new errorCreator.Database() });

          return;
        } else if (!invitedUser) {
          callback({ error: new errorCreator.DoesNotExist({ name: userName }) });

          return;
        } else if (invitedUser.rooms.indexOf(roomName) > -1) {
          callback({ error: new errorCreator.AlreadyExists({ name: invitedUser.userName }) });

          return;
        }

        const invitation = {
          itemName: roomName,
          time: new Date(),
          invitationType: 'room',
          sender: allowedUser.userName,
        };

        dbConnector.addInvitationToList(userName, invitation, (invErr) => {
          if (invErr) {
            if (invErr.code === 11000) {
              callback({ error: new errorCreator.AlreadyExists({ name: 'invitation' }) });
            } else {
              callback({ error: new errorCreator.Database() });
            }

            return;
          }

          callback({ data: { user: invitedUser } });
        });
      });
    });
  });

  socket.on('getInvitations', (params, callback = () => {}) => {
    manager.userIsAllowed(socket.id, databasePopulation.commands.invitations.commandName, (allowErr, allowed, user) => {
      if (allowErr || !allowed) {
        callback({ error: new errorCreator.Database() });

        return;
      }

      dbConnector.getInvitations(user.userName, (err, list = []) => {
        if (err) {
          callback({ error: new errorCreator.Database() });

          return;
        }

        callback({ data: { invitations: list.invitations }});
      });
    });
  });
}

exports.handle = handle;
