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

const manager = require('../../socketHelpers/manager');
const databasePopulation = require('../../config/defaults/config').databasePopulation;
const errorCreator = require('../../objects/error/errorCreator');
const dbUser = require('../../db/connectors/user');
const dbPosition = require('../../db/connectors/position');
const mapCreator = require('../../utils/mapCreator');
const appConfig = require('../../config/defaults/config').app;

dbPosition.removePositions({
  markerType: 'signalBlock',
  callback: () => {},
});

/**
 * @param {object} socket - Socket.IO socket
 */
function handle(socket) {
  socket.on('signalBlock', ({ description }, callback = () => {}) => {
    manager.userIsAllowed(socket.id, databasePopulation.commands.signalBlock.commandName, (allowErr, allowed, user) => {
      if (allowErr || !allowed) {
        callback({ error: new errorCreator.NotAllowed({ name: 'signalBlock' }) });

        return;
      }

      dbPosition.getPosition(user.userName, (err, userPosition) => {
        if (err) {
          callback({ error: new errorCreator.Database() });

          return;
        } else if (!userPosition) {
          callback({ error: new errorCreator.DoesNotExist({ name: `${user.userName} position` }) });

          return;
        }

        const coordinates = userPosition.coordinates;
        coordinates.radius = appConfig.signalBlockRadius;

        const blockPosition = {
          positionName: `signalBlock-${user.userName}`,
          owner: user.userName,
          markerType: 'signalBlock',
          isPublic: true,
          lastUpdated: new Date(),
          description: [description[0] + user.userName],
          coordinates,
        };

        if (user.team) {
          blockPosition.team = user.team;
        }

        dbPosition.updatePosition({
          position: blockPosition,
          callback: (errUpdate, newPosition) => {
            if (errUpdate) {
              callback({ error: new errorCreator.Database() });

              return;
            }

            dbPosition.getUserPositions((userErr, positions = []) => {
              if (err) {
                callback({ error: new errorCreator.Database() });

                return;
              }

              const blockedUsers = [];

              positions.forEach((position) => {
                dbUser.getUser(position.owner, (hackErr, hackedUser) => {
                  if (hackErr) {
                    callback({ error: new errorCreator.Database() });

                    return;
                  }

                  const accuracy = position.coordinates.accuracy;
                  const accuracyAdjustment = accuracy > appConfig.signalBlockBufferArea ? appConfig.signalBlockBufferArea : accuracy;

                  if (mapCreator.getDistance(userPosition.coordinates, position.coordinates) - accuracyAdjustment < appConfig.signalBlockRadius) {
                    blockedUsers.push(hackedUser);

                    if (hackedUser.userName !== user.userName) {
                      socket.to(hackedUser.userName + appConfig.whisperAppend).emit('signalBlock', { blockedBy: user.userName, position: newPosition });
                    } else {
                      socket.emit('signalBlock', { blockedBy: user.userName, position: newPosition });
                    }

                    dbUser.updateUserBlockedBy(hackedUser.userName, user.userName, () => {});
                  }
                });
              });

              socket.broadcast.to(databasePopulation.rooms.public.roomName).emit('mapPositions', {
                positions: [newPosition],
                currentTime: (new Date()),
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
                      dbUser.getUser(blockedUser.userName, (removeErr, removeUser) => {
                        if (removeErr) {
                          return;
                        }

                        dbUser.removeUserBlockedBy(removeUser.userName, () => {});

                        if (removeUser.userName !== user.userName) {
                          socket.to(removeUser.userName + appConfig.whisperAppend).emit('signalBlock', { blockedBy: user.userName, removeBlocker: true });
                        } else {
                          socket.emit('signalBlock', { blockedBy: user.userName, removeBlocker: true });
                        }
                      });
                    });
                  },
                });
              }, appConfig.signalBlockTime);
            });
          },
        });
      });
    });
  });
}

exports.handle = handle;
