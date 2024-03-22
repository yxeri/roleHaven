'use strict';

import { ObjectId } from 'mongodb';
import mongoose from 'mongoose';
import errorCreator from '../../error/errorCreator.js';
import dbConnector, { BaseSchema, BaseSchemaDef, CustomFieldSchema, ImageSchema } from '../databaseConnector.js';
import dbUser, { UserSchema } from './user.js';

export type AliasSchema = BaseSchema & {
  aliasName: string;
  aliasNameLowerCase: string;
  image: ImageSchema;
  partOfTeams: string[];
  followingRooms: string[];
  description: string[];
  pronouns: string[];
  customFields: CustomFieldSchema[];
  isVerified: boolean;
  isBanned: boolean;
};

const aliasSchema = new mongoose.Schema<AliasSchema>({
  ...BaseSchemaDef,
  aliasName: {
    type: String,
    unique: true,
  },
  aliasNameLowerCase: {
    type: String,
    unique: true,
  },
  image: dbConnector.imageSchema,
  partOfTeams: {
    type: [String],
    default: [],
  },
  followingRooms: {
    type: [String],
    default: [],
  },
  description: {
    type: [String],
    default: [],
  },
  pronouns: [String],
  customFields: [dbConnector.customFieldSchema],
  isVerified: {
    type: Boolean,
    default: true,
  },
  isBanned: {
    type: Boolean,
    default: false,
  },
}, { collection: 'aliases' });

const Alias = mongoose.model('Alias', aliasSchema);

async function updateObject({
  aliasId,
  update,
}: {
  aliasId: string;
  update: mongoose.UpdateQuery<AliasSchema>;
}) {
  const { data, error } = await dbConnector.updateObject({
    update,
    query: { _id: aliasId },
    object: Alias,
    errorNameContent: 'updateAlias',
  });

  if (error) {
    return { error };
  }

  return { data: { alias: data?.object } };
}

async function getAliases({
  filter,
  query,
}: {
  filter?: mongoose.ProjectionType<AliasSchema>;
  query: mongoose.FilterQuery<AliasSchema>;
}) {
  const { data, error } = await dbConnector.getObjects({
    query,
    filter,
    object: Alias,
  });

  if (error) {
    return { error };
  }

  return { data: { aliases: data?.objects } };
}

async function getAlias({
  query,
}: {
  query: mongoose.FilterQuery<AliasSchema>;
}) {
  const { data, error } = await dbConnector.getObject({
    query,
    object: Alias,
  });

  if (error) {
    return { error };
  }

  if (!data?.object) {
    return { error: new errorCreator.DoesNotExist({ name: `alias ${JSON.stringify(query, null, 4)}` }) };
  }

  return { data: { alias: data.object } };
}

async function getAliasById({
    aliasId,
    aliasName,
  }: {
    aliasId: string;
    aliasName?: string;
  } | { aliasName: string; aliasId?: string }
) {
  const query = aliasId
    ? { _id: aliasId }
    : { aliasName };

  return getAlias({
    query,
  });
}

async function doesAliasExist({
  aliasName,
}: {
  aliasName: string;
}) {
  return dbConnector.doesObjectExist({
    query: { aliasNameLowerCase: aliasName.toLowerCase() },
    object: Alias,
  });
}

async function createAlias({
  alias,
  options = {},
}: {
  alias: AliasSchema;
  options?: {
    setId?: boolean;
  };
}) {
  const { data, error } = await dbUser.doesUserExist({
    username: alias.aliasName,
  });

  if (error) {
    return { error };
  }

  if (data?.exists) {
    return { error: new errorCreator.AlreadyExists({ name: `aliasName ${alias.aliasName}` }) };
  }

  const aliasToSave = alias;
  aliasToSave.aliasNameLowerCase = aliasToSave.aliasName.toLowerCase();

  if (options.setId && aliasToSave.objectId) {
    aliasToSave._id = new ObjectId(aliasToSave.objectId);
  } else {
    aliasToSave._id = new ObjectId();
  }

  const { error: saveError, data: saveData } = await dbConnector.saveObject({
    object: Alias,
    objectData: alias,
    objectType: 'alias',
  });

  if (saveError) {
    return { error: saveError };
  }

  const createdAlias = saveData.savedObject;

  const { error: updateError } = await dbUser.updateUser({
    userId: createdAlias.ownerId,
    user: { aliases: [createdAlias.objectId] },
  });

  if (updateError) {
    return { error: updateError };
  }

  return { data: { alias: createdAlias } };
}

async function updateAlias({
  aliasId,
  alias,
  options = {},
}: {
  aliasId: string;
  alias: Partial<AliasSchema>;
  options?: {
    resetOwnerAliasId?: boolean;
  };
}) {
  const { resetOwnerAliasId } = options;
  const {
    aliasName,
    ownerAliasId,
    isPublic,
    image,
    description,
    customFields,
  } = alias;
  const update: mongoose.UpdateQuery<AliasSchema> = {};
  const set: mongoose.UpdateQuery<AliasSchema>['$set'] = {};
  const unset: mongoose.UpdateQuery<AliasSchema>['$unset'] = {};

  if (resetOwnerAliasId) {
    unset.ownerAliasId = '';
  } else if (ownerAliasId) {
    set.ownerAliasId = ownerAliasId;
  }

  if (typeof isPublic === 'boolean') {
    set.isPublic = isPublic;
  }

  if (aliasName) {
    set.aliasName = aliasName;
    set.aliasNameLowerCase = aliasName.toLowerCase();
  }

  if (image) {
    set.image = image;
  }

  if (description) {
    set.description = description;
  }

  if (customFields) {
    set.customFields = customFields;
  }

  if (Object.keys(set).length > 0) {
    update.$set = set;
  }
  if (Object.keys(unset).length > 0) {
    update.$unset = unset;
  }

  if (aliasName) {
    const { error, data } = await dbUser.doesUserExist({
      username: aliasName,
    });

    if (error) {
      return { error };
    }

    if (data?.exists) {
      return { error: new errorCreator.AlreadyExists({ name: `username ${aliasName}` }) };
    }

    return updateObject({
      update,
      aliasId,
    });
  }

  return updateObject({
    update,
    aliasId,
  });
}

async function getAliasesByUser({
  user,
}: {
  user: Partial<UserSchema>;
}) {
  const query: mongoose.FilterQuery<AliasSchema> = dbConnector.createUserQuery({ user });

  return getAliases({
    query,
  });
}

async function getAllAliases() {
  return getAliases({
    query: {},
  });
}

export default {
  Model: Alias,
  Schema: aliasSchema,
  createAlias,
  getAliasesByUser,
  updateAlias,
  doesAliasExist,
  getAliasById,
  getAllAliases,
};
