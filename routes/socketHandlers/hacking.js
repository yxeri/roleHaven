/*
 Copyright 2017 Aleksandar Jankovic

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

'use strict';

const databasePopulation = require('../../config/defaults/config').databasePopulation;
const dbUser = require('../../db/connectors/user');
const dbPosition = require('../../db/connectors/position');
const mapCreator = require('../../utils/mapCreator');
const appConfig = require('../../config/defaults/config').app;
const errorCreator = require('../../objects/error/errorCreator');
const textTools = require('../../utils/textTools');
const authenticator = require('../../helpers/authenticator');

dbPosition.removePositionsByType({
  markerType: 'signalBlock',
  callback: () => {},
});

/**
 * Create a position and radius that affects positions within
 * @param {string} params.token jwt
 * @param {string[]} params.description Description shown on position on client
 * @param {Object} params.socket Socket io
 * @param {Function} params.callback Callback
 */
function createSignalBlock({ token, description, socket, callback }) {
  authenticator.isUserAllowed({
    token,
    commandName: databasePopulation.commands.signalBlock.commandName,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const allowedUser = data.user;

      dbPosition.getPosition({
        positionName: allowedUser.userName,
        callback: ({ error: positionError, data: positionData }) => {
          if (positionError) {
            callback({ error: positionError });

            return;
          } else if (positionData.position.coordinates.accuracy > appConfig.minimumPositionAccuracy) {
            callback({ error: new errorCreator.Insufficient({ name: 'accuracy' }) });

            return;
          } else if (textTools.calculateMinutesDifference({ firstDate: new Date(positionData.position.lastUpdated), secondDate: new Date() }) > appConfig.maxPositionAge) {
            callback({ error: new errorCreator.Insufficient({ name: 'age' }) });

            return;
          }

          const { position: userPosition } = positionData;

          const coordinates = userPosition.coordinates;
          coordinates.radius = appConfig.signalBlockRadius;

          const blockPosition = {
            coordinates,
            positionName: `signalBlock-${allowedUser.userName}`,
            owner: allowedUser.userName,
            markerType: 'signalBlock',
            isPublic: true,
            lastUpdated: new Date(),
            description: [description[0] + allowedUser.userName],
          };

          if (allowedUser.team) {
            blockPosition.team = allowedUser.team;
          }

          dbPosition.updatePosition({
            position: blockPosition,
            callback: ({ error: updateError, data: updatePosition }) => {
              if (updateError) {
                callback({ error: updateError });

                return;
              }

              const newPosition = updatePosition.position;

              dbPosition.getUserPositions({
                callback: ({ error: userPositionsError, data: userPositionsData }) => {
                  if (userPositionsError) {
                    callback({ error: userPositionsError });

                    return;
                  }

                  const { positions } = userPositionsData;
                  const blockedUsers = [];

                  positions.forEach((position) => {
                    dbUser.getUser({
                      userName: position.owner,
                      callback: (getUser) => {
                        if (getUser.error) {
                          callback({ error: getUser.error });

                          return;
                        }

                        const hackedUser = getUser.data.user;
                        const accuracy = position.coordinates.accuracy;
                        const accuracyAdjustment = accuracy > appConfig.signalBlockBufferArea ? appConfig.signalBlockBufferArea : accuracy;

                        if (mapCreator.getDistance(userPosition.coordinates, position.coordinates) - accuracyAdjustment < appConfig.signalBlockRadius) {
                          blockedUsers.push(hackedUser);

                          if (hackedUser.userName !== allowedUser.userName) {
                            socket.to(hackedUser.userName + appConfig.whisperAppend).emit('signalBlock', {
                              blockedBy: allowedUser.userName,
                              position: newPosition,
                            });
                          } else {
                            socket.emit('signalBlock', { blockedBy: allowedUser.userName, position: newPosition });
                          }

                          dbUser.updateUserBlockedBy({
                            userName: hackedUser.userName,
                            blockedBy: allowedUser.userName,
                            callback: () => {},
                          });
                        }
                      },
                    });
                  });

                  socket.broadcast.to(databasePopulation.rooms.public.roomName).emit('mapPositions', {
                    positions: [newPosition],
                    currentTime: new Date(),
                  });

                  callback({ data: { position: newPosition } });

                  setTimeout(() => {
                    dbPosition.removePosition({
                      markerType: blockPosition.markerType,
                      positionName: blockPosition.positionName,
                      callback: () => {
                        socket.broadcast.to(databasePopulation.rooms.public.roomName).emit('mapPositions', {
                          positions: [newPosition],
                          shouldRemove: true,
                        });

                        blockedUsers.forEach((blockedUser) => {
                          dbUser.getUser({
                            userName: blockedUser.userName,
                            callback: (blockedData) => {
                              if (blockedData.error) {
                                return;
                              }

                              const { user: removeUser } = blockedData.data;

                              dbUser.removeUserBlockedBy({
                                userName: removeUser.userName,
                                callback: () => {},
                              });

                              if (removeUser.userName !== allowedUser.userName) {
                                socket.to(removeUser.userName + appConfig.whisperAppend).emit('signalBlock', {
                                  blockedBy: allowedUser.userName,
                                  removeBlocker: true,
                                });
                              } else {
                                socket.emit('signalBlock', {
                                  blockedBy: allowedUser.userName,
                                  removeBlocker: true,
                                });
                              }
                            },
                          });
                        });
                      },
                    });
                  }, appConfig.signalBlockTime);
                },
              });
            },
          });
        },
      });
    },
  });
}

/**
 * @param {object} socket - Socket.IO socket
 */
function handle(socket) {
  socket.on('signalBlock', ({ description, token }, callback = () => {}) => {
    createSignalBlock({
      description,
      token,
      callback,
    });
  });
}

exports.createSignalBlock = createSignalBlock;
exports.handle = handle;
