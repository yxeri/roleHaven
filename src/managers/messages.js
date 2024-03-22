'use strict';
import appConfig from '../config/defaults/appConfig';
import dbConfig from '../config/defaults/dbConfig';
import authenticator from '../helpers/authenticator';
import dbMessage from '../db/connectors/message';
import errorCreator from '../error/errorCreator';
import objectValidator from '../utils/objectValidator';
import roomManager from './rooms';
import textTools from '../utils/textTools';
import managerHelper from '../helpers/manager';
import userManager from './users';
import aliasManager from './aliases';
import imager from '../helpers/imager';
function generateEmitType(message) {
    switch (message.messageType) {
        case dbConfig.MessageTypes.WHISPER: {
            return dbConfig.EmitTypes.WHISPER;
        }
        case dbConfig.MessageTypes.BROADCAST: {
            return dbConfig.EmitTypes.BROADCAST;
        }
        default: {
            return dbConfig.EmitTypes.CHATMSG;
        }
    }
}
function sendAndStoreMessage({ message, callback, io, emitType, image, socket, }) {
    const messageCallback = (chatMsg) => {
        dbMessage.createMessage({
            message: chatMsg,
            callback: ({ error, data, }) => {
                if (error) {
                    callback({ error });
                    return;
                }
                const dataToSend = {
                    data: {
                        message: data.message,
                        changeType: dbConfig.ChangeTypes.CREATE,
                    },
                };
                if (socket) {
                    socket.broadcast.to(message.roomId)
                        .emit(emitType, dataToSend);
                }
                else {
                    io.to(message.roomId)
                        .emit(emitType, dataToSend);
                }
                callback(dataToSend);
            },
        });
    };
    if (image) {
        imager.createImage({
            image,
            callback: ({ error: imageError, data: imageData, }) => {
                if (imageError) {
                    callback({ error: imageError });
                    return;
                }
                const { image: createdImage } = imageData;
                const chatMsg = message;
                chatMsg.image = createdImage;
                messageCallback(chatMsg);
            },
        });
        return;
    }
    messageCallback(message);
}
function getMessageById({ token, callback, messageId, internalCallUser, }) {
    managerHelper.getObjectById({
        token,
        internalCallUser,
        callback,
        objectId: messageId,
        objectType: 'message',
        objectIdType: 'messageId',
        dbCallFunc: getMessageById,
        commandName: dbConfig.apiCommands.GetMessage.name,
    });
}
function getMessagesByRoom({ token, callback, shouldGetFuture, startDate, roomId, }) {
    authenticator.isUserAllowed({
        token,
        commandName: dbConfig.apiCommands.GetHistory.name,
        callback: ({ error, data, }) => {
            if (error) {
                callback({ error });
                return;
            }
            const { user: authUser } = data;
            if (!authUser.accessLevel < dbConfig.AccessLevels.ADMIN && !authUser.followingRooms.includes(roomId)) {
                callback({ error: new errorCreator.NotAllowed({ name: `${dbConfig.apiCommands.GetHistory.name}. User: ${authUser.objectId}. Access: messages room ${roomId}` }) });
                return;
            }
            roomManager.getRoomById({
                roomId,
                internalCallUser: authUser,
                needsAccess: true,
                callback: ({ error: roomError }) => {
                    if (roomError) {
                        callback({ error: roomError });
                        return;
                    }
                    getMessagesByRoom({
                        startDate,
                        shouldGetFuture,
                        roomId,
                        callback,
                        user: authUser,
                    });
                },
            });
        },
    });
}
function getMessagesByUser({ token, callback, }) {
    managerHelper.getObjects({
        token,
        callback,
        shouldSort: true,
        sortName: 'customTimeCreated',
        fallbackSortName: 'timeCreated',
        commandName: dbConfig.apiCommands.GetMessage.name,
        objectsType: 'messages',
        dbCallFunc: getMessagesByUser,
    });
}
function getFullHistory({ token, callback, }) {
    authenticator.isUserAllowed({
        token,
        commandName: dbConfig.apiCommands.GetAllMessages.name,
        callback: ({ error, data, }) => {
            if (error) {
                callback({ error });
                return;
            }
            const { user: authUser } = data;
            dbMessage.getAllMessages({
                callback: ({ error: messagesError, data: messagesData, }) => {
                    if (messagesError) {
                        callback({ error: messagesError });
                        return;
                    }
                    roomManager.getAllRooms({
                        internalCallUser: authUser,
                        callback: ({ error: roomsError, data: roomsData, }) => {
                            if (roomsError) {
                                callback({ error: roomsError });
                                return;
                            }
                            userManager.getAllUsers({
                                internalCallUser: authUser,
                                callback: ({ error: usersError, data: usersData, }) => {
                                    if (usersError) {
                                        callback({ error: usersError });
                                        return;
                                    }
                                    aliasManager.getAllAliases({
                                        internalCallUser: authUser,
                                        callback: ({ error: aliasesError, data: aliasesData, }) => {
                                            if (aliasesError) {
                                                callback({ error: aliasesError });
                                                return;
                                            }
                                            const { aliases } = aliasesData;
                                            const { users } = usersData;
                                            const { rooms } = roomsData;
                                            const roomsCollection = rooms.map((room) => {
                                                const roomToSave = room;
                                                if (room.isWhisper) {
                                                    const firstParticipant = users[room.participantIds[0]] || aliases[room.participantIds[0]];
                                                    const secondParticipant = users[room.participantIds[1]] || aliases[room.participantIds[1]];
                                                    roomToSave.roomName = `Whisper: ${firstParticipant.username || firstParticipant.aliasName} <-> ${secondParticipant.username || secondParticipant.aliasName}`;
                                                }
                                                return roomToSave;
                                            });
                                            messagesData.messages.sort((a, b) => {
                                                const aTime = a.customTimeCreated || a.timeCreated;
                                                const bTime = b.customTimeCreated || b.timeCreated;
                                                if (aTime < bTime) {
                                                    return -1;
                                                }
                                                if (aTime > bTime) {
                                                    return 1;
                                                }
                                                return 0;
                                            })
                                                .forEach((message) => {
                                                const messageToSave = {
                                                    username: message.ownerAliasId
                                                        ?
                                                            aliases[message.ownerAliasId].aliasName
                                                        :
                                                            users[message.ownerId].username,
                                                    roomName: roomsCollection[message.roomId].roomName,
                                                    time: message.customTimeCreated || message.timeCreated,
                                                };
                                                roomsCollection[messageToSave.roomId].messages.push(messageToSave);
                                            });
                                            callback({
                                                data: {
                                                    rooms: roomsCollection,
                                                },
                                            });
                                        },
                                    });
                                },
                            });
                        },
                    });
                },
            });
        },
    });
}
function sendBroadcastMsg({ token, message, socket, callback, io, image, internalCallUser, }) {
    authenticator.isUserAllowed({
        token,
        internalCallUser,
        commandName: dbConfig.apiCommands.SendBroadcast.name,
        callback: ({ error, data, }) => {
            if (error) {
                callback({ error });
                return;
            }
            if (!objectValidator.isValidData({
                message,
                io,
            }, {
                message: { text: true },
                io: true,
            })) {
                callback({ error: new errorCreator.InvalidData({ expected: '{ message: { text }, io }' }) });
                return;
            }
            const text = message.text.join('');
            if (!image && (text.length > appConfig.broadcastMaxLength || text.length <= 0)) {
                callback({ error: new errorCreator.InvalidLength({ expected: `text length ${appConfig.broadcastMaxLength}` }) });
                return;
            }
            const { user: authUser } = data;
            const newMessage = message;
            newMessage.text = textTools.cleanText(message.text);
            newMessage.messageType = dbConfig.MessageTypes.BROADCAST;
            newMessage.roomId = dbConfig.rooms.bcast.objectId;
            if (message.ownerAliasId && !authUser.aliases.includes(message.ownerAliasId)) {
                callback({ error: new errorCreator.NotAllowed({ name: `${dbConfig.apiCommands.SendBroadcast.name}. User: ${authUser.objectId}. Access alias ${message.ownerAliasId}` }) });
                return;
            }
            sendAndStoreMessage({
                socket,
                io,
                callback,
                image,
                emitType: dbConfig.EmitTypes.BROADCAST,
                message: newMessage,
            });
        },
    });
}
function sendChatMsg({ token, message, socket, callback, io, image, internalCallUser, }) {
    authenticator.isUserAllowed({
        token,
        internalCallUser,
        commandName: dbConfig.apiCommands.SendMessage.name,
        callback: ({ error, data, }) => {
            if (error) {
                callback({ error });
                return;
            }
            if (!objectValidator.isValidData({
                message,
                io,
            }, {
                message: {
                    text: true,
                    roomId: true,
                },
                io: true,
            })) {
                callback({ error: new errorCreator.InvalidData({ expected: '{ message: { text }, io }' }) });
                return;
            }
            const text = message.text.join('');
            if (!image && (text.length > appConfig.messageMaxLength || text.length <= 0)) {
                callback({ error: new errorCreator.InvalidCharacters({ expected: `text length ${appConfig.messageMaxLength}` }) });
                return;
            }
            const { user: authUser } = data;
            const newMessage = message;
            newMessage.text = textTools.cleanText(message.text);
            newMessage.messageType = dbConfig.MessageTypes.CHAT;
            newMessage.ownerId = authUser.objectId;
            if (message.ownerAliasId && !authUser.aliases.includes(message.ownerAliasId)) {
                callback({ error: new errorCreator.NotAllowed({ name: `${dbConfig.apiCommands.SendMessage.name}. User: ${authUser.objectId}. Access alias ${message.ownerAliasId}` }) });
                return;
            }
            roomManager.getRoomById({
                needsAccess: true,
                internalCallUser: authUser,
                roomId: newMessage.roomId,
                callback: ({ error: roomError }) => {
                    if (roomError) {
                        callback({ error: roomError });
                        return;
                    }
                    sendAndStoreMessage({
                        socket,
                        io,
                        callback,
                        image,
                        emitType: dbConfig.EmitTypes.CHATMSG,
                        message: newMessage,
                    });
                },
            });
        },
    });
}
function sendWhisperMsg({ token, participantIds, message, socket, callback, io, image, }) {
    authenticator.isUserAllowed({
        token,
        commandName: dbConfig.apiCommands.SendWhisper.name,
        callback: ({ error, data, }) => {
            if (error) {
                callback({ error });
                return;
            }
            if (!objectValidator.isValidData({
                message,
                io,
            }, {
                message: {
                    text: true,
                    roomId: true,
                },
                io: true,
            })) {
                callback({ error: new errorCreator.InvalidData({ expected: '{ message: { text }, io }' }) });
                return;
            }
            const text = message.text.join('');
            if (!image && (text.length > appConfig.messageMaxLength || text.length <= 0)) {
                callback({ error: new errorCreator.InvalidCharacters({ expected: `text length ${appConfig.messageMaxLength}` }) });
                return;
            }
            const { user: authUser } = data;
            const newMessage = message;
            newMessage.text = textTools.cleanText(message.text);
            newMessage.messageType = dbConfig.MessageTypes.WHISPER;
            newMessage.ownerId = authUser.objectId;
            newMessage.ownerAliasId = participantIds.find((participant) => authUser.aliases.includes(participant));
            if (message.ownerAliasId && !authUser.aliases.includes(message.ownerAliasId)) {
                callback({ error: new errorCreator.NotAllowed({ name: `${dbConfig.apiCommands.SendWhisper.name}. User: ${authUser.objectId}. Access alias ${message.ownerAliasId}` }) });
                return;
            }
            roomManager.doesWhisperRoomExist({
                participantIds,
                callback: ({ error: existsError, data: existsData, }) => {
                    if (existsError) {
                        callback({ error: existsError });
                        return;
                    }
                    const { exists } = existsData;
                    if (!exists) {
                        roomManager.createAndFollowWhisperRoom({
                            participantIds,
                            socket,
                            io,
                            token,
                            user: authUser,
                            callback: (newWhisperData) => {
                                if (newWhisperData.error) {
                                    callback({ error: newWhisperData.error });
                                    return;
                                }
                                const { room: newRoom } = newWhisperData.data;
                                newMessage.roomId = newRoom.objectId;
                                roomManager.getRoomById({
                                    roomId: newMessage.roomId,
                                    internalCallUser: authUser,
                                    callback: (roomData) => {
                                        if (roomData.error) {
                                            callback({ error: roomData.error });
                                            return;
                                        }
                                        sendAndStoreMessage({
                                            socket,
                                            io,
                                            callback,
                                            image,
                                            emitType: dbConfig.EmitTypes.WHISPER,
                                            message: newMessage,
                                        });
                                    },
                                });
                            },
                        });
                        return;
                    }
                    roomManager.getRoomById({
                        needsAccess: true,
                        roomId: newMessage.roomId,
                        internalCallUser: authUser,
                        callback: (roomData) => {
                            if (roomData.error) {
                                callback({ error: roomData.error });
                                return;
                            }
                            sendAndStoreMessage({
                                socket,
                                io,
                                callback,
                                image,
                                emitType: dbConfig.EmitTypes.WHISPER,
                                message: newMessage,
                            });
                        },
                    });
                },
            });
        },
    });
}
function removeMessage({ messageId, callback, token, io, socket, internalCallUser, }) {
    managerHelper.removeObject({
        callback,
        token,
        io,
        socket,
        internalCallUser,
        getDbCallFunc: getMessageById,
        getCommandName: dbConfig.apiCommands.GetMessage.name,
        objectId: messageId,
        commandName: dbConfig.apiCommands.RemoveMessage.name,
        objectType: 'message',
        dbCallFunc: dbMessage.removeMessage,
        emitTypeGenerator: generateEmitType,
        objectIdType: 'messageId',
    });
}
function updateMessage({ messageId, message, callback, token, io, options, internalCallUser, }) {
    authenticator.isUserAllowed({
        token,
        internalCallUser,
        commandName: dbConfig.apiCommands.UpdateMessage.name,
        callback: ({ error, data, }) => {
            if (error) {
                callback({ error });
                return;
            }
            const authUser = internalCallUser || data.user;
            getMessageById({
                messageId,
                internCallUser: authUser,
                callback: ({ error: getError, data: getData, }) => {
                    if (getError) {
                        callback({ error: getError });
                        return;
                    }
                    const { message: oldMessage } = getData;
                    const { hasFullAccess, } = authenticator.hasAccessTo({
                        objectToAccess: oldMessage,
                        toAuth: authUser,
                    });
                    if (!hasFullAccess) {
                        callback({ error: new errorCreator.NotAllowed({ name: `${dbConfig.apiCommands.UpdateMessage.name}. User: ${authUser.objectId}. Access message ${messageId}` }) });
                        return;
                    }
                    updateMessage({
                        messageId,
                        message,
                        options,
                        callback: ({ error: updateError, data: updateData, }) => {
                            if (updateError) {
                                callback({ error: updateError });
                                return;
                            }
                            const { message: updatedMessage } = updateData;
                            const emitType = generateEmitType(updatedMessage);
                            const oldRoomId = oldMessage.roomId;
                            const sendToId = updatedMessage.roomId;
                            const dataToSend = {
                                data: {
                                    message: updatedMessage,
                                    changeType: dbConfig.ChangeTypes.UPDATE,
                                },
                            };
                            if (oldRoomId !== sendToId) {
                                const oldDataToSend = {
                                    data: {
                                        message: { objectId: oldMessage.objectId },
                                        changeType: dbConfig.ChangeTypes.REMOVE,
                                    },
                                };
                                io.to(oldRoomId)
                                    .emit(emitType, oldDataToSend);
                            }
                            io.to(sendToId)
                                .emit(emitType, dataToSend);
                            callback(dataToSend);
                        },
                    });
                },
            });
        },
    });
}
export { sendBroadcastMsg };
export { sendChatMsg };
export { sendWhisperMsg };
export { removeMessage as removeMesssage };
export { updateMessage };
export { getMessagesByRoom };
export { getMessageById };
export { getMessagesByUser };
export { getFullHistory };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVzc2FnZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJtZXNzYWdlcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxZQUFZLENBQUM7QUFFYixPQUFPLFNBQVMsTUFBTSw4QkFBOEIsQ0FBQztBQUNyRCxPQUFPLFFBQVEsTUFBTSw2QkFBNkIsQ0FBQztBQUNuRCxPQUFPLGFBQWEsTUFBTSwwQkFBMEIsQ0FBQztBQUNyRCxPQUFPLFNBQVMsTUFBTSwwQkFBMEIsQ0FBQztBQUNqRCxPQUFPLFlBQVksTUFBTSx1QkFBdUIsQ0FBQztBQUNqRCxPQUFPLGVBQWUsTUFBTSwwQkFBMEIsQ0FBQztBQUN2RCxPQUFPLFdBQVcsTUFBTSxTQUFTLENBQUM7QUFDbEMsT0FBTyxTQUFTLE1BQU0sb0JBQW9CLENBQUM7QUFDM0MsT0FBTyxhQUFhLE1BQU0sb0JBQW9CLENBQUM7QUFDL0MsT0FBTyxXQUFXLE1BQU0sU0FBUyxDQUFDO0FBQ2xDLE9BQU8sWUFBWSxNQUFNLFdBQVcsQ0FBQztBQUNyQyxPQUFPLE1BQU0sTUFBTSxtQkFBbUIsQ0FBQztBQU92QyxTQUFTLGdCQUFnQixDQUFDLE9BQU87SUFDL0IsUUFBUSxPQUFPLENBQUMsV0FBVyxFQUFFLENBQUM7UUFDOUIsS0FBSyxRQUFRLENBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7WUFDbkMsT0FBTyxRQUFRLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQztRQUNwQyxDQUFDO1FBQ0QsS0FBSyxRQUFRLENBQUMsWUFBWSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUM7WUFDckMsT0FBTyxRQUFRLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQztRQUN0QyxDQUFDO1FBQ0QsT0FBTyxDQUFDLENBQUMsQ0FBQztZQUNSLE9BQU8sUUFBUSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUM7UUFDcEMsQ0FBQztJQUNELENBQUM7QUFDSCxDQUFDO0FBV0QsU0FBUyxtQkFBbUIsQ0FBQyxFQUMzQixPQUFP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