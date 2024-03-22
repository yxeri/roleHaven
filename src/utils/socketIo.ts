'use strict';

import { RemoteSocket, Server, Socket } from 'socket.io';
// @ts-expect-error needed type
import { EventMap } from 'socket.io/dist/typed-events.js';
import { dbConfig } from 'src/config/defaults/index.js';

async function getUserSocket({
  io,
  socketId,
}: {
  io: Server;
  socketId: string;
}): Promise<RemoteSocket<EventMap, unknown> | undefined> {
  const sockets = await io.sockets.fetchSockets();

  return sockets.find((socket) => socket.id === socketId);
}

async function getSocketsByRoom({
  io,
  roomId,
}: {
  io: Server;
  roomId: string;
}): Promise<RemoteSocket<EventMap, unknown>[]> {
  return await io.sockets.in(roomId).fetchSockets();
}

async function joinRooms({
  roomIds,
  io,
  socketId,
  userId,
}: {
  io: Server;
  socketId: string;
  userId: string;
  roomIds: string[];
}) {
  const userSocket = await getUserSocket({
    io,
    socketId,
  });


  if (userSocket) {
    roomIds.forEach((roomId) => userSocket.join(roomId));
    userSocket.join(userId);
  }

  return userSocket;
}

async function joinRequiredRooms({
  io,
  socketId,
  userId,
  socket,
  accessLevel,
}: {
  io: Server;
  socketId: string;
  userId: string;
  socket?: Socket;
  accessLevel?: number;
}): Promise<RemoteSocket<EventMap, unknown> | Socket | undefined> {
  const userSocket = socket ?? await getUserSocket({
    io,
    socketId,
  });

  if (userSocket) {
    dbConfig.requiredRooms.forEach((roomId) => userSocket.join(roomId));

    if (userId) {
      userSocket.join(userId);
    }

    if (accessLevel) {
      for (let i = 0; i <= accessLevel; i += 1) {
        userSocket.join(i.toString());
      }
    }
  }

  return userSocket;
}

async function joinAliasRooms({
  io,
  socketId,
  aliases,
}: {
  io: Server;
  socketId: string;
  aliases: string[];
}) {
  const userSocket = await getUserSocket({
    io,
    socketId,
  });

  if (userSocket) {
    aliases.forEach((aliasId) => userSocket.join(aliasId));
  }

  return userSocket;
}

async function leaveRooms({
  roomIds,
  io,
  socketId,
}: {
  io: Server;
  socketId: string;
  roomIds: string[];
}) {
  const userSocket = await getUserSocket({
    io,
    socketId,
  });

  if (userSocket) {
    roomIds.forEach((roomId) => userSocket.join(roomId));
  }

  return userSocket;
}

export default {
  getUserSocket,
  getSocketsByRoom,
  joinRooms,
  leaveRooms,
  joinRequiredRooms,
  joinAliasRooms,
};
