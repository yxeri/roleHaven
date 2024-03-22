declare function createTriggerEvent({ triggerEvent, callback, }: {
    triggerEvent: any;
    callback: any;
}): void;
declare function updateTriggerEvent({ eventId, triggerEvent, callback, options, }: {
    eventId: any;
    triggerEvent: any;
    callback: any;
    options?: {} | undefined;
}): void;
declare function updateAccess(params: any): void;
declare function removeTriggerEvent({ eventId, callback, }: {
    eventId: any;
    callback: any;
}): void;
declare function getTriggerEventById({ eventId, callback, }: {
    eventId: any;
    callback: any;
}): void;
declare function getTriggerEventsByOwner({ ownerId, callback, }: {
    ownerId: any;
    callback: any;
}): void;
declare function getTimedTriggerEvents({ callback }: {
    callback: any;
}): void;
export { getTriggerEventById };
export { removeTriggerEvent };
export { updateAccess };
export { createTriggerEvent };
export { updateTriggerEvent };
export { getTriggerEventsByOwner };
export { getTimedTriggerEvents };
