declare function createMission({ mission, callback, }: {
    mission: any;
    callback: any;
}): void;
declare function updateProgram({ missionId, mission, callback, suppressError, }: {
    missionId: any;
    mission: any;
    callback: any;
    suppressError: any;
}): void;
declare function getMissionsByUser({ user, callback, }: {
    user: any;
    callback: any;
}): void;
declare function getMissionById({ missionId, callback, }: {
    missionId: any;
    callback: any;
}): void;
export { updateProgram as updateDevice };
export { createMission as createDevice };
export { getMissionsByUser as getDevicesByUser };
export { getMissionById as getDeviceById };
