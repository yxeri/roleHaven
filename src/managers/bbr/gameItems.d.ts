declare function createGameUsers({ gameUsers, token, callback, }: {
    gameUsers: any;
    token: any;
    callback: any;
}): void;
declare function createFakePasswords({ passwords, token, callback, }: {
    passwords: any;
    token: any;
    callback: any;
}): void;
declare function getGameUsers({ stationId, token, callback, }: {
    stationId: any;
    token: any;
    callback: any;
}): void;
declare function getFakePasswords({ token, callback, }: {
    token: any;
    callback: any;
}): void;
export { createGameUsers };
export { createFakePasswords };
export { getGameUsers };
export { getFakePasswords };
