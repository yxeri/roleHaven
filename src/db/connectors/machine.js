'use strict';
import mongoose from 'mongoose';
import errorCreator from '../../error/errorCreator';
import dbConnector from '../databaseConnector';
const machineSchema = new mongoose.Schema(dbConnector.createSchema({
    name: String,
    slots: {
        type: Number,
        default: 4,
    },
    power: {
        type: Number,
        default: 100,
    },
}), { collection: 'machines' });
const Machine = mongoose.model('Machine', machineSchema);
function updateObject({ programId, update, callback, suppressError, }) {
    const query = { _id: programId };
    dbConnector.updateObject({
        update,
        query,
        suppressError,
        object: Machine,
        errorNameContent: 'updateProgramObject',
        callback: ({ error, data, }) => {
            if (error) {
                callback({ error });
                return;
            }
            callback({ data: { program: data.object } });
        },
    });
}
function getPrograms({ query, callback, }) {
    dbConnector.getObjects({
        query,
        object: Machine,
        callback: ({ error, data, }) => {
            if (error) {
                callback({ error });
                return;
            }
            callback({ data: { programs: data.objects } });
        },
    });
}
function getProgram({ query, callback, }) {
    dbConnector.getObject({
        query,
        object: Machine,
        callback: ({ error, data, }) => {
            if (error) {
                callback({ error });
                return;
            }
            if (!data.object) {
                callback({ error: new errorCreator.DoesNotExist({ name: `program ${JSON.stringify(query, null, 4)}` }) });
                return;
            }
            callback({ data: { program: data.object } });
        },
    });
}
function doesProgramExist({ programName, callback, }) {
    dbConnector.doesObjectExist({
        callback,
        query: { programName },
        object: Machine,
    });
}
function createProgram({ program, callback, }) {
    doesProgramExist({
        programName: program.programName,
        callback: (nameData) => {
            if (nameData.error) {
                callback({ error: nameData.error });
                return;
            }
            if (nameData.data.exists) {
                callback({ error: new errorCreator.AlreadyExists({ name: `program ${program.programName}` }) });
                return;
            }
            dbConnector.saveObject({
                object: new Machine(program),
                objectType: 'program',
                callback: ({ error, data, }) => {
                    if (error) {
                        callback({ error });
                        return;
                    }
                    callback({ data: { program: data.savedObject } });
                },
            });
        },
    });
}
function updateProgram({ programId, program, callback, suppressError, options = {}, }) {
    const { programName, cost, ownerAliasId, } = program;
    const { resetOwnerAliasId = false, } = options;
    const update = {};
    const set = {};
    const unset = {};
    if (cost) {
        set.deviceType = cost;
    }
    if (programName) {
        set.deviceName = programName;
    }
    if (resetOwnerAliasId) {
        unset.ownerAliasId = '';
    }
    else if (ownerAliasId) {
        set.ownerAliasId = ownerAliasId;
    }
    if (Object.keys(set).length > 0) {
        update.$set = set;
    }
    if (Object.keys(unset).length > 0) {
        update.$unset = unset;
    }
    if (programName) {
        doesProgramExist({
            deviceName: programName,
            callback: (nameData) => {
                if (nameData.error) {
                    callback({ error: nameData.error });
                    return;
                }
                if (nameData.data.exists) {
                    callback({ error: new errorCreator.AlreadyExists({ name: `program name ${programName}` }) });
                    return;
                }
                updateObject({
                    suppressError,
                    programId,
                    update,
                    callback,
                });
            },
        });
        return;
    }
    updateObject({
        programId,
        update,
        callback,
        suppressError,
    });
}
function updateAccess(params) {
    const accessParams = params;
    const { callback } = params;
    accessParams.objectId = params.programId;
    accessParams.object = Machine;
    accessParams.callback = ({ error, data, }) => {
        if (error) {
            callback({ error });
            return;
        }
        callback({ data: { device: data.object } });
    };
    if (params.shouldRemove) {
        dbConnector.removeObjectAccess(params);
    }
    else {
        dbConnector.addObjectAccess(params);
    }
}
function getProgramsByUser({ user, callback, }) {
    const query = dbConnector.createUserQuery({ user });
    getPrograms({
        query,
        callback,
    });
}
function getProgramById({ programId, callback, }) {
    getProgram({
        callback,
        query: { _id: programId },
    });
}
function removeProgram({ programId, callback, }) {
    dbConnector.removeObject({
        callback,
        object: Machine,
        query: { _id: programId },
    });
}
export { updateAccess };
export { updateProgram as updateDevice };
export { createProgram as createDevice };
export { getProgramsByUser as getDevicesByUser };
export { getProgramById as getDeviceById };
export { removeProgram as removeDevice };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFjaGluZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm1hY2hpbmUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsWUFBWSxDQUFDO0FBRWIsT0FBTyxRQUFRLE1BQU0sVUFBVSxDQUFDO0FBQ2hDLE9BQU8sWUFBWSxNQUFNLDBCQUEwQixDQUFDO0FBQ3BELE9BQU8sV0FBVyxNQUFNLHNCQUFzQixDQUFDO0FBRS9DLE1BQU0sYUFBYSxHQUFHLElBQUksUUFBUSxDQUFDLE1BQU0sQ0FBQyxXQUFXLENBQUMsWUFBWSxDQUFDO0lBQ2pFLElBQUksRUFBRSxNQUFNO0lBQ1osS0FBSyxFQUFFO1FBQ0wsSUFBSSxFQUFFLE1BQU07UUFDWixPQUFPLEVBQUUsQ0FBQztLQUNYO0lBQ0QsS0FBSyxFQUFFO1FBQ0wsSUFBSSxFQUFFLE1BQU07UUFDWixPQUFPLEVBQUUsR0FBRztLQUNiO0NBQ0YsQ0FBQyxFQUFFLEVBQUUsVUFBVSxFQUFFLFVBQVUsRUFBRSxDQUFDLENBQUM7QUFFaEMsTUFBTSxPQUFPLEdBQUcsUUFBUSxDQUFDLEtBQUssQ0FBQyxTQUFTLEVBQUUsYUFBYSxDQUFDLENBQUM7QUFTekQsU0FBUyxZQUFZLENBQUMsRUFDcEIsU0FBUyxFQUNULE1BQU0sRUFDTixRQUFRLEVBQ1IsYUFBYSxHQUNkO0lBQ0MsTUFBTSxLQUFLLEdBQUcsRUFBRSxHQUFHLEVBQUUsU0FBUyxFQUFFLENBQUM7SUFFakMsV0FBVyxDQUFDLFlBQVksQ0FBQztRQUN2QixNQUFNO1FBQ04sS0FBSztRQUNMLGFBQWE7UUFDYixNQUFNLEVBQUUsT0FBTztRQUNmLGdCQUFnQixFQUFFLHFCQUFxQjtRQUN2QyxRQUFRLEVBQUUsQ0FBQyxFQUNULEtBQUssRUFDTCxJQUFJLEdBQ0wsRUFBRSxFQUFFO1lBQ0gsSUFBSSxLQUFLLEVBQUUsQ0FBQztnQkFDVixRQUFRLENBQUMsRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDO2dCQUVwQixPQUFPO1lBQ1QsQ0FBQztZQUVELFFB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