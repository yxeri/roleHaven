'use strict';

import { dbConfig } from '../config/defaults/config';

import errorCreator from '../error/errorCreator';
import authenticator from '../helpers/authenticator';
import managerHelper from '../helpers/manager';

/**
 * Get forum by Id.
 * @param {Object} params Parameters.
 * @param {string} params.token jwt.
 * @param {Function} params.callback Callback.
 * @param {string} [params.forumId] Id of forum to retrieve.
 */
function getForumById({
  forumId,
  token,
  internalCallUser,
  needsAccess,
  callback,
}) {
  managerHelper.getObjectById({
    token,
    callback,
    internalCallUser,
    needsAccess,
    objectId: forumId,
    objectType: 'forum',
    objectIdType: 'forumId',
    dbCallFunc: getForumById,
    commandName: dbConfig.apiCommands.GetForum.name,
  });
}

/**
 * Update last updated date on forum.
 * @param {Object} params Parameters.
 * @param {string} params.forumId Id of the forum.
 * @param {Function} params.callback Callback.
 */
function updateForumTime({
  forumId,
  callback,
}) {
  updateForum({
    forumId,
    callback,
    forum: {},
  });
}

/**
 * Create a new forum.
 * @param {Object} params Parameters.
 * @param {Object} params.forum Forum to create.
 * @param {Object} params.callback Callback.
 * @param {Object} params.token jwt.
 * @param {Object} params.io Socket.io.
 */
function createForum({
  forum,
  callback,
  token,
  io,
  socket,
}) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.CreateForum.name,
    callback: ({
      error,
      data,
    }) => {
      if (error) {
        callback({ error });

        return;
      }

      const { user: authUser } = data;

      const forumToCreate = forum;
      forumToCreate.ownerId = authUser.objectId;

      if (forumToCreate.ownerAliasId && !authUser.aliases.includes(forumToCreate.ownerAliasId)) {
        callback({ error: new errorCreator.NotAllowed({ name: `create forum with alias ${forumToCreate.ownerAliasId}` }) });

        return;
      }

      createForum({
        forum: forumToCreate,
        callback: ({
          error: createError,
          data: createData,
        }) => {
          if (createError) {
            callback({ error: createError });

            return;
          }

          const { forum: createdForum } = createData;
          const dataToSend = {
            data: {
              forum: managerHelper.stripObject({ object: { ...createdForum } }),
              changeType: dbConfig.ChangeTypes.CREATE,
            },
          };

          if (socket) {
            socket.broadcast.emit(dbConfig.EmitTypes.FORUM, dataToSend);
          } else {
            io.emit(dbConfig.EmitTypes.FORUM, dataToSend);
            io.to(authUser.objectId)
              .emit(dbConfig.EmitTypes.FORUM, {
                data: {
                  forum: createdForum,
                  changeType: dbConfig.ChangeTypes.UPDATE,
                },
              });
          }

          callback({
            data: {
              forum: createdForum,
              changeType: dbConfig.ChangeTypes.CREATE,
            },
          });
        },
      });
    },
  });
}

/**
 * Get all forums.
 * @param {Object} params Parameters.
 * @param {Function} params.callback Callback.
 * @param {string} params.token jwt.
 */
function getAllForums({
  callback,
  token,
}) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.GetFull.name,
    callback: ({ error }) => {
      if (error) {
        callback({ error });

        return;
      }

      getAllForums({ callback });
    },
  });
}

/**
 * Update forum.
 * @param {Object} params Parameters.
 * @param {Object} params.forum Forum.
 * @parm {Object} params.options Options.
 * @param {Function} params.callback Callback.
 * @param {Object} params.io Socket io.
 */
function updateForum({
  token,
  forum,
  forumId,
  options,
  callback,
  io,
  internalCallUser,
  socket,
}) {
  managerHelper.updateObject({
    callback,
    options,
    token,
    io,
    internalCallUser,
    socket,
    objectId: forumId,
    object: forum,
    commandName: dbConfig.apiCommands.UpdateForum.name,
    objectType: 'forum',
    dbCallFunc: updateForum,
    emitType: dbConfig.EmitTypes.FORUM,
    objectIdType: 'forumId',
    getDbCallFunc: getForumById,
    getCommandName: dbConfig.apiCommands.GetForum.name,
  });
}

/**
 * Remove forum.
 * @param {Object} params Parameters.
 * @param {string} params.token jwt.
 * @param {string} params.forumId Id of the forum.
 * @param {Object} params.io Socket io.
 * @param {Function} params.callback Callback.
 */
function removeForum({
  token,
  forumId,
  callback,
  io,
  socket,
}) {
  managerHelper.removeObject({
    callback,
    token,
    io,
    socket,
    getDbCallFunc: getForumById,
    getCommandName: dbConfig.apiCommands.GetForum.name,
    objectId: forumId,
    commandName: dbConfig.apiCommands.RemoveForum.name,
    objectType: 'forum',
    dbCallFunc: removeForum,
    emitType: dbConfig.EmitTypes.FORUM,
    objectIdType: 'forumId',
  });
}

/**
 * Get forums by user.
 * @param {Object} params Parameters.
 * @param {string} params.token jwt.
 * @param {Function} params.callback Callback
 */
function getForumsByUser({
  token,
  callback,
}) {
  managerHelper.getObjects({
    callback,
    token,
    shouldSort: true,
    sortName: 'title',
    commandName: dbConfig.apiCommands.GetForum.name,
    objectsType: 'forums',
    dbCallFunc: getForumsByUser,
  });
}

/**
 * Update access to the forum for users or teams.
 * @param {Object} params Parameters.
 * @param {string} params.forumId Id of the forum.
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
  forumId,
  teamAdminIds,
  userAdminIds,
  userIds,
  teamIds,
  bannedIds,
  shouldRemove,
  internalCallUser,
  callback,
}) {
  authenticator.isUserAllowed({
    token,
    internalCallUser,
    commandName: dbConfig.apiCommands.UpdateForum.name,
    callback: ({
      error,
      data,
    }) => {
      if (error) {
        callback({ error });

        return;
      }

      const { user: authUser } = data;

      getForumById({
        forumId,
        internalCallUser: authUser,
        callback: ({
          error: forumError,
          data: forumData,
        }) => {
          if (forumError) {
            callback({ error: forumError });

            return;
          }

          const { forum } = forumData;

          const {
            hasFullAccess,
          } = authenticator.hasAccessTo({
            objectToAccess: forum,
            toAuth: authUser,
          });

          if (!hasFullAccess) {
            callback({ error: new errorCreator.NotAllowed({ name: `${dbConfig.apiCommands.UpdateForum.name}. User: ${authUser.objectId}. Access: forum ${forumId}` }) });

            return;
          }

          updateAccess({
            shouldRemove,
            userIds,
            teamIds,
            bannedIds,
            teamAdminIds,
            userAdminIds,
            forumId,
            callback,
          });
        },
      });
    },
  });
}

export { createForum };
export { removeForum };
export { updateForum };
export { getAllForums };
export { getForumById };
export { getForumsByUser };
export { updateForumTime };
export { updateAccess };