'use strict';

const teamManager = require('../../managers/teams');

/* eslint-disable no-param-reassign */

/**
 * @param {object} socket Socket.Io socket.
 * @param {object} io Socket.Io.
 */
function handle(socket, io) {
  socket.on('createTeam', (params, callback = () => {
  }) => {
    params.callback = callback;
    params.io = io;
    params.socket = socket;

    teamManager.createTeam(params);
  });

  socket.on('updateTeam', (params, callback = () => {
  }) => {
    params.callback = callback;
    params.io = io;
    params.socket = socket;

    teamManager.updateTeam(params);
  });

  socket.on('getTeam', (params, callback = () => {
  }) => {
    params.callback = callback;
    params.io = io;
    params.socket = socket;

    teamManager.getTeamById(params);
  });

  socket.on('getTeams', (params, callback = () => {
  }) => {
    params.callback = callback;
    params.io = io;
    params.socket = socket;

    teamManager.getTeamsByUser(params);
  });

  socket.on('inviteToTeam', (params, callback = () => {
  }) => {
    params.callback = callback;
    params.io = io;
    params.socket = socket;

    teamManager.inviteToTeam(params);
  });

  socket.on('leaveTeam', (params, callback = () => {
  }) => {
    params.callback = callback;
    params.io = io;
    params.socket = socket;

    teamManager.leaveTeam(params);
  });

  socket.on('acceptTeamInvitation', (params, callback = () => {
  }) => {
    params.callback = callback;
    params.io = io;
    params.socket = socket;

    teamManager.acceptTeamInvitation(params);
  });
}

export { handle };
