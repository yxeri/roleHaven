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

const invitationListSchema = new mongoose.Schema({
  userName: { type: String, unique: true },
  invitations: [{
    invitationType: String,
    itemName: String,
    sender: String,
    time: Date,
  }],
}, { collection: 'invitationLists' });

const InvitationList = mongoose.model('InvitationList', invitationListSchema);

/**
 * Get invitation list
 * @param {string} params.userName Name of the owner of the list
 * @param {Function} params.callback Callback
 */
function getInvitations({ userName, callback }) {
  const query = { userName };

  InvitationList.findOne(query).lean().exec((err, list) => {
    if (err) {
      callback({ error: new errorCreator.Database({ errorObject: err, name: 'getInvitations' }) });

      return;
    } else if (!list) {
      callback({ error: new errorCreator.DoesNotExist({ name: `invitations for ${userName}` }) });

      return;
    }

    callback({ data: { list } });
  });
}

/**
 * Add invitation
 * @param {string} params.userName Name of owner
 * @param {Object} params.invitation Invitation
 * @param {Function} params.callback Callback
 */
function addInvitationToList({ userName, invitation, callback }) {
  const query = { userName };

  InvitationList.findOne(query).lean().exec((err, list) => {
    if (list) { console.log(list.invitations.filter(invitationItem => invitationItem.invitationType === invitation.invitationType && invitationItem.itemName === invitation.itemName)); }

    if (err) {
      callback({ error: new errorCreator.Database({ errorObject: err, name: 'addInvitationToList' }) });

      return;
    } else if (list && list.invitations.filter(invitationItem => invitationItem.invitationType === invitation.invitationType && invitationItem.itemName === invitation.itemName).length > 0) {
      callback({ error: new errorCreator.AlreadyExists({ name: `invitation to ${userName} from ${invitation.itemName} ${invitation.invitationType}` }) });

      return;
    }

    const update = { $addToSet: { invitations: invitation } };
    const options = { new: true, upsert: true };

    InvitationList.findOneAndUpdate(query, update, options).lean().exec((invErr, updatedList) => {
      if (invErr) {
        callback({ error: new errorCreator.Database({ errorObject: invErr, name: 'addInvitationToList' }) });

        return;
      } else if (!updatedList) {
        callback({ error: new errorCreator.DoesNotExist({ name: `${userName} invitations` }) });

        return;
      }

      callback({ data: { list: updatedList } });
    });
  });
}

/**
 * Remove invitation
 * @param {string} params.userName Name of owner
 * @param {string} params.itemName Name of invitation
 * @param {string} params.invitationType Type of invitation
 * @param {Function} params.callback Callback
 */
function removeInvitationFromList({ userName, itemName, invitationType, callback }) {
  const query = { userName };
  const update = { $pull: { invitations: { itemName, invitationType } } };
  const options = { new: true };

  InvitationList.findOneAndUpdate(query, update, options).lean().exec((err, invitationList) => {
    if (err) {
      callback({ error: new errorCreator.Database({ errorObject: err, name: 'removeInvitationFromList' }) });

      return;
    } else if (!invitationList) {
      callback({ error: new errorCreator.DoesNotExist({ name: `${userName} invitation removal` }) });

      return;
    }

    callback({ data: { list: invitationList } });
  });
}

/**
 * Remove all invitations of a type
 * @param {string} params.userName Name of owner
 * @param {string} params.invitationType Type of invitation
 * @param {Function} params.callback Callback
 */
function removeInvitationTypeFromList({ userName, invitationType, callback }) {
  const query = { userName };
  const update = { $pull: { invitations: { invitationType } } };
  const options = { multi: true };

  InvitationList.update(query, update, options).lean().exec((err, invitationList) => {
    if (err) {
      callback({ error: new errorCreator.Database({ errorObject: err, name: 'removeInvitationTypeFromList' }) });

      return;
    } else if (!invitationList) {
      callback({ error: new errorCreator.DoesNotExist({ name: `${userName} invitations type` }) });

      return;
    }

    callback({ data: { list: invitationList } });
  });
}

exports.addInvitationToList = addInvitationToList;
exports.removeInvitationFromList = removeInvitationFromList;
exports.getInvitations = getInvitations;
exports.removeInvitationTypeFromList = removeInvitationTypeFromList;

