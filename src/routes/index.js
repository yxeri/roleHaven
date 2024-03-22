'use strict';
import express from 'express';
import path from 'path';
import dbUser from '../db/connectors/user';
import { appConfig, dbConfig } from '../config/defaults/config';
import dbDevice from '../db/connectors/device';
import socketUtils from '../utils/socketIo';
const router = new express.Router();
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
            .handle(socket, io));
    });
    return router;
}
export default handle;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxZQUFZLENBQUM7QUFFYixPQUFPLE9BQU8sTUFBTSxTQUFTLENBQUM7QUFDOUIsT0FBTyxJQUFJLE1BQU0sTUFBTSxDQUFDO0FBQ3hCLE9BQU8sTUFBTSxNQUFNLHVCQUF1QixDQUFDO0FBQzNDLE9BQU8sRUFBRSxTQUFTLEVBQUUsUUFBUSxFQUFFLE1BQU0sMkJBQTJCLENBQUM7QUFFaEUsT0FBTyxRQUFRLE1BQU0seUJBQXlCLENBQUM7QUFDL0MsT0FBTyxXQUFXLE1BQU0sbUJBQW1CLENBQUM7QUFFNUMsTUFBTSxNQUFNLEdBQUcsSUFBSSxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUM7QUFNcEMsU0FBUyxNQUFNLENBQUMsRUFBRTtJQUNoQixNQUFNLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsRUFBRTtRQUMzQixHQUFHLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxTQUFTLEVBQUU7WUFDOUIsS0FBSyxFQUFFLFNBQVMsQ0FBQyxLQUFLO1lBQ3RCLFFBQVEsRUFBRSxTQUFTLENBQUMsUUFBUTtZQUM1QixVQUFVLEVBQUUsU0FBUyxDQUFDLFVBQVU7WUFDaEMsTUFBTSxFQUFFLFdBQVcsU0FBUyxDQUFDLFVBQVUsZUFBZSxTQUFTLENBQUMsU0FBUyxFQUFFO1lBQzNFLE9BQU8sRUFBRSxHQUFHLENBQUMsS0FBSyxDQUFDLEtBQUssSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUM7Z0JBQ3hELENBQUM7b0JBQ0QsVUFBVSxHQUFHLENBQUMsS0FBSyxDQUFDLEtBQUssZ0JBQWdCLFNBQVMsQ0FBQyxTQUFTLEVBQUU7Z0JBQzlELENBQUM7b0JBQ0QsVUFBVSxTQUFTLENBQUMsV0FBVyxnQkFBZ0IsU0FBUyxDQUFDLFNBQVMs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