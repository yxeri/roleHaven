/*
 Copyright 2017 Carmilla Mina Jankovic

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

'use strict';

const { appConfig, dbConfig } = require('../config/defaults/config');
const errorCreator = require('../error/errorCreator');
const textTools = require('../utils/textTools');
const dbDocFile = require('../db/connectors/docFile');
const authenticator = require('../helpers/authenticator');
const objectValidator = require('../utils/objectValidator');
const managerHelper = require('../helpers/manager');

/**
 * Returns either a filtered or complete file, depending if the user or the user's teams has access to it.
 * @return {{Object, boolean}} docFile and isLocked.
 */
function getFileByAccess({ user, docFile }) {
  const {
    hasAccess,
    hasFullAccess,
  } = authenticator.hasAccessTo({
    objectToAccess: docFile,
    toAuth: user,
  });

  if (!hasAccess) {
    const strippedObject = managerHelper.stripObject({ object: Object.assign({}, docFile) });
    strippedObject.text = undefined;
    strippedObject.code = undefined;
    strippedObject.pictures = undefined;

    return { docFile: strippedObject, isLocked: true };
  } else if (!hasFullAccess) {
    const strippedObject = managerHelper.stripObject({ object: Object.assign({}, docFile) });

    return { docFile: strippedObject, isLocked: false };
  }

  return { docFile, isLocked: false };
}

/**
 * Saves doc file to database and transmits it to sockets.
 * @private
 * @param {Object} params - Parameters.
 * @param {Object} params.docFile - Doc file to save.
 * @param {Function} params.callback - Callback.
 * @param {Object} params.io - Socket.io.
 */
function saveAndTransmitDocFile({
  docFile,
  callback,
  io,
}) {
  dbDocFile.createDocFile({
    docFile,
    callback: ({ error: createError, data: createData }) => {
      if (createError) {
        callback({ error: createError });

        return;
      }

      const { docFile: newDocFile } = createData;
      const fullDocFile = Object.assign({}, newDocFile);

      if (!newDocFile.isPublic) {
        newDocFile.isLocked = true;
        newDocFile.code = undefined;
        newDocFile.text = undefined;
        newDocFile.pictures = undefined;
      }

      const creatorDataToSend = {
        data: {
          isSender: true,
          docFile: fullDocFile,
          changeType: dbConfig.ChangeTypes.CREATE,
        },
      };
      const dataToSend = {
        data: {
          docFile: managerHelper.stripObject({ object: newDocFile }),
          changeType: dbConfig.ChangeTypes.CREATE,
        },
      };

      io.emit(dbConfig.EmitTypes.DOCFILE, dataToSend);
      io.to(docFile.ownerAliasId || docFile.ownerId).emit(dbConfig.EmitTypes.DOCFILE, creatorDataToSend);

      callback({
        data: {
          docFile: fullDocFile,
          changeType: dbConfig.ChangeTypes.CREATE,
        },
      });
    },
  });
}

/**
 * Get doc file by its Id.
 * @param {Object} params - Parameters.
 * @param {string} params.token - jwt.
 * @param {Function} params.callback - Callback.
 * @param {string} params.docFileId - Id of Docfile to retrieve.
 * @param {Object} [params.internalCallUser] - User to use on authentication. It will bypass token authentication.
 */
function getDocFileById({
  docFileId,
  token,
  callback,
  internalCallUser,
}) {
  managerHelper.getObjectById({
    token,
    internalCallUser,
    objectId: docFileId,
    objectType: 'docFile',
    objectIdType: 'docFileId',
    dbCallFunc: dbDocFile.getDocFileById,
    commandName: dbConfig.apiCommands.GetDocFile.name,
    callback,
  });
}

/**
 * Create a docFile.
 * @param {Object} params - Parameters.
 * @param {Object} params.docFile - DocFile to create.
 * @param {Object} params.io - Socket io.
 * @param {Function} params.callback - Callback.
 */
function createDocFile({
  token,
  io,
  docFile,
  callback,
}) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.CreateDocFile.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      } else if (!objectValidator.isValidData({ docFile }, { docFile: { code: true, text: true, title: true } })) {
        callback({ error: new errorCreator.InvalidData({ expected: '{ docFile: { code, text, title } }' }) });

        return;
      } else if (docFile.code && (!textTools.hasAllowedText(docFile.code) || docFile.code.length > appConfig.docFileCodeMaxLength || docFile.code < appConfig.docFileCodeMinLength)) {
        callback({ error: new errorCreator.InvalidCharacters({ expected: `Alphanumeric ${docFile.code}. Code length: ${appConfig.docFileCodeMinLength} - ${appConfig.docFileCodeMaxLength}` }) });

        return;
      } else if (docFile.text.join('').length > appConfig.docFileMaxLength || docFile.text.join('') < appConfig.docFileMinLength) {
        callback({ error: new errorCreator.InvalidCharacters({ expected: `Text length: ${appConfig.docFileMinLength} - ${appConfig.docFileMaxLength}` }) });

        return;
      } else if (docFile.title.length > appConfig.docFileTitleMaxLength || docFile.title < appConfig.docFileTitleMinLength) {
        callback({ error: new errorCreator.InvalidCharacters({ expected: `Title length: ${appConfig.docFileTitleMinLength} - ${appConfig.docFileTitleMaxLength}` }) });

        return;
      }

      const { user: authUser } = data;
      const newDocFile = docFile;
      newDocFile.ownerId = authUser.objectId;
      newDocFile.code = newDocFile.code || textTools.generateTextCode();

      if (newDocFile.ownerAliasId && !authUser.aliases.includes(newDocFile.ownerAliasId)) {
        callback({ error: new errorCreator.NotAllowed({ name: `create position with alias ${newDocFile.ownerAliasId}` }) });

        return;
      }

      saveAndTransmitDocFile({
        io,
        callback,
        docFile: newDocFile,
      });
    },
  });
}

/**
 * Update existing docFile.
 * @param {Object} params - Parameters.
 * @param {Object} params.docFile - Doc file changes.
 * @param {tring} params.docFileId - Doc file.
 * @param {Object} params.io - Socket io. Will be used if socket is undefined.
 * @param {Function} params.callback - Callback.
 * @param {Object} params.io - Socket io.
 * @param {Object} [params.options] - Update options.
 */
function updateDocFile({
  docFile,
  docFileId,
  io,
  token,
  callback,
  options,
}) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.UpdateDocFile.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      } else if (docFile.text && docFile.text.join('').length > appConfig.docFileMaxLength) {
        callback({ error: new errorCreator.InvalidCharacters({ expected: `Text length: ${appConfig.docFileMaxLength}.` }) });

        return;
      } else if (docFile.title && docFile.title.length > appConfig.docFileTitleMaxLength) {
        callback({ error: new errorCreator.InvalidCharacters({ expected: `Title length: ${appConfig.docFileTitleMaxLength}` }) });

        return;
      }

      const { user: authUser } = data;

      getDocFileById({
        docFileId,
        internalCallUser: authUser,
        callback: ({ error: getDocFileError, data: getDocFileData }) => {
          if (getDocFileError) {
            callback({ error: getDocFileError });

            return;
          }

          const { docFile: foundDocFile } = getDocFileData;
          const {
            hasFullAccess,
          } = authenticator.hasAccessTo({
            objectToAccess: foundDocFile,
            toAuth: authUser,
          });

          if (!hasFullAccess) {
            callback({ error: new errorCreator.NotAllowed({ name: `${dbConfig.apiCommands.UpdateDocFile.name}. User: ${authUser.objectId}. Access: docFile ${docFileId}` }) });

            return;
          }

          dbDocFile.updateDocFile({
            docFile,
            options,
            docFileId,
            callback: ({ error: updateError, data: updateData }) => {
              if (updateError) {
                callback({ error: updateError });

                return;
              }

              const { docFile: updatedDocFile } = updateData;
              const filteredDocFile = Object.assign({}, updatedDocFile);

              filteredDocFile.code = undefined;

              const dataToSend = {
                data: {
                  docFile: managerHelper.stripObject({ object: filteredDocFile }),
                  changeType: dbConfig.ChangeTypes.UPDATE,
                },
              };
              const dataToReturn = {
                data: {
                  docFile: updateData.docFile,
                  changeType: dbConfig.ChangeTypes.UPDATE,
                },
              };

              io.emit(dbConfig.EmitTypes.DOCFILE, dataToSend);
              io.to(authUser.objectId).emit(dbConfig.EmitTypes.DOCFILE, dataToReturn);

              callback(dataToReturn);
            },
          });
        },
      });
    },
  });
}

/**
 * Get doc file by code.
 * @param {Object} params - Parameters.
 * @param {string} params.code - Doc file Code.
 * @param {string} params.token - jwt.
 * @param {Object} params.io - Socket.io;
 * @param {Function} params.callback - Callback.
 */
function unlockDocFile({
  io,
  docFileId,
  code,
  token,
  callback,
  internalCallUser,
}) {
  authenticator.isUserAllowed({
    token,
    internalCallUser,
    commandName: dbConfig.apiCommands.GetDocFile.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const { user } = data;

      dbDocFile.getDocFileById({
        docFileId,
        callback: (docFileData) => {
          if (docFileData.error) {
            callback({ error: docFileData.error });

            return;
          }

          const foundDocFile = docFileData.data.docFile;
          const dataToSend = {
            data: {
              docFile: foundDocFile,
              changeType: dbConfig.ChangeTypes.UPDATE,
            },
          };

          if (foundDocFile.code !== code || foundDocFile.accessLevel > user.accessLevel) {
            callback({ error: new errorCreator.NotAllowed({ name: `docFile ${code}` }) });

            return;
          }

          if (user.isAnonymous) {
            io.to(user.objectId).emit(dbConfig.EmitTypes.DOCFILE, dataToSend);

            callback(dataToSend);

            return;
          }


          dbDocFile.updateAccess({
            docFileId: foundDocFile.objectId,
            userIds: [user.objectId],
            callback: (accessData) => {
              if (accessData.error) {
                callback({ error: accessData.error });

                return;
              }

              io.to(user.objectId).emit(dbConfig.EmitTypes.DOCFILE, dataToSend);

              callback(dataToSend);
            },
          });
        },
      });
    },
  });
}

/**
 * Remove doc file.
 * @param {Object} params - Parameters.
 * @param {string} params.docFileId - ID of the file to remove.
 * @param {string} params.token - jwt.
 * @param {Function} params.callback - Callback
 * @param {Object} params.io - Socket io.
 */
function removeDocFile({
  docFileId,
  token,
  callback,
  io,
}) {
  managerHelper.removeObject({
    callback,
    token,
    io,
    getDbCallFunc: dbDocFile.getDocFileById,
    getCommandName: dbConfig.apiCommands.GetDocFile.name,
    objectId: docFileId,
    commandName: dbConfig.apiCommands.RemoveDocFile.name,
    objectType: 'docFile',
    dbCallFunc: dbDocFile.removeDocFile,
    emitType: dbConfig.EmitTypes.DOCFILE,
    objectIdType: 'docFileId',
  });
}

/**
 * Get files by user.
 * @param {Object} params - Parameters.
 * @param {string} params.token - jwt.
 * @param {Function} params.callback - Callback
 */
function getDocFilesByUser({
  token,
  callback,
}) {
  managerHelper.getObjects({
    token,
    shouldSort: true,
    sortName: 'title',
    commandName: dbConfig.apiCommands.GetDocFile.name,
    objectsType: 'docFiles',
    dbCallFunc: dbDocFile.getDocFilesByUser,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const { authUser, docFiles } = data;
      const allDocFiles = docFiles.map(docFile => getFileByAccess({ user: authUser, docFile }).docFile).sort((a, b) => {
        const aName = a.title;
        const bName = b.title;

        if (aName < bName) {
          return -1;
        } else if (aName > bName) {
          return 1;
        }

        return 0;
      });

      callback({ data: { docFiles: allDocFiles } });
    },
  });
}

/**
 * Update access to the docFile for users or teams.
 * @param {Object} params - Parameters.
 * @param {string} params.docFileId - Id of the file.
 * @param {Function} params.callback - Callback.
 * @param {boolean} [params.shouldRemove] - Should access be removed from the users or teams?
 * @param {string[]} [params.userIds] - Id of the users.
 * @param {string[]} [params.teamIds] - Id of the teams.
 * @param {string[]} [params.bannedIds] - Id of the blocked Ids to add.
 * @param {string[]} [params.teamAdminIds] - Id of the teams to change admin access for.
 * @param {string[]} [params.userAdminIds] - Id of the users to change admin access for.
 */
function updateAccess({
  token,
  docFileId,
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
    commandName: dbConfig.apiCommands.UpdateDocFile.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const { user: authUser } = data;

      getDocFileById({
        docFileId,
        internalCallUser: authUser,
        callback: ({ error: docFileError, data: docFileData }) => {
          if (docFileError) {
            callback({ error: docFileError });

            return;
          }

          const { docFile } = docFileData;

          const {
            hasFullAccess,
          } = authenticator.hasAccessTo({
            objectToAccess: docFile,
            toAuth: authUser,
          });

          if (!hasFullAccess) {
            callback({ error: errorCreator.NotAllowed({ name: `docFile ${docFileId}` }) });

            return;
          }

          dbDocFile.updateAccess({
            shouldRemove,
            userIds,
            teamIds,
            bannedIds,
            teamAdminIds,
            userAdminIds,
            docFileId,
            callback,
          });
        },
      });
    },
  });
}

exports.createDocFile = createDocFile;
exports.updateDocFile = updateDocFile;
exports.unlockDocFile = unlockDocFile;
exports.getDocFileById = getDocFileById;
exports.removeDocFile = removeDocFile;
exports.getDocFilesByUser = getDocFilesByUser;
exports.updateAccess = updateAccess;
