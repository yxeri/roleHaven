declare function createProgram({ program, callback, }: {
    program: any;
    callback: any;
}): void;
declare function updateProgram({ programId, program, callback, suppressError, options, }: {
    programId: any;
    program: any;
    callback: any;
    suppressError: any;
    options?: {} | undefined;
}): void;
declare function updateAccess(params: any): void;
declare function getProgramsByUser({ user, callback, }: {
    user: any;
    callback: any;
}): void;
declare function getProgramById({ programId, callback, }: {
    programId: any;
    callback: any;
}): void;
declare function removeProgram({ programId, callback, }: {
    programId: any;
    callback: any;
}): void;
export { updateAccess };
export { updateProgram as updateDevice };
export { createProgram as createDevice };
export { getProgramsByUser as getDevicesByUser };
export { getProgramById as getDeviceById };
export { removeProgram as removeDevice };
