'use strict';

const lanternHackManager = require('../../../managers/bbr/lanternHacking');

/**
 * @param {Object} socket - Socket.io socket.
 * @param {Object} io - Socket.io.
 */
function handle(socket, io) {
  socket.on('manipulateStation', ({
    password,
    boostingSignal,
    stationId,
    token,
  }, callback = () => {
  }) => {
    lanternHackManager.manipulateStation({
      socket,
      io,
      password,
      boostingSignal,
      token,
      stationId,
      callback,
    });
  });

  socket.on('getLanternHack', ({
    stationId,
    token,
  }, callback = () => {
  }) => {
    lanternHackManager.getLanternHack({
      stationId,
      token,
      callback,
    });
  });

  socket.on('getLanternInfo', ({ token }, callback = () => {
  }) => {
    lanternHackManager.getLanternInfo({
      token,
      callback,
    });
  });
}

export { handle };
