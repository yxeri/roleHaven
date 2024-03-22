declare function getPositionById({ token, positionId, callback, needsAccess, internalCallUser, }: {
    token: any;
    positionId: any;
    callback: any;
    needsAccess: any;
    internalCallUser: any;
}): void;
declare function getAndStoreGooglePositions({ io, callback, }: {
    io: any;
    callback?: (() => void) | undefined;
}): void;
declare function updatePosition({ positionId, position, token, io, callback, options, socket, internalCallUser, }: {
    positionId: any;
    position: any;
    token: any;
    io: any;
    callback: any;
    options: any;
    socket: any;
    internalCallUser: any;
}): void;
declare function createPosition({ position, token, io, internalCallUser, callback, socket, isUserPosition, }: {
    position: any;
    token: any;
    io: any;
    internalCallUser: any;
    callback: any;
    socket: any;
    isUserPosition?: boolean | undefined;
}): void;
declare function getPositionsByUser({ token, callback, }: {
    token: any;
    callback: any;
}): void;
declare function removePosition({ positionId, token, callback, io, socket, internalCallUser, }: {
    positionId: any;
    token: any;
    callback: any;
    io: any;
    socket: any;
    internalCallUser: any;
}): void;
export { updatePosition };
export { getPositionsByUser };
export { createPosition };
export { removePosition };
export { getPositionById };
export { getAndStoreGooglePositions };
