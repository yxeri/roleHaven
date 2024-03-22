declare function getActiveMission({ owner, silentOnDoesNotExist, callback, }: {
    owner: any;
    silentOnDoesNotExist: any;
    callback: any;
}): void;
declare function getInactiveMissions({ owner, callback, }: {
    owner: any;
    callback: any;
}): void;
declare function getMissions({ getInactive, callback, }: {
    getInactive: any;
    callback: any;
}): void;
declare function removeMission({ mission, callback, }: {
    mission: any;
    callback: any;
}): void;
declare function createMission({ mission, callback, }: {
    mission: any;
    callback: any;
}): void;
declare function setMissionCompleted({ owner, cancelled, callback, }: {
    owner: any;
    cancelled: any;
    callback: any;
}): void;
export { getActiveMission };
export { createMission };
export { setMissionCompleted };
export { getInactiveMissions };
export { getMissions };
export { removeMission };
