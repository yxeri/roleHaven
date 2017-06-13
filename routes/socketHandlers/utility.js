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
    } else if (textTools.isAlphaNumeric(docFile.docFileId)) {
      callback({ error: new errorCreator.InvalidCharacters({ expected: `alphanumeric ${docFile.docFileId}` }) });

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

          dbDocFile.getDocFile({
            docFileId,
            accessLevel: allowedUser.accessLevel,
            callback: ({ error: getError, data }) => {
              if (getError) {
                callback({ error: getError });

                return;
              } else if (data.docFile.creator !== allowedUser.userName) {
                callback({ error: new errorCreator.NotAllowed({ name: `${allowedUser.userName} updating doc owned by other user` }) });

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

                  callback({ data: { docFile: updateData.docFile } });
                },
              });
            },
          });
        } else {
          docFile.creator = allowedUser.userName;
          docFile.docFileId = docFile.docFileId.toLowerCase();

          dbDocFile.createDocFile({
            docFile,
            callback: ({ error: docError, data }) => {
              if (docError) {
                callback({ error: docError });

                return;
              }

              const { docFile: newDocFile } = data;

              callback({ data: { docFile: newDocFile } });

              if (newDocFile.isPublic) {
                socket.broadcast.emit('docFile', { docFile: newDocFile });
              } else if (newDocFile.team && newDocFile.team !== '') {
                const teamRoom = newDocFile.team + appConfig.teamAppend;

                socket.broadcast.to(teamRoom).emit('docFile', { docFile: newDocFile });
              }
            },
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

        dbDocFile.getDocFile({
          docFileId: docFileId.toLowerCase(),
          accessLevel: allowedUser.accessLevel,
          callback: ({ error: getError, data }) => {
            if (getError) {
              callback({ error: getError });

              return;
            }

            const { docFile } = data;

            if (!docFile.accessUsers || docFile.accessUsers.indexOf(allowedUser.userName) === -1) {
              dbDocFile.addAccessUser({
                docFileId: docFile.docFileId,
                userName: allowedUser.userName,
                callback: ({ error: accessError }) => {
                  if (accessError) {
                    callback({ error: accessError });

                    return;
                  }

                  callback({ data: { docFile } });
                },
              });

              return;
            }

            callback({ data: { docFile } });
          },
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

        dbDocFile.getDocFilesList({
          accessLevel: allowedUser.accessLevel,
          userName: allowedUser.userName,
          callback: ({ error: getError, data }) => {
            if (getError) {
              callback({ error: getError });

              return;
            }

            const { docFiles } = data;

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
          },
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
          callback: ({ error: updateError, data }) => {
            if (updateError) {
              callback({ error: updateError });

              return;
            }

            const { gameCode } = data;

            callback({ data: { gameCode } });
          },
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

        dbGameCode.getGameCodesByUserName({
          owner: allowedUser.userName,
          callback: ({ error: getError, data }) => {
            if (getError) {
              callback({ error: getError });

              return;
            }

            const { gameCodes } = data;

            callback({ data: { gameCodes } });
          },
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

        dbGameCode.getGameCodeByUserName({
          owner: allowedUser.userName,
          codeType,
          callback: ({ error: getError, data }) => {
            if (getError) {
              if (getError.type === errorCreator.ErrorTypes.DOESNOTEXIST) {
                dbGameCode.updateGameCode({
                  codeType,
                  owner: allowedUser.userName,
                  code: generateGameCode(),
                  renewable: codeType === 'profile',
                  callback: ({ error: updateError, data: updateData }) => {
                    if (updateError) {
                      callback({ error: updateError });

                      return;
                    }

                    callback({ data: { gameCode: updateData.gameCode } });
                  },
                });

                return;
              }

              callback({ error: getError });

              return;
            }

            const { gameCode } = data;

            callback({ data: { gameCode } });
          },
        });
      },
    });
  });

  socket.on('useGameCode', ({ code, token }, callback = {}) => {
    if (!objectValidator.isValidData({ code }, { code: true })) {
      callback({ error: new errorCreator.InvalidData({ expected: '{ code }' }) });

      return;
    }

    manager.userIsAllowed({
      token,
      commandName: dbConfig.commands.useGameCode.commandName,
      callback: ({ error, allowedUser }) => {
        if (error) {
          callback({ error: new errorCreator.Database({ errorObject: error, name: 'useGameCode' }) });

          return;
        }

        dbGameCode.getGameCodeByCode({
          code,
          callback: ({ error: codeError, data }) => {
            if (codeError) {
              callback({ error: codeError });

              return;
            } else if (data.gameCode.owner === allowedUser.userName) {
              callback({ error: new errorCreator.NotAllowed({ name: 'useGameCode on yourself' }) });

              return;
            }

            const { gameCode } = data;

            dbGameCode.removeGameCode({
              code: gameCode.code,
              callback: ({ error: removeError }) => {
                if (removeError) {
                  callback({ error: removeError });

                  return;
                }

                const victim = {
                  userName: gameCode.owner,
                  accessLevel: dbConfig.users.system.accessLevel,
                };

                manager.createTransaction({
                  io,
                  transaction: {
                    to: allowedUser.userName,
                    from: gameCode.owner,
                    amount: appConfig.gameCodeAmount,
                  },
                  emitToSender: true,
                  user: victim,
                });

                if (gameCode.renewable) {
                  dbGameCode.updateGameCode({
                    owner: gameCode.owner,
                    code: generateGameCode(),
                    codeType: gameCode.codeType,
                    renewable: true,
                    callback: ({ error: updateError, data: newCodeData }) => {
                      if (updateError) {
                        callback({ error: updateError });

                        return;
                      }

                      callback({ data: { success: true } });

                      dbUser.getUserByAlias({
                        alias: gameCode.owner,
                        callback: ({ error: userError, data: userData }) => {
                          if (userError) {
                            callback({ error: userError });

                            return;
                          }

                          socket.to(userData.user.socketId).emit('gameCode', { gameCode: newCodeData.gameCode });
                        },
                      });
                    },
                  });

                  return;
                }

                callback({ data: { success: true } });
              },
            });
          },
        });
      },
    });
  });
}

exports.handle = handle;
