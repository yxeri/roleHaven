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
const appConfig = require('../config/defaults/config').app;
const databasePopulation = require('../config/defaults/config').databasePopulation;
const dbDevice = require('../db/connectors/device');
const teamHandler = require('./socketHandlers/team');
const lanternHackingHandler = require('./socketHandlers/lanternHacking');
const utilityHandler = require('./socketHandlers/utility');
const locationHandler = require('./socketHandlers/position');
const deviceHandler = require('./socketHandlers/device');
const walletHandler = require('./socketHandlers/wallet');
const calibrationJobHandler = require('./socketHandlers/calibrationMission');
const simpleMessageHandler = require('./socketHandlers/simpleMsg');
const hackingHandler = require('./socketHandlers/hacking');
// const timedEventHandler = require('./socketHandlers/team');
const chatHandler = require('./socketHandlers/chat');
const userHandler = require('./socketHandlers/user');
const gameCodeHandler = require('./socketHandlers/gameCode');
const docFileHandler = require('./socketHandlers/docFile');

const router = new express.Router();

/**
 * @param {Object} io - Socket.IO
 * @returns {Object} Router
 */
function handle(io) {
  router.get('/control', (req, res) => {
    res.render('control', {
      title: appConfig.title,
      gMapsKey: appConfig.gMapsKey,
      socketPath: appConfig.socketPath,
      mainJs: 'scripts/control.js',
      mainCss: !isNaN(req.query.style) ? `styles/${req.query.style}.css` : 'styles/control.css',
    });
  });

  router.get('/', (req, res) => {
    res.render('index', {
      title: appConfig.title,
      gMapsKey: appConfig.gMapsKey,
      socketPath: appConfig.socketPath,
      mainJs: 'scripts/main.js',
      mainCss: !isNaN(req.query.style) ? `styles/${req.query.style}.css` : 'styles/main.css',
      dyslexic: req.query.dyslexic,
    });
  });

  io.on('connection', (socket) => {
    socket.join(databasePopulation.rooms.public.roomName);
    socket.join(databasePopulation.rooms.bcast.roomName);
    socket.join(databasePopulation.rooms.important.roomName);
    socket.join(databasePopulation.rooms.news.roomName);
    socket.join(databasePopulation.rooms.schedule.roomName);

    socket.emit('startup', {
      data: {
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
        welcomeMessage: appConfig.welcomeMessage,
        requiresVerification: appConfig.userVerify,
      },
    });

    socket.on('disconnect', (params, callback = () => {}) => {
      dbDevice.getDeviceBySocketId({
        socketId: socket.id,
        callback: (deviceData) => {
          if (deviceData.error) {
            return;
          }

          const device = {
            deviceId: deviceData.data.device.deviceId,
          };

          dbDevice.updateDevice({
            device,
            callback: () => {},
          });
        },
      });
      dbUser.getUserById({
        socketId: socket.id,
        callback: ({ error, data }) => {
          if (error) {
            callback({ error });

            return;
          }

          const { user } = data;

          dbUser.updateUserSocketId({
            userName: user.userName,
            callback: () => {},
          });
          dbUser.setUserLastOnline({
            userName: user.userName,
            date: new Date(),
            callback: () => {},
          });
          dbUser.updateUserOnline({
            userName: user.userName,
            online: false,
            callback: () => {},
          });
          dbUser.updateUserIsTracked({
            userName: user.userName,
            isTracked: false,
            callback: () => {},
          });
        },
      });
    });

    userHandler.handle(socket, io);
    chatHandler.handle(socket, io);
    deviceHandler.handle(socket, io);
    teamHandler.handle(socket, io);
    lanternHackingHandler.handle(socket, io);
    utilityHandler.handle(socket, io);
    locationHandler.handle(socket, io);
    walletHandler.handle(socket, io);
    calibrationJobHandler.handle(socket, io);
    simpleMessageHandler.handle(socket, io);
    hackingHandler.handle(socket, io);
    // timedEventHandler.handle(socket, io);
    gameCodeHandler.handle(socket, io);
    docFileHandler.handle(socket, io);
  });

  return router;
}

module.exports = handle;
