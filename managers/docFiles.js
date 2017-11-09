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
 * Does user have access to docFile?
 * @private
 * @param {Object} params - Parameter
 * @param {Object} params.user - User to auth
 * @param {Object} params.docFile - DocFile to check against
 * @param {Function} params.callback - Callback
 */
function hasAccessToDocFile({ user, docFile, callback }) {
  authenticator.hasAccessTo({
    objectToAccess: docFile,
    toAuth: { userId: user.userId, teamIds: user.partOfTeams, accessLevel: user.accessLevel },
    callback: (accessData) => {
      if (accessData.error) {
        callback({ error: accessData.error });

        return;
      }

      callback({ data: { docFile } });
    },
  });
}

/**
 * Saves doc file to database and transmits it to sockets
 * @private
 * @param {Object} params - Parameters
 * @param {Object} params.docFile - Doc file to save
 * @param {Function} params.callback - Callback
 * @param {Object} params.socket - Socket.io
 * @param {Object} params.io - Socket.io. Used if socket is not set
 */
function saveAndTransmitDocFile({ docFile, callback, socket, io }) {
  dbDocFile.createDocFile({
    docFile,
    callback: (createData) => {
      if (createData.error) {
        callback({ error: createData.error });

        return;
      }

      const docFileToSend = createData.data.docFile;

      callback({ data: { docFile: createData.data.docFile } });

      if (socket) {
        socket.broadcast.emit('docFile', { data: { docFile: docFileToSend } });
      } else {
        io.emit('docFile', { data: { docFile: docFileToSend } });
      }
    },
  });
}

/**
 * Create a docFile
 * @param {Object} params - Parameters
 * @param {Object} params.docFile - DocFile to create
 * @param {string} params.userId - ID of the creator. Will default to socket user
 * @param {Object} [params.socket] - Socket io
 * @param {Object} params.io - Socket io. Will be used if socket is not set
 * @param {Function} params.callback - Callback
 */
function createDocFile({ token, socket, io, docFile, callback, userId }) {
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
      } else if (!textTools.isAlphaNumeric(docFile.code) || docFile.code.length > appConfig.docFileCodeMaxLength || docFile.code === '') {
        callback({ error: new errorCreator.InvalidCharacters({ expected: `Alphanumeric ${docFile.code}. ID length: ${appConfig.docFileCodeMaxLength}` }) });

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

      if (newDocFile.teamId) { newDocFile.teamIds = [data.user.teamId]; }

      if (docFile.ownerAliasId) {
        aliasManager.getAlias({
          token,
          userId: authUser.userId,
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
      } else {
        saveAndTransmitDocFile({
          socket,
          io,
          callback,
          docFile: newDocFile,
        });
      }
    },
  });
}

/**
 * Update existing docFile
 * @param {Object} params - Parameters
 * @param {Object} params.docFile - Doc file changes
 * @param {Object} [params.socket] - Socket io
 * @param {string} params.userId - ID of the creator
 * @param {Object} params.io - Socket io. Will be used if socket is undefined
 * @param {Function} params.callback - Callback
 */
function updateDocFile({ docFile, socket, io, token, userId, callback }) {
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

      const authUser = data.user;

      dbDocFile.getDocFileById({
        lite: true,
        docFileId: docFile.docFileId,
        callback: (docFileData) => {
          if (docFileData.error) {
            callback({ error: docFileData.error });

            return;
          }

          hasAccessToDocFile({
            docFile: docFileData.data.docFile,
            user: authUser,
            callback: (accessData) => {
              if (accessData.error) {
                callback({ error: accessData.error });

                return;
              }

              dbDocFile.updateDocFile({
                docFile,
                callback: ({ error: updateError, data: updateData }) => {
                  if (updateError) {
                    callback({ error: updateError });

                    return;
                  }

                  const { code, title, ownerId, isPublic } = updateData.docFile;

                  const dataToSend = {
                    docFile: {
                      title,
                      ownerId,
                      isPublic,
                      code: isPublic ? code : undefined,
                    },
                  };

                  if (socket) {
                    socket.broadcast.emit('docFile', { data: dataToSend });
                  } else {
                    io.emit('docFile', { data: dataToSend });
                  }

                  callback({ data: updateData });
                },
              });
            },
          });
        },
      });
    },
  });
}

/**
 * Get all doc files
 * @param {Object} params - Parameters
 * @param {string} params.token - jwt
 * @param {boolean} [params.lite] - Should parameters storing a lot of data be filtered?
 * @param {Function} params.callback - Callback
 */
function getAllDocFiles({ token, lite, callback }) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.GetDocFile.name,
    callback: ({ error }) => {
      if (error) {
        callback({ error });

        return;
      }

      dbDocFile.getAllDocFiles({
        lite,
        callback: ({ error: getError, data: docData }) => {
          if (getError) {
            callback({ error: getError });

            return;
          }

          callback({ data: { docFiles: docData.docFiles } });
        },
      });
    },
  });
}

/**
 * Get DocFiles that the user, including teams that the user is part of, has access to
 * @param {Object} params - Parameters
 * @param {string} params.token jwt
 * @param {Function} params.callback Callback
 */
function getDocFilesByUser({ token, callback }) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.GetDocFile.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const user = data.user;

      dbDocFile({
        accessLevel: user.accessLevel,
        username: user.username,
        callback: ({ error: docError, data: docData }) => {
          if (docError) {
            callback({ error: docError });

            return;
          }

          callback({ data: docData });
        },
      });
    },
  });
}

/**
 * Get doc file by code
 * @param {Object} params - Parameters
 * @param {string} params.code - Doc file Code
 * @param {string} params.token - jwt
 * @param {Function} params.callback - Callback
 */
function unlockDocFileByCode({ code, token, callback }) {
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

          const docFile = docFileData.data.docFile;

          if (docFile.accessLevel > authUser.accessLevel) {
            callback({ error: new errorCreator.NotAllowed({ name: `docFile ${code}` }) });

            return;
          }

          dbDocFile.addAccess({
            docFileId: docFile.docFileId,
            userIds: [authUser.userId],
            callback: (accessData) => {
              if (accessData.error) {
                callback({ error: accessData.error });

                return;
              }

              callback({ data: { docFile } });
            },
          });
        },
      });
    },
  });
}

/**
 * Get doc file by id or code
 * @param {Object} params - Parameters
 * @param {string} [params.docFileId] - ID of Docfile to retrieve
 * @param {string} params.token - jwt
 * @param {Function} params.callback - Callback
 */
function getDocFileById({ docFileId, token, callback }) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.GetDocFile.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const authUser = data.user;

      dbDocFile.getDocFileById({
        docFileId,
        user: data.user,
        callback: ({ error: docError, data: docData }) => {
          if (docError) {
            callback({ error: docError });

            return;
          }

          hasAccessToDocFile({
            callback,
            user: authUser,
            docFile: docData.data.docFile,
          });
        },
      });
    },
  });
}

exports.createDocFile = createDocFile;
exports.updateDocFile = updateDocFile;
exports.getAllDocFiles = getAllDocFiles;
exports.getDocFilesByUser = getDocFilesByUser;
exports.getDocFileByCode = unlockDocFileByCode;
exports.getDocFileById = getDocFileById;
