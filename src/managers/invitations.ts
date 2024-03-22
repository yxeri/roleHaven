'use strict';

import { dbConfig } from '../config/defaults/config';

import authenticator from '../helpers/authenticator';
import dbInvitation from '../db/connectors/invitation';

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
        callback: ({
          error: invitationError,
          data: invitationData,
        }) => {
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
            io.to(invitation.receiver)
              .emit(dbConfig.EmitTypes.INVITATION, dataToSend);
          }

          callback(dataToSend);
        },
      });
    },
  });
}

export { declineInvitation };
