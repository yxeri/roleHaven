declare function getMessageById({ token, callback, messageId, internalCallUser, }: {
    token: any;
    callback: any;
    messageId: any;
    internalCallUser: any;
}): void;
declare function getMessagesByRoom({ token, callback, shouldGetFuture, startDate, roomId, }: {
    token: any;
    callback: any;
    shouldGetFuture: any;
    startDate: any;
    roomId: any;
}): void;
declare function getMessagesByUser({ token, callback, }: {
    token: any;
    callback: any;
}): void;
declare function getFullHistory({ token, callback, }: {
    token: any;
    callback: any;
}): void;
declare function sendBroadcastMsg({ token, message, socket, callback, io, image, internalCallUser, }: {
    token: any;
    message: any;
    socket: any;
    callback: any;
    io: any;
    image: any;
    internalCallUser: any;
}): void;
declare function sendChatMsg({ token, message, socket, callback, io, image, internalCallUser, }: {
    token: any;
    message: any;
    socket: any;
    callback: any;
    io: any;
    image: any;
    internalCallUser: any;
}): void;
declare function sendWhisperMsg({ token, participantIds, message, socket, callback, io, image, }: {
    token: any;
    participantIds: any;
    message: any;
    socket: any;
    callback: any;
    io: any;
    image: any;
}): void;
declare function removeMessage({ messageId, callback, token, io, socket, internalCallUser, }: {
    messageId: any;
    callback: any;
    token: any;
    io: any;
    socket: any;
    internalCallUser: any;
}): void;
declare function updateMessage({ messageId, message, callback, token, io, options, internalCallUser, }: {
    messageId: any;
    message: any;
    callback: any;
    token: any;
    io: any;
    options: any;
    internalCallUser: any;
}): void;
export { sendBroadcastMsg };
export { sendChatMsg };
export { sendWhisperMsg };
export { removeMessage as removeMesssage };
export { updateMessage };
export { getMessagesByRoom };
export { getMessageById };
export { getMessagesByUser };
export { getFullHistory };
