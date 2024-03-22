'use strict';
import mongoose from 'mongoose';
import { appConfig } from '../../../config/defaults/config';
import errorCreator from '../../../error/errorCreator';
import dbConnector from '../../databaseConnector';
const lanternHackSchema = new mongoose.Schema(dbConnector.createSchema({
    stationId: Number,
    wasSuccessful: Boolean,
    owner: {
        type: String,
        unique: true,
    },
    triesLeft: {
        type: Number,
        default: appConfig.hackingTriesAmount,
    },
    done: {
        type: Boolean,
        default: false,
    },
    coordinates: dbConnector.coordinatesSchema,
    gameUsers: [{
            userName: String,
            password: String,
            isCorrect: {
                type: Boolean,
                default: false,
            },
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
    userName: {
        type: String,
        unique: true,
    },
}), { collection: 'gameUsers' });
const fakePasswordSchema = new mongoose.Schema(dbConnector.createSchema({
    passwords: {
        type: [String],
        default: [],
    },
}), { collection: 'fakePasswords' });
const lanternStationSchema = new mongoose.Schema(dbConnector.createSchema({
    stationId: {
        type: Number,
        unique: true,
    },
    stationName: String,
    signalValue: {
        type: Number,
        default: 0,
    },
    isActive: {
        type: Boolean,
        default: false,
    },
    owner: Number,
    isUnderAttack: {
        type: Boolean,
        default: false,
    },
    calibrationReward: {
        type: Number,
        default: appConfig.calibrationRewardAmount,
    },
}), { collection: 'stations' });
const lanternRoundSchema = new mongoose.Schema(dbConnector.createSchema({
    isActive: {
        type: Boolean,
        default: false,
    },
    startTime: {
        type: Date,
        default: new Date(),
    },
    endTime: {
        type: Date,
        default: new Date(),
    },
}), { collection: 'lanternRounds' });
const lanternTeamSchema = new mongoose.Schema(dbConnector.createSchema({
    teamId: {
        type: Number,
        unique: true,
    },
    teamName: {
        type: String,
        unique: true,
    },
    shortName: {
        type: String,
        unique: true,
    },
    points: {
        type: Number,
        default: 0,
    },
    isActive: {
        type: Boolean,
        default: false,
    },
}));
const LanternHack = mongoose.model('LanternHack', lanternHackSchema);
const GameUser = mongoose.model('GameUser', gameUserSchema);
const FakePassword = mongoose.model('FakePassword', fakePasswordSchema);
const LanternStation = mongoose.model('LanternStation', lanternStationSchema);
const LanternRound = mongoose.model('Lantern', lanternRoundSchema);
const LanternTeam = mongoose.model('LanternTeam', lanternTeamSchema);
function createLanternTeam({ team, callback, }) {
    const newLanternTeam = new LanternTeam(team);
    const query = {
        $or: [
            { teamId: team.teamId },
            { teamName: team.teamName },
            { shortName: team.shortName },
        ],
    };
    LanternTeam.findOne(query)
        .lean()
        .exec((err, foundTeam) => {
        if (err) {
            callback({
                error: new errorCreator.Database({
                    errorObject: err,
                    name: 'createLanternTeam',
                }),
            });
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
function updateLanternTeam({ teamId, teamName, shortName, isActive, points, resetPoints, callback, }) {
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
    }
    else if (typeof points === 'number') {
        update.points = points;
    }
    LanternTeam.findOneAndUpdate(query, update, options)
        .lean()
        .exec((error, team) => {
        if (error) {
            callback({
                error: new errorCreator.Database({
                    errorObject: error,
                    name: 'updateLanternTeam',
                }),
            });
            return;
        }
        if (!team) {
            callback({ error: new errorCreator.DoesNotExist({ name: `Team id ${teamId}. updateLanternTeam` }) });
            return;
        }
        callback({ data: { team } });
    });
}
function updateSignalValue({ stationId, signalValue, callback, }) {
    const query = { stationId };
    const update = { $set: { signalValue } };
    const options = { new: true };
    LanternStation.findOneAndUpdate(query, update, options)
        .lean()
        .exec((err, station) => {
        if (err) {
            callback({
                error: new errorCreator.Database({
                    errorObject: err,
                    name: 'updateSignalValue',
                }),
            });
            return;
        }
        if (!station) {
            callback({ error: new errorCreator.DoesNotExist({ name: `station ${stationId}` }) });
            return;
        }
        callback({ data: { station } });
    });
}
function updateLanternRound({ startTime, endTime, isActive, callback, }) {
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
    LanternRound.findOneAndUpdate(query, update, options)
        .lean()
        .exec((err, updatedRound) => {
        if (err) {
            callback({
                error: new errorCreator.Database({
                    errorObject: err,
                    name: 'startLanternRound',
                }),
            });
            return;
        }
        if (!updatedRound) {
            callback({ error: new errorCreator.DoesNotExist({ name: 'active round' }) });
            return;
        }
        callback({
            data: {
                isActive: updatedRound.isActive,
                startTime: updatedRound.startTime,
                endTime: updatedRound.endTime,
            },
        });
    });
}
function getLanternRound({ callback }) {
    const query = {};
    LanternRound.findOne(query)
        .lean()
        .exec((err, foundRound) => {
        if (err) {
            callback({
                error: new errorCreator.Database({
                    errorObject: err,
                    name: 'getLanternRound',
                }),
            });
            return;
        }
        if (!foundRound) {
            callback({ error: new errorCreator.DoesNotExist({ name: 'round does not exist' }) });
            return;
        }
        const { isActive, startTime, endTime, } = foundRound;
        callback({
            data: {
                isActive,
                startTime,
                endTime,
            },
        });
    });
}
function getStation({ stationId, callback, }) {
    const query = { stationId };
    LanternStation.findOne(query)
        .lean()
        .exec((err, foundStation) => {
        if (err) {
            callback({
                error: new errorCreator.Database({
                    errorObject: err,
                    name: 'getStation',
                }),
            });
            return;
        }
        if (!foundStation) {
            callback({ error: new errorCreator.DoesNotExist({ name: `${stationId} station` }) });
            return;
        }
        callback({ data: { station: foundStation } });
    });
}
function getAllStations({ callback }) {
    const query = {};
    const sort = { stationId: 1 };
    LanternStation.find(query)
        .sort(sort)
        .lean()
        .exec((err, stations = []) => {
        if (err) {
            callback({
                error: new errorCreator.Database({
                    errorObject: err,
                    name: 'getAllStations',
                }),
            });
            return;
        }
        callback({ data: { stations } });
    });
}
function createStation({ station, callback, }) {
    const newStation = new LanternStation(station);
    const query = { stationId: station.stationId };
    LanternStation.findOne(query)
        .lean()
        .exec((err, foundStation) => {
        if (err) {
            callback({
                error: new errorCreator.Database({
                    errorObject: err,
                    name: 'createStation',
                }),
            });
            return;
        }
        if (foundStation) {
            callback({ error: new errorCreator.AlreadyExists({ name: `Station ${station.stationId}` }) });
            return;
        }
        dbConnector.saveObject({
            object: newStation,
            objectType: 'Station',
            callback: ({ error, data, }) => {
                if (error) {
                    callback({ error });
                    return;
                }
                callback({ data: { station: data.savedObject } });
            },
        });
    });
}
function resetLanternStations({ signalValue, callback, }) {
    const query = {};
    const update = { $set: { signalValue } };
    const options = { multi: true };
    LanternStation.update(query, update, options)
        .lean()
        .exec((error, data) => {
        if (error) {
            callback({ error });
            return;
        }
        callback({ data });
    });
}
function updateLanternStation({ resetOwner, stationId, isActive, stationName, owner, isUnderAttack, calibrationReward, callback, }) {
    const query = { stationId };
    const update = {};
    const options = { new: true };
    const set = {};
    const unset = {};
    if (typeof isActive === 'boolean') {
        set.isActive = isActive;
    }
    if (stationName) {
        set.stationName = stationName;
    }
    if (calibrationReward) {
        set.calibrationReward = calibrationReward;
    }
    if (resetOwner || (owner && owner === -1)) {
        unset.owner = '';
        set.isUnderAttack = false;
    }
    else if (owner) {
        set.owner = owner;
        set.isUnderAttack = false;
    }
    else if (isUnderAttack) {
        set.isUnderAttack = isUnderAttack;
    }
    if (Object.keys(set).length > 0) {
        update.$set = set;
    }
    if (Object.keys(unset).length > 0) {
        update.$unset = unset;
    }
    LanternStation.findOneAndUpdate(query, update, options)
        .lean()
        .exec((err, station) => {
        if (err) {
            callback({
                error: new errorCreator.Database({
                    errorObject: err,
                    name: 'updateLanternStation',
                }),
            });
            return;
        }
        if (!station) {
            callback({ error: new errorCreator.DoesNotExist({ name: `${stationId} station` }) });
            return;
        }
        callback({ data: { station } });
    });
}
function getActiveStations({ callback }) {
    const query = { isActive: true };
    const sort = { stationId: 1 };
    LanternStation.find(query)
        .sort(sort)
        .lean()
        .exec((err, stations = []) => {
        if (err) {
            callback({ error: new errorCreator.Database({ errorObject: err }) });
            return;
        }
        callback({ data: { stations } });
    });
}
function updateLanternHack({ stationId, owner, gameUsers, triesLeft, callback, }) {
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
    LanternHack.findOneAndUpdate(query, update, options)
        .lean()
        .exec((err, updatedLanternHack) => {
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
function lowerHackTries({ owner, callback, }) {
    const query = {
        owner,
        done: false,
    };
    const update = { $inc: { triesLeft: -1 } };
    const options = { new: true };
    LanternHack.findOneAndUpdate(query, update, options)
        .lean()
        .exec((err, lanternHack) => {
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
function getLanternHack({ owner, stationId, done, callback, }) {
    const query = {
        stationId,
        owner,
    };
    if (typeof done === 'boolean') {
        query.done = done;
    }
    LanternHack.findOne(query)
        .lean()
        .exec((err, foundHack) => {
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
function createGameUsers({ gameUsers = [] }) {
    gameUsers.forEach((gameUser) => {
        const newGameUser = new GameUser(gameUser);
        const query = { userName: gameUser.userName };
        GameUser.findOne(query)
            .lean()
            .exec((err, foundGameUser) => {
            if (err || foundGameUser) {
                return;
            }
            dbConnector.saveObject({
                object: newGameUser,
                objectType: 'gameUser',
                callback: () => {
                },
            });
        });
    });
}
function getGameUsers({ callback }) {
    const query = {};
    GameUser.find(query)
        .lean()
        .exec((err, gameUsers = []) => {
        if (err) {
            callback({ error: new errorCreator.Database({ errorObject: err }) });
            return;
        }
        callback({ data: { gameUsers } });
    });
}
function addFakePasswords({ passwords, callback, }) {
    const query = {};
    const update = { $addToSet: { passwords: { $each: passwords } } };
    const options = { new: true };
    FakePassword.findOneAndUpdate(query, update, options)
        .lean()
        .exec((err, passwordData) => {
        if (err) {
            callback({ error: new errorCreator.Database({ errorObject: err }) });
            return;
        }
        callback({ data: { passwords: passwordData.passwords } });
    });
}
function getAllFakePasswords({ callback }) {
    const query = {};
    FakePassword.findOne(query)
        .lean()
        .exec((err, passwordData) => {
        if (err) {
            callback({ error: new errorCreator.Database({ errorObject: err }) });
            return;
        }
        callback({ data: { passwords: passwordData.passwords } });
    });
}
function getTeams({ callback }) {
    const query = {};
    LanternTeam.find(query)
        .lean()
        .exec((err, teams = []) => {
        if (err) {
            callback({ error: new errorCreator.Database({ errorObject: err }) });
            return;
        }
        callback({ data: { teams } });
    });
}
function deleteStation({ stationId, callback, }) {
    const query = { stationId };
    LanternStation.remove(query)
        .lean()
        .exec((error) => {
        if (error) {
            callback({ error });
            return;
        }
        callback({ data: { success: true } });
    });
}
function deleteTeam({ teamId, callback, }) {
    const query = { teamId };
    LanternTeam.remove(query)
        .lean()
        .exec((error) => {
        if (error) {
            callback({ error });
            return;
        }
        callback({ data: { success: true } });
    });
}
function createFirstRound(callback) {
    const newRound = new LanternRound({});
    const query = {};
    LanternRound.findOne(query)
        .lean()
        .exec((error, data) => {
        if (error) {
            callback({ error });
        }
        else if (!data) {
            dbConnector.saveObject({
                object: newRound,
                objectType: 'lanternRound',
                callback,
            });
        }
        else {
            callback({ data: { exists: true } });
        }
    });
}
function createFakePasswordsContainer(callback) {
    const newFakePasswords = new FakePassword({});
    const query = {};
    FakePassword.findOne(query)
        .lean()
        .exec((error, data) => {
        if (error) {
            callback({ error });
        }
        else if (!data) {
            dbConnector.saveObject({
                object: newFakePasswords,
                objectType: 'fakePasswords',
                callback,
            });
        }
        else {
            callback({ data: { exists: true } });
        }
    });
}
function getLanternStats({ callback }) {
    LanternRound.findOne({})
        .lean()
        .exec((roundError, round) => {
        if (roundError) {
            callback({ error: roundError });
            return;
        }
        LanternTeam.find({})
            .lean()
            .exec((teamError, teams) => {
            if (teamError) {
                callback({ error: teamError });
                return;
            }
            LanternStation.find({})
                .lean()
                .exec((stationError, stations) => {
                if (stationError) {
                    callback({ error: stationError });
                    return;
                }
                callback({
                    data: {
                        lanternStats: {
                            round,
                            teams,
                            stations,
                        },
                    },
                });
            });
        });
    });
}
function setDone({ callback, owner, coordinates, stationId, wasSuccessful = false, }) {
    const query = {
        owner,
        stationId,
        done: false,
    };
    const update = {
        wasSuccessful,
        done: true,
    };
    const options = { new: true };
    if (coordinates) {
        update.coordinates = coordinates;
    }
    LanternHack.findOneAndUpdate(query, update, options)
        .lean()
        .exec((err, lanternHack) => {
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
createFirstRound(({ error, data, }) => {
    if (error) {
        console.log('Failed to create first round');
        return;
    }
    console.log('Created ', data);
});
createFakePasswordsContainer(({ error, data, }) => {
    if (error) {
        console.log('Failed to create fake password container');
        return;
    }
    console.log('Created ', data);
});
export { createGameUsers };
export { getGameUsers };
export { addFakePasswords };
export { getAllFakePasswords };
export { updateLanternHack };
export { getLanternHack };
export { lowerHackTries };
export { updateSignalValue };
export { getStation };
export { getAllStations };
export { createStation };
export { updateLanternStation };
export { getActiveStations };
export { getLanternRound };
export { updateLanternTeam };
export { createLanternTeam };
export { getTeams };
export { updateLanternRound };
export { createFirstRound };
export { createFakePasswordsContainer as createFakePasswordContainer };
export { resetLanternStations };
export { deleteTeam };
export { getLanternStats };
export { deleteStation };
export { setDone };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGFudGVybkhhY2suanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJsYW50ZXJuSGFjay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxZQUFZLENBQUM7QUFFYixPQUFPLFFBQVEsTUFBTSxVQUFVLENBQUM7QUFDaEMsT0FBTyxFQUFFLFNBQVMsRUFBRSxNQUFNLGlDQUFpQyxDQUFDO0FBQzVELE9BQU8sWUFBWSxNQUFNLDZCQUE2QixDQUFDO0FBQ3ZELE9BQU8sV0FBVyxNQUFNLHlCQUF5QixDQUFDO0FBS2xELE1BQU0saUJBQWlCLEdBQUcsSUFBSSxRQUFRLENBQUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxZQUFZLENBQUM7SUFDckUsU0FBUyxFQUFFLE1BQU07SUFDakIsYUFBYSxFQUFFLE9BQU87SUFDdEIsS0FBSyxFQUFFO1FBQ0wsSUFBSSxFQUFFLE1BQU07UUFDWixNQUFNLEVBQUUsSUFBSTtLQUNiO0lBQ0QsU0FBUyxFQUFFO1FBQ1QsSUFBSSxFQUFFLE1BQU07UUFDWixPQUFPLEVBQUUsU0FBUyxDQUFDLGtCQUFrQjtLQUN0QztJQUNELElBQUksRUFBRTtRQUNKLElBQUksRUFBRSxPQUFPO1FBQ2IsT0FBTyxFQUFFLEtBQUs7S0FDZjtJQUNELFdBQVcsRUFBRSxXQUFXLENBQUMsaUJBQWlCO0lBQzFDLFNBQVMsRUFBRSxDQUFDO1lBQ1YsUUFBUSxFQUFFLE1BQU07WUFDaEIsUUFBUSxFQUFFLE1BQU07WUFDaEIsU0FBUyxFQUFFO2dCQUNULElBQUksRUFBRSxPQUFPO2dCQUNiLE9BQU8sRUFBRSxLQUFLO2FBQ2Y7WUFDRCxZQUFZLEVBQUUsTUFBTTtZQUNwQixZQUFZLEVBQUU7Z0JBQ1osS0FBSyxFQUFFLE1BQU07Z0JBQ2IsU0FBUyxFQUFFLE1BQU07YUFDbEI7U0FDRixDQUFDO0NBQ0gsQ0FBQyxFQUFFLEVBQUUsVUFBVSxFQUFFLGNBQWMsRUFBRSxDQUFDLENBQUM7QUFFcEMsTUFBTSxjQUFjLEdBQUcsSUFBSSxRQUFRLENBQUMs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