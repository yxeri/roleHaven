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

const dbConfig = require('../config/defaults/config').databasePopulation;
const errorCreator = require('../error/errorCreator');
const dbInvitation = require('../db/connectors/invitation');
const authenticator = require('../helpers/authenticator');

/**
 * Get invitation by Id and check if the user has access to it.
 * @param {Object} params - Parameters.
 * @param {Object} params.user - User retrieving the team.
 * @param {string} params.invitationId - Id of the invitation to retrieve.
 * @param {Function} params.callback - Callback.
 * @param {string} [params.errorContentText] - Text to be printed on error.
 * @param {boolean} [params.shouldBeAdmin] - Does the user have to be an admin?
 */
function getAccessibleInvitation({
  user,
  invitationId,
  callback,
  shouldBeAdmin,
  errorContentText = `invitation ${invitationId}`,
}) {
  dbInvitation.getInvitationById({
    invitationId,
    callback: ({ error: invitationError, data: invitationData }) => {
      if (invitationError) {
        callback({ error: invitationError });

        return;
      } else if (!authenticator.hasAccessTo({
        shouldBeAdmin,
        toAuth: user,
        objectToAccess: invitationData.invitation,
      })) {
        callback({ error: new errorCreator.NotAllowed({ name: errorContentText }) });

        return;
      }

      callback({ data: invitationData });
    },
  });
}

/**
 * Remove an invitation.
 * @param {Object} params - Parameters.
 * @param {string} params.token - jwt.
 * @param {Function} params.callback - Callback.
 * @param {Object} params.io - Socket.io.
 * @param {string} params.invitationId - Id of the invitation to remove.
 */
function removeInvitation({
  token,
  callback,
  io,
  invitationId,
}) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.RemoveTeamInvitation.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const { user } = data;

      getAccessibleInvitation({
        user,
        invitationId,
        shouldBeAdmin: true,
        callback: ({ error: getError, data: getData }) => {
          if (getError) {
            callback({ error: getError });

            return;
          }

          const { invitation } = getData;

          dbInvitation.removeInvitation({
            invitationId,
            callback: ({ error: inviteError }) => {
              if (inviteError) {
                callback({ err: inviteError });

                return;
              }

              const dataToSend = {
                data: {
                  invitation: { objectId: invitationId },
                  changeType: dbConfig.ChangeTypes.REMOVE,
                },
              };

              io.to(invitation.receiverId).emit(dbConfig.EmitTypes.INVITATION, dataToSend);

              callback(dataToSend);
            },
          });
        },
      });
    },
  });
}

exports.removeInvitation = removeInvitation;
