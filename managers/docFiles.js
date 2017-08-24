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

/**
 * Create a docFile
 * @param {Object} params.user User creating doc file
 * @param {Object} params.docFile DocFile to create
 * @param {string} [params.customCreator] Custom creator name that will be shown instead of default creator
 * @param {string} params.userName Creator user name
 * @param {Object} [params.socket] Socket io
 * @param {Object} params.io Socket io. Will be used if socket is not set
 * @param {Function} params.callback Callback
 */
function createDocFile({ token, userName, socket, io, docFile, callback }) {
  authenticator.isUserAllowed({
    token,
    matchNameTo: userName,
    commandName: dbConfig.apiCommands.CreateDocFile.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      } else if (docFile.customCreator && docFile.customCreator !== data.user.userName && data.user.creatorAliases.indexOf(docFile.customCreator) === -1 && data.user.aliases.indexOf(docFile.customCreator) === -1) {
        callback({ error: new errorCreator.NotAllowed({ name: 'custom creator' }) });

        return;
      } else if (!objectValidator.isValidData({ docFile }, { docFile: { docFileId: true, text: true, title: true } })) {
        callback({ error: new errorCreator.InvalidData({ expected: '{ docFile: { docFileId, text, title } }' }) });

        return;
      } else if (!textTools.isAlphaNumeric(docFile.docFileId)) {
        callback({ error: new errorCreator.InvalidCharacters({ expected: `alphanumeric ${docFile.docFileId}` }) });

        return;
      } else if (docFile.text.join('').length > appConfig.docFileMaxLength || docFile.text.join('') === '') {
        callback({ error: new errorCreator.InvalidCharacters({ expected: `Text length: ${appConfig.docFileMaxLength}.` }) });

        return;
      } else if (docFile.title.length > appConfig.docFileTitleMaxLength || docFile.title === '') {
        callback({ error: new errorCreator.InvalidCharacters({ expected: `Title length: ${appConfig.docFileTitleMaxLength}` }) });

        return;
      } else if (docFile.docFileId.length > appConfig.docFileIdMaxLength || docFile.docFileId === '') {
        callback({ error: new errorCreator.InvalidCharacters({ expected: `Id length: ${appConfig.docFileIdMaxLength}` }) });

        return;
      }

      const newDocFile = docFile;
      newDocFile.creator = data.user.userName;
      newDocFile.docFileId = newDocFile.docFileId.toLowerCase();

      if (docFile.customCreator) {
        newDocFile.customCreator = docFile.customCreator;
        newDocFile.accessUsers = [newDocFile.creator];
      }

      dbDocFile.createDocFile({
        docFile: newDocFile,
        callback: (createData) => {
          if (createData.error) {
            callback({ error: createData.error });

            return;
          }

          callback({ data: { docFile: createData.data.docFile } });

          const docFileToSend = createData.data.docFile;

          if (!docFileToSend.isPublic) {
            docFileToSend.docFileId = null;
          }

          if (socket) {
            socket.broadcast.emit('docFile', { data: { docFile: docFileToSend } });
          } else {
            io.emit('docFile', { data: { docFile: docFileToSend } });
          }
        },
      });
    },
  });
}

/**
 * Update existing docFile
 * @param {Object} params.docFile Doc file changes
 * @param {Object} [params.socket] Socket io
 * @param {string} params.userName Creator user name
 * @param {Object} params.io Socket io. Will be used if socket is undefined
 * @param {Object} params.user User that is updating docFile
 * @param {Function} params.callback Callback
 */
function updateDocFile({ docFile, socket, io, token, userName, callback }) {
  authenticator.isUserAllowed({
    token,
    matchNameTo: userName,
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

      const user = data.user;
      const { docFileId = docFile.docFileId.toLowerCase(), title, text, visibility, isPublic } = docFile;

      dbDocFile.getDocFile({
        docFileId,
        user,
        accessLevel: user.accessLevel,
        callback: ({ error: getError, data: foundData }) => {
          if (getError) {
            callback({ error: getError });

            return;
          } else if (foundData.docFile.creator !== user.userName) {
            callback({ error: new errorCreator.NotAllowed({ name: `${user.userName} updating doc owned by other user` }) });

            return;
          }

          dbDocFile.updateDocFile({
            docFileId,
            title,
            text,
            visibility,
            isPublic,
            callback: ({ error: updateError, data: updateData }) => {
              if (updateError) {
                callback({ error: updateError });

                return;
              }

              const dataToSend = updateData;
              dataToSend.updating = true;

              if (socket) {
                socket.broadcast.emit('docFile', { data: dataToSend });
              } else {
                io.emit('docFile', { data: dataToSend });
              }

              callback({ data: dataToSend });
            },
          });
        },
      });
    },
  });
}

/**
 * Get all doc files
 * @param {string} params.token jwt
 * @param {Function} params.callback Callback
 */
function getAllDocFiles({ token, callback }) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.GetDocFile.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const user = data.user;

      dbDocFile.getDocFiles({
        accessLevel: user.accessLevel,
        userName: user.userName,
        creatorAliases: user.creatorAliases,
        callback: ({ error: getError, data: docData }) => {
          if (getError) {
            callback({ error: getError });

            return;
          }

          const docFiles = docData.docFiles;

          const filteredDocFiles = docFiles.map((docFile) => {
            const filteredDocFile = docFile;

            if ((docFile.team && user.team && docFile.team !== user.team) || (!docFile.isPublic && docFile.creator !== user.userName && user.creatorAliases.indexOf(docFile.customCreator) === -1)) {
              if (docFile.accessUsers.indexOf(user.userName) === -1) {
                filteredDocFile.docFileId = null;
                filteredDocFile.isLocked = true;
              }
            }

            return filteredDocFile;
          });

          const myDocFiles = [];
          const myTeamDocFiles = [];
          const teamDocFiles = [];
          const userDocFiles = filteredDocFiles.filter((docFile) => {
            if (!docFile.team && docFile.creator !== user.userName) {
              return true;
            }

            if (docFile.creator === user.userName || user.creatorAliases.indexOf(docFile.customCreator) > -1) {
              myDocFiles.push(docFile);
            }

            if (docFile.team) {
              if (user.team && user.team === docFile.team) {
                myTeamDocFiles.push(docFile);
              } else {
                teamDocFiles.push(docFile);
              }
            }

            return false;
          });

          callback({ data: { myDocFiles, myTeamDocFiles, userDocFiles, teamDocFiles } });
        },
      });
    },
  });
}

/**
 * Get DocFiles
 * @param {string} params.token jwt
 * @param {Function} params.callback Callback
 */
function getDocFiles({ token, callback }) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.GetDocFile.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const user = data.user;

      dbDocFile.getDocFiles({
        accessLevel: user.accessLevel,
        userName: user.userName,
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
 * Get doc file by team
 * @param {string} [params.title] Title of the doc file. Will be used together with team name
 * @param {string} [params.docFileId] ID of Docfile to retrieve
 * @param {string} params.token jwt
 * @param {Function} params.callback Callback
 */
function getDocFile({ title, docFileId, token, callback }) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.GetDocFile.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      } else if (!objectValidator.isValidData({ docFileId }, { docFileId: true })) {
        callback({ error: new errorCreator.InvalidData({ expected: '{ docFile }' }) });

        return;
      }

      dbDocFile.getDocFile({
        docFileId,
        title,
        user: data.user,
        callback: ({ error: docError, data: docData }) => {
          if (docError) {
            callback({ error: docError });

            return;
          }

          if (!data.user.isAnonymous && docData.docFile.accessUsers.indexOf(data.user.userName) === -1) {
            dbDocFile.addAccessUser({
              docFileId: docData.docFile.docFileId,
              userName: data.user.userName,
              callback: ({ error: accessError }) => {
                if (accessError) {
                  callback({ error: accessError });

                  return;
                }

                callback({ data: docData });
              },
            });

            return;
          }

          callback({ data: docData });
        },
      });
    },
  });
}

exports.createDocFile = createDocFile;
exports.updateDocFile = updateDocFile;
exports.getDocFiles = getDocFiles;
exports.getDocFile = getDocFile;
exports.getAllDocFiles = getAllDocFiles;
