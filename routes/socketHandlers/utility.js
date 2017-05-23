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
  /**
   * Time command. Returns current date
   * Emits time
   */
  socket.on('time', (params, callback = () => {}) => {
    manager.userIsAllowed(socket.id, dbConfig.commands.time.commandName, (allowErr, allowed) => {
      if (allowErr || !allowed) {
        return;
      }

      const now = new Date();

      now.setFullYear(now.getFullYear() + appConfig.yearModification);
      callback({ time: now });
    });
  });

  socket.on('createDocFile', (docFile, callback = () => {}) => {
    if (!objectValidator.isValidData(docFile, { docFileId: true, text: true, title: true })) {
      callback({ error: new errorCreator.InvalidData({}) });

      return;
    }

    manager.userIsAllowed(socket.id, dbConfig.commands.docFiles.commandName, (allowErr, allowed, user) => {
      if (allowErr) {
        callback({ error: new errorCreator.Database({}) });

        return;
      } else if (!allowed) {
        callback({ error: new errorCreator.NotAllowed({ name: 'createDocFile' }) });

        return;
      }

      docFile.creator = user.userName;
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
    });
  });

  socket.on('updateDocFile', ({ docFileId, title, text, visibility, isPublic }, callback = () => {}) => {
    if (!objectValidator.isValidData({ docFileId }, { docFileId: true })) {
      callback({ error: new errorCreator.InvalidData({ expected: '{ docFileId }' }) });

      return;
    }

    manager.userIsAllowed(socket.id, dbConfig.commands.docFiles.commandName, (allowErr, allowed) => {
      if (allowErr) {
        callback({ error: new errorCreator.Database({}) });

        return;
      } else if (!allowed) {
        callback({ error: new errorCreator.NotAllowed({ name: 'updateDocFile' }) });

        return;
      }

      dbDocFile.updateDocFile(docFileId, { title, text, visibility, isPublic }, (err, docFile) => {
        if (err) {
          callback({ error: new errorCreator.Database({}) });

          return;
        }

        callback({ data: { docFile } });
      });
    });
  });

  socket.on('getDocFile', ({ docFileId }, callback = () => {}) => {
    if (!objectValidator.isValidData({ docFileId }, { docFileId: true })) {
      callback({ error: new errorCreator.InvalidData({}) });

      return;
    }

    manager.userIsAllowed(socket.id, dbConfig.commands.getDocFile.commandName, (allowErr, allowed, user) => {
      if (allowErr || !allowed) {
        callback({ error: new errorCreator.NotAllowed({ used: dbConfig.commands.getDocFile.commandName }) });

        return;
      }

      dbDocFile.getDocFile(docFileId.toLowerCase(), user.accessLevel, (err, docFile) => {
        if (err) {
          callback({ error: new errorCreator.Database({}) });

          return;
        } else if (!docFile) {
          callback({ error: new errorCreator.DoesNotExist('docFile') });

          return;
        }

        if (!docFile.accessUsers || docFile.accessUsers.indexOf(user.userName) === -1) {
          dbDocFile.addAccessUser(docFile.docFileId, user.userName, (accessErr) => {
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
    });
  });

  socket.on('getDocFilesList', (params, callback = () => {}) => {
    manager.userIsAllowed(socket.id, dbConfig.commands.getDocFiles.commandName, (allowErr, allowed, user) => {
      if (allowErr || !allowed) {
        callback({ error: new errorCreator.NotAllowed({ used: dbConfig.commands.getDocFiles.commandName }) });

        return;
      }

      dbDocFile.getDocFilesList(user, (err, docFiles) => {
        if (err) {
          callback({ error: new errorCreator.Database() });

          return;
        }

        const filteredDocFiles = docFiles.map((docFile) => {
          const filteredDocFile = docFile;

          if ((docFile.team && user.team && docFile.team !== user.team) || (!docFile.isPublic && docFile.creator !== user.userName)) {
            if (!docFile.accessUsers || docFile.accessUsers.indexOf(user.userName) === -1) {
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

          if (docFile.creator === user.userName) {
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
      });
    });
  });

  socket.on('rebootAll', () => {
    manager.userIsAllowed(socket.id, dbConfig.commands.rebootAll.commandName, (allowErr, allowed) => {
      if (allowErr || !allowed) {
        return;
      }

      socket.broadcast.emit('reboot');
    });
  });

  socket.on('createGameCode', ({ codeType }, callback = () => {}) => {
    if (!objectValidator.isValidData({ codeType }, { codeType: true })) {
      callback({ error: new errorCreator.InvalidData({ expected: '{ codeType }' }) });

      return;
    }

    manager.userIsAllowed(socket.id, dbConfig.commands.createGameCode.commandName, (allowErr, allowed, user) => {
      if (allowErr) {
        callback({ error: new errorCreator.Database({}) });

        return;
      } else if (!allowed) {
        callback({ error: new errorCreator.NotAllowed({ name: 'createGameCode' }) });

        return;
      } else if (codeType === 'profile') {
        callback({ error: new errorCreator.NotAllowed({ name: 'createGameCode profile' }) });
      }

      dbGameCode.updateGameCode({
        owner: user.userName,
        renewable: false,
        code: generateGameCode(),
        codeType,
      }, (err, newGameCode) => {
        if (err) {
          callback({ error: new errorCreator.Database({}) });

          return;
        }

        callback({ data: { gameCode: newGameCode } });
      });
    });
  });

  socket.on('getGameCodes', ({ codeType }, callback = () => {}) => {
    if (!objectValidator.isValidData({ codeType }, { codeType: true })) {
      callback({ error: new errorCreator.InvalidData({ expected: '{ codeType }' }) });

      return;
    }

    manager.userIsAllowed(socket.id, dbConfig.commands.getGameCode.commandName, (allowErr, allowed, user) => {
      if (allowErr) {
        callback({ error: new errorCreator.Database({}) });

        return;
      } else if (!allowed) {
        callback({ error: new errorCreator.NotAllowed({ name: 'getGameCodes' }) });

        return;
      }

      dbGameCode.getGameCodesByUserName({ owner: user.userName, codeType }, (err, gameCodes) => {
        if (err) {
          callback({ error: new errorCreator.Database({}) });

          return;
        }

        callback({ data: { gameCodes } });
      });
    });
  });

  socket.on('getGameCode', ({ codeType }, callback = () => {}) => {
    if (!objectValidator.isValidData({ codeType }, { codeType: true })) {
      callback({ error: new errorCreator.InvalidData({ expected: '{ codeType }' }) });

      return;
    }

    manager.userIsAllowed(socket.id, dbConfig.commands.getGameCode.commandName, (allowErr, allowed, user) => {
      if (allowErr) {
        callback({ error: new errorCreator.Database({}) });

        return;
      } else if (!allowed) {
        callback({ error: new errorCreator.NotAllowed({ name: 'getGameCode' }) });

        return;
      }

      dbGameCode.getGameCodeByUserName({ owner: user.userName, codeType }, (err, gameCode) => {
        if (err) {
          callback({ error: new errorCreator.Database({}) });

          return;
        } else if (!gameCode) {
          if (codeType === 'profile') {
            dbGameCode.updateGameCode({ owner: user.userName, code: generateGameCode(), codeType: 'profile', renewable: true }, (codeErr, newGameCode) => {
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
    });
  });

  socket.on('useGameCode', ({ gameCode }, callback = {}) => {
    if (!objectValidator.isValidData({ gameCode }, { gameCode: true })) {
      callback({ error: new errorCreator.InvalidData({ expected: '{ gameCode }' }) });

      return;
    }

    manager.userIsAllowed(socket.id, dbConfig.commands.useGameCode.commandName, (allowErr, allowed, user) => {
      if (allowErr) {
        callback({ error: new errorCreator.Database({}) });

        return;
      } else if (!allowed) {
        callback({ error: new errorCreator.NotAllowed({ name: 'useGameCode' }) });

        return;
      }

      dbGameCode.getGameCodeByCode(gameCode, (err, retrievedGameCode) => {
        if (err) {
          callback({ error: new errorCreator.Database({}) });

          return;
        } else if (!retrievedGameCode) {
          callback({ error: new errorCreator.DoesNotExist({ name: 'gameCode' }) });

          return;
        } else if (retrievedGameCode.owner === user.userName) {
          callback({ error: new errorCreator.NotAllowed({ name: 'useGameCode on yourself' }) });

          return;
        }

        dbGameCode.removeGameCode(retrievedGameCode.code, (removeErr) => {
          if (removeErr) {
            callback({ error: new errorCreator.Database({}) });

            return;
          }

          const victim = { userName: retrievedGameCode.owner, accessLevel: dbConfig.users.system.accessLevel };

          manager.createTransaction({
            transaction: {
              to: user.userName,
              from: retrievedGameCode.owner,
              amount: appConfig.gameCodeAmount,
            },
            emitToSender: true,
            user: victim,
            io,
          });

          if (retrievedGameCode.renewable) {
            dbGameCode.updateGameCode({ owner: retrievedGameCode.owner, code: generateGameCode(), codeType: retrievedGameCode.codeType, renewable: true }, (updateErr, newGameCode) => {
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
    });
  });
}

exports.handle = handle;
