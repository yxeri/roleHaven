'use strict';

import mongoose from 'mongoose';
import errorCreator from '../../error/errorCreator';
import dbConnector from '../databaseConnector';

const invitationSchema = new mongoose.Schema(dbConnector.createSchema({
  receiverId: String,
  invitationType: String,
  itemId: String,
}), { collection: 'invitations' });

const Invitation = mongoose.model('Invitation', invitationSchema);

/**
 * Get invitations
 * @private
 * @param {Object} params Parameters.
 * @param {Object} params.query Query to get invitations.
 * @param {Function} params.callback Callback.
 */
function getInvitations({
  query,
  callback,
}) {
  dbConnector.getObjects({
    query,
    object: Invitation,
    callback: ({
      error,
      data,
    }) => {
      if (error) {
        callback({ error });

        return;
      }

      callback({
        data: {
          invitations: data.objects,
        },
      });
    },
  });
}

/**
 * Get invitation
 * @private
 * @param {Object} params Parameters.
 * @param {Object} params.query Query to get invitations.
 * @param {Function} params.callback Callback.
 */
function getInvitation({
  query,
  callback,
}) {
  dbConnector.getObject({
    query,
    object: Invitation,
    callback: ({
      error,
      data,
    }) => {
      if (error) {
        callback({ error });

        return;
      }

      if (!data.object) {
        callback({ error: new errorCreator.DoesNotExist({ name: `invitation ${JSON.stringify(query, null, 4)}` }) });

        return;
      }

      callback({ data: { invitation: data.object } });
    },
  });
}

/**
 * Does an invitation with the same item Id and receiver Id exist?
 * @param {Object} params Parameters.
 * @param {string} params.itemId Item Id.
 * @param {string} params.receiverId Receiver Id.
 * @param {Function} params.callback Callback.
 */
function doesInvitationExist({
  itemId,
  receiverId,
  callback,
}) {
  dbConnector.getObject({
    query: {
      itemId,
      receiverId,
    },
    object: Invitation,
    callback: ({
      error,
      data,
    }) => {
      if (error) {
        callback({ error });

        return;
      }

      if (!data.object) {
        callback({ data: { exists: false } });

        return;
      }

      callback({ data: { exists: true } });
    },
  });
}

/**
 * Create invitation
 * @param {Object} params Parameters.
 * @param {Object} params.invitation Invitation to save.
 * @param {Function} params.callback Callback.
 */
function createInvitation({
  invitation,
  callback,
}) {
  doesInvitationExist({
    itemId: invitation.itemId,
    receiverId: invitation.receiverId,
    callback: ({
      error,
      data,
    }) => {
      if (error) {
        callback({
          error: new errorCreator.Database({
            errorObject: error,
            name: 'createInvitation',
          }),
        });

        return;
      }

      if (data.exists) {
        callback({ error: new errorCreator.AlreadyExists({ name: `invitation ${invitation.invitationType} ${invitation.itemId}` }) });

        return;
      }

      dbConnector.saveObject({
        object: new Invitation(invitation),
        objectType: 'invitation',
        callback: ({
          error: invitationError,
          data: invitationData,
        }) => {
          if (invitationError) {
            callback({ error: invitationError });

            return;
          }

          callback({ data: { invitation: invitationData.savedObject } });
        },
      });
    },
  });
}

/**
 * Get invitation by Id.
 * @param {Object} params Parameters.
 * @param {string} params.invitationId Id of the invitation to remove.
 * @param {Function} params.callback Callback.
 */
function getInvitationById({
  invitationId,
  callback,
}) {
  getInvitations({
    callback,
    query: { _id: invitationId },
  });
}

/**
 * Get invitations that the user (or its aliases) has received.
 * @param {Object} params Parameters.
 * @param {Object} params.user User.
 * @param {Function} params.callback Callback.
 */
function getInvitationsByReceiver({
  user,
  callback,
}) {
  getInvitations({
    callback,
    query: {
      $or: [
        { receiverId: user.objectId },
        { receiverId: { $in: user.aliases } },
      ],
    },
  });
}

/**
 * Get invitations by sender.
 * @param {Object} params Parameters.
 * @param {string} params.senderId Id of the sender of the invitation.
 * @param {Function} params.callback Callback.
 */
function getInvitationsBySender({
  senderId,
  callback,
}) {
  getInvitations({
    callback,
    query: {
      $or: [
        { ownerId: senderId },
        { ownerAliasId: senderId },
      ],
    },
  });
}

/**
 * Remove invitation
 * @param {Object} params Parameters.
 * @param {string} params.invitationId Id of the invitation.
 * @param {Function} params.callback Callback.
 */
function removeInvitation({
  invitationId,
  callback,
}) {
  dbConnector.removeObject({
    callback,
    object: Invitation,
    query: { _id: invitationId },
  });
}

/**
 * Remove all invitations with the same item Id for a user.
 * @param {Object} params Parameters.
 * @param {string} params.itemId Item Id.
 * @param {Function} params.callback Callback.
 */
function removeInvitationsByItemId({
  itemId,
  callback,
}) {
  const query = {
    itemId,
  };

  dbConnector.removeObjects({
    callback,
    query,
    object: Invitation,
  });
}

/**
 * Remove invitations with the same itemId as the sent invitation.
 * @param {Object} params Parameters.
 * @param {string} params.invitationId Id of the invitation.
 * @param {Function} params.callback Callback.
 */
function useInvitation({
  invitationId,
  callback,
}) {
  getInvitation({
    query: { _id: invitationId },
    callback: ({
      error,
      data,
    }) => {
      if (error) {
        callback({ error });

        return;
      }

      const {
        itemId,
      } = data.invitation;

      removeInvitationsByItemId({
        itemId,
        callback: ({ error: removeError }) => {
          if (removeError) {
            callback({ error: removeError });

            return;
          }

          callback({ data });
        },
      });
    },
  });
}

export { createInvitation };
export { getInvitationsBySender };
export { getInvitationsByReceiver };
export { removeInvitation };
export { useInvitation };
export { getInvitationById };
