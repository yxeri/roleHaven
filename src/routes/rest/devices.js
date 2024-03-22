'use strict';
import express from 'express';
import objectValidator from '../../utils/objectValidator';
import deviceManager from '../../managers/devices';
import restErrorChecker from '../../helpers/restErrorChecker';
import errorCreator from '../../error/errorCreator';
const router = new express.Router();
function handle(io) {
    router.post('/', (request, response) => {
        if (!objectValidator.isValidData(request.body, { data: { device: { deviceName: true } } })) {
            restErrorChecker.checkAndSendError({
                response,
                error: new errorCreator.InvalidData({ expected: 'data = { device: { deviceName } }' }),
                sentData: request.body.data,
            });
            return;
        }
        const { device } = request.body.data;
        const { authorization: token } = request.headers;
        deviceManager.createDevice({
            io,
            token,
            device,
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
    router.get('/', (request, response) => {
        const { authorization: token } = request.headers;
        deviceManager.getDevicesByUser({
            token,
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
    router.get('/:deviceId', (request, response) => {
        if (!objectValidator.isValidData(request.params, { deviceId: true })) {
            restErrorChecker.checkAndSendError({
                response,
                error: new errorCreator.InvalidData({ expected: 'params = { deviceId }' }),
            });
            return;
        }
        const { deviceId } = request.params;
        const { authorization: token } = request.headers;
        deviceManager.getDeviceById({
            deviceId,
            token,
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
    router.put('/:deviceId', (request, response) => {
        if (!objectValidator.isValidData(request.params, { deviceId: true })) {
            restErrorChecker.checkAndSendError({
                response,
                error: new errorCreator.InvalidData({ expected: 'params = { deviceId }' }),
            });
            return;
        }
        if (!objectValidator.isValidData(request.body, { data: { device: true } })) {
            restErrorChecker.checkAndSendError({
                response,
                error: new errorCreator.InvalidData({ expected: 'data = { device }' }),
                sentData: request.body.data,
            });
            return;
        }
        const { device, options, } = request.body.data;
        const { deviceId } = request.params;
        const { authorization: token } = request.headers;
        deviceManager.updateDevice({
            device,
            options,
            io,
            deviceId,
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
    router.delete('/:deviceId', (request, response) => {
        if (!objectValidator.isValidData(request.params, { deviceId: true })) {
            restErrorChecker.checkAndSendError({
                response,
                error: new errorCreator.InvalidData({ expected: 'params = { deviceId }' }),
            });
            return;
        }
        const { deviceId } = request.params;
        const { authorization: token } = request.headers;
        deviceManager.removeDevice({
            io,
            deviceId,
            token,
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
    return router;
}
export default handle;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGV2aWNlcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImRldmljZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsWUFBWSxDQUFDO0FBRWIsT0FBTyxPQUFPLE1BQU0sU0FBUyxDQUFDO0FBQzlCLE9BQU8sZUFBZSxNQUFNLDZCQUE2QixDQUFDO0FBQzFELE9BQU8sYUFBYSxNQUFNLHdCQUF3QixDQUFDO0FBQ25ELE9BQU8sZ0JBQWdCLE1BQU0sZ0NBQWdDLENBQUM7QUFDOUQsT0FBTyxZQUFZLE1BQU0sMEJBQTBCLENBQUM7QUFFcEQsTUFBTSxNQUFNLEdBQUcsSUFBSSxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUM7QUFNcEMsU0FBUyxNQUFNLENBQUMsRUFBRTtJQWlCaEIsTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxPQUFPLEVBQUUsUUFBUSxFQUFFLEVBQUU7UUFDckMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxFQUFFLElBQUksRUFBRSxFQUFFLE1BQU0sRUFBRSxFQUFFLFVBQVUsRUFBRSxJQUFJLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDO1lBQzNGLGdCQUFnQixDQUFDLGlCQUFpQixDQUFDO2dCQUNqQyxRQUFRO2dCQUNSLEtBQUssRUFBRSxJQUFJLFlBQVksQ0FBQyxXQUFXLENBQUMsRUFBRSxRQUFRLEVBQUUsbUNBQW1DLEVBQUUsQ0FBQztnQkFDdEYsUUFBUSxFQUFFLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSTthQUM1QixDQUFDLENBQUM7WUFFSCxPQUFPO1FBQ1QsQ0FBQztRQUVELE1BQU0sRUFBRSxNQUFNLEVBQUUsR0FBRyxPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQztRQUNyQyxNQUFNLEVBQUUsYUFBYSxFQUFFLEtBQUssRUFBRSxHQUFHLE9BQU8sQ0FBQyxPQUFPLENBQUM7UUFFakQsYUFBYSxDQUFDLFlBQVksQ0FBQztZQUN6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