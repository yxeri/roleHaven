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

const userManager = require('../../managers/users');

/* eslint-disable no-param-reassign */

/**
 * @param {object} socket - Socket.Io socket.
 * @param {object} io - Socket.Io.
 */
function handle(socket, io) {
  socket.on('createUser', (params, callback = () => {
  }) => {
    params.callback = callback;
    params.io = io;
    params.socket = socket;
    userManager.createUser(params);
  });

  socket.on('updateUser', (params, callback = () => {
  }) => {
    params.callback = callback;
    params.io = io;
    params.socket = socket;
    userManager.updateUser(params);
  });

  socket.on('removeUser', (params, callback = () => {
  }) => {
    params.callback = callback;
    params.io = io;
    params.socket = socket;
    userManager.removeUser(params);
  });

  socket.on('getUser', (params, callback = () => {
  }) => {
    params.callback = callback;
    params.io = io;
    params.socket = socket;
    userManager.getUserById(params);
  });

  socket.on('getUsers', (params, callback = () => {
  }) => {
    params.callback = callback;
    params.io = io;
    params.socket = socket;
    userManager.getUsersByUser(params);
  });

  socket.on('updateId', (params, callback = () => {
  }) => {
    params.callback = callback;
    params.io = io;
    params.socket = socket;

    userManager.updateId(params);
  });
}

exports.handle = handle;
