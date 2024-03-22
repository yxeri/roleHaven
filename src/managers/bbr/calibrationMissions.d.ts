declare function getActiveCalibrationMission({ token, stationId, callback, userName, }: {
    token: any;
    stationId: any;
    callback: any;
    userName: any;
}): void;
declare function completeActiveCalibrationMission({ token, owner, io, callback, }: {
    token: any;
    owner: any;
    io: any;
    callback: any;
}): void;
declare function cancelActiveCalibrationMission({ token, io, callback, owner, }: {
    token: any;
    io: any;
    callback: any;
    owner: any;
}): void;
declare function getCalibrationMissions({ token, getInactive, callback, }: {
    token: any;
    getInactive: any;
    callback: any;
}): void;
declare function getValidStations({ token, callback, }: {
    token: any;
    callback: any;
}): void;
declare function removeCalibrationMissionsById({ token, stationId, callback, }: {
    token: any;
    stationId: any;
    callback: any;
}): void;
export { getValidStations };
export { getActiveCalibrationMission };
export { completeActiveCalibrationMission };
export { cancelActiveCalibrationMission };
export { getCalibrationMissions };
export { removeCalibrationMissionsById };
