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

const forumPostManager = require('../../managers/forumPosts');

/* eslint-disable no-param-reassign */

/**
 * @param {object} socket - Socket.Io socket.
 * @param {object} io - Socket.Io.
 */
function handle(socket, io) {
  socket.on('createForumPost', (params, callback = () => {}) => {
    params.callback = callback;
    params.io = io;


    forumPostManager.createPost(params);
  });

  socket.on('updateForumPost', (params, callback = () => {}) => {
    params.callback = callback;
    params.io = io;


    forumPostManager.updatePost(params);
  });

  socket.on('removeForumPost', (params, callback = () => {}) => {
    params.callback = callback;
    params.io = io;


    forumPostManager.removePost(params);
  });

  socket.on('getForumPost', (params, callback = () => {}) => {
    params.callback = callback;
    params.io = io;


    forumPostManager.getPostById(params);
  });

  socket.on('getForumPosts', (params, callback = () => {}) => {
    params.callback = callback;
    params.io = io;


    forumPostManager.getPostsByUser(params);
  });

  socket.on('getPostsByThread', (params, callback = () => {}) => {
    params.callback = callback;
    params.io = io;


    forumPostManager.getPostsByThread(params);
  });

  socket.on('getPostsByForum', (params, callback = () => {}) => {
    params.callback = callback;
    params.io = io;


    forumPostManager.getPostsByForum(params);
  });
}

exports.handle = handle;
