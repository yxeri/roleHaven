/*
 Copyright 2017 Carmilla Mina Jankovic

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

const { dbConfig } = require('../config/defaults/config');
const authenticator = require('../helpers/authenticator');
const dbInvitation = require('../db/connectors/invitation');

/**
 * Decline an invitation.
 * @param {Object} params Parameters.
 * @param {string} params.invitationId Id of the invitation to decline.
 * @param {string} params.token jwt.
 * @param {Object} params.io Socket.io. Will be used if socket is not set.
 * @param {Function} params.callback Callback.
 * @param {Object} [params.socket] Socket.io.
 */
function declineInvitation({
  invitationId,
  token,
  callback,
  socket,
  io,
}) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.DeclineInvitation.name,
    callback: ({ error }) => {
      if (error) {
        callback({ error });

        return;
      }

      dbInvitation.useInvitation({
        invitationId,
        callback: ({ error: invitationError, data: invitationData }) => {
          if (invitationError) {
            callback({ error: invitationError });

            return;
          }

          const { invitation } = invitationData;
          const dataToSend = {
            data: {
              invitation,
              changeType: dbConfig.ChangeTypes.REMOVE,
            },
          };

          if (!socket) {
            io.to(invitation.receiver).emit(dbConfig.EmitTypes.INVITATION, dataToSend);
          }

          callback(dataToSend);
        },
      });
    },
  });
}

exports.declineInvitation = declineInvitation;
