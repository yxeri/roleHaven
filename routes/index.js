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

const express = require('express');
const dbUser = require('../db/connectors/user');
const { appConfig, dbConfig } = require('../config/defaults/config');
const dbDevice = require('../db/connectors/device');

const aliasHandler = require('./socketHandlers/aliases');
const authenticationHandler = require('./socketHandlers/authenticate');
const deviceHandler = require('./socketHandlers/devices');
const docFilesHandler = require('./socketHandlers/docFiles');
const forumPostHandler = require('./socketHandlers/forumPost');
const forumHandler = require('./socketHandlers/forums');
const forumThreadHandler = require('./socketHandlers/forumThreads');
const gameCodeHandler = require('./socketHandlers/gameCodes');
const messageHandler = require('./socketHandlers/messages');
const positionHandler = require('./socketHandlers/positions');
const roomHandler = require('./socketHandlers/rooms');
const simpleMsgHandler = require('./socketHandlers/simpleMsgs');
const teamHandler = require('./socketHandlers/teams');
const transactionHandler = require('./socketHandlers/transactions');
const userHandler = require('./socketHandlers/users');
const walletHandler = require('./socketHandlers/wallets');

const router = new express.Router();

/**
 * @param {Object} io - Socket.IO
 * @returns {Object} Router
 */
function handle(io) {
  router.get('/', (req, res) => {
    res.render(appConfig.indexName, {
      title: appConfig.title,
      gMapsKey: appConfig.gMapsKey,
      socketPath: appConfig.socketPath,
      mainJs: `scripts/${appConfig.mainJsName}.js?version=${appConfig.jsVersion}`,
      mainCss: req.query.style && !Number.isNaN(req.query.style) ? `styles/${req.query.style}.css` : `styles/${appConfig.mainCssName}.css`,
    });
  });

  router.get('/admin', (req, res) => {
    res.render(appConfig.adminIndexName, {
      title: appConfig.title,
      gMapsKey: appConfig.gMapsKey,
      socketPath: appConfig.socketPath,
      adminJs: `scripts/${appConfig.adminIndexName}.js?version=${appConfig.jsVersion}`,
      adminCss: req.query.style && !Number.isNaN(req.query.style) ? `styles/admin${req.query.style}.css` : `styles/${appConfig.adminCssName}.css`,
    });
  });

  io.on('connection', (socket) => {
    dbConfig.requiredRooms.forEach((roomId) => {
      socket.join(roomId);
    });

    socket.emit(dbConfig.EmitTypes.STARTUP, {
      data: {
        publicRoomId: dbConfig.rooms.public.objectId,
        defaultLanguage: appConfig.defaultLanguage,
        forceFullscreen: appConfig.forceFullscreen,
        gpsTracking: appConfig.gpsTracking,
        customFlags: appConfig.customFlags,
        centerCoordinates: {
          latitude: appConfig.centerLat,
          longitude: appConfig.centerLong,
        },
        cornerOneCoordinates: {
          latitude: appConfig.cornerOneLat,
          longitude: appConfig.cornerOneLong,
        },
        cornerTwoCoordinates: {
          latitude: appConfig.cornerTwoLat,
          longitude: appConfig.cornerTwoLong,
        },
        defaultZoomLevel: appConfig.defaultZoomLevel,
        yearModification: appConfig.yearModification,
        mode: appConfig.mode,
        welcomeMessage: appConfig.welcomeMessage,
        userVerify: appConfig.userVerify,
        showDevInfo: appConfig.showDevInfo,
        dayModification: appConfig.dayModification,
      },
    });

    socket.on('disconnect', (params, callback = () => {}) => {
      dbDevice.updateDevice({
        device: {},
        deviceSocketId: socket.id,
        options: { resetSocket: true },
        callback: ({ error: updateError }) => {
          if (updateError) {
            callback({ error: updateError });

            return;
          }

          dbUser.updateOnline({
            isOnline: false,
            callback: ({ error: userError }) => {
              if (userError) {
                callback({ error: userError });

                return;
              }

              callback({ data: { success: true } });
            },
          });
        },
      });
    });

    aliasHandler.handle(socket, io);
    authenticationHandler.handle(socket, io);
    deviceHandler.handle(socket, io);
    docFilesHandler.handle(socket, io);
    forumPostHandler.handle(socket, io);
    forumHandler.handle(socket, io);
    forumThreadHandler.handle(socket, io);
    gameCodeHandler.handle(socket, io);
    messageHandler.handle(socket, io);
    positionHandler.handle(socket, io);
    roomHandler.handle(socket, io);
    simpleMsgHandler.handle(socket, io);
    teamHandler.handle(socket, io);
    transactionHandler.handle(socket, io);
    userHandler.handle(socket, io);
    walletHandler.handle(socket, io);
  });

  return router;
}

module.exports = handle;
