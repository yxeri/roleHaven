'use strict';

import { ObjectId } from 'mongodb';
import mongoose from 'mongoose';
import { ChildError } from 'src/error/GeneralError.js';
import dbConfig from '../../config/defaults/dbConfig.js';
import errorCreator from '../../error/errorCreator.js';
import dbConnector, { BaseSchema, BaseSchemaDef, CustomFieldSchema, ImageSchema } from '../databaseConnector.js';
import dbAlias, { AliasSchema } from './alias.js';
import dbTeam, { Team } from './team.js';

export type UserSchema = BaseSchema & {
  username: string,
  usernameLowerCase: string,
  mailAddress: string | boolean,
  password: string | boolean,
  socketId: string,
  lastOnline: Date,
  registerDevice: string,
  description: string[],
  hasFullAccess: boolean,
  isVerified: boolean,
  isBanned: boolean,
  isOnline: boolean,
  isLootable: boolean,
  defaultRoomId: string,
  partOfTeams: string[],
  followingRooms: string[],
  aliases: string[],
  image: ImageSchema,
  offName: string | boolean,
  pronouns: string[],
  customFields: CustomFieldSchema[],
};

const userSchema = new mongoose.Schema<UserSchema>({
  ...BaseSchemaDef,
  username: {
    type: String,
    unique: true,
  },
  usernameLowerCase: {
    type: String,
    unique: true,
  },
  mailAddress: {
    type: String,
    unique: true,
    sparse: true,
  },
  password: String,
  socketId: String,
  lastOnline: Date,
  registerDevice: String,
  description: [String],
  hasFullAccess: {
    type: Boolean,
    default: false,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  isBanned: {
    type: Boolean,
    default: false,
  },
  isOnline: {
    type: Boolean,
    default: false,
  },
  isLootable: {
    type: Boolean,
    default: false,
  },
  defaultRoomId: {
    type: String,
    default: dbConfig.rooms.public.objectId,
  },
  partOfTeams: {
    type: [String],
    default: [],
  },
  followingRooms: {
    type: [String],
    default: [],
  },
  aliases: {
    type: [String],
    default: [],
  },
  image: dbConnector.imageSchema,
  offName: String,
  pronouns: [String],
  customFields: [dbConnector.customFieldSchema],
}, { collection: 'users' });

const UserModel = mongoose.model('User', userSchema);

function modifyUserParameters({
  user,
  noClean,
  includeOff = false,
}: {
  user?: UserSchema,
  noClean?: boolean,
  includeOff?: boolean,
}) {
  if (!user) {
    return {} as UserSchema;
  }

  return {
    ...user,
    mailAddress: !noClean
      ? typeof user.mailAddress === 'string'
      : user.mailAddress,
    offName: !includeOff
      ? typeof user.offName === 'string'
      : user.offName,
  };
}

async function updateObject({
  socketId,
  userId,
  update,
  suppressError,
  includeOff,
}: {
  socketId?: string,
  userId?: string,
  update: mongoose.UpdateQuery<UserSchema>,
  suppressError?: boolean,
  includeOff?: boolean,
}) {
  const query = userId
    ? { _id: userId }
    : { socketId };

  const { data, error } = await dbConnector.updateObject({
    update,
    query,
    suppressError,
    object: UserModel,
  });

  if (error) {
    return { error };
  }

  return {
    data: {
      user: modifyUserParameters({
        user: data?.object,
        includeOff,
      }),
    },
  };
}

async function updateObjects({
  query,
  update,
}: {
  query: mongoose.FilterQuery<UserSchema>,
  update: mongoose.UpdateQuery<UserSchema>,
}) {
  const { data, error } = await dbConnector.updateObjects({
    update,
    query,
    object: UserModel,
  });

  if (error) {
    return { error };
  }

  return {
    data: {
      users: data?.objects.map((object) => modifyUserParameters({ user: object })),
    },
  };
}

async function getUsers({
  filter,
  query,
  includeOff,
}: {
  filter?: mongoose.ProjectionType<UserSchema>,
  query: mongoose.FilterQuery<UserSchema>,
  includeOff?: boolean,

}) {
  const { data, error } = await dbConnector.getObjects({
    query,
    filter,
    object: UserModel,
  });

  if (error) {
    return { error };
  }

  return {
    data: {
      users: data?.objects.map((user) => modifyUserParameters({
        user,
        includeOff,
      })),
    },
  };
}

async function getUser({
  filter,
  query,
  supressExistError,
  getPassword,
}: {
  filter?: mongoose.ProjectionType<UserSchema>,
  query: mongoose.FilterQuery<UserSchema>,
  supressExistError?: boolean,
  getPassword?: boolean,

}) {
  const { data, error } = await dbConnector.getObject({
    query,
    filter,
    noClean: getPassword,
    object: UserModel,
  });

  if (error) {
    return { error };
  }

  if (!data?.object) {
    return {
      error: new errorCreator.DoesNotExist({
        suppressPrint: supressExistError,
        name: `user ${JSON.stringify(query, null, 4)}`,
      }),
    };
  }

  return {
    data: {
      user: modifyUserParameters({
        user: data.object,
        noClean: getPassword,
      }),
    },
  };
}

async function getUserById({
  userId,
  username,
  getPassword = false,
  supressExistError,
}: {
  userId?: string,
  username?: string,
  getPassword?: boolean,
  supressExistError?: boolean,
}) {
  const query = userId
    ? { _id: userId }
    : { usernameLowerCase: username?.toLowerCase() };

  const { error, data } = await getUser({
    query,
    supressExistError,
    getPassword,
  });

  if (error) {
    return { error };
  }

  return { data };
}

async function doesUserSocketIdExist({
  socketId,
}: {
  socketId: string,

}) {
  const query: mongoose.FilterQuery<UserSchema> = { socketId };

  const { data, error } = await dbConnector.doesObjectExist({
    query,
    object: UserModel,
  });

  if (error) {
    return { error: new errorCreator.Database({ errorObject: error }) };
  }

  return { data };
}

async function doesUserExist({
  username,
  mailAddress,
}: {
  username?: UserSchema['username'],
  mailAddress?: UserSchema['mailAddress'],
}): Promise<{ data?: { exists: boolean, object: AliasSchema | UserSchema | null }, error?: ChildError }> {
  if (!username && !mailAddress) {
    return { error: new errorCreator.InvalidData({ expected: 'username || mailAddress' }) };
  }

  const query: mongoose.FilterQuery<UserSchema> & {
    $or: []
  } = { $or: [] };

  if (username) {
    query.$or.push({ usernameLowerCase: username.toLowerCase() });
  }
  if (mailAddress) {
    query.$or.push({ mailAddress });
  }

  const { data, error } = await dbConnector.doesObjectExist({
    query,
    object: UserModel,
  });

  if (error) {
    return { error: new errorCreator.Database({ errorObject: error }) };
  }

  if (data?.exists) {
    return { data };
  }

  if (!username) {
    return { data: { exists: false, object: null } };
  }

  return dbAlias.doesAliasExist({
    aliasName: username,
  });
}

async function createUser({
  user,
  options = {},
}: {
  user: Partial<UserSchema>;
  options?: {
    setId?: boolean,
  };
}) {
  const { error, data } = await doesUserExist({
    username: user.username,
    mailAddress: user.mailAddress,
  });

  if (error) {
    return { error };
  }

  if (data?.exists) {
    return { error: new errorCreator.AlreadyExists({ name: `username: ${user.username}` }) };
  }

  const userToSave = user;
  userToSave.usernameLowerCase = userToSave.username?.toLowerCase();

  if (options.setId && userToSave.objectId) {
    userToSave._id = new ObjectId(userToSave.objectId);
  } else {
    userToSave._id = new ObjectId();
  }

  userToSave.ownerId = userToSave._id.toString();

  const { error: saveError, data: saveData } = await dbConnector.saveObject({
    object: UserModel,
    objectData: userToSave,
    objectType: 'user',
  });

  if (saveError) {
    return { error: saveError };
  }

  if (!saveData?.savedObject) {
    return { error: new errorCreator.Database({ errorObject: 'Could not save user' }) };
  }

  return {
    data: {
      user: modifyUserParameters({
        user: saveData?.savedObject,
        includeOff: true,
      }),
    },
  };
}

async function updateOnline({
  userId,
  isOnline,
  socketId,
  suppressError,
}: {
  userId: string,
  isOnline: boolean,
  socketId?: string,
  suppressError?: boolean,
}) {
  const update: mongoose.UpdateQuery<UserSchema> = {};
  const set: mongoose.UpdateQuery<UserSchema>['$set'] = {};
  const unset: mongoose.UpdateQuery<UserSchema>['$unset'] = {};

  if (isOnline) {
    set.isOnline = true;

    if (socketId) {
      set.socketId = socketId;
    }
  } else {
    set.isOnline = false;
    unset.socketId = '';
  }

  set.lastOnline = new Date();

  if (Object.keys(set).length > 0) {
    update.$set = set;
  }
  if (Object.keys(unset).length > 0) {
    update.$unset = unset;
  }

  return await updateObject({
    userId,
    socketId,
    update,
    suppressError,
  });
}

async function updateUser({
  userSocketId,
  userId,
  user,
  options = {},
}: {
  userSocketId?: string,
  userId: string,
  user: Partial<UserSchema>,
  options?: {
    resetSocket?: boolean,
  },

}) {
  const {
    mailAddress,
    username,
    visibility,
    accessLevel,
    defaultRoomId,
    isLootable,
    hasFullAccess,
    socketId,
    aliases,
    image,
    offName,
    pronouns,
    description,
    customFields,
  } = user;
  const {
    resetSocket,
  } = options;
  const update: mongoose.UpdateQuery<UserSchema> = {};
  const set: mongoose.UpdateQuery<UserSchema>['$set'] = {};
  const unset: mongoose.UpdateQuery<UserSchema>['$unset'] = {};
  const addToSet: mongoose.UpdateQuery<UserSchema>['$addToSet'] = {};

  if (resetSocket) {
    set.socketId = '';
  } else if (socketId) {
    set.socketId = socketId;
  }

  if (mailAddress) {
    set.mailAddress = mailAddress;
  }
  if (username) {
    set.username = username;
    set.usernameLowerCase = username.toLowerCase();
  }
  if (visibility) {
    set.visibility = visibility;
  }
  if (accessLevel) {
    set.accessLevel = accessLevel;
  }
  if (defaultRoomId) {
    set.defaultRoomId = defaultRoomId;
  }
  if (typeof isLootable === 'boolean') {
    set.isLootable = isLootable;
  }
  if (typeof hasFullAccess === 'boolean') {
    set.hasFullAccess = hasFullAccess;
  }
  if (aliases) {
    addToSet.aliases = { $each: aliases };
  }
  if (image) {
    set.image = image;
  }
  if (offName) {
    set.offName = offName;
  }
  if (pronouns) {
    set.pronouns = pronouns;
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
  if (Object.keys(addToSet).length > 0) {
    update.$addToSet = addToSet;
  }

  if (username || mailAddress) {
    const { data, error } = await doesUserExist({
      username,
      mailAddress,
    });

    if (error) {
      return { error };
    }

    if (data?.exists) {
      return { error: new errorCreator.AlreadyExists({ name: `user mail ${mailAddress} username ${username}` }) };
    }

    return updateObject({
      update,
      socketId: userSocketId,
      userId,
      includeOff: typeof offName !== 'undefined',
    });
  }

  return updateObject({
    update,
    userId,
  });
}

async function verifyUser({
  userId,
}: {
  userId: string,
}) {
  return updateObject({
    userId,
    update: { isVerified: true },
  });
}

async function updateBanUser({
  shouldBan,
  userId,
}: {
  shouldBan: boolean,
  userId: string,
}) {
  const update = {
    $set: { isBanned: shouldBan },
    $unset: { socketId: '' },
  };

  const { data, error } = await updateObject({
    userId,
    update,
  });

  if (error) {
    return ({ error });
  }

  if (!data?.user) {
    return ({ error: new errorCreator.DoesNotExist({ name: `user ${userId}` }) });
  }

  return { data: { user: modifyUserParameters({ user: data.user }) } };
}

async function updateUserPassword({
  userId,
  password,
}: {
  userId: string,
  password: string,

}) {
  const update = { $set: { password } };

  return updateObject({
    userId,
    update,
  });
}

async function getUsersByUser({
  includeInactive,
  user,
  includeOff,
}: {
  includeInactive?: boolean,
  user: UserSchema,
  includeOff?: boolean,
}) {
  const query = dbConnector.createUserQuery({ user });

  if (!includeInactive) {
    query.isBanned = false;
    query.isVerified = true;
  }

  const { data, error } = await getUsers({
    query,
    includeOff,
  });

  if (error) {
    return { error };
  }

  return { data: { users: data?.users } };
}

async function addToTeam({
  userIds,
  teamId,
  isAdmin,
}: {
  userIds: UserSchema['userIds'];
  teamId: UserSchema['teamId'];
  isAdmin?: boolean
}) {
  const { error, data: userData } = await updateObjects({
    query: { _id: { $in: userIds } },
    update: { $addToSet: { partOfTeams: teamId } },
  });

  if (error) {
    return { error };
  }

  const { error: teamAddError } = await dbTeam.addTeamMembers({
    teamId,
    memberIds: userIds,
  });

  if (teamAddError) {
    return { error: teamAddError };
  }

  const { data: teamData, error: teamError } = await dbConnector.updateAccess({
    userIds,
    object: Team,
    objectId: teamId,
    userAdminIds: isAdmin
      ?
      userIds
      :
      undefined,
  });

  if (teamError) {
    return { error: teamError };
  }

  return {
    data: {
      team: teamData.object,
      users: userData?.users,
    },
  };
}

async function addAlias({
  aliasId,
  userId,
}: {
  aliasId: string;
  userId: string;
}) {
  return updateObject({
    userId,
    update: { $addToSet: { aliases: aliasId } },
  });
}

async function removeAlias({
  aliasId,
  userId,
}: {
  aliasId: string;
  userId: string;
}) {
  return updateObject({
    userId,
    update: { aliases: { $pull: aliasId } },
  });
}

async function removeAliasFromAllUsers({
  aliasId,
}: {
  aliasId: string;
}) {
  return updateObjects({
    query: {},
    update: { aliases: { $pull: aliasId } },
  });
}

async function removeFromTeam({
  userId,
  teamId,
}: {
  userId: string;
  teamId: string;
}) {
  const { error, data } = await updateObject({
    userId,
    update: { $pull: { partOfTeams: teamId } },
  });

  if (error) {
    return { error };
  }

  const { error: removeError } = await dbTeam.removeTeamMembers({
    teamId,
    memberIds: [userId],
  });

  if (removeError) {
    return { error: removeError };
  }

  const { error: accessError, data: accessData} = await dbConnector.updateAccess({
    object: Team,
    objectId: teamId,
    shouldRemove: true,
    userIds: [userId],
    userAdminIds: [userId],
  });

  if (accessError) {
    return { error: accessError };
  }

  return {
    data: {
      team: accessData.object,
      user: data.user,
    },
  }
}

async function getAllSocketIds() {
  const { data, error } = await getUsers({
    query: { socketId: { $exists: true } },
  });

  if (error) {
    return { error };
  }

  const userSocketIds: {
    [key: string]: string;
  } = {};

  data?.users?.forEach((user) => {
    userSocketIds[user.objectId] = user.socketId;
  });

  return { data: { userSocketIds } };
}

async function removeRoomFromAll({
  roomId,
}: {
  roomId: string;
}) {
  return updateObjects({
    query: {},
    update: { $pull: { followingRooms: roomId } },
  });
}

async function removeTeamFromAll({
  teamId,
}: {
  teamId: string;
}) {
  return updateObjects({
    query: {},
    update: { $pull: { partOfTeams: teamId } },
  });
}

async function getInactiveUsers() {
  const query = {
    $or: [
      { isBanned: true },
      { isVerified: false },
    ],
  };

  return getUsers({
    query,
  });
}

async function followRoom({
  roomId,
  userIds = [],
}: {
  roomId: string;
  userIds: string[];
}) {
  return updateObjects({
    query: {
      _id: { $in: userIds },
    },
    update: { $addToSet: { followingRooms: roomId } },
  });
}

async function unfollowRoom({
  roomId,
  userId,
}: {
  roomId: string;
  userId: string;
}) {
  return updateObject({
    userId,
    update: {
      followingRooms: { $pull: roomId },
    },
  });
}

async function getAllUsers() {
  return getUsers({
    query: {},
  });
}

async function getUsersByAliases({
  aliasIds,
}: {
  aliasIds: string[];
}) {
  return getUsers({
    query: {
      $or: [
        { _id: { $in: aliasIds } },
        { aliases: { $in: aliasIds } },
      ],
    },
  });
}

export default {
  createUser,
  updateUser,
  verifyUser,
  updateBanUser,
  updateUserPassword,
  getUserById,
  doesUserExist,
  getAllSocketIds,
  addToTeam,
  removeFromTeam,
  removeRoomFromAll,
  removeTeamFromAll,
  updateOnline,
  getInactiveUsers,
  followRoom,
  unfollowRoom,
  getUsersByUser,
  addAlias,
  removeAlias,
  removeAliasFromAllUsers,
  getAllUsers,
  getUsersByAliases,
  doesUserSocketIdExist,
};
