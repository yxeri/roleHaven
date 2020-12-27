/*
 Copyright 2017 Carmilla Mina Jankovic

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

const messageManager = require('../../managers/messages');
const { dbConfig } = require('../../config/defaults/config');
const errorCreator = require('../../error/errorCreator');

/* eslint-disable no-param-reassign */

/**
 * @param {object} socket Socket.Io socket.
 * @param {object} io Socket.Io.
 */
function handle(socket, io) {
  socket.on('sendMessage', (params, callback = () => {
  }) => {
    const { message } = params;
    const { messageType = '' } = message;

    params.callback = callback;
    params.io = io;
    params.socket = socket;

    switch (messageType) {
      case dbConfig.MessageTypes.BROADCAST: {
        messageManager.sendBroadcastMsg(params);

        break;
      }
      case dbConfig.MessageTypes.WHISPER: {
        messageManager.sendWhisperMsg(params);

        break;
      }
      case dbConfig.MessageTypes.CHAT: {
        messageManager.sendChatMsg(params);

        break;
      }
      case dbConfig.MessageTypes.NEWS: {
        messageManager.sendChatMsg(params);

        break;
      }
      default: {
        callback({ error: new errorCreator.Incorrect({ name: 'messageType' }) });

        break;
      }
    }
  });

  socket.on('updateMessage', (params, callback = () => {
  }) => {
    params.callback = callback;
    params.io = io;
    params.socket = socket;

    messageManager.updateMessage(params);
  });

  socket.on('removeMessage', (params, callback = () => {
  }) => {
    params.callback = callback;
    params.io = io;
    params.socket = socket;

    messageManager.removeMesssage(params);
  });

  socket.on('getMessage', (params, callback = () => {
  }) => {
    params.callback = callback;
    params.io = io;
    params.socket = socket;

    messageManager.getMessageById(params);
  });

  socket.on('getMessages', (params, callback = () => {
  }) => {
    params.callback = callback;
    params.io = io;
    params.socket = socket;

    if (params.fullHistory) {
      messageManager.getFullHistory(params);
    } else {
      messageManager.getMessagesByUser(params);
    }
  });

  socket.on('getMessagesByRoom', (params, callback = () => {
  }) => {
    params.callback = callback;
    params.io = io;
    params.socket = socket;

    messageManager.getMessagesByRoom(params);
  });
}

exports.handle = handle;
