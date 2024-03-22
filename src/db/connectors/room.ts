'use strict';

import { ObjectId } from 'mongodb';
import mongoose from 'mongoose';
import { dbConfig } from 'src/config/defaults/index.js';
import dbUser, { UserSchema } from 'src/db/connectors/user.js';
import dbConnector, { BaseSchema, BaseSchemaDef } from 'src/db/databaseConnector.js';
import errorCreator from 'src/error/errorCreator.js';

export type RoomSchema = BaseSchema & {
  roomName: string;
  roomNameLowerCase: string;
  password: string;
  participantIds: string[];
  nameIsLocked: boolean;
  isAnonymous: boolean;
  isWhisper: boolean;
  followers: string[];
  isSystemRoom: boolean;
  isUser: boolean;
  isTeam: boolean;
};

const roomSchema = new mongoose.Schema<RoomSchema>({
  ...BaseSchemaDef,
  roomName: {
    type: String,
    unique: true,
  },
  roomNameLowerCase: {
    type: String,
    unique: true,
  },
  password: String,
  participantIds: {
    type: [String],
    default: [],
  },
  nameIsLocked: {
    type: Boolean,
    default: false,
  },
  isAnonymous: {
    type: Boolean,
    default: false,
  },
  isWhisper: {
    type: Boolean,
    default: false,
  },
  followers: {
    type: [String],
    default: [],
  },
  isSystemRoom: {
    type: Boolean,
    default: false,
  },
  isUser: {
    type: Boolean,
    default: false,
  },
  isTeam: {
    type: Boolean,
    default: false,
  },
}, { collection: 'rooms' });

const Room = mongoose.model('Room', roomSchema);

async function updateObject({
  update,
  roomId,
}: {
  update: mongoose.UpdateQuery<RoomSchema>;
  roomId: string;
}) {
  const { data, error } = await dbConnector.updateObject({
    update,
    query: { _id: roomId },
    object: Room,
    errorNameContent: 'updateRoom',
  });

  if (error) {
    return { error };
  }

  return { data: { room: data?.object } };
}

async function getRoom({
  getPassword,
  query,
}: {
  query: mongoose.FilterQuery<RoomSchema>;
  getPassword?: boolean;
}) {
  const { data, error } = await dbConnector.getObject({
    query,
    noClean: getPassword,
    object: Room,
  });

  if (error) {
    return { error };
  }

  if (!data.object) {
    return { error: new errorCreator.DoesNotExist({ name: `room ${JSON.stringify(query, null, 4)}` }) };
  }

  return { data: { room: data.object } };
}

async function getRooms({
  filter,
  query,
}: {
  filter?: mongoose.ProjectionType<RoomSchema>;
  query: mongoose.FilterQuery<RoomSchema>;
}) {
  const { data, error } = await dbConnector.getObjects({
    query,
    filter,
    object: Room,
  });

  if (error) {
    return { error };
  }

  return {
    data: {
      rooms: data?.objects,
    },
  };
}

async function doesRoomExist({
  skipExistsCheck,
  roomName,
  roomId,
}: {
  skipExistsCheck?: boolean;
  roomName?: string;
  roomId?: string;
}) {
  if (skipExistsCheck) {
    return { data: { exists: false } };
  }

  if (!roomName && !roomId) {
    return { error: new errorCreator.InvalidData({ expected: 'roomName || roomId' }) };
  }

  const query: mongoose.FilterQuery<RoomSchema> & { $or: NonNullable<mongoose.FilterQuery<RoomSchema>['$or']> } = { $or: [] };

  if (roomName) {
    query.$or.push({ roomNameLowerCase: roomName.toLowerCase() });
  }

  if (roomId) {
    query.$or.push({ _id: roomId });
  }

  return dbConnector.doesObjectExist({
    query,
    object: Room,
  });
}

async function addFollowers({
  userIds,
  roomId,
  addParticipants,
}: {
  userIds: string[];
  roomId: string;
  addParticipants?: boolean;
}) {
  const update: mongoose.UpdateQuery<RoomSchema> & { $addToSet: NonNullable<mongoose.UpdateQuery<RoomSchema>['$addToSet']> } = {
    $addToSet: {
      followers: { $each: userIds },
    },
  };

  if (addParticipants) {
    update.$addToSet.participantIds = { $each: userIds };
  }

  return updateObject({
    roomId,
    update,
  });
}

async function createRoom({
  room,
  silentExistsError,
  skipExistsCheck = false,
  options = {},
}: {
  room: Partial<RoomSchema>;
  silentExistsError?: boolean;
  skipExistsCheck?: boolean;
  options?: {
    setId?: boolean;
    isFollower?: boolean;
  };
}) {
  const {
    setId,
    isFollower,
  } = options;
  const {
    roomName,
    objectId: roomId,
  } = room;

  const { data, error } = await doesRoomExist({
    roomName,
    skipExistsCheck,
  });

  if (error) {
    return { error };
  }

  if (data.exists) {
    if (silentExistsError) {
      return { data: { exists: true } };
    } else {
      return { error: new errorCreator.AlreadyExists({ name: `room name ${roomName}` }) };
    }
  }

  const roomToSave = room;
  roomToSave.roomNameLowerCase = roomToSave.roomName?.toLowerCase();

  if (setId && roomId) {
    roomToSave._id = new ObjectId(roomId);
  }

  const { error: saveError, data: saveData } = await dbConnector.saveObject({
    object: Room,
    objectData: roomToSave,
    objectType: 'room',
  });

  if (saveError) {
    return { error: saveError };
  }

  const createdRoom = saveData.savedObject;

  if (isFollower) {
    const { error: followError } = await addFollowers({
      userIds: [createdRoom.ownerAliasId || createdRoom.ownerId],
      roomId: createdRoom.objectId,
    });

    if (followError) {
      return { error: followError };
    }

    return { data: { room: createdRoom } };
  }

  return { data: { room: createdRoom } };
}

async function removeRoom({
  roomId,
  fullRemoval,
}: {
  roomId: string;
  fullRemoval?: boolean;
}) {
  const { error } = await dbConnector.removeObject({
    object: Room,
    query: { _id: roomId },
  });

  if (error) {
    return { error };
  }

  if (fullRemoval) {
    const { error: userError, data: userData } = await dbUser.removeRoomFromAll({
      roomId,
    });

    if (userError) {
      return { error: userError };
    }

    return {
      data: {
        userIds: userData.users?.map((user) => user.objectId),
        success: true,
      },
    };
  }

  return { data: { success: true, userIds: [] } };
}

async function removeFollowers({
  userIds,
  roomId,
}: {
  userIds: string[];
  roomId: string;
}) {
  return updateObject({
    roomId,
    update: {
      $pull: { followers: { $each: userIds } },
    },
  });
}

async function updateRoom({
  roomId,
  room = {},
  options = {},
}: {
  roomId: string;
  room: Partial<RoomSchema>;
  options?: {
    resetOwnerAliasId?: boolean;
    resetPassword?: boolean;
  };
}) {
  const {
    resetOwnerAliasId,
    resetPassword,
  } = options;
  const {
    roomName,
    ownerAliasId,
    accessLevel,
    visibility,
    nameIsLocked,
    isAnonymous,
    password,
  } = room;
  const update: mongoose.UpdateQuery<RoomSchema> = {};
  const set: mongoose.UpdateQuery<RoomSchema>['$set'] = {};
  const unset: mongoose.UpdateQuery<RoomSchema>['$unset'] = {};

  if (resetOwnerAliasId) {
    unset.ownerAliasId = '';
  } else if (ownerAliasId) {
    set.ownerAliasId = ownerAliasId;
  }

  if (resetPassword) {
    unset.password = '';
  } else if (password) {
    set.password = password;
  }

  if (typeof nameIsLocked === 'boolean') {
    set.nameIsLocked = nameIsLocked;
  }

  if (typeof isAnonymous === 'boolean') {
    set.isAnonymous = isAnonymous;
  }

  if (accessLevel) {
    set.accessLevel = accessLevel;
  }

  if (visibility) {
    set.visibility = visibility;
  }

  if (roomName) {
    set.roomName = roomName;
    set.roomNameLowerCase = roomName.toLowerCase();
  }

  if (Object.keys(set).length > 0) {
    update.$set = set;
  }
  if (Object.keys(unset).length > 0) {
    update.$unset = unset;
  }

  if (roomName) {
    const { error: existError, data: existData } = await doesRoomExist({
      roomName,
    });

    if (existError) {
      return { error: existError };
    }

    if (existData.exists) {
      return { error: new errorCreator.AlreadyExists({ name: `roomName ${roomName}` }) };
    }

    return updateObject({
      update,
      roomId,
    });
  }

  return updateObject({
    update,
    roomId,
  });
}

async function getRoomById({
  roomId,
  roomName,
  getPassword,
}: {
  roomId?: string;
  roomName?: string;
  getPassword?: boolean;
}) {
  const query: mongoose.FilterQuery<RoomSchema> = {};

  if (roomId) {
    query._id = roomId;
  } else {
    query.roomName = roomName;
  }

  return getRoom({
    query,
    getPassword,
  });
}

async function getRoomsByIds({
  roomIds,
}: {
  roomIds: string[];
}) {
  return getRooms({
    query: { _id: { $in: roomIds } },
  });
}

async function getRoomsByUser({
  user,
}: {
  user: Partial<UserSchema>;
}) {
  const query = dbConnector.createUserQuery({ user });

  query.$or?.push({ participantIds: { $in: [user.objectId].concat(user.aliases) } });
  query.$or?.push({ isUser: true });

  return getRooms({
    query,
  });
}

async function getWhisperRoom({
  participantIds,
}: {
  participantIds: string[];
}) {
  const query = {
    isWhisper: true,
    participantIds: { $all: participantIds },
  };

  return getRoom({
    query,
  });
}

async function doesWhisperRoomExist({
  participantIds,
}: {
  participantIds: string[];
}) {
  const query = {
    isWhisper: true,
    participantIds: { $all: participantIds },
  };

  return dbConnector.doesObjectExist({
    query,
    object: Room,
  });
}

async function getAllRooms() {
  return getRooms({
    filter: {
      isWhisper: 1,
      participantIds: 1,
      roomName: 1,
    },
    query: {},
  });
}

async function populateDbRooms() {
  console.info('Creating default rooms, if needed');

  const { rooms } = dbConfig;

  async function addRoom(roomNames: string[]) {
    const roomName = roomNames.shift();

    if (roomName) {
      const { error } = await createRoom({
        room: rooms[roomName],
        silentExistsError: true,
        options: { setId: true },

      });

      if (error) {
        return { error };
      }

      await addRoom(roomNames);
    }

    return { data: { success: true } };
  }

  return addRoom(Object.keys(rooms));
}

export default {

  createRoom,
  removeRoom,
  populateDbRooms,
  updateRoom,
  getRoomById,
  doesRoomExist,
  getWhisperRoom,
  addFollowers,
  removeFollowers,
  getRoomsByUser,
  getRoomsByIds,
  getAllRooms,
  doesWhisperRoomExist,
};
