'use strict';
import { appConfig, dbConfig } from '../config/defaults/config';
import authenticator from '../helpers/authenticator';
import errorCreator from '../error/errorCreator';
import dbPosition from '../db/connectors/position';
import mapCreator from '../utils/mapCreator';
import managerHelper from '../helpers/manager';
function getPositionById({ token, positionId, callback, needsAccess, internalCallUser, }) {
    managerHelper.getObjectById({
        token,
        internalCallUser,
        callback,
        needsAccess,
        objectId: positionId,
        objectType: 'position',
        objectIdType: 'positionId',
        dbCallFunc: getPositionById,
        commandName: dbConfig.apiCommands.GetPositions.name,
    });
}
function getAndStoreGooglePositions({ io, callback = () => {
}, }) {
    if (!appConfig.mapLayersPath) {
        callback({ error: new errorCreator.InvalidData({ expected: 'Map layer is not set' }) });
        return;
    }
    mapCreator.getGooglePositions({
        callback: (googleData) => {
            if (googleData.error) {
                callback({ error: googleData.error });
                return;
            }
            dbPosition.removePositionsByOrigin({
                origin: dbConfig.PositionOrigins.GOOGLE,
                callback: (removeData) => {
                    if (removeData.error) {
                        callback({ error: removeData.error });
                        return;
                    }
                    const { positions } = googleData.data;
                    const positionAmount = positions.length;
                    const createdPositions = [];
                    const sendCallback = ({ error, iteration, }) => {
                        if (error) {
                            callback({ error });
                            return;
                        }
                        const dataToReturn = {
                            data: {
                                positions: createdPositions,
                                changeType: dbConfig.ChangeTypes.CREATE,
                            },
                        };
                        if (iteration === positionAmount) {
                            io.emit(dbConfig.EmitTypes.POSITIONS, dataToReturn);
                            callback(dataToReturn);
                        }
                    };
                    let iteration = 1;
                    positions.forEach((position) => {
                        createPosition({
                            position,
                            callback: ({ error, data, }) => {
                                if (error) {
                                    callback({ error });
                                    return;
                                }
                                createdPositions.push(data.position);
                                sendCallback({
                                    error,
                                    iteration: iteration += 1,
                                });
                            },
                        });
                    });
                },
            });
        },
    });
}
function updatePosition({ positionId, position, token, io, callback, options, socket, internalCallUser, }) {
    managerHelper.updateObject({
        callback,
        options,
        token,
        io,
        socket,
        internalCallUser,
        objectId: positionId,
        object: position,
        commandName: dbConfig.apiCommands.UpdatePosition.name,
        objectType: 'position',
        dbCallFunc: updatePosition,
        emitType: dbConfig.EmitTypes.POSITION,
        objectIdType: 'positionId',
        getDbCallFunc: getPositionById,
        getCommandName: dbConfig.apiCommands.GetPositions.name,
    });
}
function createPosition({ position, token, io, internalCallUser, callback, socket, isUserPosition = false, }) {
    authenticator.isUserAllowed({
        token,
        internalCallUser,
        commandName: dbConfig.apiCommands.CreatePosition.name,
        callback: ({ error, data, }) => {
            if (error) {
                callback({ error });
                return;
            }
            if (!isUserPosition && (!position.coordinates || !position.coordinates.latitude || !position.coordinates.longitude)) {
                callback({ error: new errorCreator.InvalidData({ expected: 'latitude && longitude && accuracy' }) });
                return;
            }
            if ((position.positionName && (position.positionName.length > appConfig.positionNameMaxLength || position.positionName.length <= 0))
                || (position.description && position.description.join('').length > appConfig.docFileMaxLength)) {
                callback({ error: new errorCreator.InvalidCharacters({ expected: `text length: ${appConfig.docFileMaxLength}, title length: ${appConfig.positionNameMaxLength}` }) });
                return;
            }
            if (!isUserPosition && position.coordinates.accuracy && position.coordinates.accuracy > appConfig.minimumPositionAccuracy) {
                callback({ error: new errorCreator.InvalidData({ expected: `accuracy less than ${appConfig.minimumPositionAccuracy}` }) });
                return;
            }
            const { user: authUser } = data;
            const newPosition = position;
            newPosition.ownerId = authUser.objectId;
            if (newPosition.coordinates) {
                newPosition.coordinates.accuracy = newPosition.coordinates.accuracy || appConfig.minimumPositionAccuracy;
            }
            if (position.positionStructure && position.positionStructure === dbConfig.PositionStructures.CIRCLE && !position.radius) {
                newPosition.radius = appConfig.defaultPositionRadius;
            }
            if (newPosition.ownerAliasId && !authUser.aliases.includes(newPosition.ownerAliasId)) {
                callback({ error: new errorCreator.NotAllowed({ name: `create position with alias ${newPosition.ownerAliasId}` }) });
                return;
            }
            createPosition({
                suppressExistsError: isUserPosition,
                options: {
                    setId: isUserPosition,
                },
                position: newPosition,
                callback: ({ error: updateError, data: positionData, }) => {
                    if (updateError) {
                        callback({ error: updateError });
                        return;
                    }
                    const { position: updatedPosition } = positionData;
                    const dataToReturn = {
                        data: {
                            position: updatedPosition,
                            changeType: dbConfig.ChangeTypes.CREATE,
                        },
                    };
                    const dataToSend = {
                        data: {
                            position: managerHelper.stripObject({ object: { ...updatedPosition } }),
                            changeType: dbConfig.ChangeTypes.CREATE,
                        },
                    };
                    if (socket && !isUserPosition) {
                        socket.broadcast.emit(dbConfig.EmitTypes.POSITION, dataToSend);
                    }
                    else {
                        io.emit(dbConfig.EmitTypes.POSITION, dataToSend);
                    }
                    callback(dataToReturn);
                },
            });
        },
    });
}
function getPositionsByUser({ token, callback, }) {
    managerHelper.getObjects({
        callback,
        token,
        shouldSort: true,
        sortName: 'positionName',
        commandName: dbConfig.apiCommands.GetPositions.name,
        objectsType: 'positions',
        dbCallFunc: getPositionsByUser,
    });
}
function removePosition({ positionId, token, callback, io, socket, internalCallUser, }) {
    managerHelper.removeObject({
        callback,
        token,
        io,
        socket,
        internalCallUser,
        getDbCallFunc: getPositionById,
        getCommandName: dbConfig.apiCommands.GetPositions.name,
        objectId: positionId,
        commandName: dbConfig.apiCommands.RemovePosition.name,
        objectType: 'position',
        dbCallFunc: removePosition,
        emitType: dbConfig.EmitTypes.POSITION,
        objectIdType: 'positionId',
    });
}
export { updatePosition };
export { getPositionsByUser };
export { createPosition };
export { removePosition };
export { getPositionById };
export { getAndStoreGooglePositions };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9zaXRpb25zLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsicG9zaXRpb25zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFlBQVksQ0FBQztBQUViLE9BQU8sRUFBRSxTQUFTLEVBQUUsUUFBUSxFQUFFLE1BQU0sMkJBQTJCLENBQUM7QUFFaEUsT0FBTyxhQUFhLE1BQU0sMEJBQTBCLENBQUM7QUFDckQsT0FBTyxZQUFZLE1BQU0sdUJBQXVCLENBQUM7QUFDakQsT0FBTyxVQUFVLE1BQU0sMkJBQTJCLENBQUM7QUFDbkQsT0FBTyxVQUFVLE1BQU0scUJBQXFCLENBQUM7QUFDN0MsT0FBTyxhQUFhLE1BQU0sb0JBQW9CLENBQUM7QUFVL0MsU0FBUyxlQUFlLENBQUMsRUFDdkIsS0FBSyxFQUNMLFVBQVUsRUFDVixRQUFRLEVBQ1IsV0FBVyxFQUNYLGdCQUFnQixHQUNqQjtJQUNDLGFBQWEsQ0FBQyxhQUFhLENBQUM7UUFDMUIsS0FBSztRQUNMLGdCQUFnQjtRQUNoQixRQUFRO1FBQ1IsV0FBVztRQUNYLFFBQVEsRUFBRSxVQUFVO1FBQ3BCLFVBQVUsRUFBRSxVQUFVO1FBQ3RCLFlBQVksRUFBRSxZQUFZO1FBQzFCLFVBQVUsRUFBRSxlQUFlO1FBQzNCLFdBQVcsRUFBRSxRQUFRLENBQUMsV0FBVyxDQUFDLFlBQVksQ0FBQyxJQUFJO0tBQ3BELENBQUMsQ0FBQztBQUNMLENBQUM7QUFRRCxTQUFTLDBCQUEwQixDQUFDLEVBQ2xDLEVBQUUsRUFDRixRQUFRLEdBQUcsR0FBRyxFQUFFO0FBQ2hCLENBQUMsR0FDRjtJQUNDLElBQUksQ0FBQyxTQUFTLENBQUMsYUFBYSxFQUFFLENBQUM7UUFDN0IsUUFBUSxDQUFDLEVBQUUsS0FBSyxFQUFFLElBQUksWUFBWSxDQUFDLFdBQVcsQ0FBQyxFQUFFLFFBQVEsRUFBRSxzQkFBc0IsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBRXhGLE9BQU87SUFDVCxDQUFDO0lBRUQsVUFBVSxDQUFDLGtCQUFrQixDQUFDO1FBQzVCLFFBQVEsRUFBRSxDQUFDLFVBQVUsRUFBRSxFQUFFO1lBQ3ZCLElBQUksVUFBVSxDQUFDLEtBQUssRUFBRSxDQUFDO2dCQUNyQixRQUFRLENBQUMsRUFBRSxLQUFLLEVBQUUsVUFBVSxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUM7Z0JBRXRDLE9BQU87WUFDVCxDQUFDO1lBRUQsVUFBVSxDQUFDLHVCQUF1QixDQUFDO2dCQUNqQyxNQUFNLEVBQUUsUUFBUSxDQUFDLGVBQWUsQ0FBQyxNQUFNO2dCQUN2QyxRQUFRLEVBQUUsQ0FBQyxVQUFVLEVBQUUsRUFBRTtvQkFDdkIsSUFBSSxVQUFVLENBQUMsS0FBSyxFQUFFLENBQUM7d0JBQ3JCLFFBQVEsQ0FBQyxFQUFFLEtBQUssRUFBRSxVQUFVLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQzt3QkFFdEMsT0FBTztvQkFDVCxDQUFDO29CQUVELE1BQU0sRUFBRSxTQUFTLEVBQUUsR0FBRyxVQUFVLENBQUMsSUFBSSxDQUFDO29CQUN0QyxNQUFNLGNBQWMsR0FBRyxTQUFTLENBQUMsTUFBTSxDQUFDO29CQUN4QyxNQUFNLGdCQUFnQixHQUFHLEVBQUUsQ0FBQztvQkFDNUIsTUFBTSxZQUFZLEdBQUcsQ0FBQyxFQUNwQixLQUFLLEVBQ0wsU0FBUyxHQUNWLEVBQUUsRUFBRTt3QkFDSCxJQUFJLEtBQUssRUFBRSxDQUFDOzRCQUNWLFFBQVEsQ0FBQyxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUM7NEJBRXBCLE9BQU87d0JBQ1QsQ0FBQzt3QkFFRCxNQUFNLFlBQVksR0FBRzs0QkFDbkIsSUFBSSxFQUFFO2dDQUNKLFNBQVMsRUFBRSxnQkFBZ0I7Z0NBQzNCLFVBQVUsRUFBRSxRQUFRLENBQUMsV0FBVyxDQUFDLE1BQU07NkJBQ3hDO3lCQUNGLENBQUM7d0JBRUYsSUFBSSxTQUFTLEtBQUssY0FBYyxFQUFFLENBQUM7NEJBQ2pDLEVBQUUsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLFNBQVMsQ0FBQyxTQUFTLEVBQUUsWUFBWSxDQUFDLENBQUM7NEJBRXBELFFBQVEsQ0FBQyxZQUFZLENBQUMsQ0FBQzt3QkFDekIsQ0FBQztvQkFDSCxDQUFDLENBQUM7b0JBQ0YsSUFBSSxTQUFTLEdBQUcsQ0FBQyxDQUFDO29CQUVsQixTQUFTLENBQUMsT0FBTyxDQUFDLENBQUMsUUFBUSxFQUFFLEVBQUU7d0JBQzdCLGNBQWMsQ0FBQzs0QkFDYixRQUFROzRCQUNSLFFBQVEsRUFBRSxDQUFDLEVBQ1QsS0FBSyxFQUNMLElBQUksR0FDTCxFQUFFLEVBQUU7Z0NBQ0gsSUFBSSxLQUFLLEVBQUUsQ0FBQztvQ0FDVixRQUFRLENBQUMsRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDO29DQUVwQixPQUFPO2dDQUNULENBQUM7Z0NBRUQsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztnQ0FDckMsWUFBWSxDQUFDO29DQUNYLEtBQUs7b0NBQ0wsU0FBUyxFQUFFLFNBQVMsSUFBSSxDQUFDO2lDQUMxQixDQUFDLENBQUM7NEJBQ0wsQ0FBQzt5QkFDRixDQUFDLENBQUM7b0JBQ0wsQ0FBQyxDQUFDLENBQUM7Z0JBQ0wsQ0FBQzthQUNGLENBQUMsQ0FBQztRQUNMLENBQUM7S0FDRixDQUFDLENBQUM7QUFDTCxDQUFDO0FBWUQsU0FBUyxjQUFjLENBQUMsRUFDdEIsVUFBVSxFQUNWLFFBQVEsRUFDUixLQUFLLEVBQ0wsRUFBRSxFQUNGLFFBQVEsRUFDUixPQUFPLEVBQ1AsTUFBTSxFQUNOLGdCQUFnQixHQUNqQjtJQUNDLGFBQWEsQ0FBQyxZQUFZLENBQUM7UUFDekIsUUFBUTtRQUNSLE9BQU87UUFDUCxLQUFLO1FBQ0wsRUFBRTtRQUNGLE1BQU07UUFDTixnQkFBZ0I7UUFDaEIsUUFBUSxFQUFFLFVBQVU7UUFDcEIsTUFBTSxFQUFFLFFBQVE7UUFDaEIsV0FBVyxFQUFFLFFBQVEsQ0FBQyxXQUFXLENBQUMsY0FBYyxDQUFDLElBQUk7UUFDckQsVUFBVSxFQUFFLFVBQVU7UUFDdEIsVUFBVSxFQUFFLGNBQWM7UUFDMUIsUUFBUSxFQUFFLFFBQVEsQ0FBQyxTQUFTLENBQUMsUUFBUTtRQUNyQyxZQUFZLEVBQUUsWUFBWTtRQUMxQixhQUFhLEVBQUUsZUFBZTtRQUM5QixjQUFjLEVBQUUsUUFBUSxDQUFDLFdBQVcsQ0FBQyxZQUFZLENBQUMsSUFBSTtLQUN2RCxDQUFDLENBQUM7QUFDTCxDQUFDO0FBVUQsU0FBUyxjQUFjLENBQUMsRUFDdEIsUUFBUSxFQUNSLEtBQUssRUFDTCxFQUFFLEVBQ0YsZ0JBQWdCLEVBQ2hCLFFBQVEsRUFDUixNQUFNLEVBQ04sY0FBYyxHQUFHLEtBQUssR0FDdkI7SUFDQyxhQUFhLENBQUMsYUFBYSxDQUFDO1FBQzFCLEtBQUs7UUFDTCxnQkFBZ0I7UUFDaEIsV0FBVyxFQUFFLFFBQVEsQ0FBQyxXQUFXLENBQUMsY0FBYyxDQUFDLElBQUk7UUFDckQsUUFBUSxFQUFFLENBQUMsRUFDVCxLQUFLLEVBQ0wsSUFBSSxHQUNMLEVBQUUsRUFBRTtZQUNILElBQUksS0FBSyxFQUFFLENBQUM7Z0JBQ1YsUUFBUSxDQUFDLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQztnQkFFcEIsT0FBTztZQUNULENBQUM7WUFFRCxJQUFJLENBQUMsY0FBYyxJQUFJLENBQUMsQ0FBQyxRQUFRLENBQUMsV0FBVyxJQUFJLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQyxRQUFRLElBQUksQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUM7Z0JBQ3BILFFBQVEsQ0FBQyxFQUFFLEtBQUssRUFBRSxJQUFJLFlBQVksQ0FBQyxXQUFXLENBQUMsRUFBRSxRQUFRLEVBQUUsbUNBQW1DLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQztnQkFFckcsT0FBTztZQUNULENBQUM7WUFFRCxJQUFJLENBQUMsUUFBUSxDQUFDLFlBQVksSUFBSSxDQUFDLFFBQVEsQ0FBQyxZQUFZLENBQUMsTUFBTSxHQUFHLFNBQVMsQ0FBQyxxQkFBcUIsSUFBSSxRQUFRLENBQUMsWUFBWSxDQUFDLE1BQU0sSUFBSSxDQUFDLENBQUMsQ0FBQzttQkFDL0gsQ0FBQyxRQUFRLENBQUMsV0FBVyxJQUFJLFFBQVEsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLE1BQU0sR0FBRyxTQUFTLENBQUMsZ0JBQWdCLENBQUMsRUFBRSxDQUFDO2dCQUNqRyxRQUFRLENBQUMsRUFBRSxLQUFLLEVBQUUsSUFBSSxZQUFZLENBQUMsaUJBQWlCLENBQUMsRUFBRSxRQUFRLEVBQUUsZ0JBQWdCLFNBQVMsQ0FBQyxnQkFBZ0IsbUJBQW1CLFNBQVMsQ0FBQyxxQkFBcUIsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7Z0JBRXRLLE9BQU87WUFDVCxDQUFDO1lBRUQsSUFBSSxDQUFDLGNBQWMsSUFBSSxRQUFRLENBQUMsV0FBVyxDQUFDLFFBQVEsSUFBSSxRQUFRLENBQUMsV0FBVyxDQUFDLFFBQVEsR0FBRyxTQUFTLENBQUMsdUJBQXVCLEVBQUUsQ0FBQztnQkFDMUgsUUFBUSxDQUFDLEVBQUUsS0FBSyxFQUFFLElBQUksWUFBWSxDQUFDLFdBQVcsQ0FBQyxFQUFFLFFBQVEsRUFBRSxzQkFBc0IsU0FBUyxDQUFDLHVCQUF1QixFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQztnQkFFM0gsT0FBTztZQUNULENBQUM7WUFFRCxNQUFNLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxHQUFHLElBQUksQ0FBQztZQUNoQyxNQUFNLFdBQVcsR0FBRyxRQUFRLENBQUM7WUFDN0IsV0FBVyxDQUFDLE9BQU8sR0FBRyxRQUFRLENBQUMsUUFBUSxDQUFDO1lBRXhDLElBQUksV0FBVyxDQUFDLFdBQVcsRUFBRSxDQUFDO2dCQUM1QixXQUFXLENBQUMsV0FBVyxDQUFDLFFBQVEsR0FBRyxXQUFXLENBQUMsV0FBVyxDQUFDLFFBQVEsSUFBSSxTQUFTLENBQUMsdUJBQXVCLENBQUM7WUFDM0csQ0FBQztZQUVELElBQUksUUFBUSxDQUFDLGlCQUFpQixJQUFJLFFBQVEsQ0FBQyxpQkFBaUIsS0FBSyxRQUFRLENBQUMsa0JBQWtCLENBQUMsTUFBTSxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUN4SCxXQUFXLENBQUMsTUFBTSxHQUFHLFNBQVMsQ0FBQyxxQkFBcUIsQ0FBQztZQUN2RCxDQUFDO1lBRUQsSUFBSSxXQUFXLENBQUMsWUFBWSxJQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDLFlBQVksQ0FBQyxFQUFFLENBQUM7Z0JBQ3JGLFFBQVEsQ0FBQyxFQUFFLEtBQUssRUFBRSxJQUFJLFlBQVksQ0FBQyxVQUFVLENBQUMsRUFBRSxJQUFJLEVBQUUsOEJBQThCLFdBQVcsQ0FBQyxZQUFZLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO2dCQUVySCxPQUFPO1lBQ1QsQ0FBQztZQUVELGNBQWMsQ0FBQztnQkFDYixtQkFBbUIsRUFBRSxjQUFjO2dCQUNuQyxPQUFPLEVBQUU7b0JBQ1AsS0FBSyxFQUFFLGNBQWM7aUJBQ3RCO2dCQUNELFFBQVEsRUFBRSxXQUFXO2dCQUNyQixRQUFRLEVBQUUsQ0FBQyxFQUNULEtBQUssRUFBRSxXQUFXLEVBQ2xCLElBQUksRUFBRSxZQUFZLEdBQ25CLEVBQUUsRUFBRTtvQkFDSCxJQUFJLFdBQVcsRUFBRSxDQUFDO3dCQUNoQixRQUFRLENBQUMsRUFBRSxLQUFLLEVBQUUsV0FBVyxFQUFFLENBQUMsQ0FBQzt3QkFFakMsT0FBTztvQkFDVCxDQUFDO29CQUVELE1BQU0sRUFBRSxRQUFRLEVBQUUsZUFBZSxFQUFFLEdBQUcsWUFBWSxDQUFDO29CQUNuRCxNQUFNLFlBQVksR0FBRzt3QkFDbkIsSUFBSSxFQUFFOzRCQUNKLFFBQVEsRUFBRSxlQUFlOzRCQUN6QixVQUFVLEVBQUUsUUFBUSxDQUFDLFdBQVcsQ0FBQyxNQUFNO3lCQUN4QztxQkFDRixDQUFDO29CQUNGLE1BQU0sVUFBVSxHQUFHO3dCQUNqQixJQUFJLEVBQUU7NEJBQ0osUUFBUSxFQUFFLGFBQWEsQ0FBQyxXQUFXLENBQUMsRUFBRSxNQUFNLEVBQUUsRUFBRSxHQUFHLGVBQWUsRUFBRSxFQUFFLENBQUM7NEJBQ3ZFLFVBQVUsRUFBRSxRQUFRLENBQUMsV0FBVyxDQUFDLE1BQU07eUJBQ3hDO3FCQUNGLENBQUM7b0JBRUYsSUFBSSxNQUFNLElBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQzt3QkFDOUIsTUFBTSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLFNBQVMsQ0FBQyxRQUFRLEVBQUUsVUFBVSxDQUFDLENBQUM7b0JBQ2pFLENBQUM7eUJBQU0sQ0FBQzt3QkFDTixFQUFFLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUMsUUFBUSxFQUFFLFVBQVUsQ0FBQyxDQUFDO29CQUNuRCxDQUFDO29CQUVELFFBQVEsQ0FBQyxZQUFZLENBQUMsQ0FBQztnQkFDekIsQ0FBQzthQUNGLENBQUMsQ0FBQztRQUNMLENBQUM7S0FDRixDQUFDLENBQUM7QUFDTCxDQUFDO0FBUUQsU0FBUyxrQkFBa0IsQ0FBQyxFQUMxQixLQUFLLEVBQ0wsUUFBUSxHQUNUO0lBQ0MsYUFBYSxDQUFDLFVBQVUsQ0FBQztRQUN2QixRQUFRO1FBQ1IsS0FBSztRQUNMLFVBQVUsRUFBRSxJQUFJO1FBQ2hCLFFBQVEsRUFBRSxjQUFjO1FBQ3hCLFdBQVcsRUFBRSxRQUFRLENBQUMsV0FBVyxDQUFDLFlBQVksQ0FBQyxJQUFJO1FBQ25ELFdBQVcsRUFBRSxXQUFXO1FBQ3hCLFVBQVUsRUFBRSxrQkFBa0I7S0FDL0IsQ0FBQyxDQUFDO0FBQ0wsQ0FBQztBQVVELFNBQVMsY0FBYyxDQUFDLEVBQ3RCLFVBQVUsRUFDVixLQUFLLEVBQ0wsUUFBUSxFQUNSLEVBQUUsRUFDRixNQUFNLEVBQ04sZ0JBQWdCLEdBQ2pCO0lBQ0MsYUFBYSxDQUFDLFlBQVksQ0FBQztRQUN6QixRQUFRO1FBQ1IsS0FBSztRQUNMLEVBQUU7UUFDRixNQUFNO1FBQ04sZ0JBQWdCO1FBQ2hCLGFBQWEsRUFBRSxlQUFlO1FBQzlCLGNBQWMsRUFBRSxRQUFRLENBQUMsV0FBVyxDQUFDLFlBQVksQ0FBQyxJQUFJO1FBQ3RELFFBQVEsRUFBRSxVQUFVO1FBQ3BCLFdBQVcsRUFBRSxRQUFRLENBQUMsV0FBVyxDQUFDLGNBQWMsQ0FBQyxJQUFJO1FBQ3JELFVBQVUsRUFBRSxVQUFVO1FBQ3RCLFVBQVUsRUFBRSxjQUFjO1FBQzFCLFFBQVEsRUFBRSxRQUFRLENBQUMsU0FBUyxDQUFDLFFBQVE7UUFDckMsWUFBWSxFQUFFLFlBQVk7S0FDM0IsQ0FBQyxDQUFDO0FBQ0wsQ0FBQztBQUVELE9BQU8sRUFBRSxjQUFjLEVBQUUsQ0FBQztBQUMxQixPQUFPLEVBQUUsa0JBQWtCLEVBQUUsQ0FBQztBQUM5QixPQUFPLEVBQUUsY0FBYyxFQUFFLENBQUM7QUFDMUIsT0FBTyxFQUFFLGNBQWMsRUFBRSxDQUFDO0FBQzFCLE9BQU8sRUFBRSxlQUFlLEVBQUUsQ0FBQztBQUMzQixPQUFPLEVBQUUsMEJBQTBCLEVBQUUsQ0FBQyJ9