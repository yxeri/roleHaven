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

/**
 * @param {Object} socket Socket.IO socket
 * @param {Object} io Socket.io
 */
function handle(socket, io) {
  socket.on('createDocFile', ({ docFile, token }, callback = () => {}) => {
    docFileManager.createDocFile({
      docFile,
      token,
      io,
      callback,
    });
  });

  socket.on('updateDocFile', ({ docFile, token }, callback = () => {}) => {
    docFileManager.updateDocFile({
      docFile,
      token,
      io,
      callback,
    });
  });

  socket.on('getDocFile', ({ docFile, token }, callback = () => {}) => {
    docFileManager.getDocFile({
      docFile,
      token,
      callback,
    });
  });

  socket.on('getDocFiles', ({ token }, callback = () => {}) => {
    docFileManager.getAllDocFiles({
      token,
      callback,
    });
  });
}

exports.handle = handle;
