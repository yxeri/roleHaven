'use strict';

const forumManager = require('../../managers/forums');

/* eslint-disable no-param-reassign */

/**
 * @param {object} socket Socket.Io socket.
 * @param {object} io Socket.Io.
 */
function handle(socket, io) {
  socket.on('createForum', (params, callback = () => {
  }) => {
    params.callback = callback;
    params.io = io;
    params.socket = socket;

    forumManager.createForum(params);
  });

  socket.on('updateForum', (params, callback = () => {
  }) => {
    params.callback = callback;
    params.io = io;
    params.socket = socket;

    forumManager.updateForum(params);
  });

  socket.on('removeForum', (params, callback = () => {
  }) => {
    params.callback = callback;
    params.io = io;
    params.socket = socket;

    forumManager.removeForum(params);
  });

  socket.on('getForum', (params, callback = () => {
  }) => {
    params.callback = callback;
    params.io = io;
    params.socket = socket;

    forumManager.getForumById(params);
  });

  socket.on('getForums', (params, callback = () => {
  }) => {
    params.callback = callback;
    params.io = io;
    params.socket = socket;

    forumManager.getForumsByUser(params);
  });
}

export { handle };
