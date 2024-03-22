'use strict';
const authenticator = require('../../helpers/authenticator');
const dbLanternHack = require('../../db/connectors/bbr/lanternHack');
const lanternStationManager = require('./lanternStations');
const textTools = require('../../utils/textTools');
const messageManager = require('../messages');
const { dbConfig } = require('../../config/defaults/config');
function getLanternRound({ token, callback, }) {
    authenticator.isUserAllowed({
        token,
        commandName: dbConfig.apiCommands.GetLanternRound.name,
        callback: ({ error }) => {
            if (error) {
                callback({ error });
                return;
            }
            dbLanternHack.getLanternRound({
                callback: ({ error: roundError, data, }) => {
                    if (roundError) {
                        callback({ error: roundError });
                        return;
                    }
                    callback({ data });
                },
            });
        },
    });
}
function updateLanternRound({ io, token, startTime, endTime, isActive, callback, }) {
    authenticator.isUserAllowed({
        token,
        commandName: dbConfig.apiCommands.StartLanternRound.name,
        callback: ({ error }) => {
            if (error) {
                callback({ error });
                return;
            }
            dbLanternHack.getLanternRound({
                callback: ({ error: currentError, data: currentData, }) => {
                    if (currentError) {
                        callback({ error: currentError });
                        return;
                    }
                    dbLanternHack.updateLanternRound({
                        startTime,
                        endTime,
                        isActive,
                        callback: ({ error: roundError, data, }) => {
                            if (roundError) {
                                callback({ error: roundError });
                                return;
                            }
                            const next = data.isActive
                                ?
                                    data.endTime
                                :
                                    data.startTime;
                            const dataToSend = {
                                timeLeft: textTools.getDifference({
                                    laterDate: next,
                                    firstDate: new Date(),
                                }),
                                round: data,
                                changeType: dbConfig.ChangeTypes.UPDATE,
                            };
                            io.emit('lanternRound', { data: dataToSend });
                            callback({ data });
                            if (!isActive) {
                                lanternStationManager.resetStations({
                                    callback: () => {
                                    },
                                });
                            }
                            if (isActive !== currentData.isActive) {
                                if (isActive) {
                                    messageManager.sendBroadcastMsg({
                                        io,
                                        token,
                                        message: {
                                            text: [
                                                'LANTERN ACTIVITY DETECTED',
                                                'LANTERN ONLINE',
                                            ],
                                            intro: ['ATTENTION! SIGNAL DETECTED', '----------'],
                                            extro: ['----------', 'END OF MESSAGE'],
                                        },
                                        callback: () => {
                                        },
                                    });
                                }
                                else {
                                    messageManager.sendBroadcastMsg({
                                        io,
                                        token,
                                        message: {
                                            text: [
                                                'DISCONNECTING',
                                                'LANTERN OFFLINE',
                                            ],
                                            intro: ['ATTENTION! SIGNAL LOST', '----------'],
                                            extro: ['----------', 'END OF MESSAGE'],
                                        },
                                        callback: () => {
                                        },
                                    });
                                }
                            }
                        },
                    });
                },
            });
        },
    });
}
export { getLanternRound };
export { updateLanternRound };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGFudGVyblJvdW5kcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImxhbnRlcm5Sb3VuZHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsWUFBWSxDQUFDO0FBRWIsTUFBTSxhQUFhLEdBQUcsT0FBTyxDQUFDLDZCQUE2QixDQUFDLENBQUM7QUFDN0QsTUFBTSxhQUFhLEdBQUcsT0FBTyxDQUFDLHFDQUFxQyxDQUFDLENBQUM7QUFDckUsTUFBTSxxQkFBcUIsR0FBRyxPQUFPLENBQUMsbUJBQW1CLENBQUMsQ0FBQztBQUMzRCxNQUFNLFNBQVMsR0FBRyxPQUFPLENBQUMsdUJBQXVCLENBQUMsQ0FBQztBQUNuRCxNQUFNLGNBQWMsR0FBRyxPQUFPLENBQUMsYUFBYSxDQUFDLENBQUM7QUFDOUMsTUFBTSxFQUFFLFFBQVEsRUFBRSxHQUFHLE9BQU8sQ0FBQyw4QkFBOEIsQ0FBQyxDQUFDO0FBUTdELFNBQVMsZUFBZSxDQUFDLEVBQ3ZCLEtBQUssRUFDTCxRQUFRLEdBQ1Q7SUFDQyxhQUFhLENBQUMsYUFBYSxDQUFDO1FBQzFCLEtBQUs7UUFDTCxXQUFXLEVBQUUsUUFBUSxDQUFDLFdBQVcsQ0FBQyxlQUFlLENBQUMsSUFBSTtRQUN0RCxRQUFRLEVBQUUsQ0FBQyxFQUFFLEtBQUssRUFBRSxFQUFFLEVBQUU7WUFDdEIsSUFBSSxLQUFLLEVBQUUsQ0FBQztnQkFDVixRQUFRLENBQUMsRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDO2dCQUVwQixPQUFPO1lBQ1QsQ0FBQztZQUVELGFBQWEsQ0FBQyxlQUFlLENBQUM7Z0JBQzVCLFFBQVEsRUFBRSxDQUFDLEVBQ1QsS0FBSyxFQUFFLFVBQVUsRUFDakIsSUFBSSxHQUNMLEVBQUUsRUFBRTtvQkFDSCxJQUFJLFVBQVUsRUFBRSxDQUFDO3dCQUNmLFFBQVEsQ0FBQyxFQUFFLEtBQUssRUFBRSxVQUFVLEVBQUUsQ0FBQyxDQUFDO3dCQUVoQyxPQUFPO29CQUNULENBQUM7b0JBRUQsUUFBUSxDQUFDLEVB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