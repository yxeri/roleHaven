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

const positionManager = require('../../managers/positions');

/* eslint-disable no-param-reassign */

/**
 * @param {object} socket - Socket.Io socket.
 * @param {object} io - Socket.Io.
 */
function handle(socket, io) {
  socket.on('createPosition', (params, callback = () => {}) => {
    params.callback = callback;
    params.io = io;
    params.socket = socket;

    positionManager.createPosition(params);
  });

  socket.on('updatePosition', (params, callback = () => {}) => {
    params.callback = callback;
    params.io = io;
    params.socket = socket;

    positionManager.updatePosition(params);
  });

  socket.on('removePosition', (params, callback = () => {}) => {
    params.callback = callback;
    params.io = io;
    params.socket = socket;

    positionManager.removePosition(params);
  });

  socket.on('getPosition', (params, callback = () => {}) => {
    params.callback = callback;
    params.io = io;
    params.socket = socket;

    positionManager.getPositionById(params);
  });

  socket.on('getPositions', (params, callback = () => {}) => {
    params.callback = callback;
    params.io = io;
    params.socket = socket;

    positionManager.getPositions(params);
  });

  socket.on('updatePositionCoordinates',  (params, callback = () => {}) => {
    params.callback = callback;
    params.io = io;
    params.socket = socket;

    positionManager.updatePositionCoordinates(params);
  });
}

exports.handle = handle;
