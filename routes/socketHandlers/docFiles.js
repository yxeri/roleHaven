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

const docFileManager = require('../../managers/docFiles');

/* eslint-disable no-param-reassign */

/**
 * @param {object} socket - Socket.Io socket.
 * @param {object} io - Socket.Io.
 */
function handle(socket, io) {
  socket.on('createDocFile', (params, callback = () => {}) => {
    params.callback = callback;
    params.io = io;

    docFileManager.createDocFile(params);
  });

  socket.on('updateDocFile', (params, callback = () => {}) => {
    params.callback = callback;
    params.io = io;

    docFileManager.updateDocFile(params);
  });

  socket.on('removeDocFile', (params, callback = () => {}) => {
    params.callback = callback;
    params.io = io;

    docFileManager.removeDocFile(params);
  });

  socket.on('getDocFile', (params, callback = () => {}) => {
    params.callback = callback;
    params.io = io;

    docFileManager.getDocFileById(params);
  });

  socket.on('getDocFiles', (params, callback = () => {}) => {
    params.callback = callback;
    params.io = io;

    docFileManager.getDocFilesByUser(params);
  });

  socket.on('getDocFilesList', (params, callback = () => {}) => {
    params.callback = callback;
    params.io = io;

    docFileManager.getDocFilesList(params);
  });

  socket.on('unlockDocFile', (params, callback = () => {}) => {
    params.callback = callback;
    params.io = io;

    docFileManager.unlockDocFile(params);
  })
}

exports.handle = handle;
