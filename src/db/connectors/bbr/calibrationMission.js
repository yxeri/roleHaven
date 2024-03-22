import mongoose from 'mongoose';
import errorCreator from '../../../error/errorCreator';
import dbConnector from '../../databaseConnector';
const calibrationMissionSchema = new mongoose.Schema(dbConnector.createSchema({
    owner: String,
    stationId: Number,
    code: Number,
    timeCompleted: Date,
    timeCreated: Date,
    cancelled: {
        type: Boolean,
        default: false,
    },
    completed: {
        type: Boolean,
        default: false,
    },
}), { collection: 'calibrationMissions' });
const CalibrationMission = mongoose.model('CalibrationMission', calibrationMissionSchema);
function getActiveMission({ owner, silentOnDoesNotExist, callback, }) {
    const query = {
        $and: [
            { owner },
            { completed: false },
        ],
    };
    CalibrationMission.findOne(query)
        .lean()
        .exec((err, foundMission) => {
        if (err) {
            callback({
                error: new errorCreator.Database({
                    errorObject: err,
                    name: 'getActiveMission',
                }),
            });
            return;
        }
        if (!foundMission) {
            if (!silentOnDoesNotExist) {
                callback({ error: new errorCreator.DoesNotExist({ name: `calibration mission ${owner}` }) });
            }
            else {
                callback({ data: { doesNotExist: true } });
            }
            return;
        }
        callback({ data: { mission: foundMission } });
    });
}
function getInactiveMissions({ owner, callback, }) {
    const query = { $and: [{ owner }, { completed: true }] };
    const sort = { timeCompleted: 1 };
    CalibrationMission.find(query)
        .sort(sort)
        .lean()
        .exec((err, foundMissions = []) => {
        if (err) {
            callback({
                error: new errorCreator.Database({
                    errorObject: err,
                    name: 'getInactiveMissions',
                }),
            });
            return;
        }
        callback({ data: { missions: foundMissions } });
    });
}
function getMissions({ getInactive, callback, }) {
    const query = {};
    if (!getInactive) {
        query.completed = false;
    }
    CalibrationMission.find(query)
        .lean()
        .exec((err, foundMissions = []) => {
        if (err) {
            callback({
                error: new errorCreator.Database({
                    errorObject: err,
                    name: 'getMissions',
                }),
            });
            return;
        }
        callback({ data: { missions: foundMissions } });
    });
}
function removeMission({ mission, callback, }) {
    const query = {
        owner: mission.owner,
        completed: false,
    };
    CalibrationMission.findOneAndRemove(query)
        .lean()
        .exec((error) => {
        if (error) {
            callback({ error });
            return;
        }
        callback({ data: { success: true } });
    });
}
function createMission({ mission, callback, }) {
    const newMission = new CalibrationMission(mission);
    const query = {
        owner: mission.owner,
        completed: false,
    };
    CalibrationMission.findOne(query)
        .lean()
        .exec((err, foundMission) => {
        if (err) {
            callback({
                error: new errorCreator.Database({
                    errorObject: err,
                    name: 'createMission',
                }),
            });
            return;
        }
        if (foundMission) {
            callback({ error: new errorCreator.AlreadyExists({ name: `Calibration mission ${mission.owner}` }) });
            return;
        }
        dbConnector.saveObject({
            object: newMission,
            objectType: 'calibrationMission',
            callback: ({ error, data, }) => {
                if (error) {
                    callback({ error });
                    return;
                }
                callback({ data: { mission: data.savedObject } });
            },
        });
    });
}
function setMissionCompleted({ owner, cancelled, callback, }) {
    const query = {
        owner,
        completed: false,
    };
    const update = {
        $set: {
            completed: true,
            timeCompleted: new Date(),
        },
    };
    const options = { new: true };
    if (cancelled) {
        update.$set.cancelled = true;
    }
    CalibrationMission.findOneAndUpdate(query, update, options)
        .lean()
        .exec((err, foundMission) => {
        if (err) {
            callback({
                error: new errorCreator.Database({
                    errorObject: err,
                    name: 'setMissionCompleted',
                }),
            });
            return;
        }
        if (!foundMission) {
            callback({ error: new errorCreator.DoesNotExist({ name: `Mission owner: ${owner}` }) });
            return;
        }
        callback({ data: { mission: foundMission } });
    });
}
export { getActiveMission };
export { createMission };
export { setMissionCompleted };
export { getInactiveMissions };
export { getMissions };
export { removeMission };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2FsaWJyYXRpb25NaXNzaW9uLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiY2FsaWJyYXRpb25NaXNzaW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sUUFBUSxNQUFNLFVBQVUsQ0FBQztBQUNoQyxPQUFPLFlBQVksTUFBTSw2QkFBNkIsQ0FBQztBQUN2RCxPQUFPLFdBQVcsTUFBTSx5QkFBeUIsQ0FBQztBQUVsRCxNQUFNLHdCQUF3QixHQUFHLElBQUksUUFBUSxDQUFDLE1BQU0sQ0FBQyxXQUFXLENBQUMsWUFBWSxDQUFDO0lBQzVFLEtBQUssRUFBRSxNQUFNO0lBQ2IsU0FBUyxFQUFFLE1BQU07SUFDakIsSUFBSSxFQUFFLE1BQU07SUFDWixhQUFhLEVBQUUsSUFBSTtJQUNuQixXQUFXLEVBQUUsSUFBSTtJQUNqQixTQUFTLEVBQUU7UUFDVCxJQUFJLEVBQUUsT0FBTztRQUNiLE9BQU8sRUFBRSxLQUFLO0tBQ2Y7SUFDRCxTQUFTLEVBQUU7UUFDVCxJQUFJLEVBQUUsT0FBTztRQUNiLE9BQU8sRUFBRSxLQUFLO0tBQ2Y7Q0FDRixDQUFDLEVBQUUsRUFBRSxVQUFVLEVBQUUscUJBQXFCLEVBQUUsQ0FBQyxDQUFDO0FBRTNDLE1BQU0sa0JBQWtCLEdBQUcsUUFBUSxDQUFDLEtBQUssQ0FBQyxvQkFBb0IsRUFBRSx3QkFBd0IsQ0FBQyxDQUFDO0FBUzFGLFNBQVMsZ0JBQWdCLENBQUMsRUFDeEIsS0FBSyxFQUNMLG9CQUFvQixFQUNwQixRQUFRLEdBQ1Q7SUFDQyxNQUFNLEtBQUssR0FBRztRQUNaLElBQUksRUFBRTtZQUNKLEVBQUUsS0FBSyxFQUFFO1lBQ1QsRUFBRSxTQUFTLEVBQUUsS0FBSyxFQUFFO1NBQ3JCO0tBQ0YsQ0FBQztJQUVGLGtCQUFrQixDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUM7U0FDOUIsSUFBSSxFQUFFO1NBQ04sSUFBSSxDQUFDLENBQUMsR0FBRyxFQUFFLFlBQVksRUFBRSxFQUFFO1FBQzFCLElB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