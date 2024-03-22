'use strict';
import objectValidator from '../../utils/objectValidator';
import messageManager from '../../managers/messages';
import restErrorChecker from '../../helpers/restErrorChecker';
import errorCreator from '../../error/errorCreator';
import { dbConfig } from '../../config/defaults/config';
import forumPostManager from '../../managers/forumPosts';
import forumThreadManager from '../../managers/forumThreads';
function sendMessage({ request, response, io, }) {
    if (!objectValidator.isValidData(request.body, { data: { message: { text: true } } })) {
        restErrorChecker.checkAndSendError({
            response,
            error: new errorCreator.InvalidData({ expected: 'data = { message: { text } } }' }),
            sentData: request.body.data,
        });
        return;
    }
    const { image, message, } = request.body.data;
    const { authorization: token } = request.headers;
    const messageType = message.messageType || dbConfig.MessageTypes.CHAT;
    message.roomId = message.roomId || request.params.roomId;
    const callback = ({ data, error, }) => {
        if (error) {
            restErrorChecker.checkAndSendError({
                response,
                error,
                sentData: request.body.data,
            });
            return;
        }
        response.json({ data });
    };
    const messageData = {
        token,
        message,
        callback,
        io,
        image,
    };
    switch (messageType) {
        case dbConfig.MessageTypes.WHISPER: {
            messageManager.sendWhisperMsg(messageData);
            break;
        }
        case dbConfig.MessageTypes.BROADCAST: {
            messageManager.sendBroadcastMsg(messageData);
            break;
        }
        default: {
            if (!message.roomId) {
                restErrorChecker.checkAndSendError({
                    response,
                    error: new errorCreator.InvalidData({ expected: '{ roomId in params or message object }' }),
                });
                return;
            }
            messageManager.sendChatMsg(messageData);
            break;
        }
    }
}
function getMessages({ request, response, }) {
    const { authorization: token } = request.headers;
    const { roomId } = request.params || request.query;
    const { startDate, shouldGetFuture, fullHistory, } = request.query;
    const callback = ({ error, data, }) => {
        if (error) {
            restErrorChecker.checkAndSendError({
                response,
                error,
            });
            return;
        }
        response.json({ data });
    };
    if (roomId) {
        messageManager.getMessagesByRoom({
            roomId,
            token,
            startDate,
            shouldGetFuture,
            callback,
        });
    }
    else if (fullHistory) {
        messageManager.getFullHistory({
            token,
            callback,
        });
    }
    else {
        messageManager.getMessagesByUser({
            token,
            callback,
        });
    }
}
function getForumPosts({ request, response, }) {
    const { threadId, forumId, } = request.params || request.query;
    const { authorization: token } = request.headers;
    const callback = ({ error, data, }) => {
        if (error) {
            restErrorChecker.checkAndSendError({
                response,
                error,
                sentData: request.body.data,
            });
            return;
        }
        response.json({ data });
    };
    if (threadId) {
        forumPostManager.getPostsByThreads({
            threadIds: [threadId],
            token,
            callback,
        });
    }
    else if (forumId) {
        forumPostManager.getPostsByForum({
            forumId,
            token,
            callback,
        });
    }
    else {
        forumPostManager.getPostsByUser({
            token,
            callback,
        });
    }
}
function getForumThreads({ request, response, }) {
    const { forumId } = request.params || request.query;
    const { authorization: token } = request.headers;
    const callback = ({ error, data, }) => {
        if (error) {
            restErrorChecker.checkAndSendError({
                response,
                error,
            });
            return;
        }
        response.json({ data });
    };
    if (forumId) {
        forumThreadManager.getForumThreadsByForum({
            forumId,
            token,
            callback,
        });
    }
    else {
        forumThreadManager.getThreadsByUser({
            token,
            callback,
        });
    }
}
function createForumPost({ request, response, io, }) {
    if (!objectValidator.isValidData(request.body, { data: { post: { text: true } } })) {
        restErrorChecker.checkAndSendError({
            response,
            error: new errorCreator.InvalidData({ expected: '{ data: { post } }' }),
            sentData: request.body.data,
        });
        return;
    }
    const { authorization: token } = request.headers;
    const { post } = request.body.data;
    post.threadId = post.threadId || request.params.threadId;
    forumPostManager.createPost({
        io,
        token,
        post,
        callback: ({ error, data, }) => {
            if (error) {
                restErrorChecker.checkAndSendError({
                    response,
                    error,
                    sentData: request.body.data,
                });
                return;
            }
            response.json({ data });
        },
    });
}
function createThread({ request, response, io, }) {
    if (!objectValidator.isValidData(request.body, {
        data: {
            thread: {
                title: true,
                text: true,
            },
        },
    })) {
        restErrorChecker.checkAndSendError({
            response,
            error: new errorCreator.InvalidData({ expected: 'data = { thread: { title, text } }' }),
            sentData: request.body.data,
        });
        return;
    }
    const { authorization: token } = request.headers;
    const { thread } = request.body.data;
    thread.forumId = thread.forumId || request.params.forumId;
    createThread({
        io,
        token,
        thread,
        callback: ({ error, data, }) => {
            if (error) {
                restErrorChecker.checkAndSendError({
                    response,
                    error,
                    sentData: request.body.data,
                });
                return;
            }
            response.json({ data });
        },
    });
}
export { sendMessage };
export { createForumPost };
export { getMessages };
export { getForumPosts };
export { getForumThreads };
export { createThread };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGVscGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiaGVscGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFlBQVksQ0FBQztBQUViLE9BQU8sZUFBZSxNQUFNLDZCQUE2QixDQUFDO0FBQzFELE9BQU8sY0FBYyxNQUFNLHlCQUF5QixDQUFDO0FBQ3JELE9BQU8sZ0JBQWdCLE1BQU0sZ0NBQWdDLENBQUM7QUFDOUQsT0FBTyxZQUFZLE1BQU0sMEJBQTBCLENBQUM7QUFDcEQsT0FBTyxFQUFFLFFBQVEsRUFBRSxNQUFNLDhCQUE4QixDQUFDO0FBRXhELE9BQU8sZ0JBQWdCLE1BQU0sMkJBQTJCLENBQUM7QUFDekQsT0FBTyxrQkFBa0IsTUFBTSw2QkFBNkIsQ0FBQztBQVM3RCxTQUFTLFdBQVcsQ0FBQyxFQUNuQixPQUFPLEVBQ1AsUUFBUSxFQUNSLEVBQUUsR0FDSDtJQUNDLElBQUksQ0FBQyxlQUFlLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsRUFBRSxJQUFJLEVBQUUsRUFBRSxPQUFPLEVBQUUsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQztRQUN0RixnQkFBZ0IsQ0FBQyxpQkFBaUIsQ0FBQztZQUNqQyxRQUFRO1lBQ1IsS0FBSyxFQUFFLElBQUksWUFBWSxDQUFDLFdBQVcsQ0FBQyxFQUFFLFFBQVEsRUFBRSxnQ0FBZ0MsRUFBRSxDQUFDO1lBQ25GLFFBQVEsRUFBRSxPQUFPLENBQUMsSUFBSSxDQUFDLElBQUk7U0FDNUIsQ0FBQyxDQUFDO1FBRUgsT0FBTztJQUNULENBQUM7SUFFRCxNQUFNLEVBQ0osS0FBSyxFQUNMLE9BQU8sR0FDUixHQUFHLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDO0lBQ3RCLE1BQU0sRUFBRSxhQUFhLEVBQUUsS0FBSyxFQUFFLEdBQUcsT0FBTyxDQUFDLE9BQU8sQ0FBQztJQUNqRCxNQUFNLFdBQVcsR0FBRyxPQUFPLENBQUMs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