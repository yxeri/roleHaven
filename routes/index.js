/*
 Copyright 2015 Aleksandar Jankovic

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

const express = require('express');
const chatHandler = require('./socketHandlers/chat');
const userHandler = require('./socketHandlers/user');
const dbConnector = require('../db/databaseConnector');
const dbUser = require('../db/connectors/user');
const commandHandler = require('./socketHandlers/command');
const teamHandler = require('./socketHandlers/team');
const hackingHandler = require('./socketHandlers/hacking');
const utilityHandler = require('./socketHandlers/utility');
const locationHandler = require('./socketHandlers/location');
const manager = require('../socketHelpers/manager');
const appConfig = require('../config/defaults/config').app;
const databasePopulation = require('../config/defaults/config').databasePopulation;
const logger = require('../utils/logger');
const messenger = require('../socketHelpers/messenger');
const deviceHandler = require('./socketHandlers/device');

const router = new express.Router();

/**
 * @param {Object} io - Socket.IO
 * @returns {Object} Router
 */
function handle(io) {
  router.get('/', (req, res) => {
    res.render('index', {
      title: appConfig.title,
      gMapsKey: appConfig.gMapsKey,
      socketPath: appConfig.socketPath,
      mainJs: appConfig.mode === 'dev' ? 'scripts/bundle.js' : 'scripts/bundle.min.js',
    });
  });

  io.on('connection', (socket) => {
    socket.emit('startup', {
      defaultLanguage: appConfig.defaultLanguage,
      forceFullscreen: appConfig.forceFullscreen,
      gpsTracking: appConfig.gpsTracking,
      disableCommands: appConfig.disableCommands,
      hideRoomNames: appConfig.hideRoomNames,
      hideTimeStamp: appConfig.hideTimeStamp,
      staticInputStart: appConfig.staticInputStart,
      defaultInputStart: appConfig.defaultInputStart,
      customFlags: appConfig.customFlags,
      centerLat: appConfig.centerLat,
      centerLong: appConfig.centerLong,
      cornerOneLat: appConfig.cornerOneLat,
      cornerOneLong: appConfig.cornerOneLong,
      cornerTwoLat: appConfig.cornerTwoLat,
      cornerTwoLong: appConfig.cornerTwoLong,
      defaultZoomLevel: appConfig.defaultZoomLevel,
      radioChannels: appConfig.radioChannels,
    });

    socket.on('disconnect', () => {
      dbUser.getUserById(socket.id, (err, user) => {
        if (err || user === null) {
          return;
        }

        dbUser.updateUserSocketId(user.userName, '', (userErr, socketUser) => {
          if (userErr || socketUser === null) {
            logger.sendErrorMsg({
              code: logger.ErrorCodes.general,
              text: ['Failed to reset user socket ID'],
              err: userErr,
            });
          }
        });

        dbUser.setUserLastOnline(user.userName, new Date(), (userOnlineErr, settedUser) => {
          if (userOnlineErr || settedUser === null) {
            logger.sendErrorMsg({
              code: logger.ErrorCodes.general,
              text: ['Failed to set last online'],
              err: userOnlineErr,
            });
          }
        });

        dbUser.updateUserOnline(user.userName, false, (onlineErr, updatedUser) => {
          if (onlineErr || updatedUser === null) {
            logger.sendErrorMsg({
              code: logger.ErrorCodes.general,
              text: ['Failed to update online'],
              err: onlineErr,
            });
          }
        });

        logger.sendInfoMsg(`${socket.id} ${user.userName} has disconnected`);
      });
    });

    // TODO This should be moved
    /**
     * Invitations command. Returns all invitations to rooms and teams for the user
     * Emits commandFail or commandSuccess with the invitations
     */
    socket.on('getInvitations', () => {
      manager.userAllowedCommand(socket.id, databasePopulation.commands.invitations.commandName, (allowErr, allowed, user) => {
        if (allowErr || !allowed) {
          socket.emit('commandFail');

          return;
        }

        dbConnector.getInvitations(user.userName, (err, list) => {
          if (err) {
            messenger.sendSelfMsg({
              socket,
              message: {
                text: ['Failed to get invitations'],
                text_se: ['Misslyckades med att hämta alla inbjudan'],
              },
            });
            socket.emit('commandFail');

            return;
          } else if (list === null) {
            messenger.sendSelfMsg({
              socket,
              message: {
                text: ['No invitations founds'],
                text_se: ['Inga inbjudan hittades'],
              },
            });

            socket.emit('commandFail');

            return;
          }

          socket.emit('commandSuccess', { newData: { invitations: list.invitations }, freezeStep: true });
        });
      });
    });

    userHandler.handle(socket, io);
    chatHandler.handle(socket, io);
    commandHandler.handle(socket);
    deviceHandler.handle(socket);
    teamHandler.handle(socket, io);
    hackingHandler.handle(socket);
    utilityHandler.handle(socket);
    locationHandler.handle(socket);
  });

  return router;
}

module.exports = handle;
