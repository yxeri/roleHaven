'use strict';
import mongoose from 'mongoose';
import errorCreator from '../../error/errorCreator';
import dbConnector from '../databaseConnector';
const programSchema = new mongoose.Schema(dbConnector.createSchema({
    name: {
        type: String,
        unique: true,
    },
    cost: {
        type: Number,
        default: 0,
    },
    programRequirements: [String],
}), { collection: 'devices' });
const Program = mongoose.model('Program', programSchema);
function updateObject({ programId, update, callback, suppressError, }) {
    const query = { _id: programId };
    dbConnector.updateObject({
        update,
        query,
        suppressError,
        object: Program,
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
        object: Program,
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
        object: Program,
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
        object: Program,
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
                object: new Program(program),
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
    accessParams.object = Program;
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
        object: Program,
        query: { _id: programId },
    });
}
export { updateAccess };
export { updateProgram as updateDevice };
export { createProgram as createDevice };
export { getProgramsByUser as getDevicesByUser };
export { getProgramById as getDeviceById };
export { removeProgram as removeDevice };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvZ3JhbS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInByb2dyYW0udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsWUFBWSxDQUFDO0FBRWIsT0FBTyxRQUFRLE1BQU0sVUFBVSxDQUFDO0FBQ2hDLE9BQU8sWUFBWSxNQUFNLDBCQUEwQixDQUFDO0FBQ3BELE9BQU8sV0FBVyxNQUFNLHNCQUFzQixDQUFDO0FBRS9DLE1BQU0sYUFBYSxHQUFHLElBQUksUUFBUSxDQUFDLE1BQU0sQ0FBQyxXQUFXLENBQUMsWUFBWSxDQUFDO0lBQ2pFLElBQUksRUFBRTtRQUNKLElBQUksRUFBRSxNQUFNO1FBQ1osTUFBTSxFQUFFLElBQUk7S0FDYjtJQUNELElBQUksRUFBRTtRQUNKLElBQUksRUFBRSxNQUFNO1FBQ1osT0FBTyxFQUFFLENBQUM7S0FDWDtJQUNELG1CQUFtQixFQUFFLENBQUMsTUFBTSxDQUFDO0NBQzlCLENBQUMsRUFBRSxFQUFFLFVBQVUsRUFBRSxTQUFTLEVBQUUsQ0FBQyxDQUFDO0FBRS9CLE1BQU0sT0FBTyxHQUFHLFFBQVEsQ0FBQyxLQUFLLENBQUMsU0FBUyxFQUFFLGFBQWEsQ0FBQyxDQUFDO0FBU3pELFNBQVMsWUFBWSxDQUFDLEVBQ3BCLFNBQVMsRUFDVCxNQUFNLEVBQ04sUUFBUSxFQUNSLGFBQWEsR0FDZDtJQUNDLE1BQU0sS0FBSyxHQUFHLEVBQUUsR0FBRyxFQUFFLFNBQVMsRUFBRSxDQUFDO0lBRWpDLFdBQVcsQ0FBQyxZQUFZLENBQUM7UUFDdkIsTUFBTTtRQUNOLEtBQUs7UUFDTCxhQUFhO1FBQ2IsTUFBTSxFQUFFLE9BQU87UUFDZixnQkFBZ0IsRUFBRSxxQkFBcUI7UUFDdkMsUUFBUSxFQUFFLENBQUMsRUFDVCxLQUFLLEVBQ0wsSUFBSSxHQUNMLEVBQUUsRUFBRTtZQUNILElBQUksS0FBSyxFQUFFLENBQUM7Z0JBQ1YsUUFBUSxDQUFDLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQztnQkFFcEIsT0FBTztZQUNU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