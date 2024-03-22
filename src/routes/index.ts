'use strict';

import express from 'express';
import path from 'path';
import dbUser from '../db/connectors/user';
import { appConfig, dbConfig } from '../config/defaults/config';

import dbDevice from '../db/connectors/device';
import socketUtils from '../utils/socketIo';

const router = new express.Router();

/**
 * @param {Object} io Socket.IO
 * @returns {Object} Router
 */
function handle(io) {
  router.get('/', (req, res) => {
    res.render(appConfig.indexName, {
      title: appConfig.title,
      gMapsKey: appConfig.gMapsKey,
      socketPath: appConfig.socketPath,
      mainJs: `scripts/${appConfig.mainJsName}.js?version=${appConfig.jsVersion}`,
      mainCss: req.query.style && !Number.isNaN(req.query.style)
        ?
        `styles/${req.query.style}.css?version=${appConfig.jsVersion}`
        :
        `styles/${appConfig.mainCssName}.css?version=${appConfig.jsVersion}`,
    });
  });

  router.get('/admin', (req, res) => {
    res.render(appConfig.adminIndexName, {
      title: appConfig.title,
      gMapsKey: appConfig.gMapsKey,
      socketPath: appConfig.socketPath,
      adminJs: `scripts/${appConfig.adminIndexName}.js?version=${appConfig.jsVersion}`,
      adminCss: req.query.style && !Number.isNaN(req.query.style)
        ?
        `styles/admin${req.query.style}.css?version=${appConfig.jsVersion}`
        :
        `styles/${appConfig.adminCssName}.css?version=${appConfig.jsVersion}`,
    });
  });

  io.on('connection', (socket) => {
    socketUtils.joinRequiredRooms({
      io,
      socket,
      socketId: socket.id,
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

    socket.on('disconnect', (params, callback = () => {
    }) => {
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

    appConfig.handlers.forEach((handlePath) => require(path.resolve(handlePath))
      .handle(socket, io)); // eslint-disable-line global-require, import/no-dynamic-require
  });

  return router;
}

export default handle;
