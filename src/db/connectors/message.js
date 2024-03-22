'use strict';
import mongoose from 'mongoose';
import dbConnector from '../databaseConnector';
import { appConfig, dbConfig } from '../../config/defaults/config';
import errorCreator from '../../error/errorCreator';
import dbRoom from './room';
const messageSchema = new mongoose.Schema(dbConnector.createSchema({
    messageType: {
        type: String,
        default: dbConfig.MessageTypes.CHAT,
    },
    text: {
        type: [String],
        default: [],
    },
    altText: [String],
    roomId: String,
    coordinates: dbConnector.coordinatesSchema,
    intro: [String],
    extro: [String],
    image: dbConnector.imageSchema,
}), { collection: 'messages' });
const Message = mongoose.model('Message', messageSchema);
function updateObject({ messageId, update, callback, }) {
    dbConnector.updateObject({
        update,
        query: { _id: messageId },
        object: Message,
        errorNameContent: 'updateMessage',
        callback: ({ error, data, }) => {
            if (error) {
                callback({ error });
                return;
            }
            callback({ data: { message: data.object } });
        },
    });
}
function getMessages({ query, callback, errorNameContent, filter, startDate, shouldGetFuture = false, limit = appConfig.maxHistoryAmount, }) {
    const fullQuery = query;
    if (startDate) {
        const customTimeQuery = {
            customTimeCreated: {
                $exists: true,
            },
        };
        const timeQuery = {};
        if (!shouldGetFuture) {
            customTimeQuery.customTimeCreated.$lte = startDate;
            timeQuery.timeCreated = { $lte: startDate };
        }
        else {
            customTimeQuery.customTimeCreated = { $gte: startDate };
            timeQuery.timeCreated = { $gte: startDate };
        }
        fullQuery.$or = [
            customTimeQuery,
            timeQuery,
        ];
    }
    dbConnector.getObjects({
        filter,
        errorNameContent,
        limit,
        query: fullQuery,
        object: Message,
        callback: ({ error, data, }) => {
            if (error) {
                callback({ error });
                return;
            }
            callback({
                data: {
                    messages: data.objects,
                },
            });
        },
    });
}
function getMessage({ query, callback, errorNameContent, }) {
    dbConnector.getObject({
        query,
        errorNameContent,
        object: Message,
        callback: ({ error, data, }) => {
            if (error) {
                callback({ error });
                return;
            }
            if (!data.object) {
                callback({ error: new errorCreator.DoesNotExist({ name: `alias ${JSON.stringify(query, null, 4)}` }) });
                return;
            }
            callback({ data: { message: data.object } });
        },
    });
}
function createMessage({ message, callback, }) {
    dbConnector.saveObject({
        object: new Message(message),
        objectType: 'Message',
        callback: (saveData) => {
            if (saveData.error) {
                callback({ error: saveData.error });
                return;
            }
            callback({ data: { message: saveData.data.savedObject } });
        },
    });
}
function updateMessage({ messageId, message, callback, options = {}, }) {
    const { resetOwnerAliasId = false } = options;
    const { roomId, coordinates, text, ownerAliasId, intro, extro, customTimeCreated, customlastUpdated, } = message;
    const update = {};
    const set = {};
    const unset = {};
    if (resetOwnerAliasId) {
        unset.ownerAliasId = '';
    }
    else if (ownerAliasId) {
        set.ownerAliasId = ownerAliasId;
    }
    if (coordinates) {
        set.coordinates = coordinates;
    }
    if (text) {
        set.text = text;
    }
    if (intro) {
        set.intro = intro;
    }
    if (extro) {
        set.extro = extro;
    }
    if (customTimeCreated) {
        set.customTimeCreated = customTimeCreated;
    }
    if (customlastUpdated) {
        set.customlastUpdated = customlastUpdated;
    }
    if (roomId) {
        set.roomId = roomId;
    }
    if (Object.keys(set).length > 0) {
        update.$set = set;
    }
    if (Object.keys(unset).length > 0) {
        update.$unset = unset;
    }
    if (roomId) {
        dbRoom.doesRoomExist({
            roomId,
            callback: ({ error, data, }) => {
                if (error) {
                    callback({ error });
                    return;
                }
                if (!data.exists) {
                    callback({ error: new errorCreator.DoesNotExist({ name: `room ${roomId}` }) });
                    return;
                }
                updateObject({
                    messageId,
                    update,
                    options,
                    callback,
                });
            },
        });
        return;
    }
    updateObject({
        messageId,
        update,
        options,
        callback,
    });
}
function getMessagesByRoom({ roomId, callback, startDate, shouldGetFuture, user, }) {
    const query = dbConnector.createUserQuery({ user });
    query.roomId = roomId;
    getMessages({
        callback,
        startDate,
        shouldGetFuture,
        query,
        errorNameContent: 'getMessagesByRoom',
    });
}
function getMessagesByUser({ user, callback, }) {
    const query = dbConnector.createUserQuery({ user });
    query.roomId = { $in: user.followingRooms };
    getMessages({
        query,
        callback,
    });
}
function removeMessagesByRoom({ roomId, callback, }) {
    dbConnector.removeObjects({
        callback,
        object: Message,
        query: { roomId },
    });
}
function removeMessagesByUser({ ownerId, callback, }) {
    dbConnector.removeObjects({
        callback,
        object: Message,
        query: { ownerId },
    });
}
function removeMessagesByAlias({ ownerAliasId, callback, }) {
    dbConnector.removeObjects({
        callback,
        object: Message,
        query: { ownerAliasId },
    });
}
function getMessageById({ messageId, callback, }) {
    getMessage({
        callback,
        query: { _id: messageId },
    });
}
function removeMessage({ messageId, callback, }) {
    dbConnector.removeObject({
        callback,
        query: { _id: messageId },
        object: Message,
    });
}
function getAllMessages({ callback }) {
    getMessages({
        callback,
        query: {},
    });
}
export { createMessage };
export { updateMessage };
export { getMessagesByRoom };
export { removeMessagesByRoom };
export { removeMessagesByUser };
export { removeMessage };
export { getMessageById };
export { removeMessagesByAlias };
export { getMessagesByUser };
export { getAllMessages };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVzc2FnZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm1lc3NhZ2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsWUFBWSxDQUFDO0FBRWIsT0FBTyxRQUFRLE1BQU0sVUFBVSxDQUFDO0FBQ2hDLE9BQU8sV0FBVyxNQUFNLHNCQUFzQixDQUFDO0FBQy9DLE9BQU8sRUFBRSxTQUFTLEVBQUUsUUFBUSxFQUFFLE1BQU0sOEJBQThCLENBQUM7QUFFbkUsT0FBTyxZQUFZLE1BQU0sMEJBQTBCLENBQUM7QUFDcEQsT0FBTyxNQUFNLE1BQU0sUUFBUSxDQUFDO0FBRTVCLE1BQU0sYUFBYSxHQUFHLElBQUksUUFBUSxDQUFDLE1BQU0sQ0FBQyxXQUFXLENBQUMsWUFBWSxDQUFDO0lBQ2pFLFdBQVcsRUFBRTtRQUNYLElBQUksRUFBRSxNQUFNO1FBQ1osT0FBTyxFQUFFLFFBQVEsQ0FBQyxZQUFZLENBQUMsSUFBSTtLQUNwQztJQUNELElBQUksRUFBRTtRQUNKLElBQUksRUFBRSxDQUFDLE1BQU0sQ0FBQztRQUNkLE9BQU8sRUFBRSxFQUFFO0tBQ1o7SUFDRCxPQUFPLEVBQUUsQ0FBQyxNQUFNLENBQUM7SUFDakIsTUFBTSxFQUFFLE1BQU07SUFDZCxXQUFXLEVBQUUsV0FBVyxDQUFDLGlCQUFpQjtJQUMxQyxLQUFLLEVBQUUsQ0FBQyxNQUFNLENBQUM7SUFDZixLQUFLLEVBQUUsQ0FBQyxNQUFNLENBQUM7SUFDZixLQUFLLEVBQUUsV0FBVyxDQUFDLFdBQVc7Q0FDL0IsQ0FBQyxFQUFFLEVBQUUsVUFBVSxFQUFFLFVBQVUsRUFBRSxDQUFDLENBQUM7QUFFaEMsTUFBTSxPQUFPLEdBQUcsUUFBUSxDQUFDLEtBQUssQ0FBQyxTQUFTLEVBQUUsYUFBYSxDQUFDLENBQUM7QUFVekQsU0FBUyxZQUFZLENBQUMsRUFDcEIsU0FBUyxFQUNULE1BQU0sRUFDTixRQUFRLEdBQ1Q7SUFDQyxXQUFXLENBQUMsWUFBWSxDQUFDO1FBQ3ZCLE1BQU07UUFDTixL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