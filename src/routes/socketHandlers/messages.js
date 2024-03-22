'use strict';
const messageManager = require('../../managers/messages');
const { dbConfig } = require('../../config/defaults/config');
const errorCreator = require('../../error/errorCreator');
function handle(socket, io) {
    socket.on('sendMessage', (params, callback = () => {
    }) => {
        const { message } = params;
        const { messageType = '' } = message;
        params.callback = callback;
        params.io = io;
        params.socket = socket;
        switch (messageType) {
            case dbConfig.MessageTypes.BROADCAST: {
                messageManager.sendBroadcastMsg(params);
                break;
            }
            case dbConfig.MessageTypes.WHISPER: {
                messageManager.sendWhisperMsg(params);
                break;
            }
            case dbConfig.MessageTypes.CHAT: {
                messageManager.sendChatMsg(params);
                break;
            }
            default: {
                callback({ error: new errorCreator.Incorrect({ name: 'messageType' }) });
                break;
            }
        }
    });
    socket.on('updateMessage', (params, callback = () => {
    }) => {
        params.callback = callback;
        params.io = io;
        params.socket = socket;
        messageManager.updateMessage(params);
    });
    socket.on('removeMessage', (params, callback = () => {
    }) => {
        params.callback = callback;
        params.io = io;
        params.socket = socket;
        messageManager.removeMesssage(params);
    });
    socket.on('getMessage', (params, callback = () => {
    }) => {
        params.callback = callback;
        params.io = io;
        params.socket = socket;
        messageManager.getMessageById(params);
    });
    socket.on('getMessages', (params, callback = () => {
    }) => {
        params.callback = callback;
        params.io = io;
        params.socket = socket;
        if (params.fullHistory) {
            messageManager.getFullHistory(params);
        }
        else {
            messageManager.getMessagesByUser(params);
        }
    });
    socket.on('getMessagesByRoom', (params, callback = () => {
    }) => {
        params.callback = callback;
        params.io = io;
        params.socket = socket;
        messageManager.getMessagesByRoom(params);
    });
}
export { handle };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVzc2FnZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJtZXNzYWdlcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxZQUFZLENBQUM7QUFFYixNQUFNLGNBQWMsR0FBRyxPQUFPLENBQUMseUJBQXlCLENBQUMsQ0FBQztBQUMxRCxNQUFNLEVBQUUsUUFBUSxFQUFFLEdBQUcsT0FBTyxDQUFDLDhCQUE4QixDQUFDLENBQUM7QUFDN0QsTUFBTSxZQUFZLEdBQUcsT0FBTyxDQUFDLDBCQUEwQixDQUFDLENBQUM7QUFRekQsU0FBUyxNQUFNLENBQUMsTUFBTSxFQUFFLEVBQUU7SUFDeEIsTUFBTSxDQUFDLEVBQUUsQ0FBQyxhQUFhLEVBQUUsQ0FBQyxNQUFNLEVBQUUsUUFBUSxHQUFHLEdBQUcsRUFBRTtJQUNsRCxDQUFDLEVBQUUsRUFBRTtRQUNILE1BQU0sRUFBRSxPQUFPLEVBQUUsR0FBRyxNQUFNLENBQUM7UUFDM0IsTUFBTSxFQUFFLFdBQVcsR0FBRyxFQUFFLEVBQUUsR0FBRyxPQUFPLENBQUM7UUFFckMsTUFBTSxDQUFDLFFBQVEsR0FBRyxRQUFRLENBQUM7UUFDM0IsTUFBTSxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUM7UUFDZixNQUFNLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQztRQUV2QixRQUFRLFdBQVcsRUFBRSxDQUFDO1lBQ3RCLEtBQUssUUFBUSxDQUFDLFlBQVksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDO2dCQUNyQyxjQUFjLENBQUMsZ0JBQWdCLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBRXhDLE1BQU07WUFDUixDQUFDO1lBQ0QsS0FBSyxRQUFRLENBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7Z0JBQ25DLGNBQWMsQ0FBQyxjQUFjLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBRXRDLE1BQU07WUFDUixDQUFDO1lBQ0QsS0FBSyxRQUFRLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7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