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

const dbConnector = require('../../db/databaseConnector');
const dbRoom = require('../../db/connectors/room');
const dbUser = require('../../db/connectors/user');
const dbDevice = require('../../db/connectors/device');
const manager = require('../../socketHelpers/manager');
const databasePopulation = require('../../config/defaults/config').databasePopulation;
const appConfig = require('../../config/defaults/config').app;
const logger = require('../../utils/logger');
const messenger = require('../../socketHelpers/messenger');
const objectValidator = require('../../utils/objectValidator');
const fs = require('fs');
const errorCreator = require('../../objects/error/errorCreator');
const textTools = require('../../utils/textTools');

/**
 * Follow a new room on the socket
 * @param {Object} params - Parameters
 * @param {Object} params.socket - Socket.IO socket
 * @param {Object} params.room - New room to follow
 * @param {string} params.userName - Name of the new user following the room
 * @param {Function} params.callback - Callback
 */
function followRoom({ socket, room, userName, callback }) {
  const roomName = room.roomName;

  if (Object.keys(socket.rooms).indexOf(roomName) < 0) {
    messenger.sendMsg({
      socket,
      message: {
        userName: 'SYSTEM',
        text: [`${userName} started following ${roomName}`],
        text_se: [`${userName} började följa ${roomName}`],
        roomName,
      },
      sendTo: roomName,
    });
  }

  socket.join(roomName);
  callback({ data: { room } });
}

/**
 * Should the room be hidden?
 * @static
 * @param {string} room - Room name
 * @param {string} socketId - ID of the socket
 * @returns {boolean} Should the room be hidden?
 */
function shouldBeHidden(room, socketId) {
  const hiddenRooms = [
    socketId,
    databasePopulation.rooms.bcast.roomName,
  ];

  return hiddenRooms.indexOf(room) >= 0 || room.indexOf(appConfig.whisperAppend) >= 0 || room.indexOf(appConfig.deviceAppend) >= 0 || room.indexOf(appConfig.teamAppend) >= 0;
}

/**
 * @param {object} socket - Socket.IO socket
 * @param {object} io - Socket.IO
 */
function handle(socket, io) {
  socket.on('chatMsg', ({ message, image }, callback = () => {}) => {
    if (!objectValidator.isValidData({ message }, { message: { text: true, roomName: true } })) {
      callback({ error: {} });

      return;
    }

    message.text = textTools.cleanText(message.text);

    manager.userIsAllowed(socket.id, databasePopulation.commands.msg.commandName, (allowErr, allowed, user) => {
      if (allowErr || !allowed) {
        callback({ error: {} });

        return;
      }

      if (image && image.imageName && image.source.match(/^data:image\/((png)|(jpeg));base64,/)) {
        const fileName = `${new Buffer(user.userName).toString('base64')}-${appConfig.mode}-${image.imageName.replace(/[^\w.]/g, '-')}`;

        fs.writeFile(`${appConfig.publicBase}/images/${fileName}`, image.source.replace(/data:image\/((png)|(jpeg));base64,/, ''), { encoding: 'base64' }, (err) => {
          if (err) {
            callback({ error: err || {} });

            return;
          }

          const chatMsg = message;
          chatMsg.image = {
            imageName: image.imageName,
            fileName,
            width: image.width,
            height: image.height,
          };

          messenger.sendChatMsg({ user, callback, message: chatMsg, io, socket });
        });
      } else {
        messenger.sendChatMsg({ user, callback, message, io, socket });
      }
    });
  });

  socket.on('whisperMsg', ({ message }, callback = () => {}) => {
    if (!objectValidator.isValidData({ message }, { message: { text: true, roomName: true, userName: true } })) {
      callback({ error: {} });

      return;
    }

    message.text = textTools.cleanText(message.text);

    manager.userIsAllowed(socket.id, databasePopulation.commands.whisper.commandName, (allowErr, allowed, user) => {
      if (allowErr || !allowed) {
        callback({ error: {} });

        return;
      }


      messenger.sendWhisperMsg({ socket, callback, message, user, io });
    });
  });

  // TODO Unused
  socket.on('broadcastMsg', (params, callback = () => {}) => {
    if (!objectValidator.isValidData(params, { message: { text: true } })) {
      callback({ error: {} });

      return;
    }

    manager.userIsAllowed(socket.id, databasePopulation.commands.broadcast.commandName, (allowErr, allowed, user) => {
      if (allowErr || !allowed) {
        callback({ error: {} });

        return;
      }

      const message = params.message;
      message.userName = user.userName;

      messenger.sendBroadcastMsg({ socket, message, callback });
    });
  });

  socket.on('createRoom', ({ room }, callback = () => {}) => {
    if (!objectValidator.isValidData({ room }, { room: { roomName: true } })) {
      callback({ error: {} });

      return;
    }

    manager.userIsAllowed(socket.id, databasePopulation.commands.createroom.commandName, (allowErr, allowed, user) => {
      if (allowErr || !allowed || !user) {
        callback({ error: {} });

        return;
      }

      room.owner = user.userName;
      room.roomName = room.roomName.toLowerCase();

      manager.createRoom(room, user, (createErr, createdRoom) => {
        if (createErr) {
          logger.sendSocketErrorMsg({
            socket,
            code: logger.ErrorCodes.db,
            text: ['Failed to create room'],
            text_se: ['Lyckades inte skapa rummet'],
            err: createErr,
          });
          callback({ error: {} });

          return;
        } else if (!createdRoom) {
          callback({});

          return;
        }

        followRoom({ socket, userName: user.userName, room: createdRoom, callback, io });
      });
    });
  });

  socket.on('authUserToRoom', ({ room }, callback = () => {}) => {
    if (!objectValidator.isValidData({ room }, { room: { roomName: true } })) {
      callback({ error: {} });

      return;
    }

    manager.userIsAllowed(socket.id, databasePopulation.commands.history.commandName, (allowErr, allowed, user) => {
      if (allowErr || !allowed || !user) {
        callback({ error: {} });

        return;
      }

      dbRoom.getRoom(room.roomName, user, (error, retrievedRoom) => {
        if (error) {
          callback({ error: {} });

          return;
        } else if (!retrievedRoom || Object.keys(socket.rooms).indexOf(retrievedRoom.roomName) === -1) {
          callback({ data: { allowed: false, room: retrievedRoom } });

          return;
        }

        callback({ data: { allowed: true, room: retrievedRoom } });
      });
    });
  });

  socket.on('followWhisper', ({ room }, callback = () => {}) => {
    if (!objectValidator.isValidData({ room }, { room: { roomName: true } })) {
      callback({ error: new errorCreator.Database() });

      return;
    }

    manager.userIsAllowed(socket.id, databasePopulation.commands.follow.commandName, (allowErr, allowed, user) => {
      if (allowErr || !allowed || !user) {
        callback({ error: new errorCreator.Database() });

        return;
      }

      dbUser.addWhisperRoomToUser(user.userName, room.roomName, (dbErr) => {
        if (dbErr) {
          callback({ error: new errorCreator.Database() });

          return;
        }

        callback({ data: { room } });
      });
    });
  });

  socket.on('unfollowWhisper', ({ room }, callback = () => {}) => {
    if (!objectValidator.isValidData({ room }, { room: { roomName: true } })) {
      callback({ error: new errorCreator.Database() });

      return;
    }

    manager.userIsAllowed(socket.id, databasePopulation.commands.unfollow.commandName, (allowErr, allowed, user) => {
      if (allowErr || !allowed || !user) {
        callback({ error: new errorCreator.Database() });

        return;
      }

      dbUser.removeWhisperRoomFromUser(user.userName, room.roomName, (dbErr) => {
        if (dbErr) {
          callback({ error: new errorCreator.Database() });

          return;
        }

        callback({ data: { room } });
      });
    });
  });

  // TODO Duplicate code in rest api
  socket.on('follow', ({ room }, callback = () => {}) => {
    if (!objectValidator.isValidData({ room }, { room: { roomName: true } })) {
      callback({ error: {} });

      return;
    }

    manager.userIsAllowed(socket.id, databasePopulation.commands.follow.commandName, (allowErr, allowed, user) => {
      if (allowErr || !allowed || !user) {
        callback({ error: {} });

        return;
      }

      const modifiedRoom = room;
      modifiedRoom.roomName = room.roomName.toLowerCase();

      if (room.password === undefined) {
        modifiedRoom.password = '';
      }

      dbRoom.authUserToRoom(user, modifiedRoom.roomName, modifiedRoom.password, (err, authRoom) => {
        if (err || authRoom === null) {
          callback({
            error: {
              code: logger.ErrorCodes.db,
              text: [`You are not authorized to join ${modifiedRoom.roomName}`],
              text_se: [`Ni har inte tillåtelse att gå in i rummet ${modifiedRoom.roomName}`],
            },
          });

          return;
        }

        dbUser.addRoomToUser(user.userName, modifiedRoom.roomName, (roomErr) => {
          if (roomErr) {
            callback({
              error: {
                code: logger.ErrorCodes.db,
                text: [`Failed to follow ${modifiedRoom.roomName}`],
              },
            });
            logger.sendErrorMsg({
              code: logger.ErrorCodes.db,
              text: [`Failed to follow ${modifiedRoom.roomName}`],
              err: roomErr,
            });

            return;
          }

          followRoom({ socket, userName: user.userName, room: modifiedRoom, callback, io });
        });
      });
    });
  });

  // TODO Unused
  socket.on('unfollow', ({ room }, callback = () => {}) => {
    if (!objectValidator.isValidData({ room }, { room: { roomName: true } })) {
      callback({ error: {} });

      return;
    }

    manager.userIsAllowed(socket.id, databasePopulation.commands.unfollow.commandName, (allowErr, allowed, user) => {
      if (allowErr || !allowed || !user) {
        callback({ error: {} });

        return;
      }

      // TODO Move toLowerCase to class
      const roomName = room.roomName.toLowerCase();

      if (Object.keys(socket.rooms).indexOf(roomName) > -1) {
        const userName = user.userName;

        /*
         * User should not be able to unfollow its own room
         * That room is for private messaging between users
         */
        if (roomName !== userName) {
          dbUser.removeRoomFromUser(userName, roomName, (err, removedUser) => {
            if (err || removedUser === null) {
              callback({ error: {} });

              return;
            }

            messenger.sendMsg({
              socket,
              message: {
                roomName,
                text: [`${userName} left ${roomName}`],
                text_se: [`${userName} lämnade ${roomName}`],
                userName: 'SYSTEM',
              },
              sendTo: roomName,
            });
            socket.leave(roomName);
            callback({ data: { room } });
          });
        }
      } else {
        // TODO Should send error object
        callback({
          message: {
            text: [`You are not following ${roomName}`],
            text_se: [`Ni följer inte ${roomName}`],
          },
        });
      }
    });
  });

  // Shows all available rooms
  socket.on('listRooms', (params, callback = () => {}) => {
    manager.userIsAllowed(socket.id, databasePopulation.commands.getRooms.commandName, (allowErr, allowed, user) => {
      if (allowErr || !allowed || !user) {
        callback({ error: new errorCreator.NotAllowed({ used: databasePopulation.commands.getRooms.commandName }) });

        return;
      }

      dbRoom.getAllRooms(user, (roomErr, rooms) => {
        if (roomErr) {
          logger.sendErrorMsg({
            code: logger.ErrorCodes.db,
            text: ['Failed to get all room names'],
            err: roomErr,
          });

          callback({ error: {} });

          return;
        }

        const socketRooms = Object.keys(socket.rooms);
        const roomNames = rooms.filter(room => socketRooms.indexOf(room.roomName) < 0).map(room => room.roomName);
        const followedNames = socketRooms.filter(roomName => !shouldBeHidden(roomName, socket.id));

        if (user.userName === '') {
          callback({ data: { rooms: roomNames, followedRooms: followedNames } });
        } else {
          if (user.team) {
            followedNames.push('team');
          }

          dbRoom.getOwnedRooms(user, (err, ownedRooms) => {
            if (err || !ownedRooms || ownedRooms === null) {
              logger.sendErrorMsg({
                code: logger.ErrorCodes.db,
                text: ['Failed to get owned rooms'],
                err,
              });
              callback({ error: new errorCreator.Database() });

              return;
            }

            const ownedNames = ownedRooms.map(room => room.roomName);

            callback({ data: { rooms: roomNames, followedRooms: followedNames, ownedRooms: ownedNames, whisperRooms: user.whisperRooms || [] } });
          });
        }
      });
    });
  });

  socket.on('listUsers', (params, callback = () => {}) => {
    manager.userIsAllowed(socket.id, databasePopulation.commands.list.commandName, (allowErr, allowed, user) => {
      if (allowErr || !allowed || !user) {
        callback({ error: {} });

        return;
      }

      dbUser.getAllUsers(user, (userErr, users) => {
        if (userErr || users === null) {
          logger.sendErrorMsg({
            code: logger.ErrorCodes.db,
            text: ['Failed to get all users'],
            err: userErr,
          });

          callback({ error: {} });

          return;
        }

        const offlineUsers = [];
        const onlineUsers = [];

        for (let i = 0; i < users.length; i += 1) {
          const currentUser = users[i];

          if ((!appConfig.userVerify || currentUser.verified) && !currentUser.banned) {
            const aliases = currentUser.aliases;

            if (currentUser.online) {
              onlineUsers.push(currentUser.userName);
            } else {
              offlineUsers.push(currentUser.userName);
            }

            if (aliases && aliases.length > 0) {
              if (currentUser.online) {
                Array.prototype.push.apply(onlineUsers, aliases);
              } else {
                Array.prototype.push.apply(offlineUsers, aliases);
              }
            }
          }
        }

        callback({ data: { onlineUsers, offlineUsers } });
      });
    });
  });

  /**
   * Get history for one to many rooms
   * @param {Object} params - Parameters
   * @param {Object} [params.room] - Room to retrieve history from. Will retrieve from all rooms if not set
   * @param {Date} [params.startDate] - Start date of retrieval
   * @param {number} [params.lines] - Number of lines to retrieve
   * @param {string} [params.whisperTo] - User name that is whispered to
   */
  socket.on('history', ({ room, startDate, lines, whisperTo }, callback = () => {}) => {
    manager.userIsAllowed(socket.id, databasePopulation.commands.history.commandName, (allowErr, allowed, user) => {
      if (allowErr || !allowed) {
        callback({ error: new errorCreator.NotAllowed({ used: databasePopulation.commands.history.commandName }) });

        return;
      }

      const getHistory = () => {
        const allRooms = room ? [room.roomName] : Object.keys(socket.rooms);
        const historyLines = lines > appConfig.maxHistoryLines ? appConfig.maxHistoryLines : lines;

        manager.getHistory({
          rooms: allRooms,
          lines: historyLines,
          missedMsgs: false,
          lastOnline: startDate || new Date(),
          whisperTo,
          callback: (histErr, historyMessages = [], anonymous) => {
            if (histErr) {
              callback({ error: {} });

              return;
            }

            const data = {
              following: room && Object.keys(socket.rooms).indexOf(room.roomName) > -1,
            };

            if (anonymous) {
              data.messages = historyMessages.map((message) => {
                const modifiedMessage = message;
                modifiedMessage.time = new Date();
                modifiedMessage.time.setHours(0);
                modifiedMessage.time.setMinutes(0);
                modifiedMessage.time.setSeconds(0);
                modifiedMessage.userName = 'anonymous';

                return modifiedMessage;
              });
            } else {
              data.messages = historyMessages;
            }

            callback({ data });
          },
        });
      };

      if (user && user.team && room.roomName === 'team') {
        room.roomName = user.team + appConfig.teamAppend;
      } else if (whisperTo) {
        room.roomName += appConfig.whisperAppend;
      }

      if (room && Object.keys(socket.rooms).indexOf(room.roomName) > -1) {
        getHistory();
      } else {
        callback({ error: new errorCreator.NotAllowed({ used: `Not authorized to retrieve history from ${room.roomName}` }) });
      }
    });
  });

  // TODO Unused
  socket.on('removeRoom', ({ room }, callback = () => {}) => {
    if (!objectValidator.isValidData({ room }, { room: { roomName: true } })) {
      callback({ error: {} });

      return;
    }

    manager.userIsAllowed(socket.id, databasePopulation.commands.removeroom.commandName, (allowErr, allowed, user) => {
      if (allowErr || !allowed || !user) {
        callback({ error: {} });

        return;
      }

      const roomNameLower = room.roomName.toLowerCase();

      dbRoom.removeRoom(roomNameLower, user, (err, removedRoom) => {
        if (err || removedRoom === null) {
          callback({ error: {} });

          return;
        }

        dbUser.removeRoomFromAllUsers(roomNameLower, (roomErr) => {
          if (roomErr) {
            callback({ error: {} });

            return;
          }

          const connectedIds = Object.keys(io.sockets.adapter.rooms[roomNameLower].sockets);
          const allSockets = io.sockets.connected;

          for (let i = 0; i < connectedIds.length; i += 1) {
            const userSocket = allSockets[connectedIds[i]];

            userSocket.leave(roomNameLower);
          }

          socket.broadcast.to(roomNameLower).emit('unfollow', { room });
        });

        messenger.sendMsg({
          socket,
          message: {
            userName: 'SYSTEM',
            text: [`Room ${roomNameLower} has been removed by the room administrator`],
            text_se: [`Rummet ${roomNameLower} har blivit borttaget av en administratör för rummet`],
          },
          sendTo: roomNameLower,
        });
        callback({ data: { room } });
      });
    });
  });

  // TODO Unused
  socket.on('updateRoom', (params, callback = () => {}) => {
    if (!objectValidator.isValidData(params, { room: { roomName: true }, field: true, value: true })) {
      callback({ error: {} });

      return;
    }

    manager.userIsAllowed(socket.id, databasePopulation.commands.updateroom.commandName, (allowErr, allowed) => {
      if (allowErr || !allowed) {
        callback({ error: {} });

        return;
      }

      const roomName = params.room.roomName;
      const field = params.field;
      const value = params.value;
      const updateRoomCallback = (err, room) => {
        if (err || room === null) {
          logger.sendSocketErrorMsg({
            socket,
            code: logger.ErrorCodes.db,
            text: ['Failed to update room'],
            text_se: ['Misslyckades med att uppdatera rummet'],
            err,
          });

          callback({ error: {} });

          return;
        }

        callback({
          data: {
            message: {
              text: ['Room has been updated'],
              text_se: ['Rummet har uppdaterats'],
            },
          },
        });
      };

      switch (field) {
        case 'visibility':
          dbRoom.updateRoomVisibility(roomName, value, updateRoomCallback);

          break;
        case 'accesslevel':
          dbRoom.updateRoomAccessLevel(roomName, value, updateRoomCallback);

          break;
        default:
          callback({
            error: {
              code: logger.ErrorCodes.db,
              text: [`Invalid field. Room doesn't have ${field}`],
              text_se: [`Felaktigt fält. Rum har inte fältet ${field}`],
            },
          });

          break;
      }
    });
  });

  // TODO Unused
  socket.on('matchPartialMyRoom', ({ partialName }, callback = () => {}) => {
    // params.partialName is not checked if it set, to allow the retrieval of all rooms on no input

    manager.userIsAllowed(socket.id, databasePopulation.commands.list.commandName, (allowErr, allowed, user) => {
      if (allowErr || !allowed) {
        callback({ error: {} });

        return;
      }

      const itemList = [];
      const rooms = user.rooms;

      if (user.team) {
        rooms.push('team');
      }

      for (let i = 0; i < rooms.length; i += 1) {
        const room = rooms[i];

        if (!shouldBeHidden(room, socket.id) && (!partialName || room.indexOf(partialName) === 0)) {
          itemList.push(room);
        }
      }

      callback({ data: { matched: itemList } });
    });
  });

  // TODO Unused
  socket.on('matchPartialRoom', ({ partialName }, callback = () => {}) => {
    // params.partialName is not checked if it set, to allow the retrieval of all rooms on no input

    manager.userIsAllowed(socket.id, databasePopulation.commands.list.commandName, (allowErr, allowed, user) => {
      if (allowErr || !allowed) {
        callback({ error: {} });

        return;
      }

      dbRoom.matchPartialRoom(partialName, user, (err, rooms) => {
        if (err) {
          callback({ error: {} });

          return;
        }

        const itemList = [];
        const roomKeys = Object.keys(rooms);

        for (let i = 0; i < roomKeys.length; i += 1) {
          itemList.push(rooms[roomKeys[i]].roomName);
        }

        callback({ data: { matched: itemList } });
      });
    });
  });

  // TODO Unused
  socket.on('inviteToRoom', ({ user, room }, callback = () => {}) => {
    if (!objectValidator.isValidData({ user, room }, { user: { userName: true }, room: { roomName: true } })) {
      callback({ error: {} });

      return;
    }

    manager.userIsAllowed(socket.id, databasePopulation.commands.inviteroom.commandName, (allowErr, allowed, allowedUser) => {
      if (allowErr || !allowed) {
        callback({ error: {} });

        return;
      }

      const userName = user.userName;
      const roomName = room.roomName;

      dbUser.getUser(userName, (userErr, invitedUser) => {
        if (userErr || invitedUser === null) {
          callback({ error: {} });

          return;
        } else if (invitedUser.rooms.indexOf(roomName) > -1) {
          callback({ error: {} });

          return;
        }

        const invitation = {
          itemName: roomName,
          time: new Date(),
          invitationType: 'room',
          sender: allowedUser.userName,
        };

        dbConnector.addInvitationToList(userName, invitation, (invErr, list) => {
          if (invErr || list !== null) {
            if (list || (invErr && invErr.code === 11000)) {
              callback({ error: { code: 11000 } });
            } else if (invErr) {
              logger.sendSocketErrorMsg({
                socket,
                code: logger.ErrorCodes.general,
                text: ['Failed to send the invite'],
                text_se: ['Misslyckades med att skicka inbjudan'],
                err: invErr,
              });
              callback({ error: {} });
            }

            return;
          }

          callback({ data: { user: invitedUser } });
        });
      });
    });
  });

  // TODO Unused
  socket.on('roomInviteAnswer', ({ invitation, accepted }, callback = () => {}) => {
    if (!objectValidator.isValidData({ invitation, accepted }, { accepted: true, invitation: { itemName: true, sender: true, invitationType: true } })) {
      callback({ error: {} });

      return;
    }

    manager.userIsAllowed(socket.id, databasePopulation.commands.invitations.commandName, (allowErr, allowed, allowedUser) => {
      if (allowErr || !allowed) {
        callback({ error: {} });

        return;
      }

      const modifiedInvitation = invitation;
      const userName = allowedUser.userName;
      const roomName = modifiedInvitation.itemName;
      modifiedInvitation.time = new Date();

      if (accepted) {
        dbUser.addRoomToUser(userName, roomName, (roomErr) => {
          if (roomErr) {
            callback({ error: {} });
            logger.sendErrorMsg({
              code: logger.ErrorCodes.db,
              text: [`Failed to follow ${roomName}`],
              err: roomErr,
            });

            return;
          }

          followRoom({ room: { roomName }, socket, userName, callback, io });
          dbConnector.removeInvitationFromList(userName, roomName, modifiedInvitation.invitationType, () => {
          });
        });
      } else {
        dbConnector.removeInvitationFromList(userName, modifiedInvitation.itemName, modifiedInvitation.invitationType, (err, list) => {
          if (err || list === null) {
            callback({
              error: {
                text: ['Failed to decline invitation'],
                text_se: ['Misslyckades med att avböja inbjudan'],
              },
            });

            return;
          }

          callback({
            message: {
              text: ['Successfully declined invitation'],
              text_se: ['Lyckades avböja inbjudan'],
            },
          });
        });
      }
    });
  });
}

exports.handle = handle;
