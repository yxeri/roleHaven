'use strict';
import mongoose from 'mongoose';
import errorCreator from '../../error/errorCreator';
import dbConnector from '../databaseConnector';
import { appConfig, dbConfig } from '../../config/defaults/config';
const mapPositionSchema = new mongoose.Schema(dbConnector.createSchema({
    coordinatesHistory: {
        type: [dbConnector.coordinatesSchema],
        default: []
    },
    positionName: {
        type: String,
        unique: true
    },
    positionType: {
        type: String,
        default: dbConfig.PositionTypes.WORLD
    },
    description: {
        type: [String],
        default: []
    },
    radius: {
        type: Number,
        default: 0
    },
    isStationary: {
        type: Boolean,
        default: false
    },
    origin: {
        type: String,
        default: dbConfig.PositionOrigins.LOCAL
    },
    positionStructure: {
        type: String,
        default: dbConfig.PositionStructures.MARKER
    },
    styleName: String,
    occupants: [String],
}), { collection: 'mapPositions' });
const MapPosition = mongoose.model('MapPosition', mapPositionSchema);
function updateObject({ positionId, update, callback, upsert, }) {
    dbConnector.updateObject({
        update,
        upsert,
        query: { _id: positionId },
        object: MapPosition,
        errorNameContent: 'updatePosition',
        callback: ({ error, data }) => {
            if (error) {
                callback({ error });
                return;
            }
            callback({ data: { position: data.object } });
        },
    });
}
function getPositions({ query, callback, filter, }) {
    dbConnector.getObjects({
        query,
        filter,
        object: MapPosition,
        callback: ({ error, data }) => {
            if (error) {
                callback({ error });
                return;
            }
            callback({
                data: {
                    positions: data.objects,
                },
            });
        },
    });
}
function getPosition({ filter, query, callback }) {
    dbConnector.getObject({
        query,
        filter,
        object: MapPosition,
        callback: ({ error, data }) => {
            if (error) {
                callback({ error });
                return;
            }
            if (!data.object) {
                callback({ error: new errorCreator.DoesNotExist({ name: `position ${JSON.stringify(query, null, 4)}` }) });
                return;
            }
            callback({ data: { position: data.object } });
        },
    });
}
function doesPositionExist({ positionName, callback, }) {
    const query = { positionName };
    dbConnector.doesObjectExist({
        callback,
        query,
        object: MapPosition,
    });
}
function createPosition({ position, callback, suppressExistsError = false, options = {}, }) {
    doesPositionExist({
        positionName: position.positionName,
        callback: (positionData) => {
            if (positionData.error) {
                callback({ error: positionData.error });
                return;
            }
            if (positionData.data.exists) {
                callback({
                    error: new errorCreator.AlreadyExists({
                        suppressExistsError,
                        name: `positionName ${position.positionName} in position`,
                    }),
                });
                return;
            }
            const positionToSave = position;
            if (positionToSave.coordinates) {
                positionToSave.coordinatesHistory = [positionToSave.coordinates];
            }
            if (options.setId && position.objectId) {
                positionToSave._id = mongoose.Types.ObjectId(position.objectId);
            }
            dbConnector.saveObject({
                object: new MapPosition(position),
                objectType: 'mapPosition',
                callback: ({ error, data }) => {
                    if (error) {
                        callback({ error });
                        return;
                    }
                    callback({ data: { position: data.savedObject } });
                },
            });
        },
    });
}
function updatePosition({ positionId, position, callback, options = {}, }) {
    const { positionStructure, positionName, ownerAliasId, isStationary, positionType, text, isPublic, description, styleName, coordinates, } = position;
    const { resetOwnerAliasId, } = options;
    const update = {};
    const set = {};
    const unset = {};
    const push = {};
    const updateCallback = () => {
        updateObject({
            positionId,
            update,
            callback: ({ error, data }) => {
                if (error) {
                    callback({ error });
                    return;
                }
                callback({ data });
            },
        });
    };
    const existCallback = () => {
        doesPositionExist({
            positionName,
            callback: (positionData) => {
                if (positionData.error) {
                    callback({ error: positionData.error });
                    return;
                }
                if (positionData.data.exists) {
                    callback({ error: new errorCreator.AlreadyExists({ name: `position with name ${position.positionName}` }) });
                    return;
                }
                updateCallback();
            },
        });
    };
    if (text) {
        set.description = text;
    }
    if (positionName) {
        set.positionName = positionName;
    }
    if (positionType) {
        set.positionType = positionType;
    }
    if (description) {
        set.description = description;
    }
    if (positionStructure) {
        set.positionStructure = positionStructure;
    }
    if (styleName) {
        set.styleName = styleName;
    }
    if (coordinates) {
        push.coordinatesHistory = {
            $each: [coordinates],
            $sort: { timeCreated: 1 },
            $slice: -appConfig.maxPositionHistory,
        };
    }
    if (typeof isPublic !== 'undefined') {
        set.isPublic = isPublic;
    }
    if (typeof isStationary !== 'undefined') {
        set.isStationary = isStationary;
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
    if (Object.keys(push).length > 0) {
        update.$push = push;
    }
    if (positionName) {
        existCallback();
    }
    else {
        updateCallback();
    }
}
function getPositionsByUser({ user, callback, }) {
    const query = dbConnector.createUserQuery({ user });
    getPositions({
        query,
        callback,
    });
}
function getPositionsByStructure({ user, callback, positionTypes: positionStructure, }) {
    const query = dbConnector.createUserQuery({ user });
    query.positionStructure = { $in: positionStructure };
    getPositions({
        query,
        callback,
    });
}
function removePosition({ positionId, callback }) {
    dbConnector.removeObject({
        callback,
        query: { _id: positionId },
        object: MapPosition,
    });
}
function removePositionsByType({ positionType, callback }) {
    dbConnector.removeObjects({
        callback,
        object: MapPosition,
        query: { positionType },
    });
}
function removePositionsByOrigin({ origin, callback }) {
    dbConnector.removeObjects({
        callback,
        object: MapPosition,
        query: { origin },
    });
}
function getPositionById({ positionId, callback }) {
    getPosition({
        callback,
        query: { _id: positionId },
    });
}
function getUserPosition({ userId, callback }) {
    getPosition({
        callback,
        query: { _id: userId },
    });
}
function updateAccess(params) {
    const accessParams = params;
    const { callback } = params;
    accessParams.objectId = params.positionId;
    accessParams.object = MapPosition;
    accessParams.callback = ({ error, data }) => {
        if (error) {
            callback({ error });
            return;
        }
        callback({ data: { position: data.object } });
    };
    if (params.shouldRemove) {
        dbConnector.removeObjectAccess(params);
    }
    else {
        dbConnector.addObjectAccess(params);
    }
}
export { removePosition };
export { createPosition };
export { getPositionsByUser };
export { updatePosition };
export { removePositionsByOrigin };
export { getPositionById };
export { getUserPosition };
export { updateAccess };
export { removePositionsByType };
export { removePositionsByOrigin };
export { getPositionsByStructure };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9zaXRpb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJwb3NpdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxZQUFZLENBQUM7QUFFYixPQUFPLFFBQVEsTUFBTSxVQUFVLENBQUM7QUFDaEMsT0FBTyxZQUFZLE1BQU0sMEJBQTBCLENBQUM7QUFDcEQsT0FBTyxXQUFXLE1BQU0sc0JBQXNCLENBQUM7QUFDL0MsT0FBTyxFQUFFLFNBQVMsRUFBRSxRQUFRLEVBQUUsTUFBTSw4QkFBOEIsQ0FBQztBQUVuRSxNQUFNLGlCQUFpQixHQUFHLElBQUksUUFBUSxDQUFDLE1BQU0sQ0FBQyxXQUFXLENBQUMsWUFBWSxDQUFDO0lBQ3JFLGtCQUFrQixFQUFFO1FBQ2xCLElBQUksRUFBRSxDQUFDLFdBQVcsQ0FBQyxpQkFBaUIsQ0FBQztRQUNyQyxPQUFPLEVBQUUsRUFBRTtLQUNaO0lBQ0QsWUFBWSxFQUFFO1FBQ1osSUFBSSxFQUFFLE1BQU07UUFDWixNQUFNLEVBQUUsSUFBSTtLQUNiO0lBQ0QsWUFBWSxFQUFFO1FBQ1osSUFBSSxFQUFFLE1BQU07UUFDWixPQUFPLEVBQUUsUUFBUSxDQUFDLGFBQWEsQ0FBQyxLQUFLO0tBQ3RDO0lBQ0QsV0FBVyxFQUFFO1FBQ1gsSUFBSSxFQUFFLENBQUMsTUFBTSxDQUFDO1FBQ2QsT0FBTyxFQUFFLEVBQUU7S0FDWjtJQUNELE1BQU0sRUFBRTtRQUNOLElBQUksRUFBRSxNQUFNO1FBQ1osT0FBTyxFQUFFLENBQUM7S0FDWDtJQUNELFlBQVksRUFBRTtRQUNaLElBQUksRUFBRSxPQUFPO1FBQ2IsT0FBTyxFQUFFLEtBQUs7S0FDZjtJQUNELE1BQU0sRUFBRTtRQUNOLElBQUksRUFBRSxNQUFNO1FBQ1osT0FBTyxFQUFFLFFBQVEsQ0FBQyxlQUFlLENBQUMsS0FBSztLQUN4QztJQUNELGlCQUFpQixFQUFFO1FBQ2pCLElBQUksRUFBRSxNQUFNO1FBQ1osT0FBTyxFQUFFLFFBQVEsQ0FBQyxrQkFBa0Is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