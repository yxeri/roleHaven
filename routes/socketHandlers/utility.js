/*
 Copyright 2015 Aleksandar Jankovic

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

const manager = require('../../socketHelpers/manager');
const dbConfig = require('../../config/defaults/config').databasePopulation;
const appConfig = require('../../config/defaults/config').app;
const objectValidator = require('../../utils/objectValidator');
const dbDocFile = require('../../db/connectors/docFile');
const errorCreator = require('../../objects/error/errorCreator');
const dbGameCode = require('../../db/connectors/gameCode');
const textTools = require('../../utils/textTools');
const dbUser = require('../../db/connectors/user');

/**
 * Creates game code
 * @returns {string} numerical game code
 */
function generateGameCode() {
  return textTools.shuffleArray(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']).slice(0, 6).join('');
}

/**
 * @param {Object} socket Socket.IO socket
 * @param {Object} io Socket.io
 */
function handle(socket, io) {
  // TODO Not used
  socket.on('time', (params, callback = () => {}) => {
    const now = new Date();
    now.setFullYear(now.getFullYear() + appConfig.yearModification);

    callback({ time: now });
  });

  socket.on('createDocFile', ({ docFile, updateExisting, token }, callback = () => {}) => {
    if (!objectValidator.isValidData({ docFile }, { docFile: { docFileId: true, text: true, title: true } })) {
      callback({ error: new errorCreator.InvalidData({ expected: '{ docFile: { docFileId, text, title } }' }) });

      return;
    } else if (docFile.text.join('').length > appConfig.docFileMaxLength || docFile.title.length > appConfig.docFileTitleMaxLength || docFile.docFileId.length > appConfig.docFileIdMaxLength) {
      callback({ error: new errorCreator.InvalidCharacters({ expected: `text length: ${appConfig.docFileMaxLength}, title length: ${appConfig.docFileTitleMaxLength}, id length: ${appConfig.docFileIdMaxLength}` }) });

      return;
    }

    manager.userIsAllowed({
      token,
      commandName: dbConfig.commands.docFiles.commandName,
      callback: ({ error, allowedUser }) => {
        if (error) {
          callback({ error });

          return;
        }

        if (updateExisting) {
          const { title, text, visibility, isPublic, docFileId } = docFile;

          dbDocFile.getDocFile(docFileId, allowedUser.accessLevel, (err, retrievedDocFile) => {
            if (err) {
              callback({ error: new errorCreator.Database({}) });

              return;
            } else if (retrievedDocFile.creator !== allowedUser.userName) {
              callback({ error: new errorCreator.NotAllowed({ name: 'update not owned doc file' }) });

              return;
            }

            dbDocFile.updateDocFile(docFileId, { title, text, visibility, isPublic }, (updateErr, updatedDocFile) => {
              if (updateErr) {
                callback({ error: new errorCreator.Database({}) });

                return;
              }

              callback({ data: { docFile: updatedDocFile } });
            });
          });
        } else {
          docFile.creator = allowedUser.userName;
          docFile.docFileId = docFile.docFileId.toLowerCase();

          dbDocFile.createDocFile(docFile, (err, newDocFile) => {
            if (err) {
              callback({ error: new errorCreator.Database({}) });

              return;
            } else if (!newDocFile) {
              callback({ error: new errorCreator.AlreadyExists({ name: 'document' }) });

              return;
            }

            callback({ data: { docFile: newDocFile } });

            if (newDocFile.isPublic) {
              socket.broadcast.emit('docFile', { docFile: newDocFile });
            } else if (newDocFile.team && newDocFile.team !== '') {
              const teamRoom = newDocFile.team + appConfig.teamAppend;

              socket.broadcast.to(teamRoom).emit('docFile', { docFile: newDocFile });
            }
          });
        }
      },
    });
  });

  socket.on('getDocFile', ({ docFileId, token }, callback = () => {}) => {
    if (!objectValidator.isValidData({ docFileId }, { docFileId: true })) {
      callback({ error: new errorCreator.InvalidData({ expected: '{ docFileId' }) });

      return;
    }

    manager.userIsAllowed({
      token,
      commandName: dbConfig.commands.getDocFile.commandName,
      callback: ({ error, allowedUser }) => {
        if (error) {
          callback({ error });

          return;
        }

        dbDocFile.getDocFile(docFileId.toLowerCase(), allowedUser.accessLevel, (err, docFile) => {
          if (err) {
            callback({ error: new errorCreator.Database({}) });

            return;
          } else if (!docFile) {
            callback({ error: new errorCreator.DoesNotExist('docFile') });

            return;
          }

          if (!docFile.accessUsers || docFile.accessUsers.indexOf(allowedUser.userName) === -1) {
            dbDocFile.addAccessUser(docFile.docFileId, allowedUser.userName, (accessErr) => {
              if (accessErr) {
                callback({ error: new errorCreator.Database({}) });

                return;
              }

              callback({ data: { docFile } });
            });
          } else {
            callback({ data: { docFile } });
          }
        });
      },
    });
  });

  socket.on('getDocFilesList', ({ token }, callback = () => {}) => {
    manager.userIsAllowed({
      token,
      commandName: dbConfig.commands.getDocFiles.commandName,
      callback: ({ error, allowedUser }) => {
        if (error) {
          callback({ error });

          return;
        }

        dbDocFile.getDocFilesList(allowedUser, (err, docFiles) => {
          if (err) {
            callback({ error: new errorCreator.Database({}) });

            return;
          }

          const filteredDocFiles = docFiles.map((docFile) => {
            const filteredDocFile = docFile;

            if ((docFile.team && allowedUser.team && docFile.team !== allowedUser.team) || (!docFile.isPublic && docFile.creator !== allowedUser.userName)) {
              if (!docFile.accessUsers || docFile.accessUsers.indexOf(allowedUser.userName) === -1) {
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
            if (!docFile.team && docFile.creator !== allowedUser.userName) {
              return true;
            }

            if (docFile.creator === allowedUser.userName) {
              myDocFiles.push(docFile);
            }

            if (docFile.team) {
              if (allowedUser.team && allowedUser.team === docFile.team) {
                myTeamDocFiles.push(docFile);
              } else {
                teamDocFiles.push(docFile);
              }
            }

            return false;
          });

          callback({ data: { myDocFiles, myTeamDocFiles, userDocFiles, teamDocFiles } });
        });
      },
    });
  });

  socket.on('rebootAll', ({ token }, callback = () => {}) => {
    manager.userIsAllowed({
      token,
      commandName: dbConfig.commands.rebootAll.commandName,
      callback: ({ error }) => {
        if (error) {
          callback({ error });

          return;
        }

        socket.broadcast.emit('reboot');
        callback({ data: { success: true } });
      },
    });
  });

  socket.on('createGameCode', ({ codeType, token }, callback = () => {}) => {
    if (!objectValidator.isValidData({ codeType }, { codeType: true })) {
      callback({ error: new errorCreator.InvalidData({ expected: '{ codeType }' }) });

      return;
    } else if (codeType === 'profile') {
      callback({ error: new errorCreator.InvalidData({ expected: 'codeType !== profile' }) });
    }

    manager.userIsAllowed({
      token,
      commandName: dbConfig.commands.createGameCode.commandName,
      callback: ({ error, allowedUser }) => {
        if (error) {
          callback({ error });

          return;
        }

        dbGameCode.updateGameCode({
          codeType,
          owner: allowedUser.userName,
          renewable: false,
          code: generateGameCode(),
        }, (err, newGameCode) => {
          if (err) {
            callback({ error: new errorCreator.Database({}) });

            return;
          }

          callback({ data: { gameCode: newGameCode } });
        });
      },
    });
  });

  socket.on('getGameCodes', ({ codeType, token }, callback = () => {}) => {
    if (!objectValidator.isValidData({ codeType }, { codeType: true })) {
      callback({ error: new errorCreator.InvalidData({ expected: '{ codeType }' }) });

      return;
    }

    manager.userIsAllowed({
      token,
      commandName: dbConfig.commands.getGameCode.commandName,
      callback: ({ error, allowedUser }) => {
        if (error) {
          callback({ error });

          return;
        }

        dbGameCode.getGameCodesByUserName({ owner: allowedUser.userName, codeType }, (err, gameCodes) => {
          if (err) {
            callback({ error: new errorCreator.Database({}) });

            return;
          }

          callback({ data: { gameCodes } });
        });
      },
    });
  });

  socket.on('getGameCode', ({ codeType, token }, callback = () => {}) => {
    if (!objectValidator.isValidData({ codeType }, { codeType: true })) {
      callback({ error: new errorCreator.InvalidData({ expected: '{ codeType }' }) });

      return;
    }

    manager.userIsAllowed({
      token,
      commandName: dbConfig.commands.getGameCode.commandName,
      callback: ({ error, allowedUser }) => {
        if (error) {
          callback({ error });

          return;
        }

        dbGameCode.getGameCodeByUserName({ owner: allowedUser.userName, codeType }, (err, gameCode) => {
          if (err) {
            callback({ error: new errorCreator.Database({}) });

            return;
          }

          if (!gameCode) {
            if (codeType === 'profile') {
              dbGameCode.updateGameCode({
                owner: allowedUser.userName,
                code: generateGameCode(),
                codeType: 'profile',
                renewable: true,
              }, (codeErr, newGameCode) => {
                if (codeErr) {
                  callback({ error: new errorCreator.Database({}) });

                  return;
                }

                callback({ data: { gameCode: newGameCode } });
              });

              return;
            }

            callback({ error: new errorCreator.DoesNotExist({ name: 'game code' }) });

            return;
          }

          callback({ data: { gameCode } });
        });
      },
    });
  });

  socket.on('useGameCode', ({ gameCode, token }, callback = {}) => {
    if (!objectValidator.isValidData({ gameCode }, { gameCode: true })) {
      callback({ error: new errorCreator.InvalidData({ expected: '{ gameCode }' }) });

      return;
    }

    manager.userIsAllowed({
      token,
      commandName: dbConfig.commands.useGameCode.commandName,
      callback: ({ error, allowedUser }) => {
        if (error) {
          callback({ error: new errorCreator.Database({}) });

          return;
        }

        dbGameCode.getGameCodeByCode(gameCode, (err, retrievedGameCode) => {
          if (err) {
            callback({ error: new errorCreator.Database({}) });

            return;
          } else if (!retrievedGameCode) {
            callback({ error: new errorCreator.DoesNotExist({ name: 'gameCode' }) });

            return;
          } else if (retrievedGameCode.owner === allowedUser.userName) {
            callback({ error: new errorCreator.NotAllowed({ name: 'useGameCode on yourself' }) });

            return;
          }

          dbGameCode.removeGameCode(retrievedGameCode.code, (removeErr) => {
            if (removeErr) {
              callback({ error: new errorCreator.Database({}) });

              return;
            }

            const victim = {
              userName: retrievedGameCode.owner,
              accessLevel: dbConfig.users.system.accessLevel,
            };

            manager.createTransaction({
              io,
              transaction: {
                to: allowedUser.userName,
                from: retrievedGameCode.owner,
                amount: appConfig.gameCodeAmount,
              },
              emitToSender: true,
              user: victim,
            });

            if (retrievedGameCode.renewable) {
              dbGameCode.updateGameCode({
                owner: retrievedGameCode.owner,
                code: generateGameCode(),
                codeType: retrievedGameCode.codeType,
                renewable: true,
              }, (updateErr, newGameCode) => {
                if (updateErr) {
                  callback({ error: new errorCreator.Database({}) });

                  return;
                }

                callback({ data: { success: true } });

                dbUser.getUserByAlias(retrievedGameCode.owner, (userErr, retrievedUser) => {
                  if (userErr) {
                    callback({ error: new errorCreator.Database({}) });

                    return;
                  }

                  socket.to(retrievedUser.socketId).emit('gameCode', { gameCode: newGameCode });
                });
              });

              return;
            }

            callback({ data: { success: true } });
          });
        });
      },
    });
  });
}

exports.handle = handle;
