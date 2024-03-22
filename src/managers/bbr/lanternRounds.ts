'use strict';

const authenticator = require('../../helpers/authenticator');
const dbLanternHack = require('../../db/connectors/bbr/lanternHack');
const lanternStationManager = require('./lanternStations');
const textTools = require('../../utils/textTools');
const messageManager = require('../messages');
const { dbConfig } = require('../../config/defaults/config');

/**
 * Get lantern round.
 * @param {Object} params Parameters.
 * @param {string} params.token jwt.
 * @param {Function} params.callback Callback.
 */
function getLanternRound({
  token,
  callback,
}) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.GetLanternRound.name,
    callback: ({ error }) => {
      if (error) {
        callback({ error });

        return;
      }

      dbLanternHack.getLanternRound({
        callback: ({
          error: roundError,
          data,
        }) => {
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

/**
 * Update lantern round times.
 * @param {Object} params Parameters.
 * @param {Object} params.io socket io.
 * @param {string} params.token jwt.
 * @param {Date} params.startTime Start time of round.
 * @param {Date} params.endTime End time of round.
 * @param {boolean} params.isActive Is round active?
 * @param {Function} params.callback Callback.
 */
function updateLanternRound({
  io,
  token,
  startTime,
  endTime,
  isActive,
  callback,
}) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.StartLanternRound.name,
    callback: ({ error }) => {
      if (error) {
        callback({ error });

        return;
      }

      dbLanternHack.getLanternRound({
        callback: ({
          error: currentError,
          data: currentData,
        }) => {
          if (currentError) {
            callback({ error: currentError });

            return;
          }

          dbLanternHack.updateLanternRound({
            startTime,
            endTime,
            isActive,
            callback: ({
              error: roundError,
              data,
            }) => {
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
                } else {
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
