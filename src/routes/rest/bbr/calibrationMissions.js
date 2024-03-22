'use strict';
import express from 'express';
import errorCreator from '../../../error/errorCreator';
import restErrorChecker from '../../../helpers/restErrorChecker';
import calibrationMissionsManager from '../../../managers/bbr/calibrationMissions';
import objectValidator from '../../../utils/objectValidator';
const router = new express.Router();
function handle(io) {
    router.get('/', (request, response) => {
        calibrationMissionsManager.getCalibrationMissions({
            token: request.headers.authorization,
            getInactive: true,
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
    router.delete('/', (request, response) => {
        if (!objectValidator.isValidData(request.body, { data: { stationId: true } })) {
            restErrorChecker.checkAndSendError({
                response,
                error: new errorCreator.InvalidData({ expected: '' }),
                sentData: request.body.data,
            });
            return;
        }
        calibrationMissionsManager.removeCalibrationMissionsById({
            io,
            stationId: request.body.data.stationId,
            token: request.headers.authorization,
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
    router.get('/active', (request, response) => {
        calibrationMissionsManager.getCalibrationMissions({
            token: request.headers.authorization,
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
    router.post('/:userName/calibrationMission/complete', (request, response) => {
        calibrationMissionsManager.completeActiveCalibrationMission({
            io,
            token: request.headers.authorization,
            ownerName: request.params.userName,
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
    router.post('/:userName/calibrationMission/cancel', (request, response) => {
        calibrationMissionsManager.cancelActiveCalibrationMission({
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
    return router;
}
export default handle;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2FsaWJyYXRpb25NaXNzaW9ucy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImNhbGlicmF0aW9uTWlzc2lvbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsWUFBWSxDQUFDO0FBRWIsT0FBTyxPQUFPLE1BQU0sU0FBUyxDQUFDO0FBQzlCLE9BQU8sWUFBWSxNQUFNLDZCQUE2QixDQUFDO0FBQ3ZELE9BQU8sZ0JBQWdCLE1BQU0sbUNBQW1DLENBQUM7QUFDakUsT0FBTywwQkFBMEIsTUFBTSwyQ0FBMkMsQ0FBQztBQUNuRixPQUFPLGVBQWUsTUFBTSxnQ0FBZ0MsQ0FBQztBQUU3RCxNQUFNLE1BQU0sR0FBRyxJQUFJLE9BQU8sQ0FBQyxNQUFNLEVBQUUsQ0FBQztBQU1wQyxTQUFTLE1BQU0sQ0FBQyxFQUFFO0lBOEJoQixNQUFNLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxDQUFDLE9BQU8sRUFBRSxRQUFRLEVBQUUsRUFBRTtRQUNwQywwQkFBMEIsQ0FBQyxzQkFBc0IsQ0FBQztZQUNoRCxLQUFLLEVBQUUsT0FBTyxDQUFDLE9BQU8sQ0FBQyxhQUFhO1lBQ3BDLFdBQVcsRUFBRSxJQUFJO1lBQ2pCLFFBQVEsRUFBRSxDQUFDLEVBQ1QsS0FBSyxFQUFFLGdCQUFnQixFQUN2QixJQUFJLEVBQUUsZUFBZSxHQUN0QixFQUFFLEVBQUU7Z0JBQ0gsSUFBSSxnQkFBZ0IsRUFBRSxDQUFDO29CQUNyQixnQkFBZ0IsQ0FBQyxpQkFBaUIsQ0FBQzt3QkFDakMsUUFBUTt3QkFDUixLQUFLLEVBQUUsZ0JBQWdCO3dCQUN2QixRQUFRLEVBQUUsT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJO3FCQUM1QixDQUFDLENBQUM7b0JBRUgsT0FBTztnQkFDVCxDQUFDO2dCQUVELFFBQVEsQ0FBQyxJQUFJLENBQUMsRUFBRSxJQUFJLEVBQUUsZUFBZSxFQUFFLENBQUMsQ0FBQztZQUMzQyxDQUFDO1NBQ0YsQ0FBQyxDQUFDO0lBQ0wsQ0FBQyxDQUFDLENBQUM7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