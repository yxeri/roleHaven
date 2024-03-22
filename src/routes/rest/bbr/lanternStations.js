'use strict';
import express from 'express';
import errorCreator from '../../../error/errorCreator';
import restErrorChecker from '../../../helpers/restErrorChecker';
import lanternStationManager from '../../../managers/bbr/lanternStations';
import objectValidator from '../../../utils/objectValidator';
const router = new express.Router();
function handle(io) {
    router.delete('/:stationId', (request, response) => {
        if (!objectValidator.isValidData(request.params, { stationId: true })) {
            restErrorChecker.checkAndSendError({
                response,
                error: new errorCreator.InvalidData({ expected: '' }),
                sentData: request.body.data,
            });
            return;
        }
        lanternStationManager.deleteLanternStation({
            token: request.headers.authorization,
            stationId: request.params.stationId,
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
    router.get('/', (request, response) => {
        lanternStationManager.getLanternStations({
            token: request.headers.authorization,
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
    router.get('/:stationId', (request, response) => {
        lanternStationManager.getLanternStation({
            stationId: request.params.stationId,
            token: request.headers.authorization,
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
    router.post('/', (request, response) => {
        if (!objectValidator.isValidData(request.body, {
            data: {
                station: {
                    stationId: true,
                    stationName: true,
                },
            },
        })) {
            restErrorChecker.checkAndSendError({
                response,
                error: new errorCreator.InvalidData({ expected: '' }),
                sentData: request.body.data,
            });
            return;
        }
        lanternStationManager.createLanternStation({
            io,
            station: request.body.data.station,
            token: request.headers.authorization,
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
    router.post('/:stationId', (request, response) => {
        if (!objectValidator.isValidData(request.params, { stationId: true })) {
            restErrorChecker.checkAndSendError({
                response,
                error: new errorCreator.InvalidData({ expected: '' }),
                sentData: request.body.data,
            });
            return;
        }
        if (!objectValidator.isValidData(request.body, { data: { station: true } })) {
            restErrorChecker.checkAndSendError({
                response,
                error: new errorCreator.InvalidData({ expected: '' }),
                sentData: request.body.data,
            });
            return;
        }
        lanternStationManager.updateLanternStation({
            io,
            stationId: request.params.stationId,
            station: request.body.data.station,
            token: request.headers.authorization,
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGFudGVyblN0YXRpb25zLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibGFudGVyblN0YXRpb25zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFlBQVksQ0FBQztBQUViLE9BQU8sT0FBTyxNQUFNLFNBQVMsQ0FBQztBQUM5QixPQUFPLFlBQVksTUFBTSw2QkFBNkIsQ0FBQztBQUN2RCxPQUFPLGdCQUFnQixNQUFNLG1DQUFtQyxDQUFDO0FBQ2pFLE9BQU8scUJBQXFCLE1BQU0sdUNBQXVDLENBQUM7QUFDMUUsT0FBTyxlQUFlLE1BQU0sZ0NBQWdDLENBQUM7QUFFN0QsTUFBTSxNQUFNLEdBQUcsSUFBSSxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUM7QUFNcEMsU0FBUyxNQUFNLENBQUMsRUFBRTtJQXFCaEIsTUFBTSxDQUFDLE1BQU0sQ0FBQyxhQUFhLEVBQUUsQ0FBQyxPQUFPLEVBQUUsUUFBUSxFQUFFLEVBQUU7UUFDakQsSUFBSSxDQUFDLGVBQWUsQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUFFLENBQUM7WUFDdEUsZ0JBQWdCLENBQUMsaUJBQWlCLENBQUM7Z0JBQ2pDLFFBQVE7Z0JBQ1IsS0FBSyxFQUFFLElBQUksWUFBWSxDQUFDLFdBQVcsQ0FBQyxFQUFFLFFBQVEsRUFBRSxFQUFFLEVBQUUsQ0FBQztnQkFDckQsUUFBUSxFQUFFLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSTthQUM1QixDQUFDLENBQUM7WUFFSCxPQUFPO1FBQ1QsQ0FBQztRQUVELHFCQUFxQixDQUFDLG9CQUFvQixDQUFDO1lBQ3pDLEtBQUssRUFBRSxPQUFPLENBQUMsT0FBTyxDQUFDLGFBQWE7WUFDcEMsU0FBUyxFQUFFLE9BQU8sQ0FBQyxNQUFNLENBQUMsU0FBUztZQUNuQyxRQUFRLEVBQUUsQ0FBQyxFQUNULEtBQUssRUFDTCxJQUFJLEdBQ0wsRUFBRSxFQUFFO2dCQUNILElB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