'use strict';

import { appConfig, dbConfig } from '../config/defaults/config';

import errorCreator from '../error/errorCreator';
import authenticator from '../helpers/authenticator';
import managerHelper from '../helpers/manager';

/**
 * Get wallet.
 * @param {Object} params Parameters.
 * @param {string} params.walletId Id of the wallet.
 * @param {string} params.token jwt.
 * @param {Function} params.callback Callback.
 */
function getWalletById({
  walletId,
  token,
  internalCallUser,
  callback,
  needsAccess,
}) {
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

/**
 * Update wallet.
 * @param {Object} params Parameters.
 * @param {string} params.walletId Id of the wallet.
 * @param {Object} params.wallet Wallet parameters to update.
 * @param {Object} params.options Update options.
 * @param {Function} params.callback Callback.
 * @param {Object} params.io Socket.io.
 */
function updateWallet({
  walletId,
  wallet,
  token,
  callback,
  io,
  internalCallUser,
  socket,
  options = {},
}) {
  const walletToUpdate = wallet;
  const { amount } = walletToUpdate;
  walletToUpdate.amount = walletToUpdate.amount
    ?
    Number.parseInt(walletToUpdate.amount, 10)
    :
    undefined;

  const {
    resetAmount,
    shouldDecreaseAmount,
  } = options;
  const commandName = !amount && !resetAmount
    ?
    dbConfig.apiCommands.UpdateWallet.name
    :
    dbConfig.apiCommands.UpdateWalletAmount.name;

  authenticator.isUserAllowed({
    token,
    commandName,
    internalCallUser,
    callback: ({
      error,
      data,
    }) => {
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
        callback: ({
          error: walletError,
          data: walletData,
        }) => {
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
            callback: ({
              error: updateError,
              data: updateData,
            }) => {
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
              } else {
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

/**
 * Modifies wallets based on transaction.
 * @param {Object} params Parameters.
 * @param {Object} params.transaction Transaction.
 * @param {Function} params.callback Callback
 */
function runTransaction({
  transaction,
  callback,
}) {
  const {
    fromWalletId,
    toWalletId,
    amount,
  } = transaction;

  updateWallet({
    walletId: fromWalletId,
    wallet: { amount },
    options: { shouldDecreaseAmount: true },
    callback: ({
      error: decreaseError,
      data: decreaseData,
    }) => {
      if (decreaseError) {
        callback({ error: decreaseError });

        return;
      }

      updateWallet({
        walletId: toWalletId,
        wallet: { amount },
        options: { shouldDecreaseAmount: false },
        callback: ({
          error: increaseError,
          data: increaseData,
        }) => {
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

/**
 * Checks if the wallet has enough amount.
 * @param {Object} params Parameters.
 * @param {string} params.walletId Id of the wallet.
 * @param {number} params.amount Amount.
 * @param {Function} params.callback Callback
 */
function checkAmount({
  walletId,
  amount,
  callback,
}) {
  getWalletById({
    walletId,
    callback: ({
      error,
      data,
    }) => {
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

/**
 * Get wallets that the user has access to.
 * @param {Object} params Parameters.
 * @param {Function} params.callback Callback.
 * @param {string} params.token jwt.
 */
function getWalletsByUser({
  callback,
  token,
}) {
  managerHelper.getObjects({
    callback,
    token,
    commandName: dbConfig.apiCommands.GetWallet.name,
    objectsType: 'wallets',
    dbCallFunc: getWalletsByUser,
  });
}

/**
 * Update access to the wallet for users or teams.
 * @param {Object} params Parameters.
 * @param {string} params.walletId Id of the wallet.
 * @param {Function} params.callback Callback.
 * @param {boolean} [params.shouldRemove] Should access be removed from the users or teams?
 * @param {string[]} [params.userIds] Id of the users.
 * @param {string[]} [params.teamIds] Id of the teams.
 * @param {string[]} [params.bannedIds] Id of the blocked Ids to add.
 * @param {string[]} [params.teamAdminIds] Id of the teams to change admin access for.
 * @param {string[]} [params.userAdminIds] Id of the users to change admin access for.
 */
function updateAccess({
  token,
  walletId,
  teamAdminIds,
  userAdminIds,
  userIds,
  teamIds,
  bannedIds,
  shouldRemove,
  callback,
}) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.UpdateWallet.name,
    callback: ({
      error,
      data,
    }) => {
      if (error) {
        callback({ error });

        return;
      }

      const { user: authUser } = data;

      getWalletById({
        walletId,
        internalCallUser: authUser,
        callback: ({
          error: walletError,
          data: walletData,
        }) => {
          if (walletError) {
            callback({ error: walletError });

            return;
          }

          const { wallet } = walletData;

          const {
            hasFullAccess,
          } = authenticator.hasAccessTo({
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
