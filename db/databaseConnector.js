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
const appConfig = require('./../config/defaults/config').app;
const logger = require('./../utils/logger');
const objectValidator = require('./../utils/objectValidator');

const dbPath = `mongodb://${appConfig.dbHost}:${appConfig.dbPort}/${appConfig.dbName}`;

mongoose.connect(dbPath, (err) => {
  if (err) {
    logger.sendErrorMsg({
      code: logger.ErrorCodes.db,
      text: ['Failed to connect to database'],
      err,
    });
  } else {
    logger.sendInfoMsg('Connection established to database');
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
 * @param {Object} object - Object to save
 * @param {string} objectName - Object type name
 * @param {Function} callback - Callback
 */
function saveObject(object, objectName, callback) {
  object.save((saveErr, savedObj) => {
    if (saveErr) {
      logger.sendErrorMsg({
        code: logger.ErrorCodes.db,
        text: [`Failed to save ${objectName}`],
        err: saveErr,
      });
    }

    const filteredObject = savedObj;
    filteredObject.password = savedObj.password && savedObj.password !== '';

    callback(saveErr, filteredObject);
  });
}

/**
 * Verifies object
 * @param {Object} query - Search query
 * @param {Object} object - Type of object that will be modified
 * @param {string} objectName - Object type name
 * @param {Function} callback - Callback
 */
function verifyObject(query, object, objectName, callback) {
  const update = { $set: { verified: true } };

  object.findOneAndUpdate(query, update).lean().exec((err, verified) => {
    if (err) {
      logger.sendErrorMsg({
        code: logger.ErrorCodes.db,
        text: [`Failed to verify ${objectName}`],
        err,
      });
    }

    callback(err, verified);
  });
}

/**
 * Verifies all object
 * @param {Object} query - Search query
 * @param {Object} object - Type of object that will be modified
 * @param {string} objectName - Object type name
 * @param {Function} callback - Callback
 */
function verifyAllObjects(query, object, objectName, callback) {
  const update = { $set: { verified: true } };
  const options = { multi: true, new: true };

  object.update(query, update, options).lean().exec((err, verified) => {
    if (err) {
      logger.sendErrorMsg({
        code: logger.ErrorCodes.db,
        text: [`Failed to verify all ${objectName}`],
        err,
      });
    }

    callback(err, verified);
  });
}

/**
 * Get invitation list
 * @param {string} userName - Name of the owner of the list
 * @param {Function} callback - Callback
 */
function getInvitations(userName, callback) {
  const query = { userName };

  InvitationList.findOne(query).lean().exec((err, list) => {
    if (err) {
      logger.sendErrorMsg({
        code: logger.ErrorCodes.db,
        text: [`Failed to get invitations for ${userName}`],
        err,
      });
    }

    callback(err, list);
  });
}

/**
 * Add invitation
 * @param {string} userName - Name of owner
 * @param {Object} invitation - Invitation
 * @param {Function} callback - Callback
 */
function addInvitationToList(userName, invitation, callback) {
  const query = {
    $and: [
      { userName },
      { 'invitations.itemName': invitation.itemName },
      { 'invitations.invitationType': invitation.invitationType },
    ],
  };

  InvitationList.findOne(query).lean().exec((invErr, invitationList) => {
    if (invErr || invitationList) {
      if (invErr && (!invErr.code || invErr.code !== 11000)) {
        logger.sendErrorMsg({
          code: logger.ErrorCodes.db,
          text: [`Failed to find invitation list to add invitation to user ${userName}`],
          err: invErr,
        });
      }

      callback({ code: 11000 }, invitationList);
    } else {
      const update = { $push: { invitations: invitation } };
      const options = { new: true, upsert: true };

      InvitationList.update({ userName }, update, options).lean().exec((updErr) => {
        if (updErr) {
          logger.sendErrorMsg({
            code: logger.ErrorCodes.db,
            text: [`Failed to add invitation to user ${userName} list`],
            err: invErr,
          });
        }

        callback(updErr, invitationList);
      });
    }
  });
}

/**
 * Remove invitation
 * @param {string} userName - Name of owner
 * @param {string} itemName - Name of invitation
 * @param {string} invitationType - Type of invitation
 * @param {Function} callback - Callback
 */
function removeInvitationFromList(userName, itemName, invitationType, callback) {
  const query = { userName };
  const update = { $pull: { invitations: { itemName, invitationType } } };

  InvitationList.findOneAndUpdate(query, update).lean().exec((err, invitationList) => {
    if (err) {
      logger.sendErrorMsg({
        code: logger.ErrorCodes.db,
        text: [`Failed to remove invitation from ${itemName} of type ${invitationType} to ${userName}`],
        err,
      });
    }

    callback(err, invitationList);
  });
}

/**
 * Remove all invitations of a type
 * @param {string} userName - Name of owner
 * @param {string} invitationType - Type of invitation
 * @param {Function} callback - Callback
 */
function removeInvitationTypeFromList(userName, invitationType, callback) {
  const query = { userName };
  const update = { $pull: { invitations: { invitationType } } };
  const options = { multi: true };

  InvitationList.update(query, update, options).lean().exec((err, invitationList) => {
    if (err) {
      logger.sendErrorMsg({
        code: logger.ErrorCodes.db,
        text: [`Failed to remove invitations of type ${invitationType}`],
        err,
      });
    }

    callback(err, invitationList);
  });
}

/**
 * Match partial name
 * @param {Object} params - Parameters
 * @param {Function} params.callback - Callback
 * @param {string} params.partialName - Partial name
 * @param {Object} params.queryType - Database query
 * @param {Object} params.filter - Result filter
 * @param {Object} params.sort - Result sorting
 * @param {Object} params.user - User
 * @param {string} params.type - Type of object to match against
 * @param {Function} params.callback - Callback
 */
function matchPartial({ callback, partialName, queryType, filter, sort, user, type }) {
  if (!objectValidator.isValidData({ callback, partialName, queryType, filter, sort, user, type }, { filter: true, sort: true, user: true, queryType: true, callback: true, type: true })) {
    callback(null, null);

    return;
  }

  const query = {};

  if (partialName) {
    if (type === 'userName') {
      query.$and = [{ banned: false }, { verified: true }, { userName: { $regex: `^${partialName}.*` } }];
    } else if (type === 'roomName') {
      query.$and = [{ roomName: { $regex: `^${partialName}.*` } }];
    }
  } else {
    query.$and = [];
  }

  query.$and.push({ visibility: { $lte: user.accessLevel } });

  queryType.find(query, filter).sort(sort).lean().exec((err, matches) => {
    if (err) {
      logger.sendErrorMsg({
        code: logger.ErrorCodes.db,
        text: ['matchPartial'],
        err,
      });
    }

    callback(err, matches);
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
