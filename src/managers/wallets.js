'use strict';
import { appConfig, dbConfig } from '../config/defaults/config';
import errorCreator from '../error/errorCreator';
import authenticator from '../helpers/authenticator';
import managerHelper from '../helpers/manager';
function getWalletById({ walletId, token, internalCallUser, callback, needsAccess, }) {
    managerHelper.getObjectById({
        token,
        internalCallUser,
        callback,
        needsAccess,
        objectId: walletId,
        objectType: 'wallet',
        objectIdType: 'walletId',
        dbCallFunc: getWalletById,
        commandName: dbConfig.apiCommands.GetWallet.name,
    });
}
function updateWallet({ walletId, wallet, token, callback, io, internalCallUser, socket, options = {}, }) {
    const walletToUpdate = wallet;
    const { amount } = walletToUpdate;
    walletToUpdate.amount = walletToUpdate.amount
        ?
            Number.parseInt(walletToUpdate.amount, 10)
        :
            undefined;
    const { resetAmount, shouldDecreaseAmount, } = options;
    const commandName = !amount && !resetAmount
        ?
            dbConfig.apiCommands.UpdateWallet.name
        :
            dbConfig.apiCommands.UpdateWalletAmount.name;
    authenticator.isUserAllowed({
        token,
        commandName,
        internalCallUser,
        callback: ({ error, data, }) => {
            if (error) {
                callback({ error });
                return;
            }
            if (amount && amount <= 0) {
                callback({ error: new errorCreator.InvalidData({ name: `${commandName}. User: ${data.user.objectId}. Access wallet ${walletId} and update with negative amount.` }) });
                return;
            }
            const { user: authUser } = data;
            getWalletById({
                walletId,
                internalCallUser: authUser,
                callback: ({ error: walletError, data: walletData, }) => {
                    if (walletError) {
                        callback({ error: walletError });
                        return;
                    }
                    if (shouldDecreaseAmount && amount && walletData.wallet.amount < amount) {
                        callback({ error: new errorCreator.Insufficient({ name: `${commandName}. User: ${data.user.objectId}. Access wallet ${walletId} and update amount without enough in wallet.` }) });
                        return;
                    }
                    updateWallet({
                        walletId,
                        options,
                        wallet,
                        callback: ({ error: updateError, data: updateData, }) => {
                            if (updateError) {
                                callback({ error: updateError });
                                return;
                            }
                            const { wallet: updatedWallet } = updateData;
                            const dataToSend = {
                                data: {
                                    wallet: updatedWallet,
                                    changeType: dbConfig.ChangeTypes.UPDATE,
                                },
                            };
                            if (socket) {
                                socket.broadcast.emit(dbConfig.EmitTypes.WALLET, dataToSend);
                            }
                            else {
                                io.emit(dbConfig.EmitTypes.WALLET, dataToSend);
                            }
                            callback(dataToSend);
                        },
                    });
                },
            });
        },
    });
}
function runTransaction({ transaction, callback, }) {
    const { fromWalletId, toWalletId, amount, } = transaction;
    updateWallet({
        walletId: fromWalletId,
        wallet: { amount },
        options: { shouldDecreaseAmount: true },
        callback: ({ error: decreaseError, data: decreaseData, }) => {
            if (decreaseError) {
                callback({ error: decreaseError });
                return;
            }
            updateWallet({
                walletId: toWalletId,
                wallet: { amount },
                options: { shouldDecreaseAmount: false },
                callback: ({ error: increaseError, data: increaseData, }) => {
                    if (increaseError) {
                        callback({ error: increaseError });
                        return;
                    }
                    const { wallet: fromWallet } = decreaseData;
                    const { wallet: toWallet } = increaseData;
                    callback({
                        data: {
                            fromWallet,
                            toWallet,
                        },
                    });
                },
            });
        },
    });
}
function checkAmount({ walletId, amount, callback, }) {
    getWalletById({
        walletId,
        callback: ({ error, data, }) => {
            if (error) {
                callback({ error });
                return;
            }
            const { wallet } = data;
            if (wallet.amount - amount < appConfig.walletMinimumAmount) {
                callback({ error: new errorCreator.Insufficient({ name: `checkAmount. Update amount ${amount} without enough in wallet ${walletId}.` }) });
                return;
            }
            callback({ data: { success: true } });
        },
    });
}
function getWalletsByUser({ callback, token, }) {
    managerHelper.getObjects({
        callback,
        token,
        commandName: dbConfig.apiCommands.GetWallet.name,
        objectsType: 'wallets',
        dbCallFunc: getWalletsByUser,
    });
}
function updateAccess({ token, walletId, teamAdminIds, userAdminIds, userIds, teamIds, bannedIds, shouldRemove, callback, }) {
    authenticator.isUserAllowed({
        token,
        commandName: dbConfig.apiCommands.UpdateWallet.name,
        callback: ({ error, data, }) => {
            if (error) {
                callback({ error });
                return;
            }
            const { user: authUser } = data;
            getWalletById({
                walletId,
                internalCallUser: authUser,
                callback: ({ error: walletError, data: walletData, }) => {
                    if (walletError) {
                        callback({ error: walletError });
                        return;
                    }
                    const { wallet } = walletData;
                    const { hasFullAccess, } = authenticator.hasAccessTo({
                        objectToAccess: wallet,
                        toAuth: authUser,
                    });
                    if (!hasFullAccess) {
                        callback({ error: errorCreator.NotAllowed({ name: `update wallet ${walletId}` }) });
                        return;
                    }
                    updateAccess({
                        shouldRemove,
                        userIds,
                        teamIds,
                        bannedIds,
                        teamAdminIds,
                        userAdminIds,
                        walletId,
                        callback,
                    });
                },
            });
        },
    });
}
export { updateWallet };
export { getWalletById };
export { runTransaction };
export { checkAmount };
export { getWalletsByUser };
export { updateAccess };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2FsbGV0cy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIndhbGxldHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsWUFBWSxDQUFDO0FBRWIsT0FBTyxFQUFFLFNBQVMsRUFBRSxRQUFRLEVBQUUsTUFBTSwyQkFBMkIsQ0FBQztBQUVoRSxPQUFPLFlBQVksTUFBTSx1QkFBdUIsQ0FBQztBQUNqRCxPQUFPLGFBQWEsTUFBTSwwQkFBMEIsQ0FBQztBQUNyRCxPQUFPLGFBQWEsTUFBTSxvQkFBb0IsQ0FBQztBQVMvQyxTQUFTLGFBQWEsQ0FBQyxFQUNyQixRQUFRLEVBQ1IsS0FBSyxFQUNMLGdCQUFnQixFQUNoQixRQUFRLEVBQ1IsV0FBVyxHQUNaO0lBQ0MsYUFBYSxDQUFDLGFBQWEsQ0FBQztRQUMxQixLQUFLO1FBQ0wsZ0JBQWdCO1FBQ2hCLFFBQVE7UUFDUixXQUFXO1FBQ1gsUUFBUSxFQUFFLFFBQVE7UUFDbEIsVUFBVSxFQUFFLFFBQVE7UUFDcEIsWUFBWSxFQUFFLFVBQVU7UUFDeEIsVUFBVSxFQUFFLGFBQWE7UUFDekIsV0FBVyxFQUFFLFFBQVEsQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFDLElBQUk7S0FDakQsQ0FBQyxDQUFDO0FBQ0wsQ0FBQztBQVdELFNBQVMsWUFBWSxDQUFDLEVBQ3BCLFFBQVEsRUFDUixNQUFNLEVBQ04sS0FBSyxFQUNMLFFBQVEsRUFDUixFQUFFLEVBQ0YsZ0JBQWdCLEVBQ2hCLE1BQU0sRUFDTixPQUFPLEdBQUcsRUFBRSxHQUNiO0lBQ0MsTUFBTSxjQUFjLEdBQUcsTUFBTSxDQUFDO0lBQzlCLE1BQU0sRUFBRSxNQUFNLEVBQUUsR0FBRyxjQUFjLENBQUM7SUFDbEMsY0FBYyxDQUFDLE1BQU0sR0FBRyxjQUFjLENBQUMsTUFBTTtRQUMzQyxDQUFDO1lBQ0QsTUFBTSxDQUFDLFFBQVEsQ0FBQyxjQUFjLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQztRQUMxQyxDQUFDO1lBQ0QsU0FBUyxDQUFDO0lBRVos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