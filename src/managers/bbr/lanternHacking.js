'use strict';
import { appConfig, dbConfig } from '../../config/defaults/config';
import dbLanternHack from '../../db/connectors/bbr/lanternHack';
import errorCreator from '../../error/errorCreator';
import authenticator from '../../helpers/authenticator';
import poster from '../../helpers/poster';
import objectValidator from '../../utils/objectValidator';
import textTools from '../../utils/textTools';
import lanternRoundManager from './lanternRounds';
import lanternStationManager from './lanternStations';
import lanternTeamManager from './lanternTeams';
function resetStations({ io, callback = () => {
}, }) {
    if (appConfig.mode === appConfig.Modes.TEST || appConfig.signalResetTimeout === 0) {
        return;
    }
    dbLanternHack.getLanternRound({
        callback: ({ error: roundError, data: roundData, }) => {
            if (roundError) {
                callback({ error: roundError });
                return;
            }
            if (!roundData.isActive) {
                return;
            }
            dbLanternHack.getAllStations({
                callback: ({ error, data, }) => {
                    if (error) {
                        callback({ error });
                        return;
                    }
                    const { stations } = data;
                    stations.forEach((station) => {
                        if (station.signalValue === appConfig.signalDefaultValue) {
                            return;
                        }
                        const { stationId, signalValue, } = station;
                        let newSignalValue = signalValue;
                        if (signalValue > appConfig.signalDefaultValue) {
                            newSignalValue -= 1;
                        }
                        else {
                            newSignalValue += 1;
                        }
                        stations.find((foundStation) => foundStation.stationId === stationId).signalValue = newSignalValue;
                    });
                    io.emit('lanternStations', { data: { stations } });
                    callback({ data: { success: true } });
                    stations.forEach((station) => {
                        const { stationId, signalValue, } = station;
                        updateSignalValue({
                            stationId,
                            signalValue,
                            callback: ({ error: updateError }) => {
                                if (updateError) {
                                    return;
                                }
                                poster.postRequest({
                                    host: appConfig.hackingApiHost,
                                    path: '/reports/set_boost',
                                    data: {
                                        station: stationId,
                                        boost: signalValue,
                                        key: appConfig.hackingApiKey,
                                    },
                                    callback: () => {
                                    },
                                });
                            },
                        });
                    });
                },
            });
        },
    });
}
function startResetInterval({ io }) {
    setInterval(resetStations, appConfig.signalResetTimeout, { io });
}
function updateSignalValue({ stationId, boostingSignal, callback, }) {
    dbLanternHack.getStation({
        stationId,
        callback: ({ error, data, }) => {
            if (error) {
                callback({ error });
                return;
            }
            const { station } = data;
            function setNewValue({ signalValue }) {
                const minValue = appConfig.signalDefaultValue - appConfig.signalThreshold;
                const maxValue = appConfig.signalDefaultValue + appConfig.signalThreshold;
                let ceilSignalValue = Math.ceil(signalValue);
                if (ceilSignalValue > maxValue) {
                    ceilSignalValue = maxValue;
                }
                else if (ceilSignalValue < minValue) {
                    ceilSignalValue = minValue;
                }
                updateSignalValue({
                    stationId,
                    signalValue: ceilSignalValue,
                    callback: ({ error: updateError }) => {
                        if (updateError) {
                            callback({ error: updateError });
                            return;
                        }
                        poster.postRequest({
                            host: appConfig.hackingApiHost,
                            path: '/reports/set_boost',
                            data: {
                                station: stationId,
                                boost: ceilSignalValue,
                                key: appConfig.hackingApiKey,
                            },
                            callback: ({ error: requestError, data: requestData, }) => {
                                if (requestError) {
                                    callback({ error: requestError });
                                    return;
                                }
                                callback({ data: requestData });
                            },
                        });
                    },
                });
            }
            const { signalValue } = station;
            const difference = Math.abs(signalValue - appConfig.signalDefaultValue);
            let signalChange = (appConfig.signalThreshold - difference) * appConfig.signalChangePercentage;
            if (boostingSignal && signalValue < appConfig.signalDefaultValue) {
                signalChange = appConfig.signalMaxChange;
            }
            else if (!boostingSignal && signalValue > appConfig.signalDefaultValue) {
                signalChange = appConfig.signalMaxChange;
            }
            setNewValue({
                signalValue: signalValue + (boostingSignal
                    ?
                        signalChange
                    :
                        -Math.abs(signalChange)),
            });
        },
    });
}
function createHackData({ lanternHack, callback, }) {
    dbLanternHack.getAllFakePasswords({
        callback: ({ error, data, }) => {
            if (error) {
                callback({ error });
                return;
            }
            const { passwords } = data;
            const correctUser = lanternHack.gameUsers.find((gameUser) => gameUser.isCorrect);
            callback({
                data: {
                    passwords: textTools.shuffleArray(passwords)
                        .slice(0, 13)
                        .concat(lanternHack.gameUsers.map((gameUser) => gameUser.password)),
                    triesLeft: lanternHack.triesLeft,
                    userName: correctUser.userName,
                    passwordType: correctUser.passwordType,
                    passwordHint: correctUser.passwordHint,
                    stationId: lanternHack.stationId,
                },
            });
        },
    });
}
function createLanternHack({ stationId, owner, triesLeft, callback, }) {
    dbLanternHack.getGameUsers({
        stationId,
        callback: ({ error, data, }) => {
            if (error) {
                callback({ error });
                return;
            }
            if (data.gameUsers.length <= 0) {
                callback({ error: new errorCreator.DoesNotExist({ name: 'game users' }) });
                return;
            }
            const gameUsers = textTools.shuffleArray(data.gameUsers)
                .slice(0, 2)
                .map((gameUser) => {
                const passwordRand = Math.floor(Math.random() * ((gameUser.passwords.length - 1) + 1));
                const password = gameUser.passwords[passwordRand];
                const randomIndex = Math.floor(Math.random() * ((password.length - 1) + 1));
                return {
                    password,
                    userName: gameUser.userName,
                    passwordHint: {
                        index: randomIndex,
                        character: password.charAt(randomIndex),
                    },
                };
            });
            gameUsers[0].isCorrect = true;
            dbLanternHack.updateLanternHack({
                stationId,
                owner,
                gameUsers,
                triesLeft,
                callback: ({ error: updateError, data: updateData, }) => {
                    if (updateError) {
                        callback({ error: updateError });
                        return;
                    }
                    callback({ data: { lanternHack: updateData.lanternHack } });
                },
            });
        },
    });
}
function manipulateStation({ password, boostingSignal, token, stationId, callback, }) {
    if (!objectValidator.isValidData({
        password,
        boostingSignal,
    }, {
        password: true,
        boostingSignal: true,
    })) {
        callback({ error: new errorCreator.InvalidData({ expected: '{ password, boostingSignal }' }) });
        return;
    }
    authenticator.isUserAllowed({
        token,
        commandName: dbConfig.apiCommands.HackLantern.name,
        callback: ({ error, data, }) => {
            if (error) {
                callback({ error });
                return;
            }
            const { user: authUser } = data;
            getLanternHack({
                stationId,
                done: false,
                owner: authUser.username,
                callback: ({ error: getError, data: hackLanternData, }) => {
                    if (getError) {
                        callback({ error: getError });
                        return;
                    }
                    const { lanternHack } = hackLanternData;
                    const correctUser = lanternHack.gameUsers.find((gameUser) => gameUser.isCorrect);
                    if (correctUser.password === password.toLowerCase() && lanternHack.triesLeft > 0) {
                        updateSignalValue({
                            boostingSignal,
                            stationId: lanternHack.stationId,
                            callback: ({ error: updateError }) => {
                                if (updateError) {
                                    callback({ error: new errorCreator.External({ name: 'wrecking' }) });
                                    return;
                                }
                                dbLanternHack.setDone({
                                    stationId,
                                    owner: authUser.username,
                                    wasSuccessful: true,
                                    callback: ({ error: removeError }) => {
                                        if (removeError) {
                                            callback({ error: removeError });
                                            return;
                                        }
                                        callback({
                                            data: {
                                                success: true,
                                                boostingSignal,
                                            },
                                        });
                                    },
                                });
                            },
                        });
                        return;
                    }
                    dbLanternHack.lowerHackTries({
                        owner: authUser.username,
                        callback: ({ error: lowerError, data: lowerData, }) => {
                            if (lowerError) {
                                callback({ error: lowerError });
                                return;
                            }
                            const { lanternHack: loweredHack } = lowerData;
                            if (loweredHack.triesLeft <= 0) {
                                dbLanternHack.setDone({
                                    stationId,
                                    owner: authUser.username,
                                    wasSuccessful: false,
                                    callback: ({ error: removeError }) => {
                                        if (removeError) {
                                            callback({ error: removeError });
                                            return;
                                        }
                                        callback({
                                            data: {
                                                success: false,
                                                triesLeft: loweredHack.triesLeft,
                                            },
                                        });
                                    },
                                });
                                return;
                            }
                            const sentPassword = Array.from(password.toLowerCase());
                            const matches = sentPassword.filter((char) => correctUser.password.includes(char));
                            callback({
                                data: {
                                    success: false,
                                    triesLeft: loweredHack.triesLeft,
                                    matches: { amount: matches.length },
                                },
                            });
                        },
                    });
                },
            });
        },
    });
}
function getLanternHack({ stationId, token, callback, }) {
    authenticator.isUserAllowed({
        token,
        commandName: dbConfig.apiCommands.HackLantern.name,
        callback: ({ error, data, }) => {
            if (error) {
                callback({ error });
                return;
            }
            if (!objectValidator.isValidData({ stationId }, { stationId: true })) {
                callback({ error: new errorCreator.InvalidData({ expected: '{ stationId }' }) });
                return;
            }
            const { user: authUser } = data;
            getLanternHack({
                stationId,
                done: false,
                owner: authUser.username,
                callback: ({ error: getError, data: lanternHackData, }) => {
                    if (getError && getError.type !== errorCreator.ErrorTypes.DOESNOTEXIST) {
                        callback({ error: getError });
                        return;
                    }
                    if (!lanternHackData) {
                        createLanternHack({
                            stationId,
                            owner: authUser.username,
                            triesLeft: appConfig.hackingTriesAmount,
                            callback: ({ error: createError, data: createdData, }) => {
                                if (createError) {
                                    callback({ error: createError });
                                    return;
                                }
                                createHackData({
                                    lanternHack: createdData.lanternHack,
                                    callback: ({ error: hackDataErr, data: hackData, }) => {
                                        if (hackDataErr) {
                                            callback({ error: hackDataErr });
                                            return;
                                        }
                                        callback({ data: hackData });
                                    },
                                });
                            },
                        });
                        return;
                    }
                    createHackData({
                        lanternHack: lanternHackData.lanternHack,
                        callback: ({ error: hackDataErr, data: hackData, }) => {
                            if (hackDataErr) {
                                callback({ error: hackDataErr });
                                return;
                            }
                            callback({ data: hackData });
                        },
                    });
                },
            });
        },
    });
}
function getLanternInfo({ token, callback, }) {
    lanternRoundManager.getLanternRound({
        token,
        callback: ({ error, data, }) => {
            if (error) {
                callback({ error });
                return;
            }
            const startTime = data.startTime
                ?
                    new Date(data.startTime)
                :
                    0;
            const endTime = data.endTime
                ?
                    new Date(data.endTime)
                :
                    0;
            const timeLeft = !data.isActive
                ?
                    textTools.getDifference({
                        laterDate: startTime,
                        firstDate: new Date(),
                    })
                :
                    textTools.getDifference({
                        laterDate: endTime,
                        firstDate: new Date(),
                    });
            lanternStationManager.getLanternStations({
                token,
                callback: ({ error: stationError, data: stationData, }) => {
                    if (stationError) {
                        callback({ error: stationError });
                        return;
                    }
                    const { activeStations, inactiveStations, } = stationData;
                    lanternTeamManager.getLanternTeams({
                        token,
                        callback: ({ error: teamsError, data: teamsData, }) => {
                            if (teamsError) {
                                callback({ error: teamsError });
                                return;
                            }
                            callback({
                                data: {
                                    activeStations,
                                    inactiveStations,
                                    timeLeft,
                                    round: data,
                                    teams: teamsData.teams,
                                },
                            });
                        },
                    });
                },
            });
        },
    });
}
export { createLanternHack };
export { updateSignalValue };
export { manipulateStation };
export { getLanternHack };
export { getLanternInfo };
export { resetStations };
export { startResetInterval };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGFudGVybkhhY2tpbmcuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJsYW50ZXJuSGFja2luZy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxZQUFZLENBQUM7QUFFYixPQUFPLEVBQUUsU0FBUyxFQUFFLFFBQVEsRUFBRSxNQUFNLDhCQUE4QixDQUFDO0FBQ25FLE9BQU8sYUFBYSxNQUFNLHFDQUFxQyxDQUFDO0FBQ2hFLE9BQU8sWUFBWSxNQUFNLDBCQUEwQixDQUFDO0FBQ3BELE9BQU8sYUFBYSxNQUFNLDZCQUE2QixDQUFDO0FBQ3hELE9BQU8sTUFBTSxNQUFNLHNCQUFzQixDQUFDO0FBQzFDLE9BQU8sZUFBZSxNQUFNLDZCQUE2QixDQUFDO0FBQzFELE9BQU8sU0FBUyxNQUFNLHVCQUF1QixDQUFDO0FBQzlDLE9BQU8sbUJBQW1CLE1BQU0saUJBQWlCLENBQUM7QUFDbEQsT0FBTyxxQkFBcUIsTUFBTSxtQkFBbUIsQ0FBQztBQUN0RCxPQUFPLGtCQUFrQixNQUFNLGdCQUFnQixDQUFDO0FBT2hELFNBQVMsYUFBYSxDQUFDLEVBQ3JCLEVBQUUsRUFDRixRQUFRLEdBQUcsR0FBRyxFQUFFO0FBQ2hCLENBQUMsR0FDRjtJQUNDLElBQUksU0FBUyxDQUFDLElBQUksS0FBSyxTQUFTLENBQUMsS0FBSyxDQUFDLElBQUksSUFBSSxTQUFTLENBQUMsa0JBQWtCLEtBQUssQ0FBQyxFQUFFLENBQUM7UUFDbEYsT0FBTztJQUNULENBQUM7SUFFRCxhQUFhLENBQUMsZUFBZSxDQUFDO1FBQzVCLFFBQVEsRUFBRSxDQUFDLEVBQ1QsS0FBSyxFQUFFLFVBQVUsRUFDakIsSUFBSSxFQUFFLFNBQVMsR0FDaEIsRUFBRSxFQUFFO1lBQ0gsSUFBSSxVQUFVLEVBQUUsQ0FBQztnQkFDZixRQUFRLENBQUMsRUFBRSxLQUFLLEVBQUUsVUFBVSxFQUFFLENBQUMsQ0FBQztnQkFFaEMsT0FBTztZQUNULENBQUM7WUFFRCxJQUFJLENBQUMsU0FBUyxDQUFDLFFB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