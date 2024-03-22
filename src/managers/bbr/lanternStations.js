'use strict';
import { appConfig, dbConfig } from '../../config/defaults/config';
import dbLanternHack from '../../db/connectors/bbr/lanternHack';
import authenticator from '../../helpers/authenticator';
function getLanternStations({ token, callback, }) {
    authenticator.isUserAllowed({
        token,
        commandName: dbConfig.apiCommands.GetLanternStations.name,
        callback: ({ error }) => {
            if (error) {
                callback({ error });
                return;
            }
            dbLanternHack.getAllStations({
                callback: ({ error: stationError, data: stationData, }) => {
                    if (stationError) {
                        callback({ error: stationError });
                        return;
                    }
                    const { stations } = stationData;
                    const activeStations = [];
                    const inactiveStations = stations.filter((station) => {
                        if (station.isActive) {
                            activeStations.push(station);
                            return false;
                        }
                        return true;
                    });
                    callback({
                        data: {
                            activeStations,
                            inactiveStations,
                        },
                    });
                },
            });
        },
    });
}
function getLanternStation({ stationId, token, callback, }) {
    authenticator.isUserAllowed({
        token,
        commandName: dbConfig.apiCommands.GetLanternStations.name,
        callback: ({ error }) => {
            if (error) {
                callback({ error });
                return;
            }
            dbLanternHack.getStation({
                stationId,
                callback: ({ error: stationError, data: stationData, }) => {
                    if (stationError) {
                        callback({ error: stationError });
                        return;
                    }
                    callback({ data: stationData });
                },
            });
        },
    });
}
function createLanternStation({ io, station, token, callback, }) {
    authenticator.isUserAllowed({
        token,
        commandName: dbConfig.apiCommands.CreateLanternStation.name,
        callback: ({ error }) => {
            if (error) {
                callback({ error });
                return;
            }
            const newStation = station;
            newStation.calibrationReward = typeof newStation.calibrationReward === 'number'
                && newStation.calibrationReward >= appConfig.calibrationRewardMinimum
                && newStation.calibrationReward <= appConfig.calibrationRewardMax
                ?
                    newStation.calibrationReward
                :
                    undefined;
            dbLanternHack.createStation({
                station,
                callback: ({ error: stationError, data: stationData, }) => {
                    if (stationError) {
                        callback({ error: stationError });
                        return;
                    }
                    io.emit('lanternStation', {
                        data: {
                            station: stationData.station,
                            changeType: dbConfig.ChangeTypes.CREATE,
                        },
                    });
                    callback({ data: stationData });
                },
            });
        },
    });
}
function updateLanternStation({ io, station, stationId, token, callback, }) {
    authenticator.isUserAllowed({
        token,
        commandName: dbConfig.apiCommands.UpdateLanternStation.name,
        callback: ({ error }) => {
            if (error) {
                callback({ error });
                return;
            }
            const { isUnderAttack, isActive, stationName, owner, calibrationReward, resetOwner, } = station;
            updateLanternStation({
                resetOwner,
                isUnderAttack,
                stationId,
                isActive,
                stationName,
                owner,
                calibrationReward: typeof calibrationReward === 'number'
                    && calibrationReward >= appConfig.calibrationRewardMinimum
                    && calibrationReward <= appConfig.calibrationRewardMax
                    ?
                        calibrationReward
                    :
                        undefined,
                callback: ({ error: updateError, data: updateData, }) => {
                    if (updateError) {
                        callback({ error: updateError });
                        return;
                    }
                    io.emit('lanternStation', {
                        data: {
                            station: updateData.station,
                            changeType: dbConfig.ChangeTypes.UPDATE,
                        },
                    });
                    callback({ data: updateData });
                },
            });
        },
    });
}
function resetStations({ callback }) {
    dbLanternHack.resetLanternStations({
        callback,
        signalValue: appConfig.signalDefaultValue,
    });
}
function deleteLanternStation({ token, stationId, callback, }) {
    authenticator.isUserAllowed({
        token,
        commandName: dbConfig.apiCommands.DeleteLanternStation.name,
        callback: ({ error }) => {
            if (error) {
                callback({ error });
                return;
            }
            dbLanternHack.deleteStation({
                stationId,
                callback,
            });
        },
    });
}
export { getLanternStations };
export { createLanternStation };
export { updateLanternStation };
export { getLanternStation };
export { resetStations };
export { deleteLanternStation };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGFudGVyblN0YXRpb25zLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibGFudGVyblN0YXRpb25zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFlBQVksQ0FBQztBQUViLE9BQU8sRUFBRSxTQUFTLEVBQUUsUUFBUSxFQUFFLE1BQU0sOEJBQThCLENBQUM7QUFDbkUsT0FBTyxhQUFhLE1BQU0scUNBQXFDLENBQUM7QUFDaEUsT0FBTyxhQUFhLE1BQU0sNkJBQTZCLENBQUM7QUFReEQsU0FBUyxrQkFBa0IsQ0FBQyxFQUMxQixLQUFLLEVBQ0wsUUFBUSxHQUNUO0lBQ0MsYUFBYSxDQUFDLGFBQWEsQ0FBQztRQUMxQixLQUFLO1FBQ0wsV0FBVyxFQUFFLFFBQVEsQ0FBQyxXQUFXLENBQUMsa0JBQWtCLENBQUMsSUFBSTtRQUN6RCxRQUFRLEVBQUUsQ0FBQyxFQUFFLEtBQUssRUFBRSxFQUFFLEVBQUU7WUFDdEIsSUFBSSxLQUFLLEVBQUUsQ0FBQztnQkFDVixRQUFRLENBQUMsRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDO2dCQUVwQixPQUFPO1lBQ1QsQ0FBQztZQUVELGFBQWEsQ0FBQyxjQUFjLENBQUM7Z0JBQzNCLFFBQVEsRUFBRSxDQUFDLEVBQ1QsS0FBSyxFQUFFLFlBQVksRUFDbkIsSUFBSSxFQUFFLFdBQVcsR0FDbEIsRUFBRSxFQUFFO29CQUNILElBQUksWUFBWSxFQUFFLENBQUM7d0JBQ2pCLFFBQVEsQ0FBQyxFQUFFLEtBQUssRUFBRSxZQUFZLEVBQUUsQ0FBQyxDQUFDO3dCQUVsQyxPQUFPO29CQUNULENBQUM7b0JBRUQsTUFBTSxFQUFFLFFBQVEsRUFBRSxHQUFHLFdBQVcsQ0FBQztvQkFDakMsTUFBTSxjQUFjLEdBQUcsRUFBRSxDQUFDO29CQUMxQixNQUFNLGdCQUFnQixHQUFHLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxPQUFPLEVBQUUsRUFBRTt3QkFDbkQsSUFBSSxPQUFPLENBQUMsUUFBUSxFQUFFLENBQUM7NEJB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