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

const teamManager = require('../../managers/teams');

/**
 * @param {object} socket - Socket.IO socket
 * @param {object} io - Socket.IO
 */
function handle(socket, io) {
  socket.on('getTeamInvitations', ({ token }, callback = () => {}) => {
    teamManager.getTeamInvitations({
      token,
      callback,
    });
  });

  socket.on('inviteToTeam', ({ to, token }, callback = () => {}) => {
    teamManager.inviteToTeam({
      to,
      socket,
      io,
      token,
      callback,
    });
  });

  socket.on('declineTeamInvitation', ({ invitation, token }, callback = () => {}) => {
    teamManager.declineTeamInvitation({
      invitation,
      token,
      callback,
    });
  });

  socket.on('acceptTeamInvitation', ({ invitation, token }, callback = () => {}) => {
    teamManager.acceptTeamInvitation({
      invitation,
      token,
      io,
      socket,
      callback,
    });
  });

  socket.on('getTeam', ({ teamName, token }, callback = () => {}) => {
    teamManager.getTeam({
      teamName,
      token,
      callback,
    });
  });

  // function createTeam({ team, socket, io, callback, token }) {
  socket.on('createTeam', ({ team, token }, callback = () => {}) => {
    teamManager.createTeam({
      team,
      token,
      socket,
      io,
      callback,
    });
  });

  // socket.on('verifyTeam', ({ team, token }, callback = () => {}) => {
  //   TODO Verify team
  //   console.log(team, token, callback);
  // });
  //
  // socket.on('getUnverifiedTeams', ({ token }, callback = () => {}) => {
  //   TODO Get unverified teams
  //   console.log(token, callback);
  // });

  socket.on('getTeams', ({ token }, callback = () => {}) => {
    teamManager.getTeams({
      token,
      callback,
    });
  });

  // socket.on('leaveTeam', ({ token }, callback = () => {}) => {
  //   TODO Leave team
  // });
}

exports.handle = handle;
