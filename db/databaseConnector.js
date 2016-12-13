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

const teamSchema = new mongoose.Schema({
  teamName: String,
  owner: String,
  admins: [{ type: String, unique: true }],
  verified: Boolean,
}, { collection: 'teams' });
const weatherSchema = new mongoose.Schema({
  time: { type: Date, unique: true },
  temperature: Number,
  windSpeed: Number,
  precipitation: Number,
  precipType: Number,
  coverage: Number,
  viewDistance: Number,
  windDirection: Number,
  thunderRisk: Number,
}, { collection: 'weather' });
const invitationListSchema = new mongoose.Schema({
  userName: { type: String, unique: true, index: true },
  invitations: [{
    invitationType: String,
    itemName: String,
    sender: String,
    time: Date,
  }],
}, { collection: 'invitationLists' });
const gameUserSchema = new mongoose.Schema({
  userName: { type: String, unique: true },
  password: String,
}, { collection: 'gameUsers' });
const gamePasswordSchema = new mongoose.Schema({
  password: { type: String, unique: true },
}, { collection: 'gamePasswords' });

const Team = mongoose.model('Team', teamSchema);
const Weather = mongoose.model('Weather', weatherSchema);
const InvitationList = mongoose.model('InvitationList', invitationListSchema);
const GameUser = mongoose.model('GameUser', gameUserSchema);
const GamePassword = mongoose.model('GamePassword', gamePasswordSchema);

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
  const options = { multi: true };

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
 * Creates and saves weather report to db
 * @param {Object} sentWeather - Weather report
 * @param {Function} callback - Callback
 */
function createWeather(sentWeather, callback) {
  const newWeather = new Weather(sentWeather);

  saveObject(newWeather, 'weather', callback);
}

/**
 * Get weather report based on time
 * @param {Date} sentTime - Time to retrieve reports from (equal to or greater than)
 * @param {Function} callback - Callback
 */
function getWeather(sentTime, callback) {
  const query = { time: { $gte: sentTime } };
  const filter = { _id: 0 };

  Weather.findOne(query, filter).lean().exec((err, foundWeather) => {
    if (err) {
      logger.sendErrorMsg({
        code: logger.ErrorCodes.db,
        text: ['Failed to get weather'],
        err,
      });
    }

    callback(err, foundWeather);
  });
}

/**
 * Create and save game user
 * @param {Object} gameUser - Game user
 * @param {Function} callback - Callback
 */
function createGameUser(gameUser, callback) {
  const newGameUser = new GameUser(gameUser);
  const query = { userName: gameUser.userName };

  GameUser.findOne(query).lean().exec((err, foundGameUser) => {
    if (err) {
      logger.sendErrorMsg({
        code: logger.ErrorCodes.db,
        text: ['Failed to check if game user already exists'],
        err,
      });
    } else if (foundGameUser === null) {
      saveObject(newGameUser, 'gameUser', callback);
    } else {
      callback(err, null);
    }
  });
}

/**
 * Get game user
 * @param {string} userName - Game user name to retrieve
 * @param {Function} callback - Callback
 */
function getGameUser(userName, callback) {
  const query = { userName };

  GameUser.findOne(query).lean().exec((err, foundGameUser) => {
    if (err || foundGameUser === null) {
      logger.sendErrorMsg({
        code: logger.ErrorCodes.db,
        text: ['Failed to get game user'],
        err,
      });
    }

    callback(err, foundGameUser);
  });
}

/**
 * Get all game users
 * @param {Function} callback - Callback
 */
function getAllGameUsers(callback) {
  GameUser.find().lean().exec((err, gameUsers) => {
    if (err || gameUsers === null) {
      logger.sendErrorMsg({
        code: logger.ErrorCodes.db,
        text: ['Failed to get game users'],
        err,
      });
    }

    callback(err, gameUsers);
  });
}

/**
 * Create and save game password
 * @param {Object} gamePassword - Game password
 * @param {Function} callback - Callback
 */
function createGamePassword(gamePassword, callback) {
  const newGamePassword = new GamePassword(gamePassword);
  const query = { password: gamePassword.password };

  GamePassword.findOne(query).lean().exec((err, foundGamePassword) => {
    if (err) {
      logger.sendErrorMsg({
        code: logger.ErrorCodes.db,
        text: ['Failed to check if game password already exists'],
        err,
      });
    } else if (foundGamePassword === null) {
      saveObject(newGamePassword, 'gamePassword', callback);
    } else {
      callback(err, null);
    }
  });
}

/**
 * Get all game passwords
 * @param {Function} callback - Callback
 */
function getAllGamePasswords(callback) {
  GamePassword.find().lean().exec((err, gamePasswords) => {
    if (err || gamePasswords === null) {
      logger.sendErrorMsg({
        code: logger.ErrorCodes.db,
        text: ['Failed to get game passwords'],
        err,
      });
    }

    callback(err, gamePasswords);
  });
}

/**
 * Create and save team
 * @param {Object} team - Team
 * @param {Function} callback - Callback
 */
function createTeam(team, callback) {
  const newTeam = new Team(team);
  const query = { teamName: team.teamName };

  Team.findOne(query).lean().exec((err, foundTeam) => {
    if (err) {
      logger.sendErrorMsg({
        code: logger.ErrorCodes.db,
        text: ['Failed to check if team already exists'],
        err,
      });
    } else if (foundTeam === null) {
      saveObject(newTeam, 'team', callback);
    } else {
      callback(err, null);
    }
  });
}

/**
 * Get team
 * @param {string} teamName - Name of team to retrieve
 * @param {Function} callback - Callback
 */
function getTeam(teamName, callback) {
  const query = { teamName };
  const filter = { _id: 0 };

  Team.findOne(query, filter).lean().exec((err, team) => {
    if (err) {
      logger.sendErrorMsg({
        code: logger.ErrorCodes.db,
        text: ['Failed to get team'],
        err,
      });
    }

    callback(err, team);
  });
}

/**
 * Verify team
 * @param {string} teamName - Name of the team that will be verified
 * @param {Function} callback - Callback
 */
function verifyTeam(teamName, callback) {
  const query = { teamName };
  verifyObject(query, Team, 'team', callback);
}

/**
 * Verify all teams
 * @param {Function} callback - Callback
 */
function verifyAllTeams(callback) {
  const query = { verified: false };

  verifyAllObjects(query, Team, 'teams', callback);
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

      callback(invErr, invitationList);
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
 * Get all unverified teams
 * @param {Function} callback - Callback
 */
function getUnverifiedTeams(callback) {
  const query = { verified: false };
  const filter = { _id: 0 };
  const sort = { teamName: 1 };

  Team.find(query, filter).sort(sort).lean().exec((err, teams) => {
    if (err) {
      logger.sendErrorMsg({
        code: logger.ErrorCodes.db,
        text: ['Failed to get unverified teams'],
        err,
      });
    }

    callback(err, teams);
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
      query.$and = [{ userName: { $regex: `^${partialName}.*` } }];
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

exports.createTeam = createTeam;
exports.getTeam = getTeam;
exports.createWeather = createWeather;
exports.getWeather = getWeather;
exports.addInvitationToList = addInvitationToList;
exports.removeInvitationFromList = removeInvitationFromList;
exports.getInvitations = getInvitations;
exports.removeInvitationTypeFromList = removeInvitationTypeFromList;
exports.verifyTeam = verifyTeam;
exports.verifyAllTeams = verifyAllTeams;
exports.getUnverifiedTeams = getUnverifiedTeams;
exports.createGameUser = createGameUser;
exports.getGameUser = getGameUser;
exports.createGamePassword = createGamePassword;
exports.getAllGamePasswords = getAllGamePasswords;
exports.getAllGameUsers = getAllGameUsers;
exports.matchPartial = matchPartial;
exports.saveObject = saveObject;
exports.verifyObject = verifyObject;
exports.verifyAllObjects = verifyAllObjects;
