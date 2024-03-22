'use strict';
import { appConfig, dbConfig } from '../../config/defaults/config';
import dbCalibrationMission from '../../db/connectors/bbr/calibrationMission';
import dbLanternHack from '../../db/connectors/bbr/lanternHack';
import dbTransaction from '../../db/connectors/transaction';
import dbWallet from '../../db/connectors/wallet';
import errorCreator from '../../error/errorCreator';
import authenticator from '../../helpers/authenticator';
import poster from '../../helpers/poster';
import userManager from '../users';
function getActiveCalibrationMission({ token, stationId, callback, userName, }) {
    authenticator.isUserAllowed({
        token,
        commandName: dbConfig.apiCommands.GetCalibrationMission.name,
        callback: ({ error, data, }) => {
            if (error) {
                callback({ error });
                return;
            }
            const { user: authUser } = data;
            const owner = userName;
            userManager.getUserById({
                username: owner,
                internalCallUser: authUser,
                callback: ({ error: userError }) => {
                    if (userError) {
                        callback({ error: userError });
                        return;
                    }
                    dbLanternHack.getLanternRound({
                        callback: ({ error: lanternError, data: lanternData, }) => {
                            if (lanternError) {
                                callback({ error: lanternError });
                                return;
                            }
                            if (lanternData.isActive) {
                                callback({ error: new errorCreator.External({ name: 'lantern hack active' }) });
                                return;
                            }
                            dbCalibrationMission.getActiveMission({
                                owner,
                                silentOnDoesNotExist: true,
                                callback: ({ error: activeErr, data: missionData, }) => {
                                    if (activeErr) {
                                        callback({ error: activeErr });
                                        return;
                                    }
                                    if (missionData.mission) {
                                        callback({ data: missionData });
                                        return;
                                    }
                                    dbCalibrationMission.getInactiveMissions({
                                        owner,
                                        callback: ({ error: inactiveErr, data: inactiveData, }) => {
                                            if (inactiveErr) {
                                                callback({ error: inactiveErr });
                                                return;
                                            }
                                            if (inactiveData.missions.length > 0 && new Date().getTime() < new Date(inactiveData.missions[inactiveData.missions.length - 1].timeCreated).getTime() + (appConfig.calibrationTimeout * 60000)) {
                                                callback({
                                                    error: new errorCreator.TooFrequent({
                                                        name: 'calibration mission',
                                                        extraData: {
                                                            timeLeft: new Date().getTime() - (new Date(inactiveData.missions[inactiveData.missions.length - 1].timeCreated).getTime() + (appConfig.calibrationTimeout * 60000)),
                                                        },
                                                    }),
                                                });
                                                return;
                                            }
                                            dbLanternHack.getAllStations({
                                                callback: ({ error: stationsError, data: stationsData, }) => {
                                                    if (stationsError) {
                                                        callback({ error: stationsError });
                                                        return;
                                                    }
                                                    if (stationsData.stations.length < 1) {
                                                        callback({ error: new errorCreator.DoesNotExist({ name: 'no active stations' }) });
                                                        return;
                                                    }
                                                    const stationIds = stationsData.stations.map((station) => station.stationId);
                                                    const { missions: inactiveMissions } = inactiveData;
                                                    if (inactiveMissions && inactiveMissions.length > 0) {
                                                        const previousStationIds = inactiveMissions.length > 1
                                                            ?
                                                                [inactiveMissions[inactiveMissions.length - 1].stationId, inactiveMissions[inactiveMissions.length - 2].stationId]
                                                            :
                                                                [inactiveMissions[inactiveMissions.length - 1].stationId];
                                                        if (stationId && previousStationIds.indexOf(stationId) > -1) {
                                                            callback({ error: new errorCreator.InvalidData({ expected: 'not equal station' }) });
                                                            return;
                                                        }
                                                        previousStationIds.forEach((stationIdToRemove) => {
                                                            stationIds.splice(stationIds.indexOf(stationIdToRemove), 1);
                                                        });
                                                    }
                                                    if (stationIds.length === 0) {
                                                        callback({ error: new errorCreator.DoesNotExist({ name: 'no active stations' }) });
                                                        return;
                                                    }
                                                    const newStationId = stationId || stationIds[Math.floor(Math.random() * (stationIds.length))];
                                                    const newCode = Math.floor(Math.random() * (((99999999 - 10000000) + 1) + 10000000));
                                                    const missionToCreate = {
                                                        owner,
                                                        stationId: newStationId,
                                                        timeCreated: new Date(),
                                                        code: newCode,
                                                    };
                                                    dbCalibrationMission.createMission({
                                                        mission: missionToCreate,
                                                        callback: ({ error: createError, data: createData, }) => {
                                                            if (createError) {
                                                                callback({ error: createError });
                                                                return;
                                                            }
                                                            const { mission } = createData;
                                                            poster.postRequest({
                                                                host: appConfig.hackingApiHost,
                                                                path: '/reports/set_mission',
                                                                data: {
                                                                    mission: {
                                                                        stationId: mission.stationId,
                                                                        owner: mission.owner,
                                                                        code: mission.code,
                                                                    },
                                                                    key: appConfig.hackingApiKey,
                                                                },
                                                                callback: ({ error: requestError }) => {
                                                                    if (requestError) {
                                                                        dbCalibrationMission.removeMission({
                                                                            mission,
                                                                            callback: ({ error: removeError }) => {
                                                                                if (removeError) {
                                                                                    callback({ error: removeError });
                                                                                    return;
                                                                                }
                                                                                callback({ error: requestError });
                                                                            },
                                                                        });
                                                                        return;
                                                                    }
                                                                    callback({
                                                                        data: {
                                                                            mission: createData.mission,
                                                                            isNew: true,
                                                                            changeType: dbConfig.ChangeTypes.CREATE,
                                                                        },
                                                                    });
                                                                },
                                                            });
                                                        },
                                                    });
                                                },
                                            });
                                        },
                                    });
                                },
                            });
                        },
                    });
                },
            });
        },
    });
}
function completeActiveCalibrationMission({ token, owner, io, callback, }) {
    authenticator.isUserAllowed({
        token,
        commandName: dbConfig.apiCommands.CompleteCalibrationMission.name,
        callback: ({ error, data, }) => {
            if (error) {
                callback({ error });
                return;
            }
            const { user: authUser } = data;
            userManager.getUserById({
                username: owner,
                internalCallUser: authUser,
                callback: ({ error: userError, data: userData, }) => {
                    if (userError) {
                        callback({ error: userError });
                        return;
                    }
                    const { user } = userData;
                    const { objectId: ownerId } = user;
                    dbCalibrationMission.setMissionCompleted({
                        io,
                        owner,
                        callback: ({ error: missionError, data: missionData, }) => {
                            if (missionError) {
                                callback({ error: missionError });
                                return;
                            }
                            const completedMission = missionData.mission;
                            dbLanternHack.getStation({
                                stationId: completedMission.stationId,
                                callback: ({ error: stationError, data: stationData, }) => {
                                    if (stationError) {
                                        callback({ error: stationError });
                                        return;
                                    }
                                    const transaction = {
                                        toWalletId: ownerId,
                                        fromWalletId: 'SYSTEM',
                                        amount: stationData.station.calibrationReward || appConfig.calibrationRewardAmount,
                                        note: `CALIBRATION OF STATION ${completedMission.stationId}`,
                                    };
                                    dbTransaction.createTransaction({
                                        transaction,
                                        callback: ({ error: transactionError, data: transactionData, }) => {
                                            if (transactionError) {
                                                callback({ error: transactionError });
                                                return;
                                            }
                                            const { transaction: newTransaction } = transactionData;
                                            dbWallet.updateWallet({
                                                walletId: transaction.toWalletId,
                                                wallet: { amount: transaction.amount },
                                                options: { shouldDecreaseAmount: false },
                                                callback: ({ error: increaseError }) => {
                                                    if (increaseError) {
                                                        callback({ error: increaseError });
                                                        return;
                                                    }
                                                    const transactionToSend = {
                                                        data: {
                                                            transaction: newTransaction,
                                                            changeType: dbConfig.ChangeTypes.CREATE,
                                                        },
                                                    };
                                                    io.to(ownerId)
                                                        .emit(dbConfig.EmitTypes.TRANSACTION, transactionToSend);
                                                    callback({
                                                        data: {
                                                            mission: completedMission,
                                                            transaction: newTransaction,
                                                        },
                                                    });
                                                },
                                            });
                                        },
                                    });
                                },
                            });
                        },
                    });
                },
            });
        },
    });
}
function cancelActiveCalibrationMission({ token, io, callback, owner, }) {
    authenticator.isUserAllowed({
        token,
        commandName: dbConfig.apiCommands.CancelCalibrationMission.name,
        callback: ({ error, data, }) => {
            if (error) {
                callback({ error });
                return;
            }
            const { user: authUser } = data;
            userManager.getUserById({
                username: owner,
                internalCallUser: authUser,
                callback: ({ error: userError, data: userData, }) => {
                    if (userError) {
                        callback({ error: userError });
                        return;
                    }
                    const { user } = userData;
                    dbCalibrationMission.setMissionCompleted({
                        owner,
                        cancelled: true,
                        callback: ({ error: missionError, data: missionData, }) => {
                            if (missionError) {
                                callback({ error: missionError });
                                return;
                            }
                            const { mission: updatedMission } = missionData;
                            updatedMission.cancelled = true;
                            io.to(user.objectId)
                                .emit('calibrationMission', {
                                data: {
                                    mission: updatedMission,
                                    changeType: dbConfig.ChangeTypes.REMOVE,
                                },
                            });
                            callback({
                                data: {
                                    mission: updatedMission,
                                    cancelled: true,
                                },
                            });
                        },
                    });
                },
            });
        },
    });
}
function getCalibrationMissions({ token, getInactive, callback, }) {
    authenticator.isUserAllowed({
        token,
        commandName: dbConfig.apiCommands.GetCalibrationMissions.name,
        callback: ({ error }) => {
            if (error) {
                callback({ error });
                return;
            }
            dbCalibrationMission.getMissions({
                getInactive,
                callback,
            });
        },
    });
}
function getValidStations({ token, callback, }) {
    authenticator.isUserAllowed({
        token,
        commandName: dbConfig.apiCommands.GetCalibrationMissions.name,
        callback: ({ error, data, }) => {
            if (error) {
                callback({ error });
                return;
            }
            const { user: authUser } = data;
            const { username: owner } = authUser;
            dbCalibrationMission.getActiveMission({
                owner,
                silentOnDoesNotExist: true,
                callback: ({ error: activeError, data: activeData, }) => {
                    if (activeError) {
                        callback({ error: activeError });
                        return;
                    }
                    if (activeData.mission) {
                        callback({ data: activeData });
                        return;
                    }
                    dbCalibrationMission.getInactiveMissions({
                        owner,
                        callback: ({ error: inactiveErr, data: inactiveData, }) => {
                            if (inactiveErr) {
                                callback({ error: inactiveErr });
                                return;
                            }
                            if (inactiveData.missions.length > 0 && new Date().getTime() < new Date(inactiveData.missions[inactiveData.missions.length - 1].timeCreated).getTime() + (appConfig.calibrationTimeout * 60000)) {
                                callback({
                                    error: new errorCreator.TooFrequent({
                                        name: 'calibration mission',
                                        extraData: {
                                            timeLeft: new Date().getTime() - (new Date(inactiveData.missions[inactiveData.missions.length - 1].timeCreated).getTime() + (appConfig.calibrationTimeout * 60000)),
                                        },
                                    }),
                                });
                                return;
                            }
                            dbLanternHack.getAllStations({
                                callback: ({ error: stationsError, data: stationsData, }) => {
                                    if (stationsError) {
                                        callback({ error: stationsError });
                                        return;
                                    }
                                    if (stationsData.stations.length < 1) {
                                        callback({ error: new errorCreator.DoesNotExist({ name: 'no active stations' }) });
                                        return;
                                    }
                                    const stationIds = stationsData.stations.map((station) => station.stationId);
                                    const { missions } = inactiveData;
                                    if (missions && missions.length > 0) {
                                        const previousStationIds = missions.length > 1
                                            ?
                                                [missions[missions.length - 1].stationId, missions[missions.length - 2].stationId]
                                            :
                                                [missions[missions.length - 1].stationId];
                                        previousStationIds.forEach((stationIdToRemove) => {
                                            stationIds.splice(stationIds.indexOf(stationIdToRemove), 1);
                                        });
                                    }
                                    callback({
                                        data: {
                                            stations: stationsData.stations.filter((station) => stationIds.indexOf(station.stationId) > -1),
                                        },
                                    });
                                },
                            });
                        },
                    });
                },
            });
        },
    });
}
function removeCalibrationMissionsById({ token, stationId, callback, }) {
    authenticator.isUserAllowed({
        token,
        commandName: dbConfig.apiCommands.CancelCalibrationMission.name,
        callback: ({ error }) => {
            if (error) {
                callback({ error });
                return;
            }
            dbCalibrationMission.getMissions({
                callback: ({ error: missionError, data: missionData, }) => {
                    if (missionError) {
                        callback({ error: missionError });
                        return;
                    }
                    missionData.missions.forEach((mission) => {
                        if (stationId === mission.stationId) {
                            dbCalibrationMission.removeMission({
                                mission,
                                callback: () => {
                                },
                            });
                        }
                    });
                    callback({ data: { success: true } });
                },
            });
        },
    });
}
export { getValidStations };
export { getActiveCalibrationMission };
export { completeActiveCalibrationMission };
export { cancelActiveCalibrationMission };
export { getCalibrationMissions };
export { removeCalibrationMissionsById };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2FsaWJyYXRpb25NaXNzaW9ucy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImNhbGlicmF0aW9uTWlzc2lvbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsWUFBWSxDQUFDO0FBRWIsT0FBTyxFQUFFLFNBQVMsRUFBRSxRQUFRLEVBQUUsTUFBTSw4QkFBOEIsQ0FBQztBQUNuRSxPQUFPLG9CQUFvQixNQUFNLDRDQUE0QyxDQUFDO0FBQzlFLE9BQU8sYUFBYSxNQUFNLHFDQUFxQyxDQUFDO0FBQ2hFLE9BQU8sYUFBYSxNQUFNLGlDQUFpQyxDQUFDO0FBQzVELE9BQU8sUUFBUSxNQUFNLDRCQUE0QixDQUFDO0FBQ2xELE9BQU8sWUFBWSxNQUFNLDBCQUEwQixDQUFDO0FBQ3BELE9BQU8sYUFBYSxNQUFNLDZCQUE2QixDQUFDO0FBQ3hELE9BQU8sTUFBTSxNQUFNLHNCQUFzQixDQUFDO0FBQzFDLE9BQU8sV0FBVyxNQUFNLFVBQVUsQ0FBQztBQVNuQyxTQUFTLDJCQUEyQixDQUFDLEVBQ25DLEtBQUssRUFDTCxTQUFTLEVBQ1QsUUFBUSxFQUNSLFFBQVEsR0FDVDtJQUNDLGFBQWEsQ0FBQyxhQUFhLENBQUM7UUFDMUIsS0FBSztRQUNMLFdBQVcsRUFBRSxRQUFRLENBQUMsV0FBVyxDQUFDLHFCQUFxQixDQUFDLElBQUk7UUFDNUQsUUFBUSxFQUFFLENBQUMsRUFDVCxLQUFLLEVBQ0wsSUFBSSxHQUNMLEVBQUUsRUFBRTtZQUNILElBQUksS0FBSyxFQUFFLENBQUM7Z0JBQ1YsUUFBUSxDQUFDLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQztnQkFFcEIsT0FBTztZQUNULENBQUM7WUFFRCxNQUFNLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxHQUFHLElBQUksQ0FBQztZQUNoQyxNQUFNLEtBQUssR0FBRyxRQUFRLENBQUM7WUFFdkIsV0FBVyxDQUFDLFdBQVcsQ0FBQztnQkFDdEIsUUFBUSxFQUFFLEtBQUs7Z0JBQ2YsZ0JBQWdCLEVBQUUs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