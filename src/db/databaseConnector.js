'use strict';
import { ObjectId } from 'mongodb';
import mongoose from 'mongoose';
import { appConfig, dbConfig } from 'src/config/defaults/index.js';
import errorCreator from 'src/error/errorCreator.js';
const dbPath = `mongodb://${appConfig.dbHost}:${appConfig.dbPort}/${appConfig.dbName}`;
export const BaseSchemaDef = {
    ownerId: String,
    ownerAliasId: String,
    teamId: String,
    lastUpdated: Date,
    timeCreated: Date,
    customLastUpdated: Date,
    customTimeCreated: Date,
    visibility: {
        type: Number,
        default: dbConfig.AccessLevels.ANONYMOUS,
    },
    accessLevel: {
        type: Number,
        default: dbConfig.AccessLevels.ANONYMOUS,
    },
    teamAdminIds: {
        type: [String],
        default: [],
    },
    userAdminIds: {
        type: [String],
        default: [],
    },
    userIds: {
        type: [String],
        default: [],
    },
    teamIds: {
        type: [String],
        default: [],
    },
    bannedIds: {
        type: [String],
        default: [],
    },
    isPublic: {
        type: Boolean,
        default: false,
    },
    triggerEvents: {
        type: [String],
        default: [],
    },
};
export const imageSchemaDef = {
    height: Number,
    width: Number,
    imageName: String,
    fileName: String,
};
export const coordinatesSchemaDef = {
    longitude: Number,
    latitude: Number,
    speed: Number,
    accuracy: Number,
    heading: Number,
    timeCreated: Date,
    customTimeCreated: Date,
    altitude: Number,
    altitudeAccuracy: Number,
    extraCoordinates: {
        type: [{
                longitude: Number,
                latitude: Number,
            }],
        default: undefined,
    },
};
export const customFieldSchemaDef = {
    name: String,
    value: {},
};
try {
    await mongoose.connect(dbPath);
    console.info('Connection established to database');
}
catch (error) {
    console.error('Failed to connect to the database', error);
}
function modifyObject({ noClean, object, }) {
    return {
        ...object,
        objectId: object._id?.toString(),
        ...(object.password && {
            password: !noClean
                ? typeof object.password === 'string'
                : object.password
        }),
    };
}
async function saveObject({ object, objectData, objectType, }) {
    const now = new Date();
    object.schema.obj.lastUpdated = object.schema.obj.lastUpdated || now;
    object.schema.obj.timeCreated = object.schema.obj.timeCreated || now;
    try {
        const createdObject = await object.create(objectData);
        return {
            data: {
                objectType,
                savedObject: modifyObject({ object: createdObject.toObject() }),
            },
        };
    }
    catch (error) {
        return {
            error: new errorCreator.Database({
                errorObject: error,
                name: `saveObject ${objectType} ${object}`,
            }),
        };
    }
}
async function verifyObject({ query, object, }) {
    const update = {
        $set: {
            isVerified: true,
            lastUpdated: new Date(),
        },
    };
    const options = { returnOriginal: false };
    try {
        const updateResult = await object.findOneAndUpdate(query, update, options);
        if (!updateResult) {
            return { error: new errorCreator.DoesNotExist({ name: 'verify' }) };
        }
        return { data: { verified: modifyObject({ object: updateResult }) } };
    }
    catch (error) {
        return {
            error: new errorCreator.Database({
                errorObject: error,
                name: 'verifyObject',
            }),
        };
    }
}
async function verifyAllObjects({ query, object, }) {
    const update = {
        $set: {
            isVerified: true,
            lastUpdated: new Date(),
        },
    };
    const options = {};
    try {
        await object.updateMany(query, update, options);
        return { data: { verified: [].map((updatedObject) => modifyObject({ object: updatedObject })) } };
    }
    catch (error) {
        return {
            error: new errorCreator.Database({
                errorObject: error,
                name: 'verifyAllObjects',
            }),
        };
    }
}
async function dropDatabase() {
    if (appConfig.mode !== appConfig.Modes.TEST && appConfig.mode !== appConfig.Modes.DEV) {
        return { error: new errorCreator.Internal({ name: 'not in dev/test mode' }) };
    }
    try {
        await mongoose.connection.dropDatabase();
        return { data: { success: true } };
    }
    catch (error) {
        return {
            error,
        };
    }
}
async function getObject({ object, noClean = false, errorNameContent = 'getObject', query = {}, filter = {}, }) {
    try {
        const result = await object.findOne(query, filter);
        if (!result) {
            return { data: { exists: false } };
        }
        return {
            data: {
                exists: true,
                object: modifyObject({
                    noClean,
                    object: result,
                }),
            },
        };
    }
    catch (error) {
        return {
            error: new errorCreator.Database({
                errorObject: error,
                name: errorNameContent,
            }),
        };
    }
}
async function doesObjectExist({ object, query, }) {
    try {
        const result = await object.findOne(query);
        return {
            data: {
                exists: typeof result !== 'undefined' && result !== null,
                object: result,
            },
        };
    }
    catch (error) {
        return {
            error: new errorCreator.Database({
                errorObject: error,
                name: 'doesObjectExist',
            }),
        };
    }
}
async function getObjects({ object, errorNameContent = 'getObjects', sort, query = {}, filter = {}, }) {
    try {
        const result = sort
            ? await object.find(query, filter)
                .sort(sort)
            : await object.find(query, filter);
        return { data: { objects: result.map((foundObject) => modifyObject({ object: foundObject })) } };
    }
    catch (error) {
        return {
            error: new errorCreator.Database({
                errorObject: error,
                name: errorNameContent,
            }),
        };
    }
}
async function updateObject({ object, update, query, suppressError = false, options = {}, errorNameContent = 'updateObject', }) {
    const toUpdate = update;
    if (!toUpdate.$set) {
        toUpdate.$set = {};
    }
    toUpdate.$set.lastUpdated = new Date();
    try {
        const result = await object.findOneAndUpdate(query, toUpdate, { ...options, new: true });
        if (!result) {
            return {
                error: new errorCreator.DoesNotExist({
                    suppressPrint: suppressError,
                    name: `update ${JSON.stringify(query, null, 4)}`,
                }),
            };
        }
        return { data: { object: modifyObject({ object: result }) } };
    }
    catch (error) {
        return {
            error: new errorCreator.Database({
                errorObject: error,
                name: errorNameContent,
            }),
        };
    }
}
async function updateObjects({ object, update, query = {}, errorNameContent = 'updateObjects', }) {
    const options = {
        new: true,
        multi: true,
    };
    const toUpdate = update;
    const now = new Date();
    toUpdate.$set = toUpdate.$set ?? {};
    toUpdate.$set.lastUpdated = now;
    try {
        await object.updateMany(query, {
            ...update,
            $set: {
                ...(update.$set ?? {}),
                lastUpdated: new Date(),
            },
        }, options);
        const { error: errorGet, data: updatedData = { objects: [] }, } = await getObjects({
            object,
            query: {
                lastUpdated: now,
            },
        });
        if (errorGet) {
            return { error: errorGet };
        }
        return {
            data: {
                objects: updatedData
                    .objects.map((foundObject) => modifyObject({ object: foundObject })),
            },
        };
    }
    catch (error) {
        return {
            error: new errorCreator.Database({
                errorObject: error,
                name: errorNameContent,
            }),
        };
    }
}
async function removeObject({ object, query, }) {
    const options = { justOne: true };
    try {
        object.findOneAndDelete(query, options);
        return { data: { success: true } };
    }
    catch (error) {
        return {
            error: new errorCreator.Database({
                errorObject: error,
                name: 'removeObject',
            }),
        };
    }
}
async function removeObjects({ object, query, }) {
    try {
        const result = await object.deleteMany(query);
        return {
            data: {
                success: true,
                amount: result.deletedCount,
            },
        };
    }
    catch (error) {
        return {
            error: new errorCreator.Database({
                errorObject: error,
                name: 'removeObjects',
            }),
        };
    }
}
async function addObjectAccess({ objectId, object, userIds, teamIds, bannedIds, teamAdminIds, userAdminIds, }) {
    if (!userIds && !teamIds && !bannedIds && !teamAdminIds && !userAdminIds) {
        return { error: new errorCreator.InvalidData({ expected: 'teamIds || userIds || bannedIds || userAdminIds || teamAdminIds' }) };
    }
    const pull = {
        ...(bannedIds && ({
            teamAdminIds: { $each: bannedIds },
            userAdminIds: { $each: bannedIds },
            userIds: { $each: bannedIds },
            teamIds: { $each: bannedIds },
        }))
    };
    const addToSet = {
        ...(teamIds && { teamIds: { $each: teamIds } }),
        ...(userIds && { userIds: { $each: userIds } }),
        ...(teamAdminIds && { teamAdminIds: { $each: teamAdminIds } }),
        ...(userAdminIds && { userAdminIds: { $each: userAdminIds } }),
        ...(bannedIds && { bannedIds: { $each: bannedIds } }),
    };
    return updateObject({
        update: {
            ...(Object.keys(pull).length > 0 && { $pull: pull }),
            ...(Object.keys(addToSet).length > 0 && { $addToSet: addToSet }),
        },
        object,
        query: { _id: new ObjectId(objectId) },
    });
}
async function removeObjectAccess({ objectId, object, userIds, teamIds, bannedIds, teamAdminIds, userAdminIds, }) {
    if (!userIds && !teamIds && !bannedIds && !teamAdminIds && !userAdminIds) {
        return { error: new errorCreator.InvalidData({ expected: 'teamIds || userIds || bannedIds || userAdminIds || teamAdminIds' }) };
    }
    const pull = {
        ...(teamIds && { teamIds: { $in: teamIds } }),
        ...(userIds && { userIds: { $in: userIds } }),
        ...(teamAdminIds && { teamAdminIds: { $in: teamAdminIds } }),
        ...(userAdminIds && { userAdminIds: { $in: userAdminIds } }),
        ...(bannedIds && { bannedIds: { $in: bannedIds } }),
    };
    return updateObject({
        update: {
            ...(Object.keys(pull).length > 0 && { $pull: pull }),
        },
        object,
        query: { _id: objectId },
    });
}
function createUserQuery({ user, noVisibility, }) {
    const { objectId, partOfTeams, accessLevel, aliases = [], } = user;
    const query = {
        bannedIds: { $nin: [objectId] },
        $or: [
            { isPublic: true },
            { ownerId: objectId },
            { ownerAliasId: objectId },
            { userIds: { $in: [...aliases, objectId] } },
            { teamIds: { $in: partOfTeams } },
        ],
    };
    if (!noVisibility) {
        query.$or?.push({ visibility: { $lte: accessLevel } });
    }
    return query;
}
async function updateAccess(params) {
    const { shouldRemove, ...accessParams } = params;
    const callback = ({ error, data }) => {
        if (error) {
            return { error };
        }
        return { data: { object: data?.object } };
    };
    return callback(shouldRemove
        ? await removeObjectAccess(accessParams)
        : await addObjectAccess(accessParams));
}
export default {
    coordinatesSchema: coordinatesSchemaDef,
    imageSchema: imageSchemaDef,
    customFieldSchema: customFieldSchemaDef,
    saveObject,
    verifyObject,
    verifyAllObjects,
    dropDatabase,
    getObjects,
    getObject,
    updateObject,
    removeObject,
    removeObjects,
    removeObjectAccess,
    addObjectAccess,
    doesObjectExist,
    updateObjects,
    createUserQuery,
    updateAccess,
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGF0YWJhc2VDb25uZWN0b3IuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJkYXRhYmFzZUNvbm5lY3Rvci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxZQUFZLENBQUM7QUFFYixPQUFPLEVBQUUsUUFBUSxFQUFFLE1BQU0sU0FBUyxDQUFDO0FBQ25DLE9BQU8sUUFBOEIsTUFBTSxVQUFVLENBQUM7QUFDdEQsT0FBTyxFQUFFLFNBQVMsRUFBRSxRQUFRLEVBQUUsTUFBTSw4QkFBOEIsQ0FBQztBQUduRSxPQUFPLFlBQVksTUFBTSwyQkFBMkIsQ0FBQztBQUdyRCxNQUFNLE1BQU0sR0FBRyxhQUFhLFNBQVMsQ0FBQyxNQUFNLElBQUksU0FBUyxDQUFDLE1BQU0sSUFBSSxTQUFTLENBQUMsTUFBTSxFQUFFLENBQUM7QUF1QnZGLE1BQU0sQ0FBQyxNQUFNLGFBQWEsR0FBRztJQUMzQixPQUFPLEVBQUUsTUFBTTtJQUNmLFlBQVksRUFBRSxNQUFNO0lBQ3BCLE1BQU0sRUFBRSxNQUFNO0lBQ2QsV0FBVyxFQUFFLElBQUk7SUFDakIsV0FBVyxFQUFFLElBQUk7SUFDakIsaUJBQWlCLEVBQUUsSUFBSTtJQUN2QixpQkFBaUIsRUFBRSxJQUFJO0lBQ3ZCLFVBQVUsRUFBRTtRQUNWLElBQUksRUFBRSxNQUFNO1FBQ1osT0FBTyxFQUFFLFFBQVEsQ0FBQyxZQUFZLENBQUMsU0FBUztLQUN6QztJQUNELFdBQVcsRUFBRTtRQUNYLElBQUksRUFBRSxNQUFNO1FBQ1osT0FBTyxFQUFFLFFBQVEsQ0FBQyxZQUFZLENBQUMsU0FBUztLQUN6QztJQUNELFlBQVksRUFBRTtRQUNaLElBQUksRUFBRSxDQUFDLE1BQU0sQ0FBQztRQUNkLE9BQU8sRUFBRSxFQUFFO0tBQ1o7SUFDRCxZQUFZLEVBQUU7UUFDWixJQUFJLEVBQUUsQ0FBQyxNQUFNLENBQUM7UUFDZCxPQUFPLEVBQUUsRUFBRTtLQUNaO0lBQ0QsT0FBTyxFQUFFO1FBQ1AsSUFBSSxFQUFFLENBQUMs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