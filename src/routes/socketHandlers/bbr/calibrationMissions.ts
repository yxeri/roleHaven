'use strict';

const calibrationMissionManager = require('../../../managers/bbr/calibrationMissions');

/**
 * @param {object} socket - Socket.IO socket
 */
function handle(socket) {
  socket.on('getCalibrationMission', ({
    userName,
    token,
    stationId,
  }, callback = () => {
  }) => {
    calibrationMissionManager.getActiveCalibrationMission({
      token,
      userName,
      stationId,
      callback,
    });
  });

  socket.on('getValidCalibrationStations', ({
    userName,
    token,
  }, callback = () => {
  }) => {
    calibrationMissionManager.getValidStations({
      userName,
      token,
      callback,
    });
  });
}

export { handle };
