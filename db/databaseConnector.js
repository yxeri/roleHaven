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

const mongoose = require('mongoose');
const appConfig = require('../config/defaults/config').app;
const objectValidator = require('./../utils/objectValidator');
const errorCreator = require('../objects/error/errorCreator');

const dbPath = `mongodb://${appConfig.dbHost}:${appConfig.dbPort}/${appConfig.dbName}`;

mongoose.connect(dbPath, (err) => {
  if (err) {
    console.log('Failed to connect to the database');
  } else {
    // TODO Trigger non-database version of app
    console.log('Connection established to database');
  }
});

const invitationListSchema = new mongoose.Schema({
  userName: { type: String, unique: true, index: true },
  invitations: [{
    invitationType: String,
    itemName: String,
    sender: String,
    time: Date,
  }],
}, { collection: 'invitationLists' });

const InvitationList = mongoose.model('InvitationList', invitationListSchema);

/**
 * Saves object to database
 * @param {Object} params.object Object to save
 * @param {string} params.objectName Object type name
 * @param {Function} params.callback Callback
 */
function saveObject({ object, objectType, callback }) {
  object.save((saveErr) => {
    if (saveErr) {
      callback({ error: new errorCreator.Database({ errorObject: saveErr, name: `saveObject ${objectType} ${object}` }) });

      return;
    }

    callback({ data: { success: true, objectType } });
  });
}

/**
 * Verifies object
 * @param {Object} params.query Search query
 * @param {Object} params.object Type of object that will be modified
 * @param {Function} params.callback Callback
 */
function verifyObject({ query, object, callback }) {
  const update = { $set: { verified: true } };
  const options = { new: true };

  object.findOneAndUpdate(query, update, options).lean().exec((err, verified) => {
    if (err) {
      callback({ error: new errorCreator.Database({ errorObject: err, name: 'verifyObject' }) });

      return;
    } else if (!verified) {
      callback({ error: new errorCreator.DoesNotExist({ name: 'verify' }) });

      return;
    }

    callback({ data: { verified } });
  });
}

/**
 * Verifies all object
 * @param {Object} params.query Search query
 * @param {Object} params.object Type of object that will be modified
 * @param {Function} params.callback Callback
 */
function verifyAllObjects({ query, object, callback }) {
  const update = { $set: { verified: true } };
  const options = { multi: true, new: true };

  object.update(query, update, options).lean().exec((err, verified = []) => {
    if (err) {
      callback({ error: new errorCreator.Database({ errorObject: err, name: 'verifyAllObjects' }) });

      return;
    }

    callback({ data: { verified } });
  });
}

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
      callback({ error: new errorCreator.DoesNotExist({ name: `${userName} invitations` }) });

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
  const query = {
    $and: [
      { userName },
      { 'invitations.itemName': invitation.itemName },
      { 'invitations.invitationType': invitation.invitationType },
    ],
  };

  InvitationList.findOne(query).lean().exec((invErr, invitationList) => {
    if (invErr) {
      callback({ error: new errorCreator.Database({ errorObject: invErr, name: 'addInvitationToList' }) });

      return;
    } else if (!invitationList) {
      callback({ error: new errorCreator.DoesNotExist({ name: `${userName} invitations` }) });

      return;
    }

    const update = { $push: { invitations: invitation } };
    const options = { new: true, upsert: true };

    InvitationList.update({ userName }, update, options).lean().exec((updErr) => {
      if (updErr) {
        callback({ error: new errorCreator.Database({ errorObject: updErr, name: 'addInvitationToList' }) });

        return;
      }

      callback({ data: { list: invitationList } });
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
      callback({ error: new errorCreator.DoesNotExist({ name: `${userName} invitations removal` }) });

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

/**
 * Match partial name
 * @param {Function} params.callback Callback
 * @param {string} params.partialName Partial name
 * @param {Object} params.queryType Database query
 * @param {Object} params.filter Result filter
 * @param {Object} params.sort Result sorting
 * @param {Object} params.user User
 * @param {string} params.type Type of object to match against
 * @param {Function} params.callback - Callback
 */
function matchPartial({ callback, partialName, queryType, filter, sort, user, type }) {
  if (!objectValidator.isValidData({ callback, partialName, queryType, filter, sort, user, type }, { filter: true, sort: true, user: true, queryType: true, callback: true, type: true })) {
    callback({ error: new errorCreator.InvalidData({ expected: '{ callback, partialName, queryType, filter, sort, user, type }' }) });

    return;
  }

  const query = {};

  if (partialName) {
    if (type === 'userName') {
      query.$and = [
        { banned: false },
        { verified: true },
        { userName: { $regex: `^${partialName}.*` } },
      ];
    } else if (type === 'roomName') {
      query.$and = [{ roomName: { $regex: `^${partialName}.*` } }];
    }
  } else {
    query.$and = [];
  }

  query.$and.push({ visibility: { $lte: user.accessLevel } });

  queryType.find(query, filter).sort(sort).lean().exec((err, matches) => {
    if (err) {
      callback({ error: new errorCreator.Database({ errorObject: err, name: 'matchPartialName' }) });

      return;
    }

    callback({ data: { matches } });
  });
}

exports.addInvitationToList = addInvitationToList;
exports.removeInvitationFromList = removeInvitationFromList;
exports.getInvitations = getInvitations;
exports.removeInvitationTypeFromList = removeInvitationTypeFromList;
exports.matchPartial = matchPartial;
exports.saveObject = saveObject;
exports.verifyObject = verifyObject;
exports.verifyAllObjects = verifyAllObjects;
