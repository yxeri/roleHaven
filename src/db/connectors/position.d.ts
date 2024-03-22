declare function createPosition({ position, callback, suppressExistsError, options, }: {
    position: any;
    callback: any;
    suppressExistsError?: boolean | undefined;
    options?: {} | undefined;
}): void;
declare function updatePosition({ positionId, position, callback, options, }: {
    positionId: any;
    position: any;
    callback: any;
    options?: {} | undefined;
}): void;
declare function getPositionsByUser({ user, callback, }: {
    user: any;
    callback: any;
}): void;
declare function getPositionsByStructure({ user, callback, positionTypes: positionStructure, }: {
    user: any;
    callback: any;
    positionTypes: any;
}): void;
declare function removePosition({ positionId, callback }: {
    positionId: any;
    callback: any;
}): void;
declare function removePositionsByType({ positionType, callback }: {
    positionType: any;
    callback: any;
}): void;
declare function removePositionsByOrigin({ origin, callback }: {
    origin: any;
    callback: any;
}): void;
declare function getPositionById({ positionId, callback }: {
    positionId: any;
    callback: any;
}): void;
declare function getUserPosition({ userId, callback }: {
    userId: any;
    callback: any;
}): void;
declare function updateAccess(params: any): void;
export { removePosition };
export { createPosition };
export { getPositionsByUser };
export { updatePosition };
export { removePositionsByOrigin };
export { getPositionById };
export { getUserPosition };
export { updateAccess };
export { removePositionsByType };
export { removePositionsByOrigin };
export { getPositionsByStructure };
