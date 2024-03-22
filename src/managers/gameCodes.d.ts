declare function getGameCodeById({ token, callback, gameCodeId, }: {
    token: any;
    callback: any;
    gameCodeId: any;
}): void;
declare function createGameCode({ gameCode, token, io, callback, }: {
    gameCode: any;
    token: any;
    io: any;
    callback: any;
}): void;
declare function useGameCode({ io, code, token, callback, }: {
    io: any;
    code: any;
    token: any;
    callback: any;
}): void;
declare function removeGameCode({ gameCodeId, token, io, callback, socket, }: {
    gameCodeId: any;
    token: any;
    io: any;
    callback: any;
    socket: any;
}): void;
declare function getProfileGameCode({ ownerId, callback, token, }: {
    ownerId: any;
    callback: any;
    token: any;
}): void;
declare function updateGameCode({ token, io, callback, gameCodeId, gameCode, options, socket, }: {
    token: any;
    io: any;
    callback: any;
    gameCodeId: any;
    gameCode: any;
    options: any;
    socket: any;
}): void;
declare function getGameCodesByUser({ token, callback, }: {
    token: any;
    callback: any;
}): void;
export { createGameCode };
export { useGameCode };
export { removeGameCode };
export { getProfileGameCode };
export { updateGameCode };
export { getGameCodeById };
export { getGameCodesByUser };
