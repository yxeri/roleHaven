'use strict';

import mongoose from 'mongoose';
import errorCreator from '../../error/errorCreator';
import dbConnector from '../databaseConnector';

const machineSchema = new mongoose.Schema(dbConnector.createSchema({
  name: String,
  slots: {
    type: Number,
    default: 4,
  },
  power: {
    type: Number,
    default: 100,
  },
}), { collection: 'machines' });

const Machine = mongoose.model('Machine', machineSchema);

/**
 * Update program object.
 * @param {Object} params Parameters.
 * @param {string} params.programId Id of the program to update.
 * @param {Object} params.update Update.
 * @param {Function} params.callback Callback.
 */
function updateObject({
  programId,
  update,
  callback,
  suppressError,
}) {
  const query = { _id: programId };

  dbConnector.updateObject({
    update,
    query,
    suppressError,
    object: Machine,
    errorNameContent: 'updateProgramObject',
    callback: ({
      error,
      data,
    }) => {
      if (error) {
        callback({ error });

        return;
      }

      callback({ data: { program: data.object } });
    },
  });
}

/**
 * Get programs.
 * @private
 * @param {Object} params Parameters.
 * @param {Object} params.query Query to get programs.
 * @param {Function} params.callback Callback.
 */
function getPrograms({
  query,
  callback,
}) {
  dbConnector.getObjects({
    query,
    object: Machine,
    callback: ({
      error,
      data,
    }) => {
      if (error) {
        callback({ error });

        return;
      }

      callback({ data: { programs: data.objects } });
    },
  });
}

/**
 * Get program.
 * @private
 * @param {Object} params Parameters.
 * @param {string} params.query Query to get program.
 * @param {Function} params.callback Callback.
 */
function getProgram({
  query,
  callback,
}) {
  dbConnector.getObject({
    query,
    object: Machine,
    callback: ({
      error,
      data,
    }) => {
      if (error) {
        callback({ error });

        return;
      }

      if (!data.object) {
        callback({ error: new errorCreator.DoesNotExist({ name: `program ${JSON.stringify(query, null, 4)}` }) });

        return;
      }

      callback({ data: { program: data.object } });
    },
  });
}

/**
 * Does the program exist?
 * @param {Object} params Parameters
 * @param {string} params.programName Name of the program
 * @param {Function} params.callback Callback
 */
function doesProgramExist({
  programName,
  callback,
}) {
  dbConnector.doesObjectExist({
    callback,
    query: { programName },
    object: Machine,
  });
}

/**
 * Create and save program.
 * @param {Object} params Parameters
 * @param {Object} params.program New program
 * @param {Function} params.callback Callback
 */
function createProgram({
  program,
  callback,
}) {
  doesProgramExist({
    programName: program.programName,
    callback: (nameData) => {
      if (nameData.error) {
        callback({ error: nameData.error });

        return;
      }

      if (nameData.data.exists) {
        callback({ error: new errorCreator.AlreadyExists({ name: `program ${program.programName}` }) });

        return;
      }

      dbConnector.saveObject({
        object: new Machine(program),
        objectType: 'program',
        callback: ({
          error,
          data,
        }) => {
          if (error) {
            callback({ error });

            return;
          }

          callback({ data: { program: data.savedObject } });
        },
      });
    },
  });
}

/**
 * Update program properties.
 * @param {Object} params Parameters.
 * @param {Function} params.callback Callback.
 * @param {Object} params.program Properties to update in program.
 * @param {string} params.programId Program Id.
 * @param {Object} [params.options] Options.
 */
function updateProgram({
  programId,
  program,
  callback,
  suppressError,
  options = {},
}) {
  const {
    programName,
    cost,
    ownerAliasId,
  } = program;
  const {
    resetOwnerAliasId = false,
  } = options;
  const update = {};
  const set = {};
  const unset = {};

  if (cost) {
    set.deviceType = cost;
  }
  if (programName) {
    set.deviceName = programName;
  }

  if (resetOwnerAliasId) {
    unset.ownerAliasId = '';
  } else if (ownerAliasId) {
    set.ownerAliasId = ownerAliasId;
  }

  if (Object.keys(set).length > 0) {
    update.$set = set;
  }
  if (Object.keys(unset).length > 0) {
    update.$unset = unset;
  }

  if (programName) {
    doesProgramExist({
      deviceName: programName,
      callback: (nameData) => {
        if (nameData.error) {
          callback({ error: nameData.error });

          return;
        }

        if (nameData.data.exists) {
          callback({ error: new errorCreator.AlreadyExists({ name: `program name ${programName}` }) });

          return;
        }

        updateObject({
          suppressError,
          programId,
          update,
          callback,
        });
      },
    });

    return;
  }

  updateObject({
    programId,
    update,
    callback,
    suppressError,
  });
}

/**
 * Update access to the program
 * @param {Object} params Parameters.
 * @param {Function} params.callback Callback.
 * @param {boolean} [params.shouldRemove] Should access be removed?
 * @param {string[]} [params.userIds] Id of the users to update.
 * @param {string[]} [params.teamIds] Id of the teams to update.
 * @param {string[]} [params.bannedIds] Id of the blocked Ids to update.
 * @param {string[]} [params.teamAdminIds] Id of the teams to update admin access for.
 * @param {string[]} [params.userAdminIds] Id of the users to update admin access for.
 */
function updateAccess(params) {
  const accessParams = params;
  const { callback } = params;
  accessParams.objectId = params.programId;
  accessParams.object = Machine;
  accessParams.callback = ({
    error,
    data,
  }) => {
    if (error) {
      callback({ error });

      return;
    }

    callback({ data: { device: data.object } });
  };

  if (params.shouldRemove) {
    dbConnector.removeObjectAccess(params);
  } else {
    dbConnector.addObjectAccess(params);
  }
}

/**
 * Get programs that the user has access to
 * @param {Object} params Parameters.
 * @param {Object} params.user User retrieving the programs.
 * @param {Function} params.callback Callback.
 */
function getProgramsByUser({
  user,
  callback,
}) {
  const query = dbConnector.createUserQuery({ user });

  getPrograms({
    query,
    callback,
  });
}

/**
 * Get program by Id.
 * @param {Object} params Parameters.
 * @param {string} params.programId Id of the program.
 * @param {Function} params.callback Callback.
 */
function getProgramById({
  programId,
  callback,
}) {
  getProgram({
    callback,
    query: { _id: programId },
  });
}

/**
 * Remove program.
 * @param {Object} params Parameters
 * @param {string} params.programId Id of the program
 * @param {Function} params.callback Callback
 */
function removeProgram({
  programId,
  callback,
}) {
  dbConnector.removeObject({
    callback,
    object: Machine,
    query: { _id: programId },
  });
}

export { updateAccess };
export { updateProgram as updateDevice };
export { createProgram as createDevice };
export { getProgramsByUser as getDevicesByUser };
export { getProgramById as getDeviceById };
export { removeProgram as removeDevice };
