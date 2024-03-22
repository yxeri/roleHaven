declare function updateTriggerEvent({ eventId, triggerEvent, token, io, callback, socket, internalCallUser, options, }: {
    eventId: any;
    triggerEvent: any;
    token: any;
    io: any;
    callback: any;
    socket: any;
    internalCallUser: any;
    options?: {} | undefined;
}): void;
declare function getTriggerEventsByOwner({ token, callback, }: {
    token: any;
    callback: any;
}): void;
declare function removeTriggerEvent({ eventId, token, callback, io, socket, internalCallUser, }: {
    eventId: any;
    token: any;
    callback: any;
    io: any;
    socket: any;
    internalCallUser: any;
}): void;
declare function createTriggerEvent({ triggerEvent, token, io, internalCallUser, callback, socket, }: {
    triggerEvent: any;
    token: any;
    io: any;
    internalCallUser: any;
    callback: any;
    socket: any;
}): void;
declare function getTriggerEventById({ eventId, token, callback, internalCallUser, }: {
    eventId: any;
    token: any;
    callback: any;
    internalCallUser: any;
}): void;
declare function runEvent({ eventId, callback, }: {
    eventId: any;
    callback: any;
}): void;
declare function startTriggers(io: any): void;
export { updateTriggerEvent };
export { getTriggerEventsByOwner };
export { removeTriggerEvent };
export { createTriggerEvent };
export { getTriggerEventById };
export { runEvent };
export { startTriggers };
