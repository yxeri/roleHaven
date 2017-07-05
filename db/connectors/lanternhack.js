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
  owner: String,
}, { collection: 'stations' });
const lanternRoundSchema = new mongoose.Schema({
  roundId: Number,
  startTime: Date,
  endTime: Date,
}, { collection: 'lanternRounds' });
const lanternTeamSchema = new mongoose.Schema({
  teamName: { type: String, unique: true },
  shortName: { type: String, unique: true },
  points: { type: Number, default: 0 },
  isActive: { type: Boolean, default: false },
});

const LanternHack = mongoose.model('LanternHack', lanternHackSchema);
const GameUser = mongoose.model('GameUser', gameUserSchema);
const FakePassword = mongoose.model('FakePassword', fakePasswordSchema);
const Station = mongoose.model('Station', stationSchema);
const LanternRound = mongoose.model('Lantern', lanternRoundSchema);
const LanternTeam = mongoose.model('LanternTeam', lanternTeamSchema);

/**
 * Create lantern team
 * @param {Object} params.lanternTeam New lantern team
 * @param {Function} params.callback Callback
 */
function createLanternTeam({ team, callback }) {
  const newLanternTeam = new LanternTeam(team);
  const query = {
    $or: [
      { teamName: team.teamName },
      { shortName: team.shortName },
    ],
  };

  LanternTeam.findOne(query).lean().exec((err, foundTeam) => {
    if (err) {
      callback({ error: new errorCreator.Database({ errorObject: err, name: 'createLanternTeam' }) });

      return;
    } else if (foundTeam) {
      callback({ error: new errorCreator.AlreadyExists({ name: `Lantern team ${team.teamName} ${team.shortName}` }) });

      return;
    }

    databaseConnector.saveObject({
      object: newLanternTeam,
      objectType: 'LanternTeam',
      callback,
    });
  });
}

/**
 * Update lantern team
 * @param {string} params.shortName Short name of the team to update
 * @param {boolean} [params.isActive] Is the team active?
 * @param {number} [params.points] Teams total points
 * @param {boolean} [params.resetPoints] Resets points on team to 0
 * @param {Function} params.callback Callback
 */
function updateLanternTeam({ shortName, isActive, points, resetPoints, callback }) {
  const query = { shortName };
  const update = {};
  const options = { new: true };

  if (typeof isActive === 'boolean') { update.isActive = isActive; }

  if (typeof resetPoints === 'boolean' && resetPoints) {
    update.points = 0;
  } else if (points) {
    update.points = points;
  }

  LanternTeam.findOneAndUpdate(query, update, options).lean().exec((error, team) => {
    if (error) {
      callback({ error: new errorCreator.Database({ errorObject: err, name: 'updateLanternTeam' }) });

      return;
    } else if (!team) {
      callback({ error: new errorCreator.DoesNotExist({ name: `${shortName} team. updateLanternTeam` }) });

      return;
    }

    callback({ data: { team } });
  });
}

/**
 * Update lantern round. Create a new one if none exist
 * @param {number} params.roundId Id of the round
 * @param {Date} params.startTime Start time of the round
 * @param {Date} params.endTime End time of the round
 * @param {Function} params.callback Callback
 */
function updateLanternRound({ roundId, startTime, endTime, callback }) {
  const query = { roundId };
  const update = { $set: { startTime, endTime } };
  const options = { upsert: true, new: true };

  LanternRound.findOneAndUpdate(query, update, options).lean().exec((err, updatedRound) => {
    if (err) {
      callback({ error: new errorCreator.Database({ errorObject: err, name: 'updateLanternRound' }) });

      return;
    }

    callback({ data: { round: updatedRound } });
  });
}

/**
 * Remove lantern hack
 * @param {number} params.roundId Id of the round
 * @param {Function} params.callback Callback
 */
function removeLanternRound({ roundId, callback }) {
  const query = { roundId };

  LanternRound.findOneAndRemove(query).lean().exec((err) => {
    if (err) {
      callback({ error: new errorCreator.Database({ errorObject: err, name: 'removeLanternRound' }) });

      return;
    }

    callback({ data: { success: true } });
  });
}

/**
 * Update signal value on station
 * @param {number} params.stationId Station ID
 * @param {number} params.signalValue New signal value
 * @param {Function} params.callback Callback
 */
function updateSignalValue({ stationId, signalValue, callback }) {
  const query = { stationId };
  const update = { $set: { signalValue } };
  const options = { new: true };

  Station.findOneAndUpdate(query, update, options).lean().exec((err, station) => {
    if (err) {
      callback({ error: new errorCreator.Database({ errorObject: err, name: 'updateSignalValue' }) });

      return;
    } else if (!station) {
      callback({ error: new errorCreator.DoesNotExist({ name: `station ${stationId}` }) });

      return;
    }

    callback({ data: { station } });
  });
}

/**
 * Start lantern round
 * @param {number} params.roundId ID of the round
 * @param {Function} params.callback Callback
 */
function startLanternRound({ roundId, callback }) {
  const query = { roundId };
  const update = { $set: { isActive: true } };

  LanternRound.findOneAndUpdate(query, update).lean().exec((err, updatedRound) => {
    if (err) {
      callback({ error: new errorCreator.Database({ errorObject: err, name: 'startLanternRound' }) });

      return;
    } else if (!updatedRound) {
      callback({ error: new errorCreator.DoesNotExist({ name: 'active round' }) });

      return;
    }

    callback({ data: { round: updatedRound } });
  });
}

/**
 * End lantern round
 * @param {Function} params.callback Callback
 */
function endLanternRound({ callback }) {
  const query = { isActive: true };
  const update = { $set: { isActive: false } };

  LanternRound.findOneAndUpdate(query, update).lean().exec((err, updatedRound) => {
    if (err) {
      callback({ error: new errorCreator.Database({ errorObject: err, name: 'endLanternRound' }) });

      return;
    } else if (!updatedRound) {
      callback({ error: new errorCreator.DoesNotExist({ name: 'active round' }) });

      return;
    }

    callback({ data: { success: true } });
  });
}

/**
 * Get lantern round
 * @param {Function} params.callback Callback
 */
function getActiveLanternRound({ callback }) {
  const query = { isActive: true };
  const filter = { _id: 0 };

  LanternRound.findOne(query, filter).lean().exec((err, foundRound) => {
    if (err) {
      callback({ error: new errorCreator.Database({ errorObject: err, name: 'getActiveLanternRound' }) });

      return;
    } else if (!foundRound) {
      callback({ error: new errorCreator.DoesNotExist({ name: 'active round' }) });

      return;
    }

    callback({ data: { round: foundRound } });
  });
}

/**
 * Get lantern round
 * @param {number} params.roundId Lantern round Id
 * @param {Function} params.callback Callback
 */
function getLanternRound({ roundId, callback }) {
  const query = { roundId };
  const filter = { _id: 0 };

  LanternRound.findOne(query, filter).lean().exec((err, foundRound) => {
    if (err) {
      callback({ error: new errorCreator.Database({ errorObject: err, name: 'getLanternRound' }) });

      return;
    } else if (!foundRound) {
      callback({ error: new errorCreator.DoesNotExist({ name: `${roundId} round does not exist` }) });

      return;
    }

    callback({ data: { round: foundRound } });
  });
}

/**
 * Get lantern rounds
 * @param {Function} params.allback Callback
 */
function getLanternRounds({ callback }) {
  const query = {};
  const filter = { _id: 0 };

  LanternRound.find(query, filter).lean().exec((err, foundRounds = []) => {
    if (err) {
      callback({ error: new errorCreator.Database({ errorObject: err, name: 'getLanternRounds' }) });

      return;
    } else if (!foundRounds) {
      callback({ error: new errorCreator.DoesNotExist({ name: 'rounds' }) });

      return;
    }

    callback({ data: { rounds: foundRounds } });
  });
}

/**
 * Get station
 * @param {number} params.stationId Station ID
 * @param {Function} params.callback Callback
 */
function getStation({ stationId, callback }) {
  const query = { stationId };
  const filter = { _id: 0 };

  Station.findOne(query, filter).lean().exec((err, foundStation) => {
    if (err) {
      callback({ error: new errorCreator.Database({ errorObject: err, name: 'getStation' }) });

      return;
    } else if (!foundStation) {
      callback({ error: new errorCreator.DoesNotExist({ name: `${stationId} station` }) });

      return;
    }

    callback({ data: { station: foundStation } });
  });
}

/**
 * Get all stations. Sorted on station ID
 * @param {Function} params.callback Callback
 */
function getAllStations({ callback }) {
  const query = {};
  const sort = { stationId: 1 };
  const filter = { _id: 0 };

  Station.find(query, filter).sort(sort).lean().exec((err, stations = []) => {
    if (err) {
      callback({ error: new errorCreator.Database({ errorObject: err, name: 'getAllStations' }) });

      return;
    }

    callback({ data: { stations } });
  });
}

/**
 * Create and save station
 * @param {Object} params.station New station
 * @param {Function} params.callback Callback
 */
function createStation({ station, callback }) {
  const newStation = new Station(station);
  const query = { stationId: station.stationId };

  Station.findOne(query).lean().exec((err, foundStation) => {
    if (err) {
      callback({ error: new errorCreator.Database({ errorObject: err, name: 'createStation' }) });

      return;
    } else if (foundStation) {
      callback({ error: new errorCreator.AlreadyExists({ name: `Station ${station.stationId}` }) });

      return;
    }

    databaseConnector.saveObject({
      callback,
      object: newStation,
      objectType: 'Station',
    });
  });
}

/**
 * Set new isActive on station
 * @param {Object} params.station Lantern station
 * @param {number} params.station.stationId ID of station
 * @param {boolean} [params.station.isActive] Is the station active?
 * @param {string} [params.station.stationName] Name of the station
 * @param {string} [params.station.owner] Owner name of the station
 * @param {Object} [params.attacker] Attacker
 * @param {string} params.attacker.name Name of the attacker
 * @param {Date} params.attacker.time Time when the attack succeeds
 * @param {Function} params.callback Callback
 */
function updateLanternStation({ stationId, isActive, stationName, owner, attacker, callback }) {
  const set = {};
  const unset = {};

  if (typeof isActive === 'boolean') { set.isActive = isActive; }
  if (stationName) { set.stationName = stationName; }

  if (owner) {
    set.owner = owner;
    unset.attacker.name = '';
    unset.attacker.time = '';
  } else if (attacker) {
    set.attacker = attacker;
  }

  const query = { stationId };
  const update = { $set: set, $unset: unset };
  const options = { new: true };

  Station.findOneAndUpdate(query, update, options).lean().exec((err, station) => {
    if (err) {
      callback({ error: new errorCreator.Database({ errorObject: err, name: 'updateLanternStation' }) });

      return;
    } else if (!station) {
      callback({ error: new errorCreator.DoesNotExist({ name: `${stationId} station` }) });

      return;
    }

    callback({ data: { station } });
  });
}

/**
 * Get active stations
 * @param {Function} params.callback Callback
 */
function getActiveStations({ callback }) {
  const query = { isActive: true };
  const sort = { stationId: 1 };
  const filter = { _id: 0 };

  Station.find(query, filter).sort(sort).lean().exec((err, stations = []) => {
    if (err) {
      callback({ error: new errorCreator.Database({ errorObject: err }) });

      return;
    }

    callback({ data: { stations } });
  });
}

/**
 * Update lantern hack. Create a new one if none exist
 * @param {string} params.stationId Station id assigned to hack
 * @param {string} params.owner Owner of the hack
 * @param {string} params.gameUsers Game users used in the hack
 * @param {string} params.triesLeft Amount of guesses before the hack fails
 * @param {Function} params.callback Callback
 */
function updateLanternHack({ stationId, owner, gameUsers, triesLeft, callback }) {
  const query = { owner };
  const update = { stationId, owner, gameUsers, triesLeft };
  const options = { upsert: true, new: true };

  LanternHack.findOneAndUpdate(query, update, options).lean().exec((err, updatedLanternHack) => {
    if (err) {
      callback({ error: new errorCreator.Database({ errorObject: err }) });

      return;
    } else if (!updatedLanternHack) {
      callback({ error: new errorCreator.AlreadyExists({ name: `lantern hack for ${stationId} station, owner ${owner}` }) });

      return;
    }

    callback({ data: { lanternHack: updatedLanternHack } });
  });
}

/**
 * Remove lantern hack
 * @param {string} params.owner Owner user name of hack
 * @param {Function} params.callback Callback
 */
function removeLanternHack({ owner, callback }) {
  const query = { owner };

  LanternHack.findOneAndRemove(query).lean().exec((err) => {
    if (err) {
      callback({ error: new errorCreator.Database({ errorObject: err }) });

      return;
    }

    callback({ data: { success: true } });
  });
}

/**
 * Lower amount of hack tries by 1
 * @param {string} params.owner Hack owner user name
 * @param {Function} params.callback Callback
 */
function lowerHackTries({ owner, callback }) {
  const query = { owner };
  const update = { $inc: { triesLeft: -1 } };
  const options = { new: true };

  LanternHack.findOneAndUpdate(query, update, options).lean().exec((err, lanternHack) => {
    if (err) {
      callback({ error: new errorCreator.Database({ errorObject: err }) });

      return;
    } else if (!lanternHack) {
      callback({ error: new errorCreator.AlreadyExists({ name: `lantern hack try for owner ${owner}` }) });

      return;
    }

    callback({ data: { lanternHack } });
  });
}

/**
 * Get lantern hack
 * @param {string} params.owner Owner of the hack
 * @param {Function} params.callback Callback
 */
function getLanternHack({ owner, callback }) {
  const query = { owner };

  LanternHack.findOne(query).lean().exec((err, foundHack) => {
    if (err) {
      callback({ error: new errorCreator.Database({ errorObject: err }) });

      return;
    } else if (!foundHack) {
      callback({ error: new errorCreator.DoesNotExist({ name: `get lantern hack for owner ${owner}` }) });

      return;
    }

    callback({ data: { lanternHack: foundHack } });
  });
}

/**
 * Create and save game user
 * @param {Object} params.gameUser Game user
 * @param {Function} params.callback Callback
 */
function createGameUser({ gameUser, callback }) {
  const newGameUser = new GameUser(gameUser);
  const query = { userName: gameUser.userName };

  GameUser.findOne(query).lean().exec((err, foundGameUser) => {
    if (err) {
      callback({ error: new errorCreator.Database({ errorObject: err }) });

      return;
    } else if (foundGameUser) {
      callback({ error: new errorCreator.AlreadyExists({ name: `game user ${gameUser.userName}` }) });
    }

    databaseConnector.saveObject({ object: newGameUser, objectType: 'gameUser', callback });
  });
}

/**
 * Get game user
 * @param {string} params.userName Game user to retrieve
 * @param {Function} params.callback Callback
 */
function getGameUser({ userName, callback }) {
  const query = { userName };
  const filter = { _id: 0 };

  GameUser.findOne(query, filter).lean().exec((err, foundGameUser) => {
    if (err) {
      callback({ error: new errorCreator.Database({ errorObject: err }) });

      return;
    } else if (!foundGameUser) {
      callback({ error: new errorCreator.DoesNotExist({ name: `get game user ${userName}` }) });

      return;
    }

    callback({ data: { gameUser: foundGameUser } });
  });
}

/**
 * Get all game users
 * @param {number} params.stationId Station ID
 * @param {Function} params.callback Callback
 */
function getGameUsers({ stationId, callback }) {
  const query = { stationId };
  const filter = { _id: 0 };

  GameUser.find(query, filter).lean().exec((err, gameUsers = []) => {
    if (err) {
      callback({ error: new errorCreator.Database({ errorObject: err }) });

      return;
    }

    callback({ data: { gameUsers } });
  });
}

/**
 * Create and save fake password
 * @param {Object} params.fakePassword Fake password
 * @param {Function} params.callback Callback
 */
function createFakePassword({ fakePassword, callback }) {
  const newFakePassword = new FakePassword(fakePassword);
  const query = { password: fakePassword.password };

  FakePassword.findOne(query).lean().exec((err, foundFakePassword) => {
    if (err) {
      callback({ error: new errorCreator.Database({ errorObject: err }) });

      return;
    } else if (foundFakePassword) {
      callback({ error: new errorCreator.AlreadyExists({ name: `create ${fakePassword.password}` }) });

      return;
    }

    databaseConnector.saveObject({ object: newFakePassword, objectType: 'fakePassword', callback });
  });
}

/**
 * Get all fake passwords
 * @param {Function} params.callback Callback
 */
function getAllFakePasswords({ callback }) {
  const query = {};
  const filter = { _id: 0 };

  FakePassword.find(query, filter).lean().exec((err, fakePasswords = []) => {
    if (err) {
      callback({ error: new errorCreator.Database({ errorObject: err }) });

      return;
    }

    callback({ data: { fakePasswords } });
  });
}

/**
 * Get all lantern teams
 * @param {Function} params.callback Callback
 */
function getAllTeams({ callback }) {
  const query = {};
  const filter = { _id: 0 };

  LanternTeam.find(query, filter).lean().exec((err, teams = []) => {
    if (err) {
      callback({ error: new errorCreator.Database({ errorObject: err }) });

      return;
    }

    callback({ data: { teams } });
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
exports.updateLanternTeam = updateLanternTeam;
exports.createLanternTeam = createLanternTeam;
exports.getAllTeams = getAllTeams;
