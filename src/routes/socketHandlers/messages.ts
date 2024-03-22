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

export { handle };
