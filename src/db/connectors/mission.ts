'use strict';

import mongoose from 'mongoose';
import { dbConfig } from '../../config/defaults/config';
import errorCreator from '../../error/errorCreator';
import dbConnector from '../databaseConnector';

const missionSchema = new mongoose.Schema(dbConnector.createSchema({
  reward: {
    type: Number,
    default: 0,
  },
  rewardType: {
    type: String,
    default: dbConfig.RewardTypes.CURRENCY,
  },
  completed: {
    type: Boolean,
    default: false,
  },
  completedBy: String,
  standalone: {
    type: Boolean,
    default: true,
  },
}), { collection: 'missions' });

const Mission = mongoose.model('Mission', missionSchema);

/**
 * Update program object.
 * @param {Object} params Parameters.
 * @param {string} params.missionId Id of the mission to update.
 * @param {Object} params.update Update.
 * @param {Function} params.callback Callback.
 */
function updateObject({
  missionId,
  update,
  callback,
  suppressError,
}) {
  const query = { _id: missionId };

  dbConnector.updateObject({
    update,
    query,
    suppressError,
    object: Mission,
    errorNameContent: 'updateMissionObject',
    callback: ({
      error,
      data,
    }) => {
      if (error) {
        callback({ error });

        return;
      }

      callback({ data: { mission: data.object } });
    },
  });
}

/**
 * Get missions.
 * @private
 * @param {Object} params Parameters.
 * @param {Object} params.query Query to get missions.
 * @param {Function} params.callback Callback.
 */
function getMissions({
  query,
  callback,
}) {
  dbConnector.getObjects({
    query,
    object: Mission,
    callback: ({
      error,
      data,
    }) => {
      if (error) {
        callback({ error });

        return;
      }

      callback({ data: { missions: data.objects } });
    },
  });
}

/**
 * Get mission.
 * @private
 * @param {Object} params Parameters.
 * @param {string} params.query Query to get program.
 * @param {Function} params.callback Callback.
 */
function getMission({
  query,
  callback,
}) {
  dbConnector.getObject({
    query,
    object: Mission,
    callback: ({
      error,
      data,
    }) => {
      if (error) {
        callback({ error });

        return;
      }

      if (!data.object) {
        callback({ error: new errorCreator.DoesNotExist({ name: `mission ${JSON.stringify(query, null, 4)}` }) });

        return;
      }

      callback({ data: { mission: data.object } });
    },
  });
}

/**
 * Create and save mission.
 * @param {Object} params Parameters.
 * @param {Object} params.mission New mission.
 * @param {Function} params.callback Callback.
 */
function createMission({
  mission,
  callback,
}) {
  dbConnector.saveObject({
    object: new Mission(mission),
    objectType: 'mission',
    callback: ({
      error,
      data,
    }) => {
      if (error) {
        callback({ error });

        return;
      }

      callback({ data: { mission: data.savedObject } });
    },
  });
}

/**
 * Update mission properties.
 * @param {Object} params Parameters.
 * @param {Function} params.callback Callback.
 * @param {Object} params.mission Properties to update in mission.
 * @param {string} params.missionId Mission Id.
 */
function updateProgram({
  missionId,
  mission,
  callback,
  suppressError,
}) {
  const {
    completed,
  } = mission;
  const update = {};
  const set = {};

  if (completed) {
    set.completed = completed;
  }

  if (Object.keys(set).length > 0) {
    update.$set = set;
  }

  updateObject({
    suppressError,
    missionId,
    update,
    callback,
  });
}

/**
 * Get missions that the user has access to
 * @param {Object} params Parameters.
 * @param {Object} params.user User retrieving the missions.
 * @param {Function} params.callback Callback.
 */
function getMissionsByUser({
  user,
  callback,
}) {
  const query = dbConnector.createUserQuery({ user });
  const {
    objectId,
    aliases = [],
  } = user;
  query.$or.completedBy = { $in: aliases.concat([objectId]) };

  getMissions({
    query,
    callback,
  });
}

/**
 * Get mission by Id.
 * @param {Object} params Parameters.
 * @param {string} params.missionId Id of the mission.
 * @param {Function} params.callback Callback.
 */
function getMissionById({
  missionId,
  callback,
}) {
  getMission({
    callback,
    query: { _id: missionId },
  });
}

export { updateProgram as updateDevice };
export { createMission as createDevice };
export { getMissionsByUser as getDevicesByUser };
export { getMissionById as getDeviceById };
