'use strict';
import express from 'express';
import objectValidator from '../../utils/objectValidator';
import userManager from '../../managers/users';
import roomManager from '../../managers/rooms';
import aliasManager from '../../managers/aliases';
import restErrorChecker from '../../helpers/restErrorChecker';
import errorCreator from '../../error/errorCreator';
import { dbConfig } from '../../config/defaults/config';
import calibrationMissionManager from '../../managers/bbr/calibrationMissions';
const router = new express.Router();
function handle(io) {
    router.get('/', (request, response) => {
        const { authorization: token } = request.headers;
        const { includeInactive } = request.query;
        userManager.getUsersByUser({
            token,
            includeInactive,
            callback: ({ error, data, }) => {
                if (error) {
                    restErrorChecker.checkAndSendError({
                        response,
                        error,
                    });
                    return;
                }
                response.json({ data });
            },
        });
    });
    router.post('/:userId/password', (request, response) => {
        const sentData = request.body.data;
        if (!objectValidator.isValidData(request.params, { userId: true })) {
            restErrorChecker.checkAndSendError({
                response,
                error: new errorCreator.InvalidData({ expected: '{ userId }' }),
            });
            return;
        }
        const { authorization: token } = request.headers;
        const { password } = request.body.data;
        const { userId } = request.params;
        userManager.changePassword({
            password,
            userId,
            token,
            callback: ({ error, data, }) => {
                if (error) {
                    sentData.password = typeof sentData.password !== 'undefined';
                    restErrorChecker.checkAndSendError({
                        response,
                        error,
                        sentData,
                    });
                    return;
                }
                response.json({ data });
            },
        });
    });
    router.post('/', (request, response) => {
        const sentData = request.body.data;
        if (!objectValidator.isValidData(request.body, {
            data: {
                user: {
                    username: true,
                    password: true,
                },
            },
        })) {
            sentData.user.password = typeof sentData.user.password !== 'undefined';
            restErrorChecker.checkAndSendError({
                response,
                error: new errorCreator.InvalidData({ expected: '{ data: { user: { username, password } } }' }),
                sentData,
            });
            return;
        }
        const { authorization: token } = request.headers;
        const { user, options, } = request.body.data;
        user.registerDevice = dbConfig.DeviceTypes.RESTAPI;
        userManager.createUser({
            user,
            token,
            io,
            options,
            callback: ({ error, data, }) => {
                if (error) {
                    sentData.user.password = typeof sentData.user.password !== 'undefined';
                    restErrorChecker.checkAndSendError({
                        response,
                        error,
                        sentData,
                    });
                    return;
                }
                response.json({ data });
            },
        });
    });
    router.put('/:userId', (request, response) => {
        if (!objectValidator.isValidData(request.params, { userId: true })) {
            restErrorChecker.checkAndSendError({
                response,
                error: new errorCreator.InvalidData({ expected: '{ userId }' }),
            });
            return;
        }
        if (!objectValidator.isValidData(request.body, { data: { user: true } })) {
            restErrorChecker.checkAndSendError({
                response,
                error: new errorCreator.InvalidData({ expected: '{ data: { user } }' }),
                sentData: request.body.data,
            });
            return;
        }
        const { user, options, } = request.body.data;
        const { userId } = request.params;
        const { authorization: token } = request.headers;
        userManager.updateUser({
            user,
            options,
            io,
            userId,
            token,
            callback: ({ error, data, }) => {
                if (error) {
                    restErrorChecker.checkAndSendError({
                        response,
                        error,
                        sentData: request.body.data,
                    });
                    return;
                }
                response.json({ data });
            },
        });
    });
    router.get('/:userId', (request, response) => {
        if (!objectValidator.isValidData(request.params, { userId: true })) {
            restErrorChecker.checkAndSendError({
                response,
                error: new errorCreator.InvalidData({ expected: '{ userId }' }),
            });
            return;
        }
        const { authorization: token } = request.headers;
        const { userId } = request.params;
        userManager.getUserById({
            token,
            userId,
            callback: ({ error, data, }) => {
                if (error) {
                    restErrorChecker.checkAndSendError({
                        response,
                        error,
                    });
                    return;
                }
                response.json({ data });
            },
        });
    });
    router.put('/:userId/rooms/:roomId/follow', (request, response) => {
        const sentData = request.body.data;
        if (!objectValidator.isValidData(request.params, {
            userId: true,
            roomId: true,
        })) {
            sentData.password = typeof sentData.password !== 'undefined';
            restErrorChecker.checkAndSendError({
                response,
                error: new errorCreator.InvalidData({ expected: '{ userId, roomId }' }),
                sentData,
            });
            return;
        }
        const { password, aliasId, } = request.body.data;
        const { roomId } = request.params;
        const { authorization: token } = request.headers;
        roomManager.followRoom({
            io,
            token,
            roomId,
            password,
            aliasId,
            callback: ({ error, data, }) => {
                if (error) {
                    sentData.password = typeof sentData.password !== 'undefined';
                    restErrorChecker.checkAndSendError({
                        response,
                        error,
                        sentData,
                    });
                    return;
                }
                response.json({ data });
            },
        });
    });
    router.put('/:userId/rooms/:roomId/unfollow', (request, response) => {
        if (!objectValidator.isValidData(request.params, {
            userId: true,
            roomId: true,
        })) {
            restErrorChecker.checkAndSendError({
                response,
                error: new errorCreator.InvalidData({ expected: 'params: { userId, roomId }' }),
                sentData: request.body.data,
            });
            return;
        }
        const { roomId, userId, } = request.params;
        const { authorization: token } = request.headers;
        const { aliasId } = request.body.data;
        roomManager.unfollowRoom({
            io,
            token,
            userId,
            roomId,
            aliasId,
            callback: ({ error, data, }) => {
                if (error) {
                    restErrorChecker.checkAndSendError({
                        response,
                        error,
                        sentData: request.body.data,
                    });
                    return;
                }
                response.json({ data });
            },
        });
    });
    router.get('/:userId/aliases', (request, response) => {
        if (!objectValidator.isValidData(request.params, { userId: true })) {
            restErrorChecker.checkAndSendError({
                response,
                error: new errorCreator.InvalidData({ expected: '{ userId }' }),
                sentData: request.body.data,
            });
            return;
        }
        const { userId } = request.params;
        const { authorization: token } = request.headers;
        aliasManager.getAliasesByUser({
            userId,
            token,
            callback: ({ error, data, }) => {
                if (error) {
                    restErrorChecker.checkAndSendError({
                        response,
                        error,
                        sentData: request.body.data,
                    });
                    return;
                }
                response.json({ data });
            },
        });
    });
    router.put('/:userIdToVerify/verify', (request, response) => {
        if (!objectValidator.isValidData(request.params, { userIdToVerify: true })) {
            restErrorChecker.checkAndSendError({
                response,
                error: new errorCreator.InvalidData({ expected: '{ userId }' }),
                sentData: request.body.data,
            });
            return;
        }
        const { userIdToVerify } = request.params;
        const { authorization: token } = request.headers;
        userManager.verifyUser({
            userIdToVerify,
            token,
            io,
            callback: ({ error, data, }) => {
                if (error) {
                    restErrorChecker.checkAndSendError({
                        response,
                        error,
                        sentData: request.body.data,
                    });
                    return;
                }
                response.json({ data });
            },
        });
    });
    router.post('/:userName/calibrationMission/complete', (request, response) => {
        calibrationMissionManager.completeActiveCalibrationMission({
            io,
            token: request.headers.authorization,
            owner: request.params.userName,
            callback: ({ error, data, }) => {
                if (error) {
                    restErrorChecker.checkAndSendError({
                        response,
                        error,
                        sentData: request.body.data,
                    });
                    return;
                }
                response.json({ data });
            },
        });
    });
    router.get('/:userName/calibrationMission', (request, response) => {
        calibrationMissionManager.getActiveCalibrationMission({
            token: request.headers.authorization,
            userName: request.params.userName,
            callback: ({ error: calibrationError, data: calibrationData, }) => {
                if (calibrationError) {
                    restErrorChecker.checkAndSendError({
                        response,
                        error: calibrationError,
                        sentData: request.body.data,
                    });
                    return;
                }
                response.json({ data: calibrationData });
            },
        });
    });
    return router;
}
export default handle;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXNlcnMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJ1c2Vycy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxZQUFZLENBQUM7QUFFYixPQUFPLE9BQU8sTUFBTSxTQUFTLENBQUM7QUFDOUIsT0FBTyxlQUFlLE1BQU0sNkJBQTZCLENBQUM7QUFDMUQsT0FBTyxXQUFXLE1BQU0sc0JBQXNCLENBQUM7QUFDL0MsT0FBTyxXQUFXLE1BQU0sc0JBQXNCLENBQUM7QUFDL0MsT0FBTyxZQUFZLE1BQU0sd0JBQXdCLENBQUM7QUFDbEQsT0FBTyxnQkFBZ0IsTUFBTSxnQ0FBZ0MsQ0FBQztBQUM5RCxPQUFPLFlBQVksTUFBTSwwQkFBMEIsQ0FBQztBQUNwRCxPQUFPLEVBQUUsUUFBUSxFQUFFLE1BQU0sOEJBQThCLENBQUM7QUFFeEQsT0FBTyx5QkFBeUIsTUFBTSx3Q0FBd0MsQ0FBQztBQUUvRSxNQUFNLE1BQU0sR0FBRyxJQUFJLE9BQU8sQ0FBQyxNQUFNLEVBQUUsQ0FBQztBQU1wQyxTQUFTLE1BQU0sQ0FBQyxFQUFFO0lBZ0JoQixNQUFNLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxDQUFDLE9BQU8sRUFBRSxRQUFRLEVBQUUsRUFBRTtRQUNwQyxNQUFNLEVBQUUsYUFBYSxFQUFFLEtBQUssRUFBRSxHQUFHLE9BQU8sQ0FBQyxPQUFPLENBQUM7UUFDakQsTUFBTSxFQUFFLGVBQWUsRUFBRSxHQUFHLE9BQU8sQ0FBQyxLQUFLLENBQUM7UUFFMUMsV0FBVyxDQUFDLGNBQWMsQ0FBQztZQUN6QixLQUFLO1lBQ0wsZUFBZTtZQUNmLFFBQVEsRUFBRSxDQUFDLEVBQ1QsS0FBSyxFQUNMLElBQUksR0FDTCxFQUFFLEVBQUU7Z0JBQ0gsSUFBSSxLQUFLLEVBQUUsQ0FBQztvQkFDVixnQkFBZ0IsQ0FBQyxpQkFBaUIsQ0FBQzt3QkFDakMsUUFBUTt3QkFDUixLQUFLO3FCQUNOLENBQUMsQ0FBQztvQkFFSCxPQUFPO2dCQUNULENBQUM7Z0JBRUQsUUFB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