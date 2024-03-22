'use strict';
import mongoose from 'mongoose';
import dbConnector from '../databaseConnector';
import errorCreator from '../../error/errorCreator';
import { dbConfig } from '../../config/defaults/config';
const gameCodeSchema = new mongoose.Schema(dbConnector.createSchema({
    code: {
        type: String,
        unique: true,
    },
    codeType: {
        type: String,
        default: dbConfig.GameCodeTypes.TRANSACTION,
    },
    codeContent: {
        type: [String],
        default: [],
    },
    isRenewable: {
        type: Boolean,
        default: false,
    },
    used: {
        type: Boolean,
        default: false,
    },
}), { collection: 'gameCodes' });
const GameCode = mongoose.model('GameCode', gameCodeSchema);
function updateObject({ gameCodeId, update, callback, }) {
    dbConnector.updateObject({
        update,
        query: { _id: gameCodeId },
        object: GameCode,
        errorNameContent: 'updateGameCode',
        callback: ({ error, data, }) => {
            if (error) {
                callback({ error });
                return;
            }
            callback({ data: { gameCode: data.object } });
        },
    });
}
function getGameCode({ query, callback, filter, }) {
    dbConnector.getObject({
        query,
        filter,
        object: GameCode,
        callback: ({ error, data, }) => {
            if (error) {
                callback({ error });
                return;
            }
            if (!data.object) {
                callback({ error: new errorCreator.DoesNotExist({ name: `gameCode ${JSON.stringify(query, null, 4)}` }) });
                return;
            }
            callback({ data: { gameCode: data.object } });
        },
    });
}
function getGameCodes({ query, filter, callback, }) {
    dbConnector.getObjects({
        query,
        filter,
        object: GameCode,
        callback: ({ error, data, }) => {
            if (error) {
                callback({ error });
                return;
            }
            callback({
                data: {
                    gameCodes: data.objects,
                },
            });
        },
    });
}
function doesExist({ query, callback, }) {
    dbConnector.getObject({
        query,
        callback,
        object: GameCode,
    });
}
function createGameCode({ gameCode, callback, }) {
    doesExist({
        query: { code: gameCode.code },
        callback: ({ error, data, }) => {
            if (error) {
                callback({ error });
                return;
            }
            if (data.exists) {
                callback({ error: new errorCreator.AlreadyExists({ name: `Game code ${gameCode.code}` }) });
                return;
            }
            dbConnector.saveObject({
                object: new GameCode(gameCode),
                objectType: 'gameCode',
                callback: (savedData) => {
                    if (savedData.error) {
                        callback({ error: savedData.error });
                        return;
                    }
                    callback({ data: { gameCode: savedData.data.savedObject } });
                },
            });
        },
    });
}
function updateGameCode({ gameCodeId, gameCode, callback, }) {
    const { codeType, isRenewable, used, codeContent, } = gameCode;
    const update = { $set: {} };
    if (codeContent) {
        update.$set.codeContent = codeContent;
    }
    if (codeType) {
        update.$set.codeType = codeType;
    }
    if (typeof isRenewable === 'boolean') {
        update.$set.isRenewable = isRenewable;
    }
    if (typeof used === 'boolean') {
        update.$set.used = used;
    }
    updateObject({
        update,
        callback,
        gameCodeId,
    });
}
function getGameCodesByUser({ user, callback, }) {
    const query = dbConnector.createUserQuery({ user });
    query.used = false;
    getGameCodes({
        callback,
        query,
    });
}
function getGameCodeById({ gameCodeId, callback, }) {
    const query = { _id: gameCodeId };
    getGameCode({
        query,
        callback,
    });
}
function removeGameCode({ gameCodeId, callback, }) {
    dbConnector.removeObject({
        callback,
        object: GameCode,
        query: { _id: gameCodeId },
    });
}
function getProfileGameCode({ ownerId, callback, }) {
    const query = {
        ownerId,
        codeType: dbConfig.GameCodeTypes.PROFILE,
    };
    getGameCode({
        callback,
        query,
    });
}
export { createGameCode };
export { updateGameCode };
export { removeGameCode };
export { getGameCodeById };
export { getGameCodesByUser };
export { getProfileGameCode };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2FtZUNvZGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJnYW1lQ29kZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxZQUFZLENBQUM7QUFFYixPQUFPLFFBQVEsTUFBTSxVQUFVLENBQUM7QUFDaEMsT0FBTyxXQUFXLE1BQU0sc0JBQXNCLENBQUM7QUFDL0MsT0FBTyxZQUFZLE1BQU0sMEJBQTBCLENBQUM7QUFDcEQsT0FBTyxFQUFFLFFBQVEsRUFBRSxNQUFNLDhCQUE4QixDQUFDO0FBRXhELE1BQU0sY0FBYyxHQUFHLElBQUksUUFBUSxDQUFDLE1BQU0sQ0FBQyxXQUFXLENBQUMsWUFBWSxDQUFDO0lBQ2xFLElBQUksRUFBRTtRQUNKLElBQUksRUFBRSxNQUFNO1FBQ1osTUFBTSxFQUFFLElBQUk7S0FDYjtJQUNELFFBQVEsRUFBRTtRQUNSLElBQUksRUFBRSxNQUFNO1FBQ1osT0FBTyxFQUFFLFFBQVEsQ0FBQyxhQUFhLENBQUMsV0FBVztLQUM1QztJQUNELFdBQVcsRUFBRTtRQUNYLElBQUksRUFBRSxDQUFDLE1BQU0sQ0FBQztRQUNkLE9BQU8sRUFBRSxFQUFFO0tBQ1o7SUFDRCxXQUFXLEVBQUU7UUFDWCxJQUFJLEVBQUUsT0FBTztRQUNiLE9BQU8sRUFBRSxLQUFLO0tBQ2Y7SUFDRCxJQUFJLEVBQUU7UUFDSixJQUFJLEVBQUUsT0FBTztRQUNiLE9BQU8sRUFBRSxLQUFLO0tBQ2Y7Q0FDRixDQUFDLEVBQUUsRUFBRSxVQUFVLEVBQUUsV0FBVyxFQUFFLENBQUMsQ0FBQztBQUVqQyxNQUFNLFFBQVEsR0FBRyxRQUFRLENBQUMsS0FBSyxDQUFDLFVBQVUsRUFBRSxjQUFjLENBQUMsQ0FBQztBQVU1RCxTQUFTLFlBQVksQ0FBQyxFQUNwQixVQUFVLEVBQ1YsTUFBTSxFQUNOLFFBQVEsR0FDVDtJQUNDLFdBQVcsQ0FBQyxZQUFZLENBQUM7UUFDdkIsTUFBTTtRQUNOLEtBQUssRUFBRSxFQUFFLEdBQUcsRUFBRSxVQUFVLEVBQUU7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QztJQUNELElBQUksT0FBTyxJQUFJLEtBQUssU0FBUyxFQUFFLENBQUM7UUFDOUIsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDO0lBQzFCLENBQUM7SUFFRCxZQUFZLENBQUM7UUFDWCxNQUFNO1FBQ04sUUFBUTtRQUNSLFVBQVU7S0FDWCxDQUFDLENBQUM7QUFDTCxDQUFDO0FBUUQsU0FBUyxrQkFBa0IsQ0FBQyxFQUMxQixJQUFJLEVBQ0osUUFBUSxHQUNUO0lBQ0MsTUFBTSxLQUFLLEdBQUcsV0FBVyxDQUFDLGVBQWUsQ0FBQyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7SUFDcEQsS0FBSyxDQUFDLElBQUksR0FBRyxLQUFLLENBQUM7SUFFbkIsWUFBWSxDQUFDO1FBQ1gsUUFBUTtRQUNSLEtBQUs7S0FDTixDQUFDLENBQUM7QUFDTCxDQUFDO0FBUUQsU0FBUyxlQUFlLENBQUMsRUFDdkIsVUFBVSxFQUNWLFFBQVEsR0FDVDtJQUNDLE1BQU0sS0FBSyxHQUFHLEVBQUUsR0FBRyxFQUFFLFVBQVUsRUFBRSxDQUFDO0lBRWxDLFdBQVcsQ0FBQztRQUNWLEtBQUs7UUFDTCxRQUFRO0tBQ1QsQ0FBQyxDQUFDO0FBQ0wsQ0FBQztBQVFELFNBQVMsY0FBYyxDQUFDLEVBQ3RCLFVBQVUsRUFDVixRQUFRLEdBQ1Q7SUFDQyxXQUFXLENBQUMsWUFBWSxDQUFDO1FBQ3ZCLFFBQVE7UUFDUixNQUFNLEVBQUUsUUFBUTtRQUNoQixLQUFLLEVBQUUsRUFBRSxHQUFHLEVBQUUsVUFBVSxFQUFFO0tBQzNCLENBQUMsQ0FBQztBQUNMLENBQUM7QUFRRCxTQUFTLGtCQUFrQixDQUFDLEVBQzFCLE9BQU8sRUFDUCxRQUFRLEdBQ1Q7SUFDQyxNQUFNLEtBQUssR0FBRztRQUNaLE9BQU87UUFDUCxRQUFRLEVBQUUsUUFBUSxDQUFDLGFBQWEsQ0FBQyxPQUFPO0tBQ3pDLENBQUM7SUFFRixXQUFXLENBQUM7UUFDVixRQUFRO1FBQ1IsS0FBSztLQUNOLENBQUMsQ0FBQztBQUNMLENBQUM7QUFFRCxPQUFPLEVBQUUsY0FBYyxFQUFFLENBQUM7QUFDMUIsT0FBTyxFQUFFLGNBQWMsRUFBRSxDQUFDO0FBQzFCLE9BQU8sRUFBRSxjQUFjLEVBQUUsQ0FBQztBQUMxQixPQUFPLEVBQUUsZUFBZSxFQUFFLENBQUM7QUFDM0IsT0FBTyxFQUFFLGtCQUFrQixFQUFFLENBQUM7QUFDOUIsT0FBTyxFQUFFLGtCQUFrQixFQUFFLENBQUMifQ==