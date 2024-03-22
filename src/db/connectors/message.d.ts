declare function createMessage({ message, callback, }: {
    message: any;
    callback: any;
}): void;
declare function updateMessage({ messageId, message, callback, options, }: {
    messageId: any;
    message: any;
    callback: any;
    options?: {} | undefined;
}): void;
declare function getMessagesByRoom({ roomId, callback, startDate, shouldGetFuture, user, }: {
    roomId: any;
    callback: any;
    startDate: any;
    shouldGetFuture: any;
    user: any;
}): void;
declare function getMessagesByUser({ user, callback, }: {
    user: any;
    callback: any;
}): void;
declare function removeMessagesByRoom({ roomId, callback, }: {
    roomId: any;
    callback: any;
}): void;
declare function removeMessagesByUser({ ownerId, callback, }: {
    ownerId: any;
    callback: any;
}): void;
declare function removeMessagesByAlias({ ownerAliasId, callback, }: {
    ownerAliasId: any;
    callback: any;
}): void;
declare function getMessageById({ messageId, callback, }: {
    messageId: any;
    callback: any;
}): void;
declare function removeMessage({ messageId, callback, }: {
    messageId: any;
    callback: any;
}): void;
declare function getAllMessages({ callback }: {
    callback: any;
}): void;
export { createMessage };
export { updateMessage };
export { getMessagesByRoom };
export { removeMessagesByRoom };
export { removeMessagesByUser };
export { removeMessage };
export { getMessageById };
export { removeMessagesByAlias };
export { getMessagesByUser };
export { getAllMessages };
