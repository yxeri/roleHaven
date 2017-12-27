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
  errorContentText = `docFileId ${docFileId}`,
}) {
  dbDocFile.getDocFileById({
    docFileId,
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

      callback(docFileData);
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
 * @param {string} [params.userId] - ID of the creator. Will default to socket user.
 * @param {Object} [params.socket] - Socket io.
 */
function createDocFile({
  token,
  socket,
  io,
  docFile,
  callback,
  userId,
}) {
  authenticator.isUserAllowed({
    token,
    matchToId: userId,
    commandName: dbConfig.apiCommands.CreateDocFile.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      } else if (!objectValidator.isValidData({ docFile }, { docFile: { code: true, text: true, title: true } })) {
        callback({ error: new errorCreator.InvalidData({ expected: '{ docFile: { code, text, title } }' }) });

        return;
      } else if (!textTools.hasAllowedText(docFile.code) || docFile.code.length > appConfig.docFileCodeMaxLength || docFile.code === '') {
        callback({ error: new errorCreator.InvalidCharacters({ expected: `Alphanumeric ${docFile.code}. Code length: ${appConfig.docFileCodeMaxLength}` }) });

        return;
      } else if (docFile.text.join('').length > appConfig.docFileMaxLength || docFile.text.join('') === '') {
        callback({ error: new errorCreator.InvalidCharacters({ expected: `Text length: ${appConfig.docFileMaxLength}.` }) });

        return;
      } else if (docFile.title.length > appConfig.docFileTitleMaxLength || docFile.title === '') {
        callback({ error: new errorCreator.InvalidCharacters({ expected: `Title length: ${appConfig.docFileTitleMaxLength}` }) });

        return;
      }

      const authUser = data.user;
      const newDocFile = docFile;
      newDocFile.ownerId = authUser.userId;

      if (docFile.ownerAliasId) {
        aliasManager.getAccessibleAlias({
          token,
          user: authUser,
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
 * @param {string} params.userId - ID of the creator.
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
  userId,
  callback,
  options,
}) {
  authenticator.isUserAllowed({
    token,
    matchToId: userId,
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

      getAccessibleDocFile({
        docFileId,
        shouldBeAdmin: true,
        user: data.user,
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
                    ownerId: ownerAliasId || ownerId,
                    code: isPublic ? code : undefined,
                  },
                  changeType: dbConfig.ChangeTypes.UPDATE,
                },
              };

              if (socket) {
                socket.broadcast.emit(dbConfig.EmitTypes.DOCFILE, dataToSend);
              } else {
                io.emit(dbConfig.EmitTypes.DOCFILE, dataToSend);
              }

              callback({ data: { docFile: updateData.docFile } });
            },
          });
        },
      });
    },
  });
}

/**
 * Get all doc files.
 * @param {Object} params - Parameters.
 * @param {string} params.token - jwt.
 * @param {boolean} [params.lite] - Should parameters storing a lot of data be filtered?
 * @param {Function} params.callback - Callback.
 */
function getAllDocFiles({ token, lite, callback }) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.GetAll.name,
    callback: ({ error }) => {
      if (error) {
        callback({ error });

        return;
      }

      dbDocFile.getAllDocFiles({
        lite,
        callback,
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

      const authUser = data.user;

      dbDocFile.getDocFileByCode({
        code,
        callback: (docFileData) => {
          if (docFileData.error) {
            callback({ error: docFileData.error });

            return;
          }

          const foundDocFile = docFileData.data.docFile;

          if (foundDocFile.accessLevel > authUser.accessLevel) {
            callback({ error: new errorCreator.NotAllowed({ name: `docFile ${code}` }) });

            return;
          }

          dbDocFile.addAccess({
            docFileId: foundDocFile.docFileId,
            userIds: [authUser.userId],
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
 * @param {string} [params.userId] - Id of the user creating the file.
 */
function getDocFileById({
  docFileId,
  token,
  callback,
  userId,
}) {
  authenticator.isUserAllowed({
    token,
    matchToId: userId,
    commandName: dbConfig.apiCommands.GetDocFile.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      getAccessibleDocFile({
        docFileId,
        callback,
        user: data.user,
      });
    },
  });
}

/**
 * Get a list of doc files that the user can see.
 * @param {Object} params - Parameters.
 * @param {string} params.token - jwt.
 * @param {string} params.userId - ID of the user that is trying to retrieve a list.
 * @param {Function} params.callback - Callback.
 */
function getDocFilesList({
  token,
  userId,
  callback,
}) {
  authenticator.isUserAllowed({
    token,
    matchToId: userId,
    commandName: dbConfig.apiCommands.GetDocFilesList.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      dbDocFile.getDocFilesListByUser({
        user: data.user,
        callback: (listData) => {
          if (listData.error) {
            callback({ error: listData.error });

            return;
          }

          const docFiles = listData.data.docFiles.map((docFile) => {
            const { isPublic } = docFile;

            return {
              isPublic,
              title: docFile.title,
              ownerId: docFile.ownerAliasId || docFile.ownerId,
              code: isPublic || authenticator.hasAccessTo({ toAuth: data.user, objectToAccess: docFile }) ? docFile.code : undefined,
            };
          });

          callback({ data: { docFiles } });
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
 * @param {string} params.userId - ID of the user removing the file
 * @param {Function} params.callback - Callback
 * @param {Object} params.io - Socket io. Will be used if socket is not set.
 * @param {Object} [params.socket] - Socket io.
 */
function removeDocFile({
  docFileId,
  token,
  userId,
  callback,
  socket,
  io,
}) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.RemoveDocFile.commandName,
    matchToId: userId,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      getAccessibleDocFile({
        docFileId,
        user: data.user,
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
                  docFile: { docFileId },
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
 * @param {string} params.userId - Id of the user retrieving the files.
 * @param {Function} params.callback - Callback
 */
function getDocFilesByUser({ token, userId, callback }) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.GetDocFile.commandName,
    matchToId: userId,
    callback: ({ error }) => {
      if (error) {
        callback({ error });

        return;
      }

      dbDocFile.getDocFilesByUser({
        userId,
        callback,
      });
    },
  });
}

exports.createDocFile = createDocFile;
exports.updateDocFile = updateDocFile;
exports.getAllDocFiles = getAllDocFiles;
exports.unlockDocFile = unlockDocFile;
exports.getDocFileById = getDocFileById;
exports.removeDocFile = removeDocFile;
exports.getDocFilesList = getDocFilesList;
exports.getDocFilesByUser = getDocFilesByUser;
