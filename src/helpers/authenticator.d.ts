declare function createToken({ username, userId, password, callback, }: {
    username: any;
    userId: any;
    password: any;
    callback: any;
}): void;
declare function isUserAllowed({ commandName, token, internalCallUser, callback, }: {
    commandName: any;
    token: any;
    internalCallUser: any;
    callback: any;
}): void;
declare function isAllowedAccessLevel({ objectToCreate, toAuth, }: {
    objectToCreate: any;
    toAuth: any;
}): boolean;
declare function hasAccessTo({ objectToAccess, toAuth, }: {
    objectToAccess: any;
    toAuth: any;
}): {
    canSee: any;
    hasAccess: any;
    hasFullAccess: any;
};
export { isUserAllowed };
export { createToken };
export { hasAccessTo };
export { isAllowedAccessLevel };
