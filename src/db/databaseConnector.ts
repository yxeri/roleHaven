'use strict';

import { ObjectId } from 'mongodb';
import mongoose, { mongo, SortOrder } from 'mongoose';
import { appConfig, dbConfig } from 'src/config/defaults/index.js';
import { AliasSchema } from 'src/db/connectors/alias.js';
import { UserSchema } from 'src/db/connectors/user.js';
import errorCreator from 'src/error/errorCreator.js';
import { ChildError } from 'src/error/GeneralError.js';

const dbPath = `mongodb://${appConfig.dbHost}:${appConfig.dbPort}/${appConfig.dbName}`;

export type BaseSchema = {
  _id: ObjectId;
  objectId: string;
  ownerId: string;
  ownerAliasId: string;
  teamId: string;
  lastUpdated: Date;
  timeCreated: Date;
  customLastUpdated: Date;
  customTimeCreated: Date;
  visibility: number;
  accessLevel: number;
  teamAdminIds: string[];
  userAdminIds: string[];
  userIds: string[];
  teamIds: string[];
  bannedIds: string[];
  isPublic: boolean;
  triggerEvents: string[];
};

export const BaseSchemaDef = {
  ownerId: String,
  ownerAliasId: String,
  teamId: String,
  lastUpdated: Date,
  timeCreated: Date,
  customLastUpdated: Date,
  customTimeCreated: Date,
  visibility: {
    type: Number,
    default: dbConfig.AccessLevels.ANONYMOUS,
  },
  accessLevel: {
    type: Number,
    default: dbConfig.AccessLevels.ANONYMOUS,
  },
  teamAdminIds: {
    type: [String],
    default: [],
  },
  userAdminIds: {
    type: [String],
    default: [],
  },
  userIds: {
    type: [String],
    default: [],
  },
  teamIds: {
    type: [String],
    default: [],
  },
  bannedIds: {
    type: [String],
    default: [],
  },
  isPublic: {
    type: Boolean,
    default: false,
  },
  triggerEvents: {
    type: [String],
    default: [],
  },
};

export type ImageSchema = {
  height: number;
  width: number;
  imageName: string;
  fileName: string;
};

export const imageSchemaDef: mongoose.SchemaDefinition<ImageSchema> = {
  height: Number,
  width: Number,
  imageName: String,
  fileName: String,
};

export type CoordinatesSchema = {
  longitude: number;
  latitude: number;
  speed: number;
  accuracy: number;
  heading: number;
  timeCreated: Date;
  customTimeCreated: Date;
  altitude: number;
  altitudeAccuracy: number;
  extraCoordinates?: {
    longitude: number;
    latitude: number;
  }[];
};

export const coordinatesSchemaDef: mongoose.SchemaDefinition<CoordinatesSchema> = {
  longitude: Number,
  latitude: Number,
  speed: Number,
  accuracy: Number,
  heading: Number,
  timeCreated: Date,
  customTimeCreated: Date,
  altitude: Number,
  altitudeAccuracy: Number,
  extraCoordinates: {
    type: [{
      longitude: Number,
      latitude: Number,
    }],
    default: undefined,
  },
};

export type CustomFieldSchema = {
  name: string;
  value: {
    [key: string]: unknown
  };
};

export const customFieldSchemaDef: mongoose.SchemaDefinition<CustomFieldSchema> = {
  name: String,
  value: {},
};

try {
  await mongoose.connect(dbPath);

  console.info('Connection established to database');
} catch (error) {
  console.error('Failed to connect to the database', error);
}

function modifyObject<T>({
  noClean,
  object,
}: {
  noClean?: boolean;
  object: T & BaseSchema & {
    password?: string | boolean
  };
}) {
  return {
    ...object,
    objectId: object._id?.toString(),
    ...(object.password && {
      password: !noClean
        ? typeof object.password === 'string'
        : object.password
    }),
  };
}

async function saveObject<T>({
  object,
  objectData,
  objectType,
}: {
  object: mongoose.Model<T & BaseSchema>;
  objectData: Partial<T & BaseSchema>;
  objectType: string;
}) {
  const now = new Date();
  object.schema.obj.lastUpdated = object.schema.obj.lastUpdated || now;
  object.schema.obj.timeCreated = object.schema.obj.timeCreated || now;

  try {
    const createdObject = await object.create(objectData);

    return {
      data: {
        objectType,
        savedObject: modifyObject({ object: createdObject.toObject() as (T & BaseSchema) }),
      },
    };
  } catch (error) {
    return {
      error: new errorCreator.Database({
        errorObject: error,
        name: `saveObject ${objectType} ${object}`,
      }),
    };
  }
}

async function verifyObject<T>({
  query,
  object,
}: {
  query: mongoose.FilterQuery<T & BaseSchema>;
  object: mongoose.Model<T & BaseSchema>;
}) {
  const update = {
    $set: {
      isVerified: true,
      lastUpdated: new Date(),
    },
  };
  const options: mongoose.QueryOptions = { returnOriginal: false };

  try {
    const updateResult = await object.findOneAndUpdate(query, update, options);

    if (!updateResult) {
      return { error: new errorCreator.DoesNotExist({ name: 'verify' }) };
    }

    return { data: { verified: modifyObject({ object: updateResult }) } };
  } catch (error) {
    return {
      error: new errorCreator.Database({
        errorObject: error,
        name: 'verifyObject',
      }),
    };
  }
}

async function verifyAllObjects<T>({
  query,
  object,
}: {
  query: mongoose.FilterQuery<T & BaseSchema>;
  object: mongoose.Model<T & BaseSchema>;

}) {
  const update: mongoose.UpdateQuery<T & BaseSchema> = {
    $set: {
      isVerified: true,
      lastUpdated: new Date(),
    },
  };
  const options: mongo.UpdateOptions = {};

  try {
    await object.updateMany(query, update, options);

    return { data: { verified: [].map((updatedObject) => modifyObject({ object: updatedObject })) } };
  } catch (error) {
    return {
      error: new errorCreator.Database({
        errorObject: error,
        name: 'verifyAllObjects',
      }),
    };
  }
}

async function dropDatabase() {
  if (appConfig.mode !== appConfig.Modes.TEST && appConfig.mode !== appConfig.Modes.DEV) {
    return { error: new errorCreator.Internal({ name: 'not in dev/test mode' }) };
  }

  try {
    await mongoose.connection.dropDatabase();

    return { data: { success: true } };
  } catch (error) {
    return {
      error,
    };
  }
}

async function getObject<T>({
  object,
  noClean = false,
  errorNameContent = 'getObject',
  query = {},
  filter = {},
}: {
  object: mongoose.Model<T & BaseSchema>;
  noClean?: boolean;
  errorNameContent?: string;
  query?: mongoose.FilterQuery<T & BaseSchema>;
  filter?: mongoose.ProjectionType<T & BaseSchema>;
}) {
  try {
    const result = await object.findOne(query, filter);

    if (!result) {
      return { data: { exists: false } };
    }

    return {
      data: {
        exists: true,
        object: modifyObject({
          noClean,
          object: result,
        }),
      },
    };
  } catch (error) {
    return {
      error: new errorCreator.Database({
        errorObject: error,
        name: errorNameContent,
      }),
    };
  }
}

async function doesObjectExist<T>({
  object,
  query,
}: {
  object: mongoose.Model<T & BaseSchema>;
  query: mongoose.FilterQuery<T & BaseSchema>;
}) {
  try {
    const result = await object.findOne<T & BaseSchema>(query);

    return {
      data: {
        exists: typeof result !== 'undefined' && result !== null,
        object: result,
      },
    };
  } catch (error) {
    return {
      error: new errorCreator.Database({
        errorObject: error,
        name: 'doesObjectExist',
      }),
    };
  }
}

async function getObjects<T>({
  object,
  errorNameContent = 'getObjects',
  sort,
  query = {},
  filter = {},
}: {
  object: mongoose.Model<T & BaseSchema>;
  errorNameContent?: string;
  sort?: string | {
    [key in keyof T & BaseSchema]: SortOrder
  };
  query: mongoose.FilterQuery<T & Partial<BaseSchema>>;
  filter?: mongoose.ProjectionType<T & BaseSchema>;
}): Promise<{
  data?: {
    objects: (T & BaseSchema)[]
  },
  error?: ChildError,
}> {
  try {
    const result = sort
      ? await object.find<T & BaseSchema>(query, filter)
        .sort(sort)
      : await object.find<T & BaseSchema>(query, filter);

    return { data: { objects: result.map((foundObject) => modifyObject({ object: foundObject })) } };
  } catch (error) {
    return {
      error: new errorCreator.Database({
        errorObject: error,
        name: errorNameContent,
      }),
    };
  }
}

async function updateObject<T>({
  object,
  update,
  query,
  suppressError = false,
  options = {},
  errorNameContent = 'updateObject',
}: {
  object: mongoose.Model<T & BaseSchema>;
  update: mongoose.UpdateQuery<T & BaseSchema>;
  query: mongoose.FilterQuery<T & BaseSchema>;
  suppressError?: boolean;
  options?: mongoose.QueryOptions;
  errorNameContent?: string;
}): Promise<{ data?: { object: T & BaseSchema }, error?: ChildError }> {
  const toUpdate = update;

  if (!toUpdate.$set) {
    toUpdate.$set = {};
  }

  toUpdate.$set.lastUpdated = new Date();

  try {
    const result = await object.findOneAndUpdate(query, toUpdate, { ...options, new: true });

    if (!result) {
      return {
        error: new errorCreator.DoesNotExist({
          suppressPrint: suppressError,
          name: `update ${JSON.stringify(query, null, 4)}`,
        }),
      };
    }

    return { data: { object: modifyObject({ object: result }) } };
  } catch (error) {
    return {
      error: new errorCreator.Database({
        errorObject: error,
        name: errorNameContent,
      }),
    };
  }
}

async function updateObjects<T>({
  object,
  update,
  query = {},
  errorNameContent = 'updateObjects',
}: {
  object: mongoose.Model<T & BaseSchema>;
  update: mongoose.UpdateQuery<T & BaseSchema>;
  query: mongoose.FilterQuery<Partial<T & BaseSchema>>;
  errorNameContent?: string;
}): Promise<{ data?: { objects: (T & BaseSchema)[] }, error?: ChildError }> {
  const options = {
    new: true,
    multi: true,
  };
  const toUpdate = update;
  const now = new Date();
  toUpdate.$set = toUpdate.$set ?? {};
  toUpdate.$set.lastUpdated = now;

  try {
    await object.updateMany(query, {
      ...update,
      $set: {
        ...(update.$set ?? {}),
        lastUpdated: new Date(),
      },
    }, options);

    const {
      error: errorGet,
      data: updatedData = { objects: [] },
    } = await getObjects({
      object,
      query: { 
        lastUpdated: now,
      },
    });

    if (errorGet) {
      return { error: errorGet };
    }

    return {
      data: {
        objects: updatedData
          .objects.map((foundObject) => modifyObject({ object: foundObject })),
      },
    };
  } catch (error) {
    return {
      error: new errorCreator.Database({
        errorObject: error,
        name: errorNameContent,
      }),
    };
  }
}

async function removeObject<T>({
  object,
  query,
}: {
  object: mongoose.Model<T & BaseSchema>;
  query: mongoose.FilterQuery<T & BaseSchema>;
}) {
  const options: mongoose.QueryOptions = { justOne: true };

  try {
    object.findOneAndDelete(query, options);

    return { data: { success: true } };
  } catch (error) {
    return {
      error: new errorCreator.Database({
        errorObject: error,
        name: 'removeObject',
      }),
    };
  }
}

async function removeObjects<T>({
  object,
  query,
}: {
  object: mongoose.Model<T & BaseSchema>;
  query: mongoose.FilterQuery<T & BaseSchema>;
}) {
  try {
    const result = await object.deleteMany(query);

    return {
      data: {
        success: true,
        amount: result.deletedCount,
      },
    };
  } catch (error) {
    return {
      error: new errorCreator.Database({
        errorObject: error,
        name: 'removeObjects',
      }),
    };
  }
}

async function addObjectAccess<T>({
  objectId,
  object,
  userIds,
  teamIds,
  bannedIds,
  teamAdminIds,
  userAdminIds,
}: {
  objectId: string;
  object: mongoose.Model<T & BaseSchema>;
  userIds?: BaseSchema['userIds'];
  teamIds?: BaseSchema['teamIds'];
  bannedIds?: BaseSchema['bannedIds'];
  teamAdminIds?: BaseSchema['teamAdminIds'];
  userAdminIds?: BaseSchema['userAdminIds'];
}): Promise<{ data?: { object: T & BaseSchema }, error?: ChildError }> {
  if (!userIds && !teamIds && !bannedIds && !teamAdminIds && !userAdminIds) {
    return { error: new errorCreator.InvalidData({ expected: 'teamIds || userIds || bannedIds || userAdminIds || teamAdminIds' }) };
  }

  const pull = {
    ...(bannedIds && ({
      teamAdminIds: { $each: bannedIds },
      userAdminIds: { $each: bannedIds },
      userIds: { $each: bannedIds },
      teamIds: { $each: bannedIds },
    }))
  };
  const addToSet = {
    ...(teamIds && { teamIds: { $each: teamIds } }),
    ...(userIds && { userIds: { $each: userIds } }),
    ...(teamAdminIds && { teamAdminIds: { $each: teamAdminIds } }),
    ...(userAdminIds && { userAdminIds: { $each: userAdminIds } }),
    ...(bannedIds && { bannedIds: { $each: bannedIds } }),
  };

  return updateObject({
    update: {
      ...(Object.keys(pull).length > 0 && { $pull: pull }),
      ...(Object.keys(addToSet).length > 0 && { $addToSet: addToSet }),
    },
    object,
    query: { _id: new ObjectId(objectId) },
  });
}

async function removeObjectAccess<T>({
  objectId,
  object,
  userIds,
  teamIds,
  bannedIds,
  teamAdminIds,
  userAdminIds,
}: {
  objectId: string;
  object: mongoose.Model<T & BaseSchema>;
  userIds?: BaseSchema['userIds'];
  teamIds?: BaseSchema['teamIds'];
  bannedIds?: BaseSchema['bannedIds'];
  teamAdminIds?: BaseSchema['teamAdminIds'];
  userAdminIds?: BaseSchema['userAdminIds'];
}): Promise<{ data?: { object: T & BaseSchema }, error?: ChildError }> {
  if (!userIds && !teamIds && !bannedIds && !teamAdminIds && !userAdminIds) {
    return { error: new errorCreator.InvalidData({ expected: 'teamIds || userIds || bannedIds || userAdminIds || teamAdminIds' }) };
  }

  const pull = {
    ...(teamIds && { teamIds: { $in: teamIds } }),
    ...(userIds && { userIds: { $in: userIds } }),
    ...(teamAdminIds && { teamAdminIds: { $in: teamAdminIds } }),
    ...(userAdminIds && { userAdminIds: { $in: userAdminIds } }),
    ...(bannedIds && { bannedIds: { $in: bannedIds } }),
  };

  return updateObject({
    update: {
      ...(Object.keys(pull).length > 0 && { $pull: pull }),
    },
    object,
    query: { _id: objectId },
  });
}

function createUserQuery({
  user,
  noVisibility,
}: {
  user: Partial<UserSchema>,
  noVisibility?: boolean;
}) {
  const {
    objectId,
    partOfTeams,
    accessLevel,
    aliases = [],
  } = user;
  const query: mongoose.FilterQuery<UserSchema | AliasSchema> = {
    bannedIds: { $nin: [objectId] },
    $or: [
      { isPublic: true },
      { ownerId: objectId },
      { ownerAliasId: objectId },
      { userIds: { $in: [...aliases, objectId] } },
      { teamIds: { $in: partOfTeams } },
    ],
  };

  if (!noVisibility) {
    query.$or?.push({ visibility: { $lte: accessLevel } });
  }

  return query;
}

async function updateAccess<T>(params: {
  objectId: string;
  object: mongoose.Model<T & BaseSchema>;
  shouldRemove?: boolean;
  teamIds?: BaseSchema['teamIds'];
  userIds?: BaseSchema['userIds'];
  userAdminIds?: BaseSchema['userAdminIds'];
  teamAdminIds?: BaseSchema['teamAdminIds'];
}) {
  const { shouldRemove, ...accessParams } = params;

  const callback = ({ error, data }: { error?: ChildError, data?: { object: T & BaseSchema } }) => {
    if (error) {
      return { error };
    }

    return { data: { object: data?.object } };
  };

  return callback(shouldRemove
    ? await removeObjectAccess(accessParams)
    : await addObjectAccess(accessParams));
}

export default {
  coordinatesSchema: coordinatesSchemaDef,
  imageSchema: imageSchemaDef,
  customFieldSchema: customFieldSchemaDef,
  saveObject,
  verifyObject,
  verifyAllObjects,
  dropDatabase,
  getObjects,
  getObject,
  updateObject,
  removeObject,
  removeObjects,
  removeObjectAccess,
  addObjectAccess,
  doesObjectExist,
  updateObjects,
  createUserQuery,
  updateAccess,
};
