declare function createLanternTeam({ team, callback, }: {
    team: any;
    callback: any;
}): void;
declare function updateLanternTeam({ teamId, teamName, shortName, isActive, points, resetPoints, callback, }: {
    teamId: any;
    teamName: any;
    shortName: any;
    isActive: any;
    points: any;
    resetPoints: any;
    callback: any;
}): void;
declare function updateSignalValue({ stationId, signalValue, callback, }: {
    stationId: any;
    signalValue: any;
    callback: any;
}): void;
declare function updateLanternRound({ startTime, endTime, isActive, callback, }: {
    startTime: any;
    endTime: any;
    isActive: any;
    callback: any;
}): void;
declare function getLanternRound({ callback }: {
    callback: any;
}): void;
declare function getStation({ stationId, callback, }: {
    stationId: any;
    callback: any;
}): void;
declare function getAllStations({ callback }: {
    callback: any;
}): void;
declare function createStation({ station, callback, }: {
    station: any;
    callback: any;
}): void;
declare function resetLanternStations({ signalValue, callback, }: {
    signalValue: any;
    callback: any;
}): void;
declare function updateLanternStation({ resetOwner, stationId, isActive, stationName, owner, isUnderAttack, calibrationReward, callback, }: {
    resetOwner: any;
    stationId: any;
    isActive: any;
    stationName: any;
    owner: any;
    isUnderAttack: any;
    calibrationReward: any;
    callback: any;
}): void;
declare function getActiveStations({ callback }: {
    callback: any;
}): void;
declare function updateLanternHack({ stationId, owner, gameUsers, triesLeft, callback, }: {
    stationId: any;
    owner: any;
    gameUsers: any;
    triesLeft: any;
    callback: any;
}): void;
declare function lowerHackTries({ owner, callback, }: {
    owner: any;
    callback: any;
}): void;
declare function getLanternHack({ owner, stationId, done, callback, }: {
    owner: any;
    stationId: any;
    done: any;
    callback: any;
}): void;
declare function createGameUsers({ gameUsers }: {
    gameUsers?: never[] | undefined;
}): void;
declare function getGameUsers({ callback }: {
    callback: any;
}): void;
declare function addFakePasswords({ passwords, callback, }: {
    passwords: any;
    callback: any;
}): void;
declare function getAllFakePasswords({ callback }: {
    callback: any;
}): void;
declare function getTeams({ callback }: {
    callback: any;
}): void;
declare function deleteStation({ stationId, callback, }: {
    stationId: any;
    callback: any;
}): void;
declare function deleteTeam({ teamId, callback, }: {
    teamId: any;
    callback: any;
}): void;
declare function createFirstRound(callback: any): void;
declare function createFakePasswordsContainer(callback: any): void;
declare function getLanternStats({ callback }: {
    callback: any;
}): void;
declare function setDone({ callback, owner, coordinates, stationId, wasSuccessful, }: {
    callback: any;
    owner: any;
    coordinates: any;
    stationId: any;
    wasSuccessful?: boolean | undefined;
}): void;
export { createGameUsers };
export { getGameUsers };
export { addFakePasswords };
export { getAllFakePasswords };
export { updateLanternHack };
export { getLanternHack };
export { lowerHackTries };
export { updateSignalValue };
export { getStation };
export { getAllStations };
export { createStation };
export { updateLanternStation };
export { getActiveStations };
export { getLanternRound };
export { updateLanternTeam };
export { createLanternTeam };
export { getTeams };
export { updateLanternRound };
export { createFirstRound };
export { createFakePasswordsContainer as createFakePasswordContainer };
export { resetLanternStations };
export { deleteTeam };
export { getLanternStats };
export { deleteStation };
export { setDone };
