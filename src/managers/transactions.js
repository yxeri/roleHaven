'use strict';
import { dbConfig } from '../config/defaults/config';
import errorCreator from '../error/errorCreator';
import authenticator from '../helpers/authenticator';
import walletManager from './wallets';
import managerHelper from '../helpers/manager';
function getTransactionById({ transactionId, token, internalCallUser, callback, }) {
    authenticator.isUserAllowed({
        token,
        internalCallUser,
        commandName: dbConfig.apiCommands.GetTransaction.name,
        callback: ({ error, data, }) => {
            if (error) {
                callback({ error });
                return;
            }
            const { user: authUser } = data;
            getTransactionById({
                transactionId,
                callback: ({ error: transactionError, data: transactionData, }) => {
                    if (transactionError) {
                        callback({ error: transactionError });
                        return;
                    }
                    const { transaction: foundTransaction } = transactionData;
                    const { hasAccess, canSee, } = authenticator.hasAccessTo({
                        objectToAccess: foundTransaction,
                        toAuth: authUser,
                    });
                    if (!canSee) {
                        callback({ error: errorCreator.NotAllowed({ name: `transaction ${transactionId}` }) });
                        return;
                    }
                    if (!hasAccess) {
                        callback({ data: { transaction: managerHelper.stripObject({ object: foundTransaction }) } });
                        return;
                    }
                    callback({ data: transactionData });
                },
            });
        },
    });
}
function getTransactionsByWallet({ walletId, token, callback, }) {
    authenticator.isUserAllowed({
        token,
        commandName: dbConfig.apiCommands.GetTransaction.name,
        callback: ({ error, data, }) => {
            if (error) {
                callback({ error });
                return;
            }
            const { user: authUser } = data;
            walletManager.getWalletById({
                walletId,
                internalCallUser: authUser,
                callback: ({ error: walletError }) => {
                    if (walletError) {
                        callback({ error: walletError });
                        return;
                    }
                    getTransactionsByWallet({
                        walletId,
                        callback: ({ error: transError, data: transData, }) => {
                            if (transError) {
                                callback({ error: transError });
                                return;
                            }
                            const { transactions } = transData;
                            callback({ data: { transactions } });
                        },
                    });
                },
            });
        },
    });
}
function createTransaction({ transaction, io, socket, callback, }) {
    if (transaction.fromWalletId === transaction.toWalletId) {
        callback({ error: new errorCreator.InvalidData({ name: 'transfer to self' }) });
        return;
    }
    if (transaction.amount <= 0) {
        callback({ error: new errorCreator.Insufficient({ name: 'amount is 0 or less' }) });
        return;
    }
    const newTransaction = transaction;
    newTransaction.amount = Math.abs(newTransaction.amount);
    newTransaction.ownerId = newTransaction.ownerId || dbConfig.users.systemUser.objectId;
    walletManager.checkAmount({
        walletId: newTransaction.fromWalletId,
        amount: newTransaction.amount,
        callback: ({ error: amountError }) => {
            if (amountError) {
                callback({ error: amountError });
                return;
            }
            createTransaction({
                transaction: newTransaction,
                callback: ({ error: transactionError, data: transactionData, }) => {
                    if (transactionError) {
                        callback({ error: transactionError });
                        return;
                    }
                    const { transaction: createdTransaction } = transactionData;
                    walletManager.runTransaction({
                        transaction: createdTransaction,
                        callback: ({ error: runTransactionError, data: runTransactionData, }) => {
                            if (runTransactionError) {
                                callback({ error: runTransactionError });
                                return;
                            }
                            const { fromWallet, toWallet, } = runTransactionData;
                            const fromDataToSend = {
                                data: {
                                    transaction: createdTransaction,
                                    changeType: dbConfig.ChangeTypes.CREATE,
                                },
                            };
                            const toDataToSend = {
                                data: {
                                    transaction: createdTransaction,
                                    changeType: dbConfig.ChangeTypes.CREATE,
                                },
                            };
                            const fromWalletData = {
                                data: {
                                    wallet: fromWallet,
                                    changeType: dbConfig.ChangeTypes.UPDATE,
                                },
                            };
                            const toWalletData = {
                                data: {
                                    wallet: toWallet,
                                    changeType: dbConfig.ChangeTypes.UPDATE,
                                },
                            };
                            if (socket) {
                                socket.broadcast.to(fromWallet.objectId)
                                    .emit(dbConfig.EmitTypes.TRANSACTION, fromDataToSend);
                                socket.broadcast.to(toWallet.objectId)
                                    .emit(dbConfig.EmitTypes.TRANSACTION, toDataToSend);
                            }
                            else {
                                io.to(fromWallet.objectId)
                                    .emit(dbConfig.EmitTypes.TRANSACTION, fromDataToSend);
                                io.to(toWallet.objectId)
                                    .emit(dbConfig.EmitTypes.TRANSACTION, toDataToSend);
                            }
                            io.to(fromWallet.objectId)
                                .emit(dbConfig.EmitTypes.WALLET, fromWalletData);
                            io.to(toWallet.objectId)
                                .emit(dbConfig.EmitTypes.WALLET, toWalletData);
                            callback(fromDataToSend);
                        },
                    });
                },
            });
        },
    });
}
function createTransactionBasedOnToken({ transaction, io, token, socket, callback, }) {
    authenticator.isUserAllowed({
        token,
        commandName: dbConfig.apiCommands.CreateTransaction.name,
        callback: ({ error, data, }) => {
            if (error) {
                callback({ error });
                return;
            }
            const { user: authUser } = data;
            walletManager.getWalletById({
                internalCallUser: authUser,
                walletId: transaction.fromWalletId,
                callback: ({ error: walletError, data: walletData, }) => {
                    if (walletError) {
                        callback({ error: walletError });
                        return;
                    }
                    const transactionToCreate = transaction;
                    const { wallet: foundWallet } = walletData;
                    transactionToCreate.teamId = foundWallet.teamId;
                    transactionToCreate.ownerId = foundWallet.ownerId;
                    transactionToCreate.ownerAliasId = foundWallet.ownerAliasId;
                    createTransaction({
                        io,
                        callback,
                        socket,
                        transaction: transactionToCreate,
                    });
                },
            });
        },
    });
}
function removeTransaction({ token, transactionId, callback, io, }) {
    authenticator.isUserAllowed({
        token,
        commandName: dbConfig.apiCommands.RemoveTransaction.name,
        callback: ({ error, data, }) => {
            if (error) {
                callback({ error });
                return;
            }
            const { user: authUser } = data;
            getTransactionById({
                transactionId,
                internalCallUser: authUser,
                callback: ({ error: getTransactionError, data: getTransactionData, }) => {
                    if (getTransactionError) {
                        callback({ error: getTransactionError });
                        return;
                    }
                    const { transaction: foundTransaction } = getTransactionData;
                    const { hasFullAccess, } = authenticator.hasAccessTo({
                        objectToAccess: foundTransaction,
                        toAuth: authUser,
                    });
                    if (!hasFullAccess) {
                        callback({ error: new errorCreator.NotAllowed({ name: `remove transaction ${transactionId}` }) });
                        return;
                    }
                    const { amount, fromWalletId, toWalletId, } = foundTransaction;
                    const reversedTransaction = {
                        amount,
                        objectId: transactionId,
                        fromWalletId: toWalletId,
                        toWalletId: fromWalletId,
                    };
                    walletManager.runTransaction({
                        transaction: reversedTransaction,
                        callback: ({ error: runTransactionError, data: runTransactionData, }) => {
                            if (runTransactionError) {
                                callback({ error: runTransactionError });
                                return;
                            }
                            const { fromWallet: updatedFromWallet, toWallet: updatedToWallet, } = runTransactionData;
                            removeTransaction({
                                transactionId,
                                callback: ({ error: transactionError }) => {
                                    if (transactionError) {
                                        callback({ error: transactionError });
                                        return;
                                    }
                                    const toDataToSend = {
                                        data: {
                                            wallet: updatedToWallet,
                                            changeType: dbConfig.ChangeTypes.REMOVE,
                                            transaction: { objectId: transactionId },
                                        },
                                    };
                                    const fromDataToSend = {
                                        data: {
                                            wallet: updatedFromWallet,
                                            transaction: { objectId: transactionId },
                                            changeType: dbConfig.ChangeTypes.UPDATE,
                                        },
                                    };
                                    io.to(updatedToWallet.objectId)
                                        .emit(dbConfig.EmitTypes.TRANSACTION, toDataToSend);
                                    io.to(updatedFromWallet.objectId)
                                        .emit(dbConfig.EmitTypes.TRANSACTION, fromDataToSend);
                                    callback({
                                        data: {
                                            fromWallet: updatedFromWallet,
                                            toWallet: updatedToWallet,
                                            transaction: reversedTransaction,
                                            changeType: dbConfig.ChangeTypes.REMOVE,
                                        },
                                    });
                                },
                            });
                        },
                    });
                },
            });
        },
    });
}
function updateTransaction({ token, transaction, transactionId, options, callback, io, socket, }) {
    authenticator.isUserAllowed({
        token,
        commandName: dbConfig.apiCommands.UpdateTransaction.name,
        callback: ({ error, data, }) => {
            if (error) {
                callback({ error });
                return;
            }
            const { user: authUser } = data;
            getTransactionById({
                transactionId,
                internalCallUser: authUser,
                callback: ({ error: transactionError, data: transactionData, }) => {
                    if (transactionError) {
                        callback({ error: transactionError });
                        return;
                    }
                    const { transaction: foundTransaction } = transactionData;
                    const { hasFullAccess, } = authenticator.hasAccessTo({
                        objectToAccess: foundTransaction,
                        toAuth: authUser,
                    });
                    if (!hasFullAccess) {
                        callback({ error: new errorCreator.NotAllowed({ name: `update transaction ${transactionId}` }) });
                        return;
                    }
                    updateTransaction({
                        options,
                        transaction,
                        transactionId,
                        callback: ({ error: updateError, data: updateData, }) => {
                            if (updateError) {
                                callback({ error: updateError });
                                return;
                            }
                            const { transaction: updatedTransaction } = updateData;
                            const dataToSend = {
                                data: {
                                    transaction: updatedTransaction,
                                    changeType: dbConfig.ChangeTypes.UPDATE,
                                },
                            };
                            if (socket) {
                                socket.broadcast.to(updatedTransaction.fromWalletId)
                                    .emit(dbConfig.EmitTypes.TRANSACTION, dataToSend);
                                socket.broadcast.to(updatedTransaction.toWalletId)
                                    .emit(dbConfig.EmitTypes.TRANSACTION, dataToSend);
                            }
                            else {
                                io.to(updatedTransaction.fromWalletId)
                                    .emit(dbConfig.EmitTypes.TRANSACTION, dataToSend);
                                io.to(updatedTransaction.toWalletId)
                                    .emit(dbConfig.EmitTypes.TRANSACTION, dataToSend);
                            }
                            callback(dataToSend);
                        },
                    });
                },
            });
        },
    });
}
function getTransactionsByUser({ token, callback, }) {
    authenticator.isUserAllowed({
        token,
        commandName: dbConfig.apiCommands.GetTransaction.name,
        callback: ({ error, data, }) => {
            if (error) {
                callback({ error });
                return;
            }
            const { user: authUser } = data;
            getTransactionsByUser({
                user: authUser,
                callback: ({ error: transactionError, data: transactionData, }) => {
                    if (transactionError) {
                        callback({ error: transactionError });
                        return;
                    }
                    const { transactions } = transactionData;
                    const allTransactions = transactions.map((transaction) => {
                        const { hasFullAccess } = authenticator.hasAccessTo({
                            toAuth: authUser,
                            objectToAccess: transaction,
                        });
                        if (!hasFullAccess) {
                            return managerHelper.stripObject({ object: transaction });
                        }
                        return transaction;
                    });
                    callback({ data: { transactions: allTransactions } });
                },
            });
        },
    });
}
export { createTransactionBasedOnToken };
export { getTransactionsByWallet };
export { createTransaction };
export { getTransactionById };
export { removeTransaction };
export { updateTransaction };
export { getTransactionsByUser };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHJhbnNhY3Rpb25zLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsidHJhbnNhY3Rpb25zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFlBQVksQ0FBQztBQUViLE9BQU8sRUFBRSxRQUFRLEVBQUUsTUFBTSwyQkFBMkIsQ0FBQztBQUVyRCxPQUFPLFlBQVksTUFBTSx1QkFBdUIsQ0FBQztBQUNqRCxPQUFPLGFBQWEsTUFBTSwwQkFBMEIsQ0FBQztBQUNyRCxPQUFPLGFBQWEsTUFBTSxXQUFXLENBQUM7QUFDdEMsT0FBTyxhQUFhLE1BQU0sb0JBQW9CLENBQUM7QUFTL0MsU0FBUyxrQkFBa0IsQ0FBQyxFQUMxQixhQUFhLEVBQ2IsS0FBSyxFQUNMLGdCQUFnQixFQUNoQixRQUFRLEdBQ1Q7SUFDQyxhQUFhLENBQUMsYUFBYSxDQUFDO1FBQzFCLEtBQUs7UUFDTCxnQkFBZ0I7UUFDaEIsV0FBVyxFQUFFLFFBQVEsQ0FBQyxXQUFXLENBQUMsY0FBYyxDQUFDLElBQUk7UUFDckQsUUFBUSxFQUFFLENBQUMsRUFDVCxLQUFLLEVBQ0wsSUFBSSxHQUNMLEVBQUUsRUFBRTtZQUNILElBQUksS0FBSyxFQUFFLENBQUM7Z0JBQ1YsUUFBUSxDQUFDLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQztnQkFFcEIsT0FBTztZQUNULENBQUM7WUFFRCxNQUFNLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxHQUFHLElBQUksQ0FBQztZQUVoQyxrQkFBa0IsQ0FBQztnQkFDakIsYUFBYTtnQkFDYixRQUFRLEVBQUUsQ0FBQyxFQUNULEtBQUssRUFBRSxnQkFBZ0IsRUFDdkIsSUFBSSxFQUFFLGVBQWUsR0FDdEIsRUFBRSxFQUFFO29CQUNILElBQUksZ0JBQWdCLEVBQUUsQ0FBQzt3QkFDckIsUUFBUSxDQUFDLEVBQUUsS0FBSyxFQUFFLGdCQUFnQixFQUFFLENBQUMsQ0FBQzt3QkFFdEMsT0FBTztvQkFDVCxDQUFDO29CQUVELE1BQU0sRUFBRSxXQUFXLEVBQUUs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