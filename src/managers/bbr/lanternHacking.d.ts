declare function resetStations({ io, callback, }: {
    io: any;
    callback?: (() => void) | undefined;
}): void;
declare function startResetInterval({ io }: {
    io: any;
}): void;
declare function updateSignalValue({ stationId, boostingSignal, callback, }: {
    stationId: any;
    boostingSignal: any;
    callback: any;
}): void;
declare function createLanternHack({ stationId, owner, triesLeft, callback, }: {
    stationId: any;
    owner: any;
    triesLeft: any;
    callback: any;
}): void;
declare function manipulateStation({ password, boostingSignal, token, stationId, callback, }: {
    password: any;
    boostingSignal: any;
    token: any;
    stationId: any;
    callback: any;
}): void;
declare function getLanternHack({ stationId, token, callback, }: {
    stationId: any;
    token: any;
    callback: any;
}): void;
declare function getLanternInfo({ token, callback, }: {
    token: any;
    callback: any;
}): void;
export { createLanternHack };
export { updateSignalValue };
export { manipulateStation };
export { getLanternHack };
export { getLanternInfo };
export { resetStations };
export { startResetInterval };
