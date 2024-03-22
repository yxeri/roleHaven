'use strict';

import { ObjectId } from 'mongodb';
import mongoose from 'mongoose';
import { UserSchema } from 'src/db/connectors/user.js';
import dbConnector, { BaseSchema, BaseSchemaDef } from 'src/db/databaseConnector.js';
import ErrorCreator from 'src/error/errorCreator.js';
import errorCreator from 'src/error/errorCreator.js';

export type WalletSchema = BaseSchema & {
  amount: number;
  isProtected: boolean;
};

export const walletSchema = new mongoose.Schema<WalletSchema>({
  ...BaseSchemaDef,
  amount: {
    type: Number,
    default: 0,
  },
  isProtected: {
    type: Boolean,
    default: false,
  },
}, { collection: 'wallets' });

const Wallet = mongoose.model('Wallet', walletSchema);

async function getWallets({
  filter,
  query,
  errorNameContent = 'getWallets',
}: {
  filter?: mongoose.ProjectionType<WalletSchema>;
  query: mongoose.FilterQuery<WalletSchema>;
  errorNameContent?: string;
}) {
  const { error, data } = await dbConnector.getObjects({
    query,
    filter,
    object: Wallet,
    errorNameContent,
  });

  if (error) {
    return { error };
  }

  return {
    data: {
      wallets: data?.objects,
    },
  };
}

async function getWallet({
  query,
}: {
  query: mongoose.FilterQuery<WalletSchema>;
}) {
  const { error, data } = await dbConnector.getObject({
    query,
    object: Wallet,
  });

  if (error) {
    return { error };
  }

  if (!data.object) {
    return { error: new errorCreator.DoesNotExist({ name: `wallet ${JSON.stringify(query, null, 4)}` }) };
  }

  return { data: { wallet: data.object } };
}

async function updateObject({
  update,
  walletId,
}: {
  update: mongoose.UpdateQuery<WalletSchema>;
  walletId: string;
}) {
  const { error, data } = await dbConnector.updateObject({
    update,
    query: { _id: walletId },
    object: Wallet,
    errorNameContent: 'updateWallet',
  });

  if (error) {
    return { error };
  }

  if (!data?.object) {
    return { error: new ErrorCreator.DoesNotExist({ name: `Wallet ${walletId}` }) };
  }

  return { data: { wallet: data.object } };
}

async function getAllWallets() {
  return getWallets({
    query: {},
    errorNameContent: 'getAllWallets',
  });
}

async function getWalletsByTeams({
  teamIds,
}: {
  teamIds: string[];
}) {
  const query = {
    $or: [
      { ownerId: { $in: teamIds } },
      { teamIds: { $in: teamIds } },
    ],
  };

  return getWallets({
    query,
  });
}

async function getWalletsByUser({
  user,
  noVisibility,
}: {
  user: Partial<UserSchema>;
  noVisibility?: boolean;
}) {
  const query = dbConnector.createUserQuery({
    user,
    noVisibility,
  });

  return getWallets({
    query,
  });
}

async function createWallet({
  wallet,
  options = {},
}: {
  wallet: Partial<WalletSchema>;
  options?: {
    setId?: boolean;
  };
}) {
  const walletToSave = wallet;

  if (options.setId && walletToSave.objectId) {
    walletToSave._id = new ObjectId(walletToSave.objectId);
  }

  const { error, data } = await dbConnector.saveObject({
    object: Wallet,
    objectData: walletToSave,
    objectType: 'wallet',
  });

  if (error) {
    return { error };
  }

  return { data: { wallet: data.savedObject } };
}

async function updateWallet({
  walletId,
  wallet,
  options = {},
}: {
  walletId: string;
  wallet: Partial<WalletSchema>;
  options?: {
    resetAmount?: boolean;
    shouldDecreaseAmount?: boolean;
    resetOwnerAliasId?: boolean;
  };
}) {
  const {
    amount,
    ownerAliasId,
    visibility,
    accessLevel,
    isProtected,
  } = wallet;
  const {
    shouldDecreaseAmount,
    resetAmount,
    resetOwnerAliasId,
  } = options;
  const update: mongoose.UpdateQuery<WalletSchema> = {};
  const set: mongoose.UpdateQuery<WalletSchema>['$set'] = {};
  const unset: mongoose.UpdateQuery<WalletSchema>['$unset'] = {};

  if (typeof resetAmount === 'boolean' && resetAmount) {
    set.amount = 0;
  } else if (amount) {
    update.$inc = {};

    if (shouldDecreaseAmount) {
      update.$inc.amount = -Math.abs(amount);
    } else {
      update.$inc.amount = Math.abs(amount);
    }
  }

  if (resetOwnerAliasId) {
    unset.ownerAliasId = '';
  } else if (ownerAliasId) {
    set.ownerAliasId = ownerAliasId;
  }

  if (typeof isProtected === 'boolean') {
    set.isProtected = isProtected;
  }

  if (visibility) {
    set.visibility = visibility;
  }

  if (accessLevel) {
    set.accessLevel = accessLevel;
  }

  if (Object.keys(set).length > 0) {
    update.$set = set;
  }

  if (Object.keys(unset).length > 0) {
    update.$unset = unset;
  }

  return updateObject({
    update,
    walletId,
  });
}

async function removeWallet({
  walletId,
}: {
  walletId: string;
}) {
  return dbConnector.removeObject({
    query: { _id: walletId },
    object: Wallet,
  });
}

async function getWalletsByIds({
  walletIds,
}: {
  walletIds: string[];
}) {
  return getWallets({
    query: { _id: { $in: walletIds } },
  });
}

async function getWalletById({
  walletId,
}: {
  walletId: string;
}) {
  return getWallet({
    query: { _id: walletId },
  });
}

export default {
  createWallet,
  getAllWallets,
  getWalletsByUser,
  removeWallet,
  updateWallet,
  getWalletsByTeams,
  getWalletsByIds,
  getWalletById,
};
