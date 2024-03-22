'use strict';
const express = require('express');
const objectValidator = require('../../utils/objectValidator');
const positionManager = require('../../managers/positions');
const restErrorChecker = require('../../helpers/restErrorChecker');
const errorCreator = require('../../error/errorCreator');
const router = new express.Router();
function handle(io) {
    router.post('/', (request, response) => {
        if (!objectValidator.isValidData(request.body, { data: { position: true } })) {
            restErrorChecker.checkAndSendError({
                response,
                error: new errorCreator.InvalidData({ expected: 'data = { position }' }),
                sentData: request.body.data,
            });
        }
        const { position } = request.body.data;
        const { authorization: token } = request.headers;
        positionManager.createPosition({
            io,
            position,
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
    router.get('/', (request, response) => {
        const { authorization: token } = request.headers;
        positionManager.getPositionsByUser({
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
    router.get('/:positionId', (request, response) => {
        if (!objectValidator.isValidData(request.params, { positionId: true })) {
            restErrorChecker.checkAndSendError({
                response,
                error: new errorCreator.InvalidData({ expected: 'params = { positionId }' }),
            });
            return;
        }
        const { authorization: token } = request.headers;
        const { positionId } = request.params;
        positionManager.getPositionById({
            token,
            positionId,
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
    router.delete('/:positionId', (request, response) => {
        if (!objectValidator.isValidData(request.params, { positionId: true })) {
            restErrorChecker.checkAndSendError({
                response,
                error: new errorCreator.InvalidData({ expected: 'params = { positionId }' }),
            });
            return;
        }
        const { positionId } = request.params;
        const { authorization: token } = request.headers;
        positionManager.removePosition({
            io,
            positionId,
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
    router.put('/:positionId', (request, response) => {
        if (!objectValidator.isValidData(request.params, { positionId: true })) {
            restErrorChecker.checkAndSendError({
                response,
                error: new errorCreator.InvalidData({ expected: 'params = { positionId }' }),
            });
            return;
        }
        if (!objectValidator.isValidData(request.body, { data: { position: true } })) {
            restErrorChecker.checkAndSendError({
                response,
                error: new errorCreator.InvalidData({ expected: 'data = { position }' }),
                sentData: request.body.data,
            });
            return;
        }
        const { position, options, } = request.body.data;
        const { positionId } = request.params;
        const { authorization: token } = request.headers;
        positionManager.updatePosition({
            position,
            options,
            io,
            positionId,
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
    return router;
}
export default handle;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9zaXRpb25zLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsicG9zaXRpb25zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFlBQVksQ0FBQztBQUViLE1BQU0sT0FBTyxHQUFHLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQztBQUNuQyxNQUFNLGVBQWUsR0FBRyxPQUFPLENBQUMsNkJBQTZCLENBQUMsQ0FBQztBQUMvRCxNQUFNLGVBQWUsR0FBRyxPQUFPLENBQUMsMEJBQTBCLENBQUMsQ0FBQztBQUM1RCxNQUFNLGdCQUFnQixHQUFHLE9BQU8sQ0FBQyxnQ0FBZ0MsQ0FBQyxDQUFDO0FBQ25FLE1BQU0sWUFBWSxHQUFHLE9BQU8sQ0FBQywwQkFBMEIsQ0FBQyxDQUFDO0FBRXpELE1BQU0sTUFBTSxHQUFHLElBQUksT0FBTyxDQUFDLE1BQU0sRUFBRSxDQUFDO0FBTXBDLFNBQVMsTUFBTSxDQUFDLEVBQUU7SUFrQmhCLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUMsT0FBTyxFQUFFLFFBQVEsRUFBRSxFQUFFO1FBQ3JDLElBQUksQ0FBQyxlQUFlLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsRUFBRSxJQUFJLEVBQUUsRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUM7WUFDN0UsZ0JBQWdCLENBQUMsaUJBQWlCLENBQUM7Z0JBQ2pDLFFBQVE7Z0JBQ1IsS0FBSyxFQUFFLElBQUksWUFBWSxDQUFDLFdBQVcsQ0FBQyxFQUFFLFFBQVEsRUFBRSxxQkFBcUIsRUFBRSxDQUFDO2dCQUN4RSxRQUFRLEVBQUUsT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJO2FBQzVCLENBQUMsQ0FBQztRQUNMLENBQUM7UUFFRCxNQUFNLEVBQUUsUUFBUSxFQUFFLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUM7UUFDdkMsTUFBTSxFQUFFLGFBQWEsRUFBRSxLQUFLLEVBQUUsR0FBRyxP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