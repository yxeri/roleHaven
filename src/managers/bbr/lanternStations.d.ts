declare function getLanternStations({ token, callback, }: {
    token: any;
    callback: any;
}): void;
declare function getLanternStation({ stationId, token, callback, }: {
    stationId: any;
    token: any;
    callback: any;
}): void;
declare function createLanternStation({ io, station, token, callback, }: {
    io: any;
    station: any;
    token: any;
    callback: any;
}): void;
declare function updateLanternStation({ io, station, stationId, token, callback, }: {
    io: any;
    station: any;
    stationId: any;
    token: any;
    callback: any;
}): void;
declare function resetStations({ callback }: {
    callback: any;
}): void;
declare function deleteLanternStation({ token, stationId, callback, }: {
    token: any;
    stationId: any;
    callback: any;
}): void;
export { getLanternStations };
export { createLanternStation };
export { updateLanternStation };
export { getLanternStation };
export { resetStations };
export { deleteLanternStation };
