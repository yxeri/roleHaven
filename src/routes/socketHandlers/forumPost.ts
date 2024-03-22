'use strict';

const forumPostManager = require('../../managers/forumPosts');

/* eslint-disable no-param-reassign */

/**
 * @param {object} socket Socket.Io socket.
 * @param {object} io Socket.Io.
 */
function handle(socket, io) {
  socket.on('createForumPost', (params, callback = () => {
  }) => {
    params.callback = callback;
    params.io = io;
    params.socket = socket;

    forumPostManager.createPost(params);
  });

  socket.on('updateForumPost', (params, callback = () => {
  }) => {
    params.callback = callback;
    params.io = io;
    params.socket = socket;

    forumPostManager.updatePost(params);
  });

  socket.on('removeForumPost', (params, callback = () => {
  }) => {
    params.callback = callback;
    params.io = io;
    params.socket = socket;

    forumPostManager.removePost(params);
  });

  socket.on('getForumPost', (params, callback = () => {
  }) => {
    params.callback = callback;
    params.io = io;
    params.socket = socket;

    forumPostManager.getPostById(params);
  });

  socket.on('getForumPosts', (params, callback = () => {
  }) => {
    params.callback = callback;
    params.io = io;
    params.socket = socket;

    forumPostManager.getPostsByUser(params);
  });

  socket.on('getPostsByThreads', (params, callback = () => {
  }) => {
    params.callback = callback;
    params.io = io;
    params.socket = socket;

    forumPostManager.getPostsByThreads(params);
  });

  socket.on('getPostsByForum', (params, callback = () => {
  }) => {
    params.callback = callback;
    params.io = io;
    params.socket = socket;

    forumPostManager.getPostsByForum(params);
  });
}

export { handle };
