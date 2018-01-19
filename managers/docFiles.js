/*
 Copyright 2017 Aleksandar Jankovic

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

const appConfig = require('../config/defaults/config').app;
const dbConfig = require('../config/defaults/config').databasePopulation;
const errorCreator = require('../objects/error/errorCreator');
const textTools = require('../utils/textTools');
const dbDocFile = require('../db/connectors/docFile');
const authenticator = require('../helpers/authenticator');
const objectValidator = require('../utils/objectValidator');
const aliasManager = require('./aliases');

/**
 * Get doc file by ID and check if the user has access to it.
 * @param {Object} params - Parameters.
 * @param {Object} params.user - User retrieving the alias.
 * @param {string} params.docFileId - ID of the doc file to retrieve.
 * @param {Function} params.callback - Callback.
 * @param {string} [params.errorContentText] - Text to be printed on error.
 * @param {boolean} [params.shouldBeAdmin] - Does the user have to be an admin?
 */
function getAccessibleDocFile({
  user,
  docFileId,
  callback,
  shouldBeAdmin,
  full,
  errorContentText = `docFileId ${docFileId}`,
}) {
  dbDocFile.getDocFileById({
    docFileId,
    full: true,
    callback: (docFileData) => {
      if (docFileData.error) {
        callback({ error: docFileData.error });

        return;
      } else if (!authenticator.hasAccessTo({
        shouldBeAdmin,
        toAuth: user,
        objectToAccess: docFileData.data.docFile,
      })) {
        callback({ error: new errorCreator.NotAllowed({ name: errorContentText }) });

        return;
      }

      const foundDocFile = docFileData.data.docFile;
      const filteredDocFile = {
        objectId: foundDocFile.objectId,
        title: foundDocFile.title,
        ownerId: foundDocFile.ownerId,
        ownerAliasId: foundDocFile.ownerAliasId,
        lastUpdated: foundDocFile.lastUpdated,
        timeCreated: foundDocFile.timeCreated,
        customLastUpdated: foundDocFile.customLastUpdated,
        customTimeCreated: foundDocFile.customTimeCreated,
        text: foundDocFile.text,
      };

      callback({
        data: {
          docFile: full ? foundDocFile : filteredDocFile,
        },
      });
    },
  });
}

/**
 * Saves doc file to database and transmits it to sockets.
 * @private
 * @param {Object} params - Parameters.
 * @param {Object} params.docFile - Doc file to save.
 * @param {Function} params.callback - Callback.
 * @param {Object} [params.socket] - Socket.io.
 * @param {Object} params.io - Socket.io. Used if socket is not set.
 */
function saveAndTransmitDocFile({
  docFile,
  callback,
  socket,
  io,
}) {
  dbDocFile.createDocFile({
    docFile,
    callback: (createData) => {
      if (createData.error) {
        callback({ error: createData.error });

        return;
      }

      const dataToSend = {
        data: {
          docFile: createData.data.docFile,
          changeType: dbConfig.ChangeTypes.CREATE,
        },
      };

      if (socket) {
        socket.broadcast.emit(dbConfig.EmitTypes.DOCFILE, dataToSend);
      } else {
        io.emit(dbConfig.EmitTypes.DOCFILE, dataToSend);
      }

      callback(dataToSend);
    },
  });
}

/**
 * Create a docFile.
 * @param {Object} params - Parameters.
 * @param {Object} params.docFile - DocFile to create.
 * @param {Object} params.io - Socket io. Will be used if socket is not set.
 * @param {Function} params.callback - Callback.
 * @param {Object} [params.socket] - Socket io.
 */
function createDocFile({
  token,
  socket,
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
      } else if (docFile.code && (!textTools.hasAllowedText(docFile.code) || docFile.code.length > appConfig.docFileCodeMaxLength || docFile.code === '')) {
        callback({ error: new errorCreator.InvalidCharacters({ expected: `Alphanumeric ${docFile.code}. Code length: ${appConfig.docFileCodeMaxLength}` }) });

        return;
      } else if (docFile.text.join('').length > appConfig.docFileMaxLength || docFile.text.join('') === '') {
        callback({ error: new errorCreator.InvalidCharacters({ expected: `Text length: ${appConfig.docFileMaxLength}.` }) });

        return;
      } else if (docFile.title.length > appConfig.docFileTitleMaxLength || docFile.title === '') {
        callback({ error: new errorCreator.InvalidCharacters({ expected: `Title length: ${appConfig.docFileTitleMaxLength}` }) });

        return;
      }

      const { user } = data;
      const newDocFile = docFile;
      newDocFile.ownerId = user.objectId;
      newDocFile.code = newDocFile.code || textTools.generateTextCode();

      if (docFile.ownerAliasId) {
        aliasManager.getAccessibleAlias({
          token,
          user,
          aliasId: docFile.ownerAliasId,
          callback: (aliasData) => {
            if (aliasData.error) {
              callback({ error: aliasData.error });

              return;
            }

            saveAndTransmitDocFile({
              socket,
              io,
              callback,
              docFile: newDocFile,
            });
          },
        });

        return;
      }

      saveAndTransmitDocFile({
        socket,
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
 * @param {Object} params.io - Socket io. Will be used if socket is not set.
 * @param {Object} [params.socket] - Socket io.
 * @param {Object} [params.options] - Update options.
 */
function updateDocFile({
  docFile,
  docFileId,
  socket,
  io,
  token,
  callback,
  options,
}) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.CreateDocFile.name,
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

      const { user } = data;

      getAccessibleDocFile({
        docFileId,
        user,
        shouldBeAdmin: true,
        callback: (docFileData) => {
          if (docFileData.error) {
            callback({ error: docFileData.error });

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

              const {
                code,
                title,
                ownerId,
                ownerAliasId,
                isPublic,
              } = updateData.docFile;

              const dataToSend = {
                data: {
                  docFile: {
                    title,
                    isPublic,
                    objectId: docFileId,
                    ownerId: ownerAliasId || ownerId,
                    code: isPublic ? code : undefined,
                  },
                  changeType: dbConfig.ChangeTypes.UPDATE,
                },
              };
              const dataToReturn = {
                data: {
                  docFile: updateData.docFile,
                  changeType: dbConfig.ChangeTypes.UPDATE,
                },
              };

              if (socket) {
                socket.broadcast.emit(dbConfig.EmitTypes.DOCFILE, dataToSend);
              } else {
                io.emit(dbConfig.EmitTypes.DOCFILE, dataToSend);
              }

              callback(dataToReturn);
            },
          });
        },
      });
    },
  });
}

/**
 * Get a list of available files.
 * @param {Object} params - Parameters.
 * @param {string} params.token - jwt.
 * @param {Function} params.callback - Callback.
 */
function getDocFilesList({ token, callback }) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.GetDocFilesList.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const { user } = data;

      dbDocFile.getAllDocFiles({
        callback: ({ error: docFilesError, data: docFilesData }) => {
          if (docFilesError) {
            callback({ error: docFilesError });

            return;
          }

          const { docFiles } = docFilesData;
          const modifiedFiles = docFiles.map((docFile) => {
            const newDocFile = {
              objectId: docFile.objectId,
              isPublic: docFile.isPublic,
              ownerId: docFile.ownerAliasId || docFile.ownerId,
              title: docFile.title,
            };

            if (docFile.isPublic || authenticator.hasAccessTo({
              objectToAccess: docFile,
              toAuth: user,
            })) {
              newDocFile.code = docFile.code;
            }

            return newDocFile;
          });

          callback({ data: { docFiles: modifiedFiles } });
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
 * @param {Function} params.callback - Callback.
 */
function unlockDocFile({ code, token, callback }) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.GetDocFile.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const { user } = data;

      dbDocFile.getDocFileByCode({
        code,
        callback: (docFileData) => {
          if (docFileData.error) {
            callback({ error: docFileData.error });

            return;
          }

          const foundDocFile = docFileData.data.docFile;

          if (foundDocFile.accessLevel > user.accessLevel) {
            callback({ error: new errorCreator.NotAllowed({ name: `docFile ${code}` }) });

            return;
          }

          dbDocFile.addAccess({
            docFileId: foundDocFile.objectId,
            userIds: [user.objectId],
            callback: (accessData) => {
              if (accessData.error) {
                callback({ error: accessData.error });

                return;
              }

              callback({ data: { docFile: foundDocFile } });
            },
          });
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
 */
function getDocFileById({
  docFileId,
  token,
  callback,
  full,
}) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.GetDocFile.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const { user } = data;

      getAccessibleDocFile({
        docFileId,
        callback,
        user,
        full,
        shouldBeAdmin: full && dbConfig.apiCommands.GetFull.accessLevel > user.accessLevel,
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
 * @param {Object} params.io - Socket io. Will be used if socket is not set.
 * @param {Object} [params.socket] - Socket io.
 */
function removeDocFile({
  docFileId,
  token,
  callback,
  socket,
  io,
}) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.RemoveDocFile.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const { user } = data;

      getAccessibleDocFile({
        docFileId,
        user,
        shouldBeAdmin: true,
        callback: (aliasData) => {
          if (aliasData.error) {
            callback({ error: aliasData.error });

            return;
          }
          dbDocFile.removeDocFile({
            docFileId,
            callback: (removeData) => {
              if (removeData.remove) {
                callback({ error: removeData.error });

                return;
              }

              const dataToSend = {
                data: {
                  docFile: { objectId: docFileId },
                  changeType: dbConfig.ChangeTypes.REMOVE,
                },
              };

              if (socket) {
                socket.broadcast.emit(dbConfig.EmitTypes.DOCFILE, dataToSend);
              } else {
                io.emit(dbConfig.EmitTypes.DOCFILE, dataToSend);
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
 * Get files by user.
 * @param {Object} params - Parameters.
 * @param {string} params.token - jwt.
 * @param {Function} params.callback - Callback
 */
function getDocFilesByUser({
  full,
  token,
  callback,
}) {
  authenticator.isUserAllowed({
    token,
    commandName: full ? dbConfig.apiCommands.GetFull.name : dbConfig.apiCommands.GetDocFile.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const { user } = data;

      dbDocFile.getDocFilesByUser({
        user,
        full,
        callback,
      });
    },
  });
}

exports.createDocFile = createDocFile;
exports.updateDocFile = updateDocFile;
exports.unlockDocFile = unlockDocFile;
exports.getDocFileById = getDocFileById;
exports.removeDocFile = removeDocFile;
exports.getDocFilesList = getDocFilesList;
exports.getDocFilesByUser = getDocFilesByUser;
