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
const logger = require('../../utils/logger');
const databaseConnector = require('../databaseConnector');

// Access levels: Lowest / Lower / Middle / Higher / Highest / God
// 1 / 3 / 5 / 7 / 9 / 11

const lanternHackSchema = new mongoose.Schema({
  owner: { type: String, unique: true },
  triesLeft: { type: Number, default: 3 },
  stationId: Number,
  gameUsers: [{
    userName: String,
    password: String,
    isCorrect: { type: Boolean, default: false },
    passwordType: String,
    passwordHint: {
      index: Number,
      character: String,
    },
  }],
}, { collection: 'lanternHacks' });
const gameUserSchema = new mongoose.Schema({
  userName: { type: String, unique: true },
  passwords: [String],
  stationId: Number,
}, { collection: 'gameUsers' });
const fakePasswordSchema = new mongoose.Schema({
  password: { type: String, unique: true },
}, { collection: 'fakePasswords' });
const stationSchema = new mongoose.Schema({
  stationId: { type: Number, unique: true },
  stationName: String,
  signalValue: { type: Number, default: 0 },
  isActive: { type: Boolean, default: false },
}, { collection: 'stations' });
const lanternRoundSchema = new mongoose.Schema({
  roundId: Number,
  startTime: Date,
  endTime: Date,
}, { collection: 'lanternRounds' });

const LanternHack = mongoose.model('LanternHack', lanternHackSchema);
const GameUser = mongoose.model('GameUser', gameUserSchema);
const FakePassword = mongoose.model('FakePassword', fakePasswordSchema);
const Station = mongoose.model('Station', stationSchema);
const LanternRound = mongoose.model('Lantern', lanternRoundSchema);

/**
 * Update lantern round. Create a new one if none exist
 * @param {Object} lanternRound Lantern round
 * @param {number} lanternRound.roundId Id of the round
 * @param {Date} lanternRound.startTime Start time of the round
 * @param {Date} lanternRound.endTime End time of the round
 * @param {Function} callback Callback
 */
function updateLanternRound({ roundId, startTime, endTime }, callback) {
  const query = { roundId };
  const update = { startTime, endTime };
  const options = { upsert: true, new: true };

  LanternRound.findOneAndUpdate(query, update, options).lean().exec((err, updatedRound) => {
    if (err) {
      logger.sendErrorMsg({
        code: logger.ErrorCodes.db,
        text: ['Failed to check if lantern round exists'],
        err,
      });
    }

    callback(err, updatedRound);
  });
}

/**
 * Remove lantern hack
 * @param {number} roundId Id of the round
 * @param {Function} callback Callback
 */
function removeLanternRound(roundId, callback) {
  const query = { roundId };

  LanternRound.findOneAndRemove(query).lean().exec((err) => {
    if (err) {
      logger.sendErrorMsg({
        code: logger.ErrorCodes.db,
        text: ['Failed to remove lantern round'],
        err,
      });

      return;
    }

    callback(err);
  });
}

/**
 * Update signal value on station
 * @param {number} stationId - Station ID
 * @param {number} signalValue - New signal value
 * @param {Function} callback - Callback
 */
function updateSignalValue(stationId, signalValue, callback) {
  const query = { stationId };
  const update = { $set: { signalValue } };

  Station.findOneAndUpdate(query, update).lean().exec((err, station) => {
    if (err) {
      logger.sendErrorMsg({
        code: logger.ErrorCodes.db,
        text: [`Failed to set signal value on station ${stationId}`],
        err,
      });
    }

    callback(err, station);
  });
}

/**
 * Start lantern round
 * @param {number} roundId ID of the round
 * @param {Function} callback - Callback
 */
function startLanternRound(roundId, callback) {
  const query = { roundId };
  const update = { $set: { isActive: true } };

  LanternRound.findOneAndUpdate(query, update).lean().exec((err, updatedRound) => {
    if (err) {
      logger.sendErrorMsg({
        code: logger.ErrorCodes.db,
        text: ['Failed to set new active round'],
        err,
      });
    }

    callback(err, updatedRound);
  });
}

/**
 * End lantern round
 * @param {Function} callback - Callback
 */
function endLanternRound(callback) {
  const query = { isActive: true };
  const update = { $set: { isActive: false } };

  LanternRound.findOneAndUpdate(query, update).lean().exec((err, updatedRound) => {
    if (err) {
      logger.sendErrorMsg({
        code: logger.ErrorCodes.db,
        text: ['Failed to set new active round'],
        err,
      });
    }

    callback(err, updatedRound);
  });
}

/**
 * Get lantern round
 * @param {Function} callback Callback
 */
function getActiveLanternRound(callback) {
  const query = { isActive: true };
  const filter = { _id: 0 };

  LanternRound.findOne(query, filter).lean().exec((err, foundRound) => {
    if (err) {
      logger.sendErrorMsg({
        code: logger.ErrorCodes.db,
        text: ['Failed to find lantern rounds'],
        err,
      });
    }

    callback(err, foundRound);
  });
}

/**
 * Get lantern round
 * @param {number} roundId Lantern round Id
 * @param {Function} callback Callback
 */
function getLanternRound(roundId, callback) {
  const query = { roundId };
  const filter = { _id: 0 };

  LanternRound.findOne(query, filter).lean().exec((err, foundRound) => {
    if (err) {
      logger.sendErrorMsg({
        code: logger.ErrorCodes.db,
        text: ['Failed to find lantern rounds'],
        err,
      });
    }

    callback(err, foundRound);
  });
}

/**
 * Get lantern rounds
 * @param {Function} callback Callback
 */
function getLanternRounds(callback) {
  const query = {};
  const filter = { _id: 0 };

  LanternRound.find(query, filter).lean().exec((err, foundRounds) => {
    if (err) {
      logger.sendErrorMsg({
        code: logger.ErrorCodes.db,
        text: ['Failed to find lantern rounds'],
        err,
      });
    }

    callback(err, foundRounds);
  });
}

/**
 * Get station
 * @param {number} stationId Station ID
 * @param {Function} callback Callback
 */
function getStation(stationId, callback) {
  const query = { stationId };
  const filter = { _id: 0 };

  Station.findOne(query, filter).lean().exec((err, foundStation) => {
    if (err) {
      logger.sendErrorMsg({
        code: logger.ErrorCodes.db,
        text: ['Failed to find station'],
        err,
      });
    }

    callback(err, foundStation);
  });
}

/**
 * Get all stations. Sorted on station ID
 * @param {Function} callback - Callback
 */
function getAllStations(callback) {
  const query = {};
  const sort = { stationId: 1 };
  const filter = { _id: 0 };

  Station.find(query, filter).sort(sort).lean().exec((err, stations) => {
    if (err) {
      logger.sendErrorMsg({
        code: logger.ErrorCodes.db,
        text: ['Failed to get stations'],
        err,
      });
    }

    callback(err, stations);
  });
}

/**
 * Create and save station
 * @param {Object} station - New station
 * @param {Function} callback - Callback
 */
function createStation(station, callback) {
  const newStation = new Station(station);

  getStation(station.stationId, (err, foundStation) => {
    if (err) {
      logger.sendErrorMsg({
        code: logger.ErrorCodes.db,
        text: ['Failed to check if user exists'],
        err,
      });
    } else if (foundStation === null) {
      databaseConnector.saveObject(newStation, 'station', callback);
    } else {
      callback(err, null);
    }
  });
}

/**
 * Set new isActive on station
 * @param {Object} station Lantern station
 * @param {number} station.stationId ID of station
 * @param {boolean} [station.isActive] Is the station active?
 * @param {string} [station.stationName] Name of the station
 * @param {string} [station.ownwer] Owner name of the station
 * @param {Function} callback Callback
 */
function updateLanternStation({ stationId, isActive, stationName, owner }, callback) {
  const set = {};

  if (typeof isActive === 'boolean') {
    set.isActive = isActive;
  }

  if (stationName) {
    set.stationName = stationName;
  }

  if (owner) {
    set.owner = owner;
  }

  const query = { stationId };
  const update = { $set: set };

  Station.findOneAndUpdate(query, update).lean().exec((err, station) => {
    if (err) {
      logger.sendErrorMsg({
        code: logger.ErrorCodes.db,
        text: [`Failed to set active on station ${stationId}`],
        err,
      });
    }

    callback(err, station);
  });
}

/**
 * Get active stations
 * @param {Function} callback - Callback
 */
function getActiveStations(callback) {
  const query = { isActive: true };
  const sort = { stationId: 1 };
  const filter = { _id: 0 };

  Station.find(query, filter).sort(sort).lean().exec((err, stations) => {
    if (err) {
      logger.sendErrorMsg({
        code: logger.ErrorCodes.db,
        text: ['Failed to get stations'],
        err,
      });
    }

    callback(err, stations);
  });
}

/**
 * Update lantern hack. Create a new one if none exist
 * @param {Object} lanternHack Lantern hack
 * @param {Function} callback Callback
 */
function updateLanternHack({ stationId, owner, gameUsers, triesLeft }, callback) {
  const query = { owner };
  const update = { stationId, owner, gameUsers, triesLeft };
  const options = { upsert: true, new: true };

  LanternHack.findOneAndUpdate(query, update, options).lean().exec((err, updatedLanternHack) => {
    if (err) {
      logger.sendErrorMsg({
        code: logger.ErrorCodes.db,
        text: ['Failed to check if game user already exists'],
        err,
      });
    }

    callback(err, updatedLanternHack);
  });
}

/**
 * Remove lantern hack
 * @param {string} owner Owner user name of hack
 * @param {Function} callback Callback
 */
function removeLanternHack(owner, callback) {
  const query = { owner };

  LanternHack.findOneAndRemove(query).lean().exec((err) => {
    if (err) {
      logger.sendErrorMsg({
        code: logger.ErrorCodes.db,
        text: ['Failed to remove room'],
        err,
      });

      return;
    }

    callback(err);
  });
}

/**
 * Lower amount of hack tries by 1
 * @param {string} owner Hack owner user name
 * @param {Function} callback Callback
 */
function lowerHackTries(owner, callback) {
  const query = { owner };
  const update = { $inc: { triesLeft: -1 } };
  const options = { new: true };

  LanternHack.findOneAndUpdate(query, update, options).lean().exec((err, lanternHack) => {
    if (err) {
      logger.sendErrorMsg({
        code: logger.ErrorCodes.db,
        text: ['Failed to increment command usage'],
        err,
      });

      callback(err, null);

      return;
    }

    callback(err, lanternHack);
  });
}

/**
 * Get lantern hack
 * @param {string} owner Owner of the hack
 * @param {Function} callback Callback
 */
function getLanternHack(owner, callback) {
  const query = { owner };

  LanternHack.findOne(query).lean().exec((err, foundHack) => {
    if (err) {
      logger.sendErrorMsg({
        code: logger.ErrorCodes.db,
        text: ['Failed to get game user'],
        err,
      });
    }

    callback(err, foundHack);
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

      callback(err, null);
    } else if (foundGameUser === null) {
      databaseConnector.saveObject(newGameUser, 'gameUser', callback);
    } else {
      callback(err, null);
    }
  });
}

/**
 * Get game user
 * @param {string} userName Game user to retrieve
 * @param {Function} callback Callback
 */
function getGameUser(userName, callback) {
  const query = { userName };
  const filter = { _id: 0 };

  GameUser.findOne(query, filter).lean().exec((err, foundGameUser) => {
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
 * @param {number} params.stationId Station ID
 * @param {Function} callback Callback
 */
function getGameUsers({ stationId }, callback) {
  const query = { stationId };
  const filter = { _id: 0 };

  GameUser.find(query, filter).lean().exec((err, gameUsers) => {
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
 * Create and save fake password
 * @param {Object} fakePassword Fake password
 * @param {Function} callback Callback
 */
function createFakePassword(fakePassword, callback) {
  const newFakePassword = new FakePassword(fakePassword);
  const query = { password: fakePassword.password };

  FakePassword.findOne(query).lean().exec((err, foundFakePassword) => {
    if (err) {
      logger.sendErrorMsg({
        code: logger.ErrorCodes.db,
        text: ['Failed to check if fake password already exists'],
        err,
      });

      callback(err, null);
    } else if (foundFakePassword === null) {
      databaseConnector.saveObject(newFakePassword, 'fakePassword', callback);
    } else {
      callback(err, null);
    }
  });
}

/**
 * Get all fake passwords
 * @param {Function} callback Callback
 */
function getAllFakePasswords(callback) {
  const query = {};
  const filter = { _id: 0 };

  FakePassword.find(query, filter).lean().exec((err, fakePasswords) => {
    if (err || fakePasswords === null) {
      logger.sendErrorMsg({
        code: logger.ErrorCodes.db,
        text: ['Failed to get fake passwords'],
        err,
      });
    }

    callback(err, fakePasswords);
  });
}

exports.createGameUser = createGameUser;
exports.getGameUser = getGameUser;
exports.createFakePassword = createFakePassword;
exports.getAllFakePasswords = getAllFakePasswords;
exports.getGameUsers = getGameUsers;
exports.updateLanternHack = updateLanternHack;
exports.getLanternHack = getLanternHack;
exports.lowerHackTries = lowerHackTries;
exports.removeLanternHack = removeLanternHack;
exports.updateSignalValue = updateSignalValue;
exports.getStation = getStation;
exports.getAllStations = getAllStations;
exports.createStation = createStation;
exports.updateLanternStation = updateLanternStation;
exports.getActiveStations = getActiveStations;
exports.removeLanternRound = removeLanternRound;
exports.updateLanternRound = updateLanternRound;
exports.getLanternRound = getLanternRound;
exports.getLanternRounds = getLanternRounds;
exports.startLanternRound = startLanternRound;
exports.getActiveLanternRound = getActiveLanternRound;
exports.endLanternRound = endLanternRound;
