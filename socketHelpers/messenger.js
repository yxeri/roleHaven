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

const dbChatHistory = require('./../db/connectors/chatHistory');
const dbUser = require('./../db/connectors/user');
const databasePopulation = require('./../config/defaults/config').databasePopulation;
const appConfig = require('./../config/defaults/config').app;
const logger = require('./../utils/logger');
const objectValidator = require('./../utils/objectValidator');

/**
 * Symbolizes space between words in morse string
 * @private
 * @type {string}
 */
const morseSeparator = '#';
const morseCodes = {
  a: '.-',
  b: '-...',
  c: '-.-.',
  d: '-..',
  e: '.',
  f: '..-.',
  g: '--.',
  h: '....',
  i: '..',
  j: '.---',
  k: '-.-',
  l: '.-..',
  m: '--',
  n: '-.',
  o: '---',
  p: '.--.',
  q: '--.-',
  r: '.-.',
  s: '...',
  t: '-',
  u: '..-',
  v: '...-',
  w: '.--',
  x: '-..-',
  y: '-.--',
  z: '--..',
  1: '.----',
  2: '..---',
  3: '...--',
  4: '....-',
  5: '.....',
  6: '-....',
  7: '--...',
  8: '---..',
  9: '----.',
  0: '-----',
  '#': morseSeparator,
};

/**
 * Parses the text that will be sent as morse and returns the parsed morse text
 * @private
 * @param {string} text - Text to be sent as morse
 * @returns {string} - Parsed morse text
 */
function parseMorse(text) {
  let morseCode;
  let morseCodeText = '';
  let filteredText = text.toLowerCase();

  filteredText = filteredText.replace(/[åä]/g, 'a');
  filteredText = filteredText.replace(/[ö]/g, 'o');
  filteredText = filteredText.replace(/\s/g, '#');
  filteredText = filteredText.replace(/[^a-z0-9#]/g, '');

  for (let i = 0; i < filteredText.length; i += 1) {
    morseCode = morseCodes[filteredText.charAt(i)];

    for (let j = 0; j < morseCode.length; j += 1) {
      morseCodeText += `${morseCode[j]}${j === morseCode.length - 1 ? '' : ' '}`;
    }

    morseCodeText += '  ';
  }

  return morseCodeText;
}

/**
 * Add a sent message to a room's history in the database
 * @param {string} roomName - Name of the room
 * @param {Object} message - Message to be added
 * @param {Function} callback - callback
 */
function addMsgToHistory(roomName, message, callback) {
  dbChatHistory.addMsgToHistory(roomName, message, (err, history) => {
    if (err || history === null) {
      logger.sendErrorMsg({
        code: logger.ErrorCodes.db,
        text: ['Failed to add message to history'],
        err,
      });
      callback(err || {});
    } else {
      callback(err, message);
    }
  });
}

/**
 * Send a message to the user's socket
 * @param {{text: string[]}} message - Message to send
 * @param {Object} socket - Socket.io socket
 */
function sendSelfMsg({ message, socket }) {
  if (!objectValidator.isValidData({ message, socket }, { socket: true, message: { text: true } })) {
    return;
  }

  socket.emit('message', { message });
}

/**
 * Sends multiple message to the user's socket
 * @param {{text: string[]}[]} messages - Messages to send
 * @param {Object} socket - Socket.io socket
 */
function sendSelfMsgs({ messages, socket }) {
  if (!objectValidator.isValidData({ messages, socket }, { socket: true, messages: true })) {
    return;
  }

  socket.emit('messages', { messages });
}

/**
 * Checks if the user is following a room
 * @param {Object} user - User to check
 * @param {string} roomName - Name of the room
 * @returns {boolean} Is the socket following the room?
 */
function isUserFollowingRoom(user, roomName) {
  if (user.rooms.indexOf(roomName) === -1) {
    sendSelfMsg({
      user,
      message: {
        text: [`You are not following room ${roomName}`],
        text_se: [`Ni följer inte rummet ${roomName}`],
      },
    });

    return false;
  }

  return true;
}

/**
 * Sends a message to a room. The message will not be stored in history
 * Emits message
 * @param {{sendTo: string, socket: Object}} params - Parameters
 * @param {Object} params.message - Message to send
 * @param {string} params.message.userName - Name of sender
 * @param {string[]} params.message.text - Text in message
 * @param {string[]} [params.message.text_se] - Text in message
 */
function sendMsg(params) {
  if (!objectValidator.isValidData(params, { socket: true, message: { text: true, userName: true }, sendTo: true })) {
    return;
  }

  const socket = params.socket;
  const data = {
    message: params.message,
    sendTo: params.sendTo,
  };

  socket.broadcast.to(data.sendTo).emit('message', data);
}

/**
 * Sends a message with the importantMsg class. It can be sent to all connected sockets or one specific device (if toOneDevice is set)
 * It is stored in a separate histories collection for important messages
 * Emits importantMsg
 * @param {Object} socket - Socket.io socket
 * @param {{text: string[], userName: string}} message - Message to send
 * @param {boolean} [device] - Device that will receive message. Empty if message should be sent to all clients
 * @param {Function} callback - Client callback
 */
function sendImportantMsg({ socket, message, device, callback }) {
  if (!objectValidator.isValidData({ socket, message, device }, { socket: true, message: { text: true, userName: true } })) {
    callback({ error: {} });

    return;
  }

  const data = {
    message,
    device,
  };
  data.message.roomName = device ? device.deviceId + appConfig.deviceAppend : (data.message.roomName || databasePopulation.rooms.important.roomName);
  data.message.extraClass = 'importantMsg';
  data.message.time = new Date();

  addMsgToHistory(data.message.roomName, data.message, (err) => {
    if (err) {
      callback({ error: {} });

      return;
    }

    if (device) {
      socket.to(data.message.roomName).emit('importantMsg', data);
    } else {
      socket.broadcast.emit('importantMsg', data);
    }

    callback(data);
  });
}

/**
 * Store message in history and send to connected clients
 * @param {Object} params.user - User sending the message
 * @param {Function} params.callback - Callback
 * @param {Object} params.message - Message to send
 * @param {Object} params.io - Socket.io
 */
function sendAndStoreMsg({ user, callback, message, io }) {
  dbUser.getUser(user.userName, (userErr, foundUser) => {
    if (userErr || foundUser === null || !isUserFollowingRoom(foundUser, message.roomName)) {
      callback({ error: {} });

      return;
    }

    const data = {
      message,
    };
    data.message.time = new Date();

    addMsgToHistory(data.message.roomName, data.message, (err) => {
      if (err) {
        callback({ error: {} });

        return;
      }

      io.to(data.message.roomName).emit('message', data);
      callback({ data });
    });
  });
}

/**
 * Sends a message to a room and stores it in history
 * Emits message
 * @param {Object} message - Message to be sent
 * @param {Object} user - User sending the message
 * @param {Function} callback - Client callback
 */
function sendChatMsg({ message, user, callback, io }) {
  if (!objectValidator.isValidData({ message, user, callback, io }, { user: { userName: true }, message: { text: true, roomName: true, userName: true }, io: true })) {
    callback({ error: {} });

    return;
  }

  if (message.userName) {
    dbUser.getUserByAlias(message.userName, (aliasErr, aliasUser) => {
      if (aliasErr) {
        callback({ error: {} });

        return;
      } else if (aliasUser === null || aliasUser.userName !== user.userName) {
        callback({
          error: {
            called: sendChatMsg.name,
            message: {
              text: ['User name does not match user trying to send the message'],
            },
          },
        });

        return;
      }

      sendAndStoreMsg({ io, message, user, callback });
    });
  } else {
    const modifiedMessage = message;
    modifiedMessage.userName = user.userName;

    if (modifiedMessage.roomName === 'team') {
      modifiedMessage.roomName = user.team + appConfig.teamAppend;
    }

    sendAndStoreMsg({ io, message, user, callback });
  }
}

/**
 * Sends a message to a whisper room (*user name*-whisper), which is followed by a single user, and stores it in history
 * Emits message
 * @param {Object} message - Message to be sent
 * @param {Object} socket - Socket.io socket
 * @param {Function} callback - Client callback
 */
function sendWhisperMsg({ message, socket, callback }) {
  if (!objectValidator.isValidData({ message, socket, callback }, { socket: true, message: { text: true, roomName: true, userName: true } })) {
    callback({ error: {} });

    return;
  }

  const data = {
    message,
  };
  data.message.roomName += appConfig.whisperAppend;
  data.message.extraClass = 'whisperMsg';
  data.message.time = new Date();

  addMsgToHistory(data.message.roomName, data.message, (err) => {
    if (err) {
      callback({ error: {} });

      return;
    }

    const senderRoomName = data.message.userName + appConfig.whisperAppend;

    addMsgToHistory(senderRoomName, data.message, (senderErr) => {
      if (senderErr) {
        callback({ error: {} });

        return;
      }

      socket.broadcast.to(data.message.roomName).emit('message', data);
      callback(data);
    });
  });
}

/**
 * Sends a message with broadcastMsg class to all connected sockets
 * It is stored in a separate broadcast history
 * Emits message
 * @param {Object} message - Message to be sent
 * @param {Object} socket - Socket.io socket
 * @param {Function} callback - Client callback
 */
function sendBroadcastMsg({ message, socket, callback }) {
  if (!objectValidator.isValidData({ message, socket, callback }, { socket: true, message: { text: true, userName: true } })) {
    callback({ error: {} });

    return;
  }

  const data = {
    message,
  };
  data.message.extraClass = 'broadcastMsg';
  data.message.roomName = databasePopulation.rooms.bcast.roomName;
  data.message.time = new Date();

  addMsgToHistory(data.message.roomName, data.message, (err) => {
    if (err) {
      callback({ error: {} });

      return;
    }

    socket.broadcast.emit('message', data);
    callback(data);
  });
}

/**
 * Send an array of strings with an optional title
 * Emits list
 * @param {{socket: Object, itemList: { itemList: Object[], listTitle: string}, columns: number}} params - Parameters
 */
function sendList(params) {
  if (!objectValidator.isValidData(params, { socket: true, itemList: { itemList: true, listTitle: true } })) {
    return;
  }

  const socket = params.socket;
  const data = {
    itemList: params.itemList,
    columns: params.columns,
  };

  socket.emit('list', data);
}

/**
 * Send morse code to all sockets and store in history
 * @param {Object} socket - Socket.IO socket
 * @param {Object} message - Message
 * @param {string} message.morseCode - Morse code
 * @param {string} [message.room] - Room name
 * @param {boolean} [silent] - Should the morse code text be surpressed?
 * @param {boolean} [local] - Should morse be played on the client that sent it?
 * @param {Function} [callback] - Callback
 */
function sendMorse({ socket, message, silent, local, callback = () => {} }) {
  if (!objectValidator.isValidData({ socket, message, silent, local, callback }, { socket: true, message: { morseCode: true } })) {
    callback({ error: {} });

    return;
  }

  const roomName = message.roomName || databasePopulation.rooms.morse.roomName;
  const morseCode = parseMorse(message.morseCode);
  const morseObj = {
    morseCode,
    silent,
  };

  if (!local) {
    socket.broadcast.emit('morse', morseObj);
  }

  socket.emit('morse', morseObj);

  if (!silent) {
    const morseMessage = {
      text: [morseCode.replace(/#/g, '')],
      time: new Date(),
      roomName,
    };

    addMsgToHistory(roomName, morseMessage, () => {
    });
  }
}

exports.sendImportantMsg = sendImportantMsg;
exports.sendChatMsg = sendChatMsg;
exports.sendWhisperMsg = sendWhisperMsg;
exports.sendBroadcastMsg = sendBroadcastMsg;
exports.sendMsg = sendMsg;
exports.sendSelfMsg = sendSelfMsg;
exports.sendSelfMsgs = sendSelfMsgs;
exports.sendList = sendList;
exports.sendMorse = sendMorse;
