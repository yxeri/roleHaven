import { RemoteSocket, Server, Socket } from 'socket.io';
import { EventMap } from 'socket.io/dist/typed-events.js';
declare function getUserSocket({ io, socketId, }: {
    io: Server;
    socketId: string;
}): Promise<RemoteSocket<EventMap, unknown> | undefined>;
declare function getSocketsByRoom({ io, roomId, }: {
    io: Server;
    roomId: string;
}): Promise<RemoteSocket<EventMap, unknown>[]>;
declare function joinRooms({ roomIds, io, socketId, userId, }: {
    io: Server;
    socketId: string;
    userId: string;
    roomIds: string[];
}): Promise<RemoteSocket<EventMap, unknown> | undefined>;
declare function joinRequiredRooms({ io, socketId, userId, socket, accessLevel, }: {
    io: Server;
    socketId: string;
    userId: string;
    socket?: Socket;
    accessLevel?: number;
}): Promise<RemoteSocket<EventMap, unknown> | Socket | undefined>;
declare function joinAliasRooms({ io, socketId, aliases, }: {
    io: Server;
    socketId: string;
    aliases: string[];
}): Promise<RemoteSocket<EventMap, unknown> | undefined>;
declare function leaveRooms({ roomIds, io, socketId, }: {
    io: Server;
    socketId: string;
    roomIds: string[];
}): Promise<RemoteSocket<EventMap, unknown> | undefined>;
declare const _default: {
    getUserSocket: typeof getUserSocket;
    getSocketsByRoom: typeof getSocketsByRoom;
    joinRooms: typeof joinRooms;
    leaveRooms: typeof leaveRooms;
    joinRequiredRooms: typeof joinRequiredRooms;
    joinAliasRooms: typeof joinAliasRooms;
};
export default _default;
