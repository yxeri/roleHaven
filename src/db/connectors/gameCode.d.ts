declare function createGameCode({ gameCode, callback, }: {
    gameCode: any;
    callback: any;
}): void;
declare function updateGameCode({ gameCodeId, gameCode, callback, }: {
    gameCodeId: any;
    gameCode: any;
    callback: any;
}): void;
declare function getGameCodesByUser({ user, callback, }: {
    user: any;
    callback: any;
}): void;
declare function getGameCodeById({ gameCodeId, callback, }: {
    gameCodeId: any;
    callback: any;
}): void;
declare function removeGameCode({ gameCodeId, callback, }: {
    gameCodeId: any;
    callback: any;
}): void;
declare function getProfileGameCode({ ownerId, callback, }: {
    ownerId: any;
    callback: any;
}): void;
export { createGameCode };
export { updateGameCode };
export { removeGameCode };
export { getGameCodeById };
export { getGameCodesByUser };
export { getProfileGameCode };
