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

const dbUser = require('../../db/connectors/user');
const dbConfig = require('../../config/defaults/config').databasePopulation;
const userManager = require('../../managers/users');
const objectValidator = require('../../utils/objectValidator');
const errorCreator = require('../../objects/error/errorCreator');
const authenticator = require('../../helpers/authenticator');
const roomManager = require('../../managers/rooms');
const aliasManager = require('../../managers/aliases');

dbUser.removeAllUserBlockedBy({ callback: () => {} });

/**
 * @param {object} socket Socket.IO socket
 * @param {object} io Socket.IO
 */
function handle(socket, io) {
  socket.on('sendPasswordReset', ({ userName, token }, callback = () => {}) => {
    userManager.sendPasswordReset({
      token,
      userName,
      callback,
    });
  });

  // socket.on('sendVerification', ({ userName }, callback = () => {}) => {
  // TODO Resend verification
  // if (!objectValidator.isValidData({ mail }, { mail: true })) {
  //   callback({ error: new errorCreator.InvalidData({ expected: '{ mail }' }) });
  //
  //   return;
  // }
  //
  // dbUser.getUserByMail({
  //   mail,
  //   callback: ({ error, data }) => {
  //     if (error) {
  //       callback({ error });
  //
  //       return;
  //     }
  //
  //     const { user } = data;
  //
  //     mailer.sendVerification({
  //       address: mail,
  //       userName: user.userName,
  //       callback: (verificationData) => {
  //         if (verificationData.error) {
  //           callback({ error: verificationData.error });
  //
  //           return;
  //         }
  //
  //         callback({ data: { success: true } });
  //       },
  //     });
  //   },
  // });
  // });

  socket.on('changePassword', ({ key, password }, callback = () => {}) => {
    userManager.changePassword({
      key,
      password,
      callback,
    });
  });

  socket.on('verifyUser', ({ key }, callback = () => {}) => {
    userManager.verifyUser({
      key,
      callback,
      socket,
      io,
    });
  });

  socket.on('register', ({ user }, callback = () => {}) => {
    userManager.createUser({
      user,
      callback,
      origin: 'socket',
    });
  });

  socket.on('updateId', ({ token, device }, callback = () => {}) => {
    if (!objectValidator.isValidData({ token, device }, { token: true, device: { deviceId: true } }, { verbose: false })) {
      callback({ error: new errorCreator.InvalidData({ expected: '{ token, device: { deviceId } }', verbose: false }) });

      return;
    }

    authenticator.isUserAllowed({
      token,
      commandName: dbConfig.apiCommands.UpdateId.name,
      callback: ({ error, data }) => {
        if (error) {
          callback({ error });

          return;
        }

        dbUser.updateUserSocketId({
          userName: data.user.userName,
          socketId: socket.id,
          callback: (userData) => {
            if (userData.error) {
              callback({ error: userData.error });

              return;
            }

            const { user: updatedUser } = userData.data;

            const dataToSend = {
              user: {
                userName: updatedUser.userName,
                accessLevel: updatedUser.accessLevel,
                aliases: updatedUser.aliases,
                team: updatedUser.team,
                shortTeam: updatedUser.shortTeam,
                blockedBy: updatedUser.blockedBy,
              },
            };

            roomManager.joinRooms({
              socket,
              rooms: updatedUser.rooms,
              deviceId: device.deviceId,
            });

            callback({ data: dataToSend });
          },
        });
      },
    });
  });

  socket.on('login', ({ user, device }, callback = () => {}) => {
    userManager.login({
      user,
      device,
      socket,
      io,
      callback,
    });
  });

  socket.on('logout', ({ device, token }, callback = () => {}) => {
    userManager.logout({
      device,
      token,
      socket,
      callback,
    });
  });

  socket.on('ban', ({ user, token }, callback = () => {}) => {
    userManager.banUser({
      user,
      socket,
      io,
      token,
      callback,
    });
  });

  socket.on('getBannedUsers', ({ token }, callback = () => {}) => {
    userManager.getBannedUsers({
      token,
      callback,
    });
  });

  socket.on('matchPartialUser', ({ token, partialName }, callback = () => {}) => {
    userManager.matchPartialUserName({
      partialName,
      token,
      callback,
    });
  });

  // TODO Unused
  socket.on('matchPartialAlias', ({ partialName, token }, callback = () => {}) => {
    aliasManager.matchPartialAlias({
      partialName,
      token,
      callback,
    });
  });

  socket.on('createAlias', ({ alias, token }, callback = () => {}) => {
    aliasManager.createAlias({
      token,
      alias,
      callback,
    });
  });

  socket.on('listAliases', ({ includeInactive, token }, callback = () => {}) => {
    aliasManager.getAllAliases({
      includeInactive,
      token,
      callback,
    });
  });

  socket.on('listUsers', ({ team, includeInactive, token }, callback = () => {}) => {
    userManager.listUsers({
      includeInactive,
      token,
      callback,
      team,
    });
  });
}

exports.handle = handle;
