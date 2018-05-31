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

const gameCodeManager = require('../../managers/gameCodes');

/* eslint-disable no-param-reassign */

/**
 * @param {object} socket - Socket.Io socket.
 * @param {object} io - Socket.Io.
 */
function handle(socket, io) {
  socket.on('createGameCode', (params, callback = () => {}) => {
    params.callback = callback;
    params.io = io;


    gameCodeManager.createGameCode(params);
  });

  socket.on('updateGameCode', (params, callback = () => {}) => {
    params.callback = callback;
    params.io = io;


    gameCodeManager.updateGameCode(params);
  });

  socket.on('removeGameCode', (params, callback = () => {}) => {
    params.callback = callback;
    params.io = io;


    gameCodeManager.removeGameCode(params);
  });

  socket.on('getGameCode', (params, callback = () => {}) => {
    params.callback = callback;
    params.io = io;


    gameCodeManager.getGameCodeById(params);
  });

  socket.on('getGameCodes', (params, callback = () => {}) => {
    params.callback = callback;
    params.io = io;


    gameCodeManager.getGameCodesByOwner(params);
  });

  socket.on('useGameCode', (params, callback = () => {}) => {
    params.callback = callback;
    params.io = io;


    gameCodeManager.useGameCode(params);
  });
}

exports.handle = handle;
