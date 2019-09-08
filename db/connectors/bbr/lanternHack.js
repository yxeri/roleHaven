/*
 Copyright 2018 Carmilla Mina Jankovic
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
const errorCreator = require('../../../error/errorCreator');
const dbConnector = require('../../databaseConnector');
const { appConfig } = require('../../../config/defaults/config');

// Access levels: Lowest / Lower / Middle / Higher / Highest / God
// 1 / 3 / 5 / 7 / 9 / 11

const lanternHackSchema = new mongoose.Schema(dbConnector.createSchema({
  stationId: Number,
  wasSuccessful: Boolean,
  owner: { type: String, unique: true },
  triesLeft: { type: Number, default: appConfig.hackingTriesAmount },
  done: { type: Boolean, default: false },
  coordinates: dbConnector.coordinatesSchema,
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
}), { collection: 'lanternHacks' });

const gameUserSchema = new mongoose.Schema(dbConnector.createSchema({
  passwords: [String],
  stationId: Number,
  userName: { type: String, unique: true },
}), { collection: 'gameUsers' });

const fakePasswordSchema = new mongoose.Schema(dbConnector.createSchema({
  passwords: { type: [String], default: [] },
}), { collection: 'fakePasswords' });

const lanternStationSchema = new mongoose.Schema(dbConnector.createSchema({
  stationId: { type: Number, unique: true },
  stationName: String,
  signalValue: { type: Number, default: 0 },
  isActive: { type: Boolean, default: false },
  owner: Number,
  isUnderAttack: { type: Boolean, default: false },
  calibrationReward: { type: Number, default: appConfig.calibrationRewardAmount },
}), { collection: 'stations' });

const lanternRoundSchema = new mongoose.Schema(dbConnector.createSchema({
  isActive: { type: Boolean, default: false },
  startTime: { type: Date, default: new Date() },
  endTime: { type: Date, default: new Date() },
}), { collection: 'lanternRounds' });

const lanternTeamSchema = new mongoose.Schema(dbConnector.createSchema({
  teamId: { type: Number, unique: true },
  teamName: { type: String, unique: true },
  shortName: { type: String, unique: true },
  points: { type: Number, default: 0 },
  isActive: { type: Boolean, default: false },
}));

const LanternHack = mongoose.model('LanternHack', lanternHackSchema);
const GameUser = mongoose.model('GameUser', gameUserSchema);
const FakePassword = mongoose.model('FakePassword', fakePasswordSchema);
const LanternStation = mongoose.model('LanternStation', lanternStationSchema);
const LanternRound = mongoose.model('Lantern', lanternRoundSchema);
const LanternTeam = mongoose.model('LanternTeam', lanternTeamSchema);

/**
 * Create lantern team.
 * @param {Object} params Parameters.
 * @param {Object} params.team New lantern team.
 * @param {Function} params.callback Callback.
 */
function createLanternTeam({
  team,
  callback,
}) {
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
    }

    if (foundTeam) {
      callback({ error: new errorCreator.AlreadyExists({ name: `Lantern team ${team.teamName} ${team.shortName}` }) });

      return;
    }

    dbConnector.saveObject({
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
 * Update lantern team.
 * @param {Object} params Parameters.
 * @param {number} [params.teamId] Id of team to get.
 * @param {boolean} [params.isActive] Is the team active?
 * @param {number} [params.points] Teams total points.
 * @param {boolean} [params.resetPoints] Resets points on team to 0.
 * @param {string} [params.teamName] Team name.
 * @param {string} [params.shortName] Short team name.
 * @param {Function} params.callback Callback.
 */
function updateLanternTeam({
  teamId,
  teamName,
  shortName,
  isActive,
  points,
  resetPoints,
  callback,
}) {
  const query = { teamId };
  const update = {};
  const options = { new: true };

  if (typeof isActive === 'boolean') {
    update.isActive = isActive;
  }

  if (teamName) {
    update.teamName = teamName;
  }

  if (shortName) {
    update.shortName = shortName;
  }

  if (typeof resetPoints === 'boolean' && resetPoints) {
    update.points = 0;
  } else if (typeof points === 'number') {
    update.points = points;
  }

  LanternTeam.findOneAndUpdate(query, update, options).lean().exec((error, team) => {
    if (error) {
      callback({ error: new errorCreator.Database({ errorObject: error, name: 'updateLanternTeam' }) });

      return;
    }

    if (!team) {
      callback({ error: new errorCreator.DoesNotExist({ name: `Team id ${teamId}. updateLanternTeam` }) });

      return;
    }

    callback({ data: { team } });
  });
}

/**
 * Update signal value on station.
 * @param {Object} params Parameters.
 * @param {number} params.stationId Station Id.
 * @param {number} params.signalValue New signal value.
 * @param {Function} params.callback Callback.
 */
function updateSignalValue({
  stationId,
  signalValue,
  callback,
}) {
  const query = { stationId };
  const update = { $set: { signalValue } };
  const options = { new: true };

  LanternStation.findOneAndUpdate(query, update, options).lean().exec((err, station) => {
    if (err) {
      callback({ error: new errorCreator.Database({ errorObject: err, name: 'updateSignalValue' }) });

      return;
    }

    if (!station) {
      callback({ error: new errorCreator.DoesNotExist({ name: `station ${stationId}` }) });

      return;
    }

    callback({ data: { station } });
  });
}

/**
 * Change times for round.
 * @param {Object} params Parameters.
 * @param {Date} params.startTime Start time.
 * @param {Date} params.endTime End time.
 * @param {Function} params.callback Callback.
 */
function updateLanternRound({
  startTime,
  endTime,
  isActive,
  callback,
}) {
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
    }

    if (!updatedRound) {
      callback({ error: new errorCreator.DoesNotExist({ name: 'active round' }) });

      return;
    }

    callback({ data: { isActive: updatedRound.isActive, startTime: updatedRound.startTime, endTime: updatedRound.endTime } });
  });
}

/**
 * Get lantern round.
 * @param {Object} params Parameters.
 * @param {Function} params.callback Callback.
 */
function getLanternRound({ callback }) {
  const query = {};

  LanternRound.findOne(query).lean().exec((err, foundRound) => {
    if (err) {
      callback({ error: new errorCreator.Database({ errorObject: err, name: 'getLanternRound' }) });

      return;
    }

    if (!foundRound) {
      callback({ error: new errorCreator.DoesNotExist({ name: 'round does not exist' }) });

      return;
    }

    const {
      isActive,
      startTime,
      endTime,
    } = foundRound;

    callback({
      data: {
        isActive,
        startTime,
        endTime,
      },
    });
  });
}

/**
 * Get station.
 * @param {Object} params Parameters.
 * @param {number} params.stationId Station Id.
 * @param {Function} params.callback Callback.
 */
function getStation({
  stationId,
  callback,
}) {
  const query = { stationId };

  LanternStation.findOne(query).lean().exec((err, foundStation) => {
    if (err) {
      callback({ error: new errorCreator.Database({ errorObject: err, name: 'getStation' }) });

      return;
    }

    if (!foundStation) {
      callback({ error: new errorCreator.DoesNotExist({ name: `${stationId} station` }) });

      return;
    }

    callback({ data: { station: foundStation } });
  });
}

/**
 * Get all stations. Sorted on station Id.
 * @param {Object} params Parameters.
 * @param {Function} params.callback Callback.
 */
function getAllStations({ callback }) {
  const query = {};
  const sort = { stationId: 1 };

  LanternStation.find(query).sort(sort).lean().exec((err, stations = []) => {
    if (err) {
      callback({ error: new errorCreator.Database({ errorObject: err, name: 'getAllStations' }) });

      return;
    }

    callback({ data: { stations } });
  });
}

/**
 * Create and save station.
 * @param {Object} params Parameters.
 * @param {Object} params.station New station.
 * @param {Function} params.callback Callback.
 */
function createStation({
  station,
  callback,
}) {
  const newStation = new LanternStation(station);
  const query = { stationId: station.stationId };

  LanternStation.findOne(query).lean().exec((err, foundStation) => {
    if (err) {
      callback({ error: new errorCreator.Database({ errorObject: err, name: 'createStation' }) });

      return;
    }

    if (foundStation) {
      callback({ error: new errorCreator.AlreadyExists({ name: `Station ${station.stationId}` }) });

      return;
    }

    dbConnector.saveObject({
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
 * Set all lantern station to value.
 * @param {Object} params Parameters.
 * @param {number} params.signalValue New value.
 * @param {Function} params.callback Callback.
 */
function resetLanternStations({
  signalValue,
  callback,
}) {
  const query = {};
  const update = { $set: { signalValue } };
  const options = { multi: true };

  LanternStation.update(query, update, options).lean().exec((error, data) => {
    if (error) {
      callback({ error });

      return;
    }

    callback({ data });
  });
}

/**
 * Set new isActive on station.
 * @param {Object} params Parameters.
 * @param {number} params.stationId Id of station.
 * @param {boolean} [params.isActive] Is the station active?
 * @param {string} [params.stationName] Name of the station.
 * @param {number} [params.resetOwner] Remove owner and set isUnderAttack to false.
 * @param {number} [params.owner] Team Id of the owner.
 * @param {Object} [params.isUnderAttack] Is the station under attack?
 * @param {number} [params.calibrationReward] Amount of digital currency that will be sent to user when they complete mission with this stations Id.
 * @param {Function} params.callback Callback.
 */
function updateLanternStation({
  resetOwner,
  stationId,
  isActive,
  stationName,
  owner,
  isUnderAttack,
  calibrationReward,
  callback,
}) {
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

  LanternStation.findOneAndUpdate(query, update, options).lean().exec((err, station) => {
    if (err) {
      callback({ error: new errorCreator.Database({ errorObject: err, name: 'updateLanternStation' }) });

      return;
    }

    if (!station) {
      callback({ error: new errorCreator.DoesNotExist({ name: `${stationId} station` }) });

      return;
    }

    callback({ data: { station } });
  });
}

/**
 * Get active stations.
 * @param {Object} params Parameters.
 * @param {Function} params.callback Callback.
 */
function getActiveStations({ callback }) {
  const query = { isActive: true };
  const sort = { stationId: 1 };

  LanternStation.find(query).sort(sort).lean().exec((err, stations = []) => {
    if (err) {
      callback({ error: new errorCreator.Database({ errorObject: err }) });

      return;
    }

    callback({ data: { stations } });
  });
}

/**
 * Update lantern hack. Create a new one if none exist.
 * @param {Object} params Parameters.
 * @param {string} params.stationId Station id assigned to hack.
 * @param {string} params.owner Owner of the hack.
 * @param {string} params.gameUsers Game users used in the hack.
 * @param {string} params.triesLeft Amount of guesses before the hack fails.
 * @param {Function} params.callback Callback.
 */
function updateLanternHack({
  stationId,
  owner,
  gameUsers,
  triesLeft,
  callback,
}) {
  const query = { owner };
  const update = {
    stationId,
    owner,
    gameUsers,
    triesLeft,
    done: false,
  };
  const options = {
    upsert: true,
    new: true,
  };

  LanternHack.findOneAndUpdate(query, update, options).lean().exec((err, updatedLanternHack) => {
    if (err) {
      callback({ error: new errorCreator.Database({ errorObject: err }) });

      return;
    }

    if (!updatedLanternHack) {
      callback({ error: new errorCreator.AlreadyExists({ name: `lantern hack for ${stationId} station, owner ${owner}` }) });

      return;
    }

    callback({ data: { lanternHack: updatedLanternHack } });
  });
}

/**
 * Lower amount of hack tries by 1.
 * @param {Object} params Parameters.
 * @param {string} params.owner Hack owner user Id.
 * @param {Function} params.callback Callback.
 */
function lowerHackTries({
  owner,
  callback,
}) {
  const query = {
    owner,
    done: false,
  };
  const update = { $inc: { triesLeft: -1 } };
  const options = { new: true };

  LanternHack.findOneAndUpdate(query, update, options).lean().exec((err, lanternHack) => {
    if (err) {
      callback({ error: new errorCreator.Database({ errorObject: err }) });

      return;
    }

    if (!lanternHack) {
      callback({ error: new errorCreator.AlreadyExists({ name: `lantern hack try for owner ${owner}` }) });

      return;
    }

    callback({ data: { lanternHack } });
  });
}

/**
 * Get lantern hack.
 * @param {Object} params Parameters.
 * @param {string} params.owner Owner of the hack.
 * @param {Function} params.callback Callback
 */
function getLanternHack({
  owner,
  callback,
}) {
  const query = { owner };

  LanternHack.findOne(query).lean().exec((err, foundHack) => {
    if (err) {
      callback({ error: new errorCreator.Database({ errorObject: err }) });

      return;
    }

    if (!foundHack) {
      callback({ error: new errorCreator.DoesNotExist({ name: `get lantern hack for owner ${owner}` }) });

      return;
    }

    callback({ data: { lanternHack: foundHack } });
  });
}

/**
 * Create and save game users.
 * @param {Object} params Parameters.
 * @param {Object} params.gameUsers Game users.
 */
function createGameUsers({ gameUsers = [] }) {
  gameUsers.forEach((gameUser) => {
    const newGameUser = new GameUser(gameUser);
    const query = { userName: gameUser.userName };

    GameUser.findOne(query).lean().exec((err, foundGameUser) => {
      if (err || foundGameUser) {
        return;
      }

      dbConnector.saveObject({
        object: newGameUser,
        objectType: 'gameUser',
        callback: () => {},
      });
    });
  });
}

/**
 * Get all game users.
 * @param {Object} params Parameters.
 * @param {Function} params.callback Callback.
 */
function getGameUsers({ callback }) {
  const query = {};

  GameUser.find(query).lean().exec((err, gameUsers = []) => {
    if (err) {
      callback({ error: new errorCreator.Database({ errorObject: err }) });

      return;
    }

    callback({ data: { gameUsers } });
  });
}

/**
 * Add new fake passwords. Duplicates will be ignored.
 * @param {Object} params Parameters.
 * @param {Object} params.passwords Fake passwords to add.
 * @param {Function} params.callback Callback.
 */
function addFakePasswords({
  passwords,
  callback,
}) {
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
 * Get all fake passwords.
 * @param {Object} params Parameters.
 * @param {Function} params.callback Callback.
 */
function getAllFakePasswords({ callback }) {
  const query = {};

  FakePassword.findOne(query).lean().exec((err, passwordData) => {
    if (err) {
      callback({ error: new errorCreator.Database({ errorObject: err }) });

      return;
    }

    callback({ data: { passwords: passwordData.passwords } });
  });
}

/**
 * Get all lantern teams.
 * @param {Object} params Parameters.
 * @param {Function} params.callback Callback.
 */
function getTeams({ callback }) {
  const query = {};

  LanternTeam.find(query).lean().exec((err, teams = []) => {
    if (err) {
      callback({ error: new errorCreator.Database({ errorObject: err }) });

      return;
    }

    callback({ data: { teams } });
  });
}

/**
 * Delete station.
 * @param {Object} params Parameters.
 * @param {number} params.stationId Id of station to delete.
 * @param {Function} params.callback Callback.
 */
function deleteStation({
  stationId,
  callback,
}) {
  const query = { stationId };

  LanternStation.remove(query).lean().exec((error) => {
    if (error) {
      callback({ error });

      return;
    }

    callback({ data: { success: true } });
  });
}

/**
 * Delete team.
 * @param {Object} params Parameters.
 * @param {number} params.teamId Id of team to delete.
 * @param {Function} params.callback Callback.
 */
function deleteTeam({
  teamId,
  callback,
}) {
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
 * Create first round.
 * @param {Function} callback Callback.
 */
function createFirstRound(callback) {
  const newRound = new LanternRound({});
  const query = {};

  LanternRound.findOne(query).lean().exec((error, data) => {
    if (error) {
      callback({ error });
    } else if (!data) {
      dbConnector.saveObject({ object: newRound, objectType: 'lanternRound', callback });
    } else {
      callback({ data: { exists: true } });
    }
  });
}

/**
 * Create fake passsword container.
 * @param {Function} callback Callback
 */
function createFakePasswordsContainer(callback) {
  const newFakePasswords = new FakePassword({});
  const query = {};

  FakePassword.findOne(query).lean().exec((error, data) => {
    if (error) {
      callback({ error });
    } else if (!data) {
      dbConnector.saveObject({ object: newFakePasswords, objectType: 'fakePasswords', callback });
    } else {
      callback({ data: { exists: true } });
    }
  });
}

/**
 * Get lantern stations, round and teams.
 * @param {Object} params Parameters.
 * @param {Function} params.callback Callback.
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

      LanternStation.find({}).lean().exec((stationError, stations) => {
        if (stationError) {
          callback({ error: stationError });

          return;
        }

        callback({ data: { lanternStats: { round, teams, stations } } });
      });
    });
  });
}

/**
 * Set hack to done.
 * @param {Object} params Parameters.
 * @param {Function} params.callback Callback.
 * @param {boolean} params.wasSuccessful Was the hack successful?
 */
function setDone({
  callback,
  owner,
  coordinates,
  wasSuccessful = false,
}) {
  const query = {
    owner,
    done: false,
  };
  const update = {
    wasSuccessful,
    done: true,
  };
  const options = { new: true };

  if (coordinates) { update.coordinates = coordinates; }

  LanternHack.findOneAndUpdate(query, update, options).lean().exec((err, lanternHack) => {
    if (err) {
      callback({ error: new errorCreator.Database({ errorObject: err }) });

      return;
    }

    if (!lanternHack) {
      callback({ error: new errorCreator.AlreadyExists({ name: `lantern hack done for owner ${owner}` }) });

      return;
    }

    callback({ data: { lanternHack } });
  });
}

createFirstRound(({ error, data }) => {
  if (error) {
    console.log('Failed to create first round');

    return;
  }

  console.log('Created ', data);
});

createFakePasswordsContainer(({ error, data }) => {
  if (error) {
    console.log('Failed to create fake password container');

    return;
  }

  console.log('Created ', data);
});

exports.createGameUsers = createGameUsers;
exports.getGameUsers = getGameUsers;
exports.addFakePasswords = addFakePasswords;
exports.getAllFakePasswords = getAllFakePasswords;
exports.updateLanternHack = updateLanternHack;
exports.getLanternHack = getLanternHack;
exports.lowerHackTries = lowerHackTries;
exports.updateSignalValue = updateSignalValue;
exports.getStation = getStation;
exports.getAllStations = getAllStations;
exports.createStation = createStation;
exports.updateLanternStation = updateLanternStation;
exports.getActiveStations = getActiveStations;
exports.getLanternRound = getLanternRound;
exports.updateLanternTeam = updateLanternTeam;
exports.createLanternTeam = createLanternTeam;
exports.getTeams = getTeams;
exports.updateLanternRound = updateLanternRound;
exports.createFirstRound = createFirstRound;
exports.createFakePasswordContainer = createFakePasswordsContainer;
exports.resetLanternStations = resetLanternStations;
exports.deleteTeam = deleteTeam;
exports.getLanternStats = getLanternStats;
exports.deleteStation = deleteStation;
exports.setDone = setDone;
