'use strict';
const express = require('express');
const objectValidator = require('../../utils/objectValidator');
const walletManager = require('../../managers/wallets');
const transactionManager = require('../../managers/transactions');
const restErrorChecker = require('../../helpers/restErrorChecker');
const errorCreator = require('../../error/errorCreator');
const router = new express.Router();
function handle(io) {
    router.get('/', (request, response) => {
        const { authorization: token } = request.headers;
        walletManager.getWalletsByUser({
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
    router.get('/:walletId', (request, response) => {
        if (!objectValidator.isValidData(request.params, { walletId: true })) {
            restErrorChecker.checkAndSendError({
                response,
                error: new errorCreator.InvalidData({ expected: 'params = { walletId }' }),
            });
            return;
        }
        const { walletId } = request.params;
        const { authorization: token } = request.headers;
        walletManager.getWalletById({
            token,
            walletId,
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
    router.put('/:walletId', (request, response) => {
        if (!objectValidator.isValidData(request.params, { walletId: true })) {
            restErrorChecker.checkAndSendError({
                response,
                error: new errorCreator.InvalidData({ expected: 'params = { walletId }' }),
            });
            return;
        }
        if (!objectValidator.isValidData(request.body, { data: { wallet: true } })) {
            restErrorChecker.checkAndSendError({
                response,
                error: new errorCreator.InvalidData({ expected: '{ data: { wallet } }' }),
                sentData: request.body.data,
            });
            return;
        }
        const { walletId } = request.params;
        const { wallet } = request.body.data;
        const { authorization: token } = request.headers;
        walletManager.updateWallet({
            wallet,
            walletId,
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
    router.get('/:walletId/transactions', (request, response) => {
        if (!objectValidator.isValidData(request.params, { walletId: true })) {
            restErrorChecker.checkAndSendError({
                response,
                error: new errorCreator.InvalidData({ expected: 'params = { walletId }' }),
            });
            return;
        }
        const { walletId } = request.params;
        const { authorization: token } = request.headers;
        transactionManager.getTransactionsByWallet({
            walletId,
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2FsbGV0cy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIndhbGxldHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsWUFBWSxDQUFDO0FBRWIsTUFBTSxPQUFPLEdBQUcsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDO0FBQ25DLE1BQU0sZUFBZSxHQUFHLE9BQU8sQ0FBQyw2QkFBNkIsQ0FBQyxDQUFDO0FBQy9ELE1BQU0sYUFBYSxHQUFHLE9BQU8sQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDO0FBQ3hELE1BQU0sa0JBQWtCLEdBQUcsT0FBTyxDQUFDLDZCQUE2QixDQUFDLENBQUM7QUFDbEUsTUFBTSxnQkFBZ0IsR0FBRyxPQUFPLENBQUMsZ0NBQWdDLENBQUMsQ0FBQztBQUNuRSxNQUFNLFlBQVksR0FBRyxPQUFPLENBQUMsMEJBQTBCLENBQUMsQ0FBQztBQUV6RCxNQUFNLE1BQU0sR0FBRyxJQUFJLE9BQU8sQ0FBQyxNQUFNLEVBQUUsQ0FBQztBQU1wQyxTQUFTLE1BQU0sQ0FBQyxFQUFFO0lBY2hCLE1BQU0sQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLENBQUMsT0FBTyxFQUFFLFFBQVEsRUFBRSxFQUFFO1FBQ3BDLE1BQU0sRUFBRSxhQUFhLEVBQUUsS0FBSyxFQUFFLEdBQUcsT0FBTyxDQUFDLE9BQU8sQ0FBQztRQUVqRCxhQUFhLENBQUMsZ0JBQWdCLENBQUM7WUFDN0IsS0FBSztZQUNMLFFBQVEsRUFBRSxDQUFDLEVBQ1QsS0FBSyxFQUNMLElBQUksR0FDTCxFQUFFLEVBQUU7Z0JBQ0gsSUFBSSxLQUFLLEVBQUUsQ0FBQztvQkFDVixnQkFBZ0IsQ0FBQyxpQkFBaUIsQ0FBQzt3QkFDakMsUUFBUTt3QkFDUixLQUFLO3dCQUNMLFFBQVEsRUFBRSxPQUFPLENBQUMsSUFBSSxDQUFDLElBQUk7cUJBQzVCLENBQUMsQ0FBQztvQkFFSCxPQUFPO2dCQUNULENBQUM7Z0JBRUQsUUFBUSxDQUFDLElBQUksQ0FBQyxFQUFFLElBQUksRUFBRSxD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