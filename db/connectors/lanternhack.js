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
const winston = require('winston');
const appConfig = require('../../config/defaults/config').app;

// Access levels: Lowest / Lower / Middle / Higher / Highest / God
// 1 / 3 / 5 / 7 / 9 / 11

const lanternHackSchema = new mongoose.Schema({
  owner: { type: String, unique: true },
  triesLeft: { type: Number, default: appConfig.hackingTriesAmount },
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
  passwords: { type: [String], default: [] },
}, { collection: 'fakePasswords' });
const stationSchema = new mongoose.Schema({
  stationId: { type: Number, unique: true },
  stationName: String,
  signalValue: { type: Number, default: 0 },
  isActive: { type: Boolean, default: false },
  owner: Number,
  isUnderAttack: { type: Boolean, default: false },
  calibrationReward: { type: Number, default: appConfig.calibrationRewardAmount },
}, { collection: 'stations' });
const lanternRoundSchema = new mongoose.Schema({
  isActive: { type: Boolean, default: false },
  startTime: { type: Date, default: new Date() },
  endTime: { type: Date, default: new Date() },
}, { collection: 'lanternRounds' });
const lanternTeamSchema = new mongoose.Schema({
  teamId: { type: Number, unique: true },
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
      { teamId: team.teamId },
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
      callback: (saveData) => {
        if (saveData.error) {
          callback({ error: saveData.error });

          return;
        }

        callback({ data: { team: saveData.data.savedObject } });
      },
    });
  });
}

/**
 * Update lantern team
 * @param {number} [params.teamId] Id of team to get
 * @param {boolean} [params.isActive] Is the team active?
 * @param {number} [params.points] Teams total points
 * @param {boolean} [params.resetPoints] Resets points on team to 0
 * @param {string} [params.teamName] Team name
 * @param {string} [params.shortName] Short team name
 * @param {Function} params.callback Callback
 */
function updateLanternTeam({ teamId, teamName, shortName, isActive, points, resetPoints, callback }) {
  const query = { teamId };
  const update = {};
  const options = { new: true };

  if (typeof isActive === 'boolean') { update.isActive = isActive; }
  if (teamName) { update.teamName = teamName; }
  if (shortName) { update.shortName = shortName; }

  if (typeof resetPoints === 'boolean' && resetPoints) {
    update.points = 0;
  } else if (typeof points === 'number') {
    update.points = points;
  }

  LanternTeam.findOneAndUpdate(query, update, options).lean().exec((error, team) => {
    if (error) {
      callback({ error: new errorCreator.Database({ errorObject: error, name: 'updateLanternTeam' }) });

      return;
    } else if (!team) {
      callback({ error: new errorCreator.DoesNotExist({ name: `Team id ${teamId}. updateLanternTeam` }) });

      return;
    }

    callback({ data: { team } });
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
 * Change times for round
 * @param {Date} params.startTime Start time
 * @param {Date} params.endTime End time
 * @param {Function} params.callback Callback
 */
function updateLanternRound({ startTime, endTime, isActive, callback }) {
  const query = {};
  const update = { $set: {} };
  const options = { new: true };

  if (startTime) {
    update.$set.startTime = startTime;
  }

  if (endTime) {
    update.$set.endTime = endTime;
  }

  if (typeof isActive !== 'undefined') {
    update.$set.isActive = isActive;
  }


  LanternRound.findOneAndUpdate(query, update, options).lean().exec((err, updatedRound) => {
    if (err) {
      callback({ error: new errorCreator.Database({ errorObject: err, name: 'startLanternRound' }) });

      return;
    } else if (!updatedRound) {
      callback({ error: new errorCreator.DoesNotExist({ name: 'active round' }) });

      return;
    }

    callback({ data: { isActive: updatedRound.isActive, startTime: updatedRound.startTime, endTime: updatedRound.endTime } });
  });
}

/**
 * Start lantern round
 * @param {number} params.roundId ID of the round
 * @param {Function} params.callback Callback
 */
function startLanternRound({ endTime, callback }) {
  const query = {};
  const update = { $set: { isActive: true } };
  const options = { new: true };

  if (endTime) {
    update.$set.endTime = endTime;
  }

  LanternRound.findOneAndUpdate(query, update, options).lean().exec((err, updatedRound) => {
    if (err) {
      callback({ error: new errorCreator.Database({ errorObject: err, name: 'startLanternRound' }) });

      return;
    } else if (!updatedRound) {
      callback({ error: new errorCreator.DoesNotExist({ name: 'active round' }) });

      return;
    }

    callback({ data: { isActive: updatedRound.isActive, startTime: updatedRound.startTime, endTime: updatedRound.endTime } });
  });
}

/**
 * End lantern round
 * @param {Date} params.startTime Start time of next round
 * @param {Function} params.callback Callback
 */
function endLanternRound({ startTime, callback }) {
  const query = {};
  const update = { $set: { isActive: false } };
  const options = { new: true };

  if (startTime) {
    update.$set.startTime = startTime;
  }

  LanternRound.findOneAndUpdate(query, update, options).lean().exec((err, updatedRound) => {
    if (err) {
      callback({ error: new errorCreator.Database({ errorObject: err, name: 'endLanternRound' }) });

      return;
    } else if (!updatedRound) {
      callback({ error: new errorCreator.DoesNotExist({ name: 'active round' }) });

      return;
    }

    callback({ data: { isActive: updatedRound.isActive, startTime: updatedRound.startTime, endTime: updatedRound.endTime } });
  });
}

/**
 * Get lantern round
 * @param {number} params.roundId Lantern round Id
 * @param {Function} params.callback Callback
 */
function getLanternRound({ callback }) {
  const query = {};
  const filter = { _id: 0 };

  LanternRound.findOne(query, filter).lean().exec((err, foundRound) => {
    if (err) {
      callback({ error: new errorCreator.Database({ errorObject: err, name: 'getLanternRound' }) });

      return;
    } else if (!foundRound) {
      callback({ error: new errorCreator.DoesNotExist({ name: 'round does not exist' }) });

      return;
    }

    callback({ data: { isActive: foundRound.isActive, startTime: foundRound.startTime, endTime: foundRound.endTime } });
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
      object: newStation,
      objectType: 'Station',
      callback: ({ error, data }) => {
        if (error) {
          callback({ error });

          return;
        }

        callback({ data: { station: data.savedObject } });
      },
    });
  });
}

/**
 * Set all lantern station to value
 * @param {number} params.signalValue New value
 * @param {Function} params.callback Callback
 */
function resetLanternStations({ signalValue, callback }) {
  const query = {};
  const update = { $set: { signalValue } };
  const options = { multi: true };

  Station.update(query, update, options).lean().exec((error, data) => {
    if (error) {
      callback({ error });

      return;
    }

    callback({ data });
  });
}

/**
 * Set new isActive on station
 * @param {Object} params.station Lantern station
 * @param {number} params.station.stationId ID of station
 * @param {boolean} [params.station.isActive] Is the station active?
 * @param {string} [params.station.stationName] Name of the station
 * @param {number} [params.station.resetOwner] Remove owner and set isUnderAttack to false
 * @param {number} [params.station.owner] Team id of the owner
 * @param {Object} [params.isUnderAttack] Is the station under attack?
 * @param {number} [params.calibrationReward] Amount of digital currency that will be sent to user when they complete mission with this stations ID
 * @param {Function} params.callback Callback
 */
function updateLanternStation({ resetOwner, stationId, isActive, stationName, owner, isUnderAttack, calibrationReward, callback }) {
  const query = { stationId };
  const update = {};
  const options = { new: true };
  const set = {};
  const unset = {};

  if (typeof isActive === 'boolean') { set.isActive = isActive; }
  if (stationName) { set.stationName = stationName; }
  if (calibrationReward) { set.calibrationReward = calibrationReward; }

  if (resetOwner || (owner && owner === -1)) {
    unset.owner = '';
    set.isUnderAttack = false;
  } else if (owner) {
    set.owner = owner;
    set.isUnderAttack = false;
  } else if (isUnderAttack) {
    set.isUnderAttack = isUnderAttack;
  }

  if (Object.keys(set).length > 0) { update.$set = set; }
  if (Object.keys(unset).length > 0) { update.$unset = unset; }

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
 * Create and save game users
 * @param {Object} params.gameUsers Game users
 * @param {Function} params.callback Callback
 */
function createGameUsers({ gameUsers = [] }) {
  gameUsers.forEach((gameUser) => {
    const newGameUser = new GameUser(gameUser);
    const query = { userName: gameUser.userName };

    GameUser.findOne(query).lean().exec((err, foundGameUser) => {
      if (err || foundGameUser) {
        return;
      }

      databaseConnector.saveObject({ object: newGameUser, objectType: 'gameUser', callback: () => {} });
    });
  });
}

/**
 * Get all game users
 * @param {Function} params.callback Callback
 */
function getGameUsers({ callback }) {
  const query = {};
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
 * Add new fake passwords. Duplicates will be ignored
 * @param {Object} params.fakePasswords Fake passwords to add
 * @param {Function} params.callback Callback
 */
function addFakePasswords({ passwords, callback }) {
  const query = {};
  const update = { $addToSet: { passwords: { $each: passwords } } };
  const options = { new: true };

  FakePassword.findOneAndUpdate(query, update, options).lean().exec((err, passwordData) => {
    if (err) {
      callback({ error: new errorCreator.Database({ errorObject: err }) });

      return;
    }

    callback({ data: { passwords: passwordData.passwords } });
  });
}

/**
 * Get all fake passwords
 * @param {Function} params.callback Callback
 */
function getAllFakePasswords({ callback }) {
  const query = {};
  const filter = { _id: 0 };

  FakePassword.findOne(query, filter).lean().exec((err, passwordData) => {
    if (err) {
      callback({ error: new errorCreator.Database({ errorObject: err }) });

      return;
    }

    callback({ data: { passwords: passwordData.passwords } });
  });
}

/**
 * Get all lantern teams
 * @param {Function} params.callback Callback
 */
function getTeams({ callback }) {
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

/**
 * Delete station
 * @param {number} params.stationId ID of station to delete
 * @param {Function} params.callback Callback
 */
function deleteStation({ stationId, callback }) {
  const query = { stationId };

  Station.remove(query).lean().exec((error) => {
    if (error) {
      callback({ error });

      return;
    }

    callback({ data: { success: true } });
  });
}

/**
 * Delete team
 * @param {number} params.teamId ID of team to delete
 * @param {Function} params.callback Callback
 */
function deleteTeam({ teamId, callback }) {
  const query = { teamId };

  LanternTeam.remove(query).lean().exec((error) => {
    if (error) {
      callback({ error });

      return;
    }

    callback({ data: { success: true } });
  });
}

/**
 * Create first round
 * @param {Function} callback Callback
 */
function createFirstRound(callback) {
  const newRound = new LanternRound({});
  const query = {};

  LanternRound.findOne(query).lean().exec((error, data) => {
    if (error) {
      callback({ error });
    } else if (!data) {
      databaseConnector.saveObject({ object: newRound, objectType: 'lanternRound', callback });
    } else {
      callback({ data: { exists: true } });
    }
  });
}

/**
 * Create fake passsword container
 * @param {Function} callback Callback
 */
function createFakePasswordsContainer(callback) {
  const newFakePasswords = new FakePassword({});
  const query = {};

  FakePassword.findOne(query).lean().exec((error, data) => {
    if (error) {
      callback({ error });
    } else if (!data) {
      databaseConnector.saveObject({ object: newFakePasswords, objectType: 'fakePasswords', callback });
    } else {
      callback({ data: { exists: true } });
    }
  });
}

/**
 * Get lantern stations, round and teams
 * @param {Function} params.callback Callback
 */
function getLanternStats({ callback }) {
  LanternRound.findOne({}).lean().exec((roundError, round) => {
    if (roundError) {
      callback({ error: roundError });

      return;
    }

    LanternTeam.find({}).lean().exec((teamError, teams) => {
      if (teamError) {
        callback({ error: teamError });

        return;
      }

      Station.find({}).lean().exec((stationError, stations) => {
        if (stationError) {
          callback({ error: stationError });

          return;
        }

        callback({ data: { lanternStats: { round, teams, stations } } });
      });
    });
  });
}

createFirstRound(({ error, data }) => {
  if (error) {
    winston.log('Failed to create first round');

    return;
  }

  winston.log('Created ', data);
});

createFakePasswordsContainer(({ error, data }) => {
  if (error) {
    winston.log('Failed to create fake password container');

    return;
  }

  winston.log('Created ', data);
});

exports.createGameUsers = createGameUsers;
exports.getGameUsers = getGameUsers;
exports.addFakePasswords = addFakePasswords;
exports.getAllFakePasswords = getAllFakePasswords;
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
exports.getLanternRound = getLanternRound;
exports.startLanternRound = startLanternRound;
exports.endLanternRound = endLanternRound;
exports.updateLanternTeam = updateLanternTeam;
exports.createLanternTeam = createLanternTeam;
exports.getTeams = getTeams;
exports.updateLanternRound = updateLanternRound;
exports.createFirstRound = createFirstRound;
exports.createfakePasswordContainer = createFakePasswordsContainer;
exports.resetLanternStations = resetLanternStations;
exports.deleteTeam = deleteTeam;
exports.getLanternStats = getLanternStats;
exports.deleteStation = deleteStation;
