'use strict';
import authenticator from '../helpers/authenticator';
import errorCreator from '../error/errorCreator';
import { appConfig, dbConfig } from '../config/defaults/config';
import transactionManager from './transactions';
import textTools from '../utils/textTools';
import docFileManager from './docFiles';
import managerHelper from '../helpers/manager';
function getGameCodeById({ token, callback, gameCodeId, }) {
    managerHelper.getObjectById({
        token,
        callback,
        objectId: gameCodeId,
        objectType: 'gameCode',
        objectIdType: 'gameCodeId',
        dbCallFunc: getGameCodeById,
        commandName: dbConfig.apiCommands.GetGameCode.name,
    });
}
function triggerUnlockedContent({ token, gameCode, callback, io, user, socket, }) {
    const dataToSend = {
        data: {
            gameCode: {
                ownerId: gameCode.ownerAliasId || gameCode.ownerId,
                codeType: gameCode.codeType,
                content: {},
            },
        },
    };
    switch (gameCode.codeType) {
        case dbConfig.GameCodeTypes.TRANSACTION: {
            transactionManager.createTransaction({
                io,
                socket,
                transaction: {
                    ownerId: gameCode.ownerId,
                    toWalletId: user.objectId,
                    fromWalletId: gameCode.ownerAliasId || gameCode.ownerId,
                    amount: appConfig.gameCodeAmount,
                },
                callback: ({ error, data, }) => {
                    if (error) {
                        callback({ error });
                        return;
                    }
                    dataToSend.content.transaction = data.transaction;
                    callback(dataToSend);
                },
            });
            break;
        }
        case dbConfig.GameCodeTypes.DOCFILE: {
            docFileManager.unlockDocFile({
                token,
                io,
                aliasId: gameCode.ownerAliasId,
                internalCallUser: user,
                code: gameCode.codeContent[0],
                callback: ({ error, data, }) => {
                    if (error) {
                        callback({ error });
                        return;
                    }
                    dataToSend.data.content.docFile = data.docFile;
                    callback(dataToSend);
                },
            });
            break;
        }
        case dbConfig.GameCodeTypes.TEXT: {
            dataToSend.data.text = gameCode.codeContent;
            callback(dataToSend);
            break;
        }
        default: {
            callback({ error: new errorCreator.InvalidData({ name: `Unlock game code content. User: ${user.obj}. Game code: ${gameCode.objectId}. CodeType: ${gameCode.codeType}` }) });
            break;
        }
    }
}
function createGameCode({ gameCode, token, io, callback, }) {
    authenticator.isUserAllowed({
        token,
        commandName: dbConfig.apiCommands.CreateGameCode.name,
        callback: ({ error, data, }) => {
            if (error) {
                callback({ error });
                return;
            }
            const { user: authUser } = data;
            const gameCodeToSave = gameCode;
            gameCodeToSave.ownerId = authUser.objectId;
            gameCodeToSave.code = (gameCodeToSave.code || textTools.generateTextCode()).toLowerCase();
            if (gameCodeToSave.ownerAliasId && !authUser.aliases.includes(gameCodeToSave.ownerAliasId)) {
                callback({ error: new errorCreator.NotAllowed({ name: `${dbConfig.apiCommands.CreateGameCode.name}. User: ${authUser.objectId}. Access game code with alais ${gameCodeToSave.ownerAliasId}` }) });
                return;
            }
            createGameCode({
                gameCode: gameCodeToSave,
                callback: (gameCodeData) => {
                    if (gameCodeData.error) {
                        callback({ error: gameCodeData.error });
                        return;
                    }
                    const dataToSend = {
                        data: {
                            gameCode: gameCodeData.data.gameCode,
                            changeType: dbConfig.ChangeTypes.CREATE,
                        },
                    };
                    io.to(authUser.objectId)
                        .emit(dbConfig.EmitTypes.GAMECODE, dataToSend);
                    callback(dataToSend);
                },
            });
        },
    });
}
function useGameCode({ io, code, token, callback, }) {
    authenticator.isUserAllowed({
        token,
        commandName: dbConfig.apiCommands.UseGameCode.name,
        callback: ({ error, data, }) => {
            if (error) {
                callback({ error });
                return;
            }
            const { user: authUser } = data;
            getGameCodeById({
                code,
                callback: ({ error: getError, data: getData, }) => {
                    if (getError) {
                        callback({ error: getError });
                        return;
                    }
                    if (getData.gameCode.ownerId === authUser.objectId) {
                        callback({ error: new errorCreator.NotAllowed({ name: 'useGameCode on yourself' }) });
                        return;
                    }
                    removeGameCode({
                        code,
                        callback: ({ error: removeError }) => {
                            if (removeError) {
                                callback({ error: removeError });
                                return;
                            }
                            const { gameCode: usedGameCode } = getData;
                            triggerUnlockedContent({
                                token,
                                user: authUser,
                                gameCode: usedGameCode,
                                callback: ({ error: unlockError, data: unlockData, }) => {
                                    if (unlockError) {
                                        callback({ error: unlockError });
                                        return;
                                    }
                                    const dataToOwner = {
                                        data: {
                                            gameCode: usedGameCode,
                                            changeType: dbConfig.ChangeTypes.REMOVE,
                                        },
                                    };
                                    if (usedGameCode.isRenewable) {
                                        createGameCode({
                                            gameCode: {
                                                ownerId: usedGameCode.ownerId,
                                                ownerAliasId: usedGameCode.ownerAliasId,
                                                codeType: usedGameCode.codeType,
                                                codeContent: usedGameCode.codeContent,
                                                isRenewable: true,
                                            },
                                            callback: ({ error: createError, data: createData, }) => {
                                                if (createError) {
                                                    callback({ error: createError });
                                                    return;
                                                }
                                                dataToOwner.data.newGameCode = createData.gameCode;
                                                io.to(usedGameCode.ownerId)
                                                    .emit(dbConfig.EmitTypes.GAMECODE, dataToOwner);
                                            },
                                        });
                                        callback({ data: unlockData });
                                        return;
                                    }
                                    io.to(usedGameCode.ownerId)
                                        .emit(dbConfig.EmitTypes.GAMECODE, dataToOwner);
                                    callback({ data: unlockData });
                                },
                            });
                        },
                    });
                },
            });
        },
    });
}
function removeGameCode({ gameCodeId, token, io, callback, socket, }) {
    managerHelper.removeObject({
        callback,
        token,
        io,
        socket,
        getDbCallFunc: getGameCodeById,
        getCommandName: dbConfig.apiCommands.GetGameCode.name,
        objectId: gameCodeId,
        commandName: dbConfig.apiCommands.RemoveGameCode.name,
        objectType: 'gameCode',
        dbCallFunc: removeGameCode,
        emitType: dbConfig.EmitTypes.GAMECODE,
        objectIdType: 'gameCodeId',
    });
}
function getProfileGameCode({ ownerId, callback, token, }) {
    authenticator.isUserAllowed({
        token,
        commandName: dbConfig.apiCommands.GetGameCode.name,
        callback: ({ error }) => {
            if (error) {
                callback({ error });
                return;
            }
            getProfileGameCode({
                ownerId,
                callback,
            });
        },
    });
}
function updateGameCode({ token, io, callback, gameCodeId, gameCode, options, socket, }) {
    managerHelper.updateObject({
        callback,
        options,
        token,
        io,
        socket,
        toStrip: [
            'codeContent',
            'code',
        ],
        objectId: gameCodeId,
        object: gameCode,
        commandName: dbConfig.apiCommands.UpdateGameCode.name,
        objectType: 'gameCode',
        dbCallFunc: updateGameCode,
        emitType: dbConfig.EmitTypes.GAMECODE,
        objectIdType: 'gameCodeId',
        getDbCallFunc: getGameCodeById,
        getCommandName: dbConfig.apiCommands.GetGameCode.name,
    });
}
function getGameCodesByUser({ token, callback, }) {
    managerHelper.getObjects({
        callback,
        token,
        shouldSort: true,
        commandName: dbConfig.apiCommands.GetGameCode.name,
        objectsType: 'gameCodes',
        dbCallFunc: getGameCodesByUser,
    });
}
export { createGameCode };
export { useGameCode };
export { removeGameCode };
export { getProfileGameCode };
export { updateGameCode };
export { getGameCodeById };
export { getGameCodesByUser };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2FtZUNvZGVzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZ2FtZUNvZGVzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFlBQVksQ0FBQztBQUViLE9BQU8sYUFBYSxNQUFNLDBCQUEwQixDQUFDO0FBQ3JELE9BQU8sWUFBWSxNQUFNLHVCQUF1QixDQUFDO0FBQ2pELE9BQU8sRUFBRSxTQUFTLEVBQUUsUUFBUSxFQUFFLE1BQU0sMkJBQTJCLENBQUM7QUFFaEUsT0FBTyxrQkFBa0IsTUFBTSxnQkFBZ0IsQ0FBQztBQUNoRCxPQUFPLFNBQVMsTUFBTSxvQkFBb0IsQ0FBQztBQUMzQyxPQUFPLGNBQWMsTUFBTSxZQUFZLENBQUM7QUFDeEMsT0FBTyxhQUFhLE1BQU0sb0JBQW9CLENBQUM7QUFTL0MsU0FBUyxlQUFlLENBQUMsRUFDdkIsS0FBSyxFQUNMLFFBQVEsRUFDUixVQUFVLEdBQ1g7SUFDQyxhQUFhLENBQUMsYUFBYSxDQUFDO1FBQzFCLEtBQUs7UUFDTCxRQUFRO1FBQ1IsUUFBUSxFQUFFLFVBQVU7UUFDcEIsVUFBVSxFQUFFLFVBQVU7UUFDdEIsWUFBWSxFQUFFLFlBQVk7UUFDMUIsVUFBVSxFQUFFLGVBQWU7UUFDM0IsV0FBVyxFQUFFLFFBQVEsQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLElBQUk7S0FDbkQsQ0FBQyxDQUFDO0FBQ0wsQ0FBQztBQVVELFNBQVMsc0JBQXNCLENBQUMsRUFDOUIsS0FBSyxFQUNMLFFBQVEsRUFDUixRQUFRLEVBQ1IsRUFBRSxFQUNGLElBQUksRUFDSixNQUFNLEdBQ1A7SUFDQyxNQUFNLFVBQVUsR0FBRztRQUNqQixJQUFJLEVBQUU7WUFDSixRQUFRLEVBQUU7Z0JBQ1IsT0FBTyxFQUFFLFFBQVEsQ0FBQyxZQUFZLElBQUksUUFBUSxDQUFDLE9BQU87Z0JBQ2xELFFBQVEsRUFBRSxRQUFRLENBQUMsUUFBUTtnQkFDM0IsT0FBTyxFQUFFLEVBQUU7YUFDWjtTQUNGO0tBQ0YsQ0FBQztJQUVGLFFB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