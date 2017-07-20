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

const manager = require('../../helpers/manager');
const dbConfig = require('../../config/defaults/config').databasePopulation;
const messenger = require('../../helpers/messenger');
const authenticator = require('../../helpers/authenticator');

/**
 * Send chat message
 * @param {Object} params.message Message to send
 * @param {Object} params.image Image to attach to the message
 * @param {Object} params.token jwt token
 * @param {Object} params.socket Socket.io socket
 * @param {Object} params.io Socket.io
 * @param {Function} params.callback Callback
 */
function sendChatMsg({ message, image, token, socket, io, callback }) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.SendMessage.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      messenger.sendChatMsg({
        callback,
        io,
        socket,
        image,
        message,
        user: data.user,
      });
    },
  });
}

/**
 * Send whisper message
 * @param {Object} params.message Message to send
 * @param {Object} params.token jwt token
 * @param {Object} params.socket Socket.io socket
 * @param {Object} params.io Socket.io
 * @param {Function} params.callback Callback
 */
function sendWhisperMsg({ message, token, socket, io, callback }) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.SendWhisper.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      messenger.sendWhisperMsg({
        socket,
        callback,
        io,
        message,
        user: data.user,
      });
    },
  });
}

/**
 * Send broadcast message
 * @param {Object} params.message Message to send
 * @param {Object} params.token jwt token
 * @param {Object} params.socket Socket.io socket
 * @param {Object} params.io Socket.io
 * @param {Function} params.callback Callback
 */
function sendBroadcastMsg({ message, token, socket, io, callback }) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.SendBroadcast.name,
    callback: ({ error }) => {
      if (error) {
        callback({ error });

        return;
      }

      messenger.sendBroadcastMsg({
        socket,
        io,
        callback,
        message,
      });
    },
  });
}

/**
 * Create room
 * @param {Object} params.room Room to create
 * @param {Object} params.token jwt
 * @param {Object} params.socket Socket io.
 * @param {Object} params.io Socket io. Will be used if socket is not set
 * @param {Function} params.callback Callback
 */
function createRoom({ room, token, io, socket, callback }) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.CreateRoom.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      manager.createRoom({
        room,
        callback,
        io,
        socket,
        user: data.user,
      });
    },
  });
}

/**
 * Check if user is allowed to enter the room
 * @param {Object} params.room Room to auth to
 * @param {Object} params.token jwt
 * @param {Function} params.callback Callback
 */
function authUserToRoom({ room, token, callback }) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.GetRoom.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      manager.authUserToRoom({
        room,
        callback,
        user: data.user,
      });
    },
  });
}

/**
 * Make user follow whisper room
 * @param {Object} params.user User following whisper room
 * @param {string} params.whisperTo Message receiver name
 * @param {Object} params.sender User data sent from client
 * @param {Object} params.room Whisper room
 * @param {Object} params.socket Socket.io socket
 * @param {Object} params.io Socket.io. Used if socket is not set
 * @param {Function} params.callback Callback
 */
function followWhisperRoom({ sender, whisperTo, room, token, socket, io, callback }) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.FollowRoom.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      manager.followWhisperRoom({
        room,
        callback,
        sender,
        socket,
        whisperTo,
        io,
        user: data.user,
      });
    },
  });
}

/**
 * Follow a new room on the user
 * @param {Object} params.room Room to follow
 * @param {Object} params.room.roomName Name of the room
 * @param {Object} [params.room.password] Password to the room
 * @param {Object} params.user User trying to follow a room
 * @param {Function} params.callback Callback
 * @param {Object} params.socket Socket.io socket
 * @param {Object} params.token jwt
 * @param {Object} params.io Socket.io. Used if socket is not set
 */
function followRoom({ token, callback, room, socket, io }) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.FollowRoom.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      manager.followRoom({
        io,
        socket,
        room,
        callback,
        user: data.user,
      });
    },
  });
}

/**
 * Unfollow room
 * @param {Object} params.user User that is unfollowing a room
 * @param {boolean} params.isWhisperRoom Is it a whisper room?
 * @param {Object} params.room Room to unfollow
 * @param {Function} params.callback Callback
 * @param {Object} params.socket Socket io socket
 * @param {Object} params.io Socket io. Will be used if socket is not set
 * @param {Object} params.token jwt
 */
function unfollowRoom({ token, callback, room, socket, io, isWhisperRoom }) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.UnfollowRoom.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      manager.unfollowRoom({
        socket,
        io,
        callback,
        isWhisperRoom,
        room,
        user: data.user,
      });
    },
  });
}

/**
 * List rooms
 * @param {Object} params.user User listing rooms
 * @param {Object} params.socket Socket io
 * @param {Function} params.callback Callback
 * @param {Object} params.token jwt
 */
function listRooms({ socket, token, callback }) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.GetRoom,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      manager.listRooms({
        socket,
        callback,
        user: data.user,
      });
    },
  });
}

/**
 * Gets getHistory (messages) from one or more rooms
 * @param {Object} params.user User retrieving history
 * @param {string[]} params.rooms The rooms to retrieve the getHistory from
 * @param {Object} params.io socket io. Will be used if socket is not set
 * @param {Object} params.socket Socket io
 * @param {Function} params.callback Callback
 * @param {Object} params.token jwt
 */
function getHistory({ token, room, whisperTo, io, socket, callback }) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.GetHistory.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      manager.getHistory({
        whisperTo,
        callback,
        socket,
        io,
        room,
        user: data.user,
      });
    },
  });
}

/**
 * Remove room
 * @param {Object} params.user Owner of the room
 * @param {Object} params.room Room to remove
 * @param {Object} [params.socket] Socket io
 * @param {Object} params.io socket io. Will be used if socket is not set
 * @param {Function} params.callback Callback
 */
function removeRoom({ token, room, socket, io, callback }) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.RemoveRoom.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      manager.removeRoom({
        room,
        socket,
        io,
        callback,
        user: data.user,
      });
    },
  });
}

/**
 * Match sent partial room name to one or more rooms followed. Match will start from index 0
 * @param {Object} params.user User retrieving rooms
 * @param {string} params.partialName Partial room name
 * @param {Function} params.callback Callback
 */
function matchPartialMyRoomName({ token, partialName, callback }) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.GetRoom.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      manager.matchMyPartialRoomName({
        callback,
        partialName,
        user: data.user,
      });
    },
  });
}

/**
 * Match sent partial room name to one or more rooms. Match will start from index 0
 * @param {Object} params.user User retrieving rooms
 * @param {string} params.partialName Partial room name
 * @param {Function} params.callback Callback
 */
function matchPartialRoomName({ token, partialName, callback }) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.GetRoom.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      manager.matchMyPartialRoomName({
        partialName,
        callback,
        user: data.user,
      });
    },
  });
}

/**
 * Get room
 * @param {Object} params.token jwt
 * @param {string} params.roomName Name of the room to retrieve
 * @param {Function} params.callback Callback
 */
function getRoom({ token, roomName, callback }) {
  authenticator.isUserAllowed({
    token,
    commandName: dbConfig.apiCommands.GetRoom.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      manager.getRoom({
        roomName,
        callback,
        user: data.user,
      });
    },
  });
}

/**
 * @param {object} socket - Socket.IO socket
 * @param {object} io - Socket.IO
 */
function handle(socket, io) {
  socket.on('chatMsg', ({ message, image, token }, callback = () => {}) => {
    sendChatMsg({ message, image, token, socket, io, callback });
  });
  socket.on('whisperMsg', ({ message, token }, callback = () => {}) => {
    sendWhisperMsg({ message, token, callback, socket, io });
  });
  // TODO Unused
  socket.on('broadcastMsg', ({ message, token }, callback = () => {}) => {
    sendBroadcastMsg({ message, token, callback, socket, io });
  });
  socket.on('createRoom', ({ room, token }, callback = () => {}) => {
    createRoom({ room, token, callback, socket, io });
  });
  socket.on('authUserToRoom', ({ room, token }, callback = () => {}) => {
    authUserToRoom({ room, token, callback, socket, io });
  });
  socket.on('followWhisperRoom', ({ user, whisperTo, room, token }, callback = () => {}) => {
    followWhisperRoom({
      token,
      room,
      whisperTo,
      callback,
      io,
      socket,
      sender: user,
    });
  });
  socket.on('follow', ({ room, token }, callback = () => {}) => {
    followRoom({
      token,
      callback,
      room,
      socket,
      io,
    });
  });
  socket.on('unfollow', ({ room, isWhisperRoom, token }, callback = () => {}) => {
    unfollowRoom({
      token,
      callback,
      room,
      socket,
      io,
      isWhisperRoom,
    });
  });
  socket.on('listRooms', ({ token }, callback = () => {}) => {
    listRooms({
      token,
      socket,
      callback,
    });
  });
  socket.on('getHistory', ({ room, whisperTo, token }, callback = () => {}) => {
    getHistory({
      token,
      whisperTo,
      room,
      socket,
      io,
      callback,
    });
  });
  // TODO Unused
  socket.on('removeRoom', ({ room, token }, callback = () => {}) => {
    removeRoom({
      token,
      room,
      callback,
    });
  });
  // TODO Unused
  socket.on('matchPartialMyRoom', ({ partialName, token }, callback = () => {}) => {
    matchPartialRoomName({
      token,
      partialName,
      callback,
    });
  });
  // TODO Unused
  socket.on('matchPartialRoom', ({ partialName, token }, callback = () => {}) => {
    matchPartialMyRoomName({
      token,
      partialName,
      callback,
    });
  });
  socket.on('getRoom', ({ roomName, token }, callback = () => {}) => {
    getRoom({
      token,
      roomName,
      callback,
    });
  });
}

exports.sendChatMsg = sendChatMsg;
exports.sendWhisperMsg = sendWhisperMsg;
exports.sendBroadcastMsg = sendBroadcastMsg;
exports.createRoom = createRoom;
exports.authUserToRoom = authUserToRoom;
exports.followWhisperRoom = followWhisperRoom;
exports.followRoom = followRoom;
exports.unfollowRoom = unfollowRoom;
exports.listRooms = listRooms;
exports.getHistory = getHistory;
exports.removeRoom = removeRoom;
exports.matchPartialMyRoomName = matchPartialMyRoomName;
exports.matchPartialRoomName = matchPartialRoomName;
exports.getRoom = getRoom;
exports.handle = handle;
