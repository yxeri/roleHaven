/*
 Copyright 2017 Carmilla Mina Jankovic

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
const path = require('path');
const dbUser = require('../db/connectors/user');
const { appConfig, dbConfig } = require('../config/defaults/config');
const dbDevice = require('../db/connectors/device');
const socketUtils = require('../utils/socketIo');

const router = new express.Router();

/**
 * @param {Object} io Socket.IO
 * @returns {Object} Router
 */
function handle(io) {
  router.get('/', (req, res) => {
    res.render(appConfig.indexName);
  });

  io.on('connection', (socket) => {
    socketUtils.joinRequiredRooms({
      io,
      socket,
      socketId: socket.id,
    });

    socket.emit(dbConfig.EmitTypes.STARTUP, {
      data: {
        activeApps: dbConfig.activeApps,
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
        minZoomLevel: appConfig.minZoomLevel,
        maxZoomLevel: appConfig.maxZoomLevel,
        yearModification: appConfig.yearModification,
        mode: appConfig.mode,
        welcomeMessage: appConfig.welcomeMessage,
        userVerify: appConfig.userVerify,
        showDevInfo: appConfig.showDevInfo,
        dayModification: appConfig.dayModification,
        requireOffName: appConfig.requireOffName,
        allowedImages: appConfig.allowedImages,
        customUserFields: dbConfig.customUserFields,
        defaultForum: dbConfig.defaultForum,
        activeTermination: appConfig.activateTermination,
        permissions: {
          CreatePosition: dbConfig.apiCommands.CreatePosition,
          UpdatePosition: dbConfig.apiCommands.UpdatePosition,
          UpdatePositionCoordinates: dbConfig.apiCommands.UpdatePositionCoordinates,
          SendMessage: dbConfig.apiCommands.SendMessage,
          SendWhisper: dbConfig.apiCommands.SendWhisper,
          CreateDocFile: dbConfig.apiCommands.CreateDocFile,
          CreateGameCode: dbConfig.apiCommands.CreateGameCode,
          CreateAlias: dbConfig.apiCommands.CreateAlias,
          CreateDevice: dbConfig.apiCommands.CreateDevice,
          CreateForum: dbConfig.apiCommands.CreateForum,
          CreateForumPost: dbConfig.apiCommands.CreateForumPost,
          CreateForumThread: dbConfig.apiCommands.CreateForumThread,
          CreateRoom: dbConfig.apiCommands.CreateRoom,
          CreateUser: dbConfig.apiCommands.CreateUser,
          CreateTeam: dbConfig.apiCommands.CreateTeam,
          InviteToTeam: dbConfig.apiCommands.InviteToTeam,
          IncludeOff: dbConfig.apiCommands.IncludeOff,
        },
      },
    });

    socket.on('disconnect', (params, callback = () => {}) => {
      dbDevice.updateDevice({
        suppressError: true,
        device: {},
        deviceSocketId: socket.id,
        options: { resetSocket: true },
        callback: ({ error: updateError }) => {
          if (updateError) {
            callback({ error: updateError });

            return;
          }

          dbUser.updateOnline({
            suppressError: true,
            socketId: socket.id,
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

    appConfig.handlers.forEach((handlePath) => require(path.resolve(handlePath)).handle(socket, io)); // eslint-disable-line global-require, import/no-dynamic-require
  });

  return router;
}

module.exports = handle;
