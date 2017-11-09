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

const mongoose = require('mongoose');
const errorCreator = require('../../objects/error/errorCreator');
const dbConnector = require('../databaseConnector');

const invitationSchema = new mongoose.Schema(dbConnector.createSchema({
  receiverId: String,
  invitationType: String,
  itemId: String,
  senderId: String,
  senderAliasId: String,
  onlyOne: { type: Boolean, default: true },
}), { collection: 'invitations' });

const Invitation = mongoose.model('Invitation', invitationSchema);

/**
 * Get invitations
 * @private
 * @param {Object} params - Parameters
 * @param {Object} params.query - Query to get invitations
 * @param {Function} params.callback - Callback
 */
function getInvitations({ query, callback }) {
  dbConnector.getObjects({
    query,
    object: Invitation,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      callback({ invitations: data.objects });
    },
  });
}

/**
 * Get invitation
 * @private
 * @param {Object} params - Parameters
 * @param {Object} params.query - Query to get invitations
 * @param {Function} params.callback - Callback
 */
function getInvitation({ query, callback }) {
  dbConnector.getObject({
    query,
    object: Invitation,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      } else if (!data.object) {
        callback({ error: new errorCreator.DoesNotExist({ name: `invitation ${query.toString()}` }) });

        return;
      }

      callback({ invitation: data.object });
    },
  });
}

/**
 * Create invitation
 * @param {Object} params - Parameters
 * @param {Object} params.invitation - Invitation to save
 * @param {Function} params.callback - Callback
 */
function createInvitation({ invitation, callback }) {
  const query = {
    itemId: invitation.itemId,
    receiverId: invitation.receiverId,
  };

  getInvitation({
    query,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error: new errorCreator.Database({ errorObject: error, name: 'createInvitation' }) });

        return;
      } else if (data.invitation) {
        callback({ error: new errorCreator.AlreadyExists({ name: `invitation ${invitation.invitationType} ${invitation.itemId}` }) });

        return;
      }

      dbConnector.saveObject({
        object: new Invitation(invitation),
        objectType: 'invitation',
        callback: ({ error: invitationError, data: invitationData }) => {
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
 * Get invitations by receiver
 * @param {Object} params - Parameters
 * @param {string} params.receiverId - ID of the receiver of the invitation
 * @param {Function} params.callback - Callback
 */
function getInvitationsByReceiver({ receiverId, callback }) {
  getInvitations({
    callback,
    query: { receiverId },
  });
}

/**
 * Get invitations by sender
 * @param {Object} params - Parameters
 * @param {string} params.senderId - ID of the sender of the invitation
 * @param {Function} params.callback - Callback
 */
function getInvitationsBySender({ senderId, callback }) {
  getInvitations({
    callback,
    query: { senderId },
  });
}

/**
 * Remove invitation
 * @param {Object} params - Parameters
 * @param {string} params.objectId - ID of the invitation
 * @param {Function} params.callback - Callback
 */
function removeInvitation({ objectId, callback }) {
  dbConnector.removeObject({
    callback,
    object: Invitation,
    query: { _id: objectId },
  });
}

/**
 * Remove invitations by type on receiver
 * @param {Object} params - Parameters
 * @param {string} params.receiverId - ID of the receiver
 * @param {string} params.invitationType - Type of invitation to remove
 * @param {Function} params.callback - Callback
 */
function removeInvitations({ receiverId, invitationType, callback }) {
  const query = {
    invitationType,
    receiverId,
  };

  dbConnector.removeObjects({
    callback,
    query,
    object: Invitation,
  });
}

exports.createInvitation = createInvitation;
exports.getInvitationsBySender = getInvitationsBySender;
exports.getInvitationsByReceiver = getInvitationsByReceiver;
exports.removeInvitation = removeInvitation;
exports.removeInvitations = removeInvitations;
