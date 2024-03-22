'use strict';

import invitationManager from '../../managers/invitations';

/* eslint-disable no-param-reassign */

/**
 * @param {object} socket Socket.Io socket.
 * @param {object} io Socket.Io.
 */
function handle(socket, io) {
  socket.on('declineInvitation', (params, callback = () => {
  }) => {
    params.callback = callback;
    params.io = io;
    params.socket = socket;

    invitationManager.declineInvitation(params);
  });

  socket.on('getInvitations', (params, callback = () => {
  }) => {
    params.callback = callback;
    params.io = io;
    params.socket = socket;

    invitationManager.getInvitations(params);
  });
}

export default { handle };
