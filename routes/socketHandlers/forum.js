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

const forumManager = require('../../managers/forums');

/**
 * @param {Object} socket Socket.IO socket
 * @param {Object} io Socket.io
 */
function handle(socket, io) {
  socket.on('createPost', ({ post, token }, callback = () => {}) => {
    forumManager.createPost({
      post,
      callback,
      token,
      io,
      socket,
    });
  });

  socket.on('createForumThread', ({ thread, token }, callback = () => {}) => {
    forumManager.createThread({
      thread,
      callback,
      token,
      io,
      socket,
    });
  });

  socket.on('getForumThreads', ({ forumId, token }, callback = () => {}) => {
    forumManager.getForumThreadsByForum({
      forumId,
      callback,
      token,
    });
  });

  socket.on('getCompleteForums', ({ token }, callback = () => {}) => {
    forumManager.getCompleteForums({
      token,
      callback,
    });
  });
}

exports.handle = handle;
