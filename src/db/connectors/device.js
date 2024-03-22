'use strict';
import mongoose from 'mongoose';
import { DeviceType } from 'src/config/defaults/dbConfig.js';
import dbConnector from 'src/db/databaseConnector.js';
import errorCreator from 'src/error/errorCreator.js';
const deviceSchema = new mongoose.Schema({
    deviceName: {
        type: String,
        unique: true,
    },
    socketId: String,
    lastUserId: String,
    connectedToUser: {
        type: String,
        unique: true,
        sparse: true,
    },
    deviceType: {
        type: mongoose.SchemaTypes.Mixed,
        default: DeviceType.USERDEVICE,
    },
}, { collection: 'devices' });
const Device = mongoose.model('Device', deviceSchema);
async function updateObject({ deviceId, deviceSocketId, update, suppressError, }) {
    const query = {};
    if (deviceId) {
        query._id = deviceId;
    }
    else {
        query.socketId = deviceSocketId;
    }
    const { error, data } = await dbConnector.updateObject({
        update,
        query,
        suppressError,
        object: Device,
        errorNameContent: 'updateDeviceObject',
    });
    if (error) {
        return { error };
    }
    if (!data?.object) {
        return { error: new errorCreator.DoesNotExist({ name: `device ${JSON.stringify(query, null, 4)}` }) };
    }
    return { data: { device: data.object } };
}
async function getDevices({ query, }) {
    const { error, data } = await dbConnector.getObjects({
        query,
        object: Device,
    });
    if (error) {
        return { error };
    }
    return { data: { devices: data?.objects } };
}
async function getDevice({ query, }) {
    const { error, data } = await dbConnector.getObject({
        query,
        object: Device,
    });
    if (error) {
        return { error };
    }
    if (!data?.object) {
        return { error: new errorCreator.DoesNotExist({ name: `device ${JSON.stringify(query, null, 4)}` }) };
    }
    return { data: { device: data.object } };
}
async function doesDeviceExist({ deviceName, }) {
    return dbConnector.doesObjectExist({
        query: { deviceName },
        object: Device,
    });
}
async function createDevice({ device, }) {
    const { error, data } = await doesDeviceExist({
        deviceName: device.deviceName,
    });
    if (error) {
        return { error };
    }
    if (data.exists) {
        return { error: new errorCreator.AlreadyExists({ name: `device ${device.deviceName}` }) };
    }
    const { error: saveError, data: saveData } = await dbConnector.saveObject({
        object: Device,
        objectData: device,
        objectType: 'device',
    });
    if (saveError) {
        return { error: saveError };
    }
    return { data: { device: saveData.savedObject } };
}
async function updateDevice({ deviceId, deviceSocketId, device, suppressError, options = {}, }) {
    const { socketId, deviceName, deviceType, ownerAliasId, } = device;
    const { resetSocket = false, resetOwnerAliasId = false, } = options;
    const update = {};
    const set = {};
    const unset = {};
    if (resetSocket) {
        unset.socketId = '';
    }
    else if (socketId) {
        set.socketId = socketId;
    }
    if (deviceType) {
        set.deviceType = deviceType;
    }
    if (deviceName) {
        set.deviceName = deviceName;
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
    if (deviceName) {
        const { error, data } = await doesDeviceExist({
            deviceName,
        });
        if (error) {
            return { error };
        }
        if (data.exists) {
            return { error: new errorCreator.AlreadyExists({ name: `device name ${deviceName}` }) };
        }
        return updateObject({
            suppressError,
            deviceSocketId,
            deviceId,
            update,
        });
    }
    return updateObject({
        deviceId,
        deviceSocketId,
        update,
        suppressError,
    });
}
async function getDevicesByUser({ user, }) {
    const query = dbConnector.createUserQuery({ user });
    return getDevices({
        query,
    });
}
async function getDeviceById({ deviceId, }) {
    return getDevice({
        query: { _id: deviceId },
    });
}
async function removeDevice({ deviceId, }) {
    return dbConnector.removeObject({
        object: Device,
        query: { _id: deviceId },
    });
}
async function getDeviceBySocketId({ socketId, }) {
    return getDevice({
        query: { socketId },
    });
}
export default {
    updateDevice,
    createDevice,
    getDevicesByUser,
    getDeviceById,
    removeDevice,
    getDeviceBySocketId,
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGV2aWNlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZGV2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFlBQVksQ0FBQztBQUViLE9BQU8sUUFBUSxNQUFNLFVBQVUsQ0FBQztBQUNoQyxPQUFPLEVBQUUsVUFBVSxFQUFFLE1BQU0saUNBQWlDLENBQUM7QUFHN0QsT0FBTyxXQUEyQixNQUFNLDZCQUE2QixDQUFDO0FBQ3RFLE9BQU8sWUFBWSxNQUFNLDJCQUEyQixDQUFDO0FBVXJELE1BQU0sWUFBWSxHQUFHLElBQUksUUFBUSxDQUFDLE1BQU0sQ0FBZTtJQUNyRCxVQUFVLEVBQUU7UUFDVixJQUFJLEVBQUUsTUFBTTtRQUNaLE1BQU0sRUFBRSxJQUFJO0tBQ2I7SUFDRCxRQUFRLEVBQUUsTUFBTTtJQUNoQixVQUFVLEVBQUUsTUFBTTtJQUNsQixlQUFlLEVBQUU7UUFDZixJQUFJLEVBQUUsTUFBTTtRQUNaLE1BQU0sRUFBRSxJQUFJO1FBQ1osTUFBTSxFQUFFLElBQUk7S0FDYjtJQUNELFVBQVUsRUFBRTtRQUNWLElBQUksRUFBRSxRQUFRLENBQUMsV0FBVyxDQUFDLEtBQUs7UUFDaEMsT0FBTyxFQUFFLFVBQVUsQ0FBQyxVQUFVO0tBQy9CO0NBQ0YsRUFBRSxFQUFFLFVBQVUsRUFBRSxTQUFTLEVBQUUsQ0FBQyxDQUFDO0FBRTlCLE1BQU0sTUFBTSxHQUFHLFFBQVEsQ0FBQyxLQUFLLENBQUMsUUFBUSxFQUFFLFlBQVksQ0FBQyxDQUFDO0FBRXRELEtBQUssVUFBVSxZQUFZLENBQUMsRUFDMUIsUUFBUSxFQUNSLGNBQWMsRUFDZCxNQUFNLEVBQ04sYUFBYSxHQU1kO0lBQ0MsTUFBTSxLQUFLLEdBQXVDLEVBQUUsQ0FBQztJQUVyRCxJQUFJLFFBQVEsRUFBRSxDQUFDO1FBQ2IsS0FBSyxDQUFDLEdBQUcsR0FBRyxRQUFRLENBQUM7SUFDdkIsQ0FBQztTQUFNLENBQUM7UUFDTixLQUFLLENBQUMsUUFBUSxHQUFHLGNBQWMsQ0FB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