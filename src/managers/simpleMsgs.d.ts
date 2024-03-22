declare function getSimpleMsgById({ token, callback, simpleMsgId, internalCallUser, }: {
    token: any;
    callback: any;
    simpleMsgId: any;
    internalCallUser: any;
}): void;
declare function sendSimpleMsg({ text, io, token, callback, socket, }: {
    text: any;
    io: any;
    token: any;
    callback: any;
    socket: any;
}): void;
declare function updateSimpleMsg({ token, callback, simpleMsgId, simpleMsg, io, options, socket, }: {
    token: any;
    callback: any;
    simpleMsgId: any;
    simpleMsg: any;
    io: any;
    options: any;
    socket: any;
}): void;
declare function removeSimpleMsg({ token, callback, simpleMsgId, io, socket, }: {
    token: any;
    callback: any;
    simpleMsgId: any;
    io: any;
    socket: any;
}): void;
declare function getSimpleMsgsByUser({ token, callback, }: {
    token: any;
    callback: any;
}): void;
export { sendSimpleMsg };
export { getSimpleMsgsByUser };
export { updateSimpleMsg };
export { removeSimpleMsg };
export { getSimpleMsgById };
