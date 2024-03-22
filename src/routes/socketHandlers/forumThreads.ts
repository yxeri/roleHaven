'use strict';

const forumThreadManager = require('../../managers/forumThreads');

/* eslint-disable no-param-reassign */

/**
 * @param {object} socket - Socket.Io socket.
 * @param {object} io - Socket.Io.
 */
function handle(socket, io) {
  socket.on('createForumThread', (params, callback = () => {
  }) => {
    params.callback = callback;
    params.io = io;
    params.socket = socket;

    forumThreadManager.createThread(params);
  });

  socket.on('updateForumThread', (params, callback = () => {
  }) => {
    params.callback = callback;
    params.io = io;
    params.socket = socket;

    forumThreadManager.updateThread(params);
  });

  socket.on('removeForumThread', (params, callback = () => {
  }) => {
    params.callback = callback;
    params.io = io;
    params.socket = socket;

    forumThreadManager.removeThread(params);
  });

  socket.on('getForumThread', (params, callback = () => {
  }) => {
    params.callback = callback;
    params.io = io;
    params.socket = socket;

    forumThreadManager.getThreadById(params);
  });

  socket.on('getForumThreads', (params, callback = () => {
  }) => {
    params.callback = callback;
    params.io = io;
    params.socket = socket;

    forumThreadManager.getThreadsByUser(params);
  });

  socket.on('getThreadsByForum', (params, callback = () => {
  }) => {
    params.callback = callback;
    params.io = io;
    params.socket = socket;

    forumThreadManager.getForumThreadsByForum(params);
  });
}

export { handle };
