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
const dbUser = require('../db/connectors/user');
const teamHandler = require('./socketHandlers/team');
const hackingHandler = require('./socketHandlers/lanternHacking');
const utilityHandler = require('./socketHandlers/utility');
const locationHandler = require('./socketHandlers/position');
const appConfig = require('../config/defaults/config').app;
const databasePopulation = require('../config/defaults/config').databasePopulation;
const deviceHandler = require('./socketHandlers/device');
const walletHandler = require('./socketHandlers/wallet');
const calibrationJobHandler = require('./socketHandlers/calibrationMission');
const simpleMessageHandler = require('./socketHandlers/simpleMsg');

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
      mainCss: !isNaN(req.query.style) ? `styles/${req.query.style}.css` : 'styles/main.css',
    });
  });

  io.on('connection', (socket) => {
    socket.join(databasePopulation.rooms.public.roomName);

    socket.emit('startup', {
      defaultLanguage: appConfig.defaultLanguage,
      forceFullscreen: appConfig.forceFullscreen,
      gpsTracking: appConfig.gpsTracking,
      customFlags: appConfig.customFlags,
      centerLat: appConfig.centerLat,
      centerLong: appConfig.centerLong,
      cornerOneLat: appConfig.cornerOneLat,
      cornerOneLong: appConfig.cornerOneLong,
      cornerTwoLat: appConfig.cornerTwoLat,
      cornerTwoLong: appConfig.cornerTwoLong,
      defaultZoomLevel: appConfig.defaultZoomLevel,
      radioChannels: appConfig.radioChannels,
      yearModification: appConfig.yearModification,
      mode: appConfig.mode,
    });

    socket.on('disconnect', () => {
      dbUser.getUserById(socket.id, (err, user) => {
        if (err || user === null) {
          return;
        }

        dbUser.updateUserSocketId(user.userName, '', () => {});
        dbUser.setUserLastOnline(user.userName, new Date(), () => {});
        dbUser.updateUserOnline(user.userName, false, () => {});
        dbUser.updateUserIsTracked(user.userName, false, () => {});
      });
    });

    userHandler.handle(socket, io);
    chatHandler.handle(socket, io);
    deviceHandler.handle(socket, io);
    teamHandler.handle(socket, io);
    hackingHandler.handle(socket, io);
    utilityHandler.handle(socket, io);
    locationHandler.handle(socket, io);
    walletHandler.handle(socket, io);
    calibrationJobHandler.handle(socket, io);
    simpleMessageHandler.handle(socket, io);
  });

  return router;
}

module.exports = handle;
