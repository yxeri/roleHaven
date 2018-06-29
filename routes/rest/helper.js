/*
 Copyright 2017 Aleksandar Jankovic

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

'use strict';

const objectValidator = require('../../utils/objectValidator');
const messageManager = require('../../managers/messages');
const restErrorChecker = require('../../helpers/restErrorChecker');
const errorCreator = require('../../error/errorCreator');
const { dbConfig } = require('../../config/defaults/config');
const forumPostManager = require('../../managers/forumPosts');
const forumThreadManager = require('../../managers/forumThreads');
const transactionManager = require('../../managers/transactions');

/**
 * Send message. Called by the REST API.
 * @param {Object} params - Parameters.
 * @param {Object} params.request - Request.
 * @param {Object} params.response - Response.
 * @param {Object} params.io - Socket.io.
 */
function sendMessage({ request, response, io }) {
  if (!objectValidator.isValidData(request.body, { data: { message: { text: true } } })) {
    restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: 'data = { message: { text } } }' }), sentData: request.body.data });

    return;
  }

  const {
    image,
    message,
  } = request.body.data;
  const { authorization: token } = request.headers;
  const messageType = message.messageType || dbConfig.MessageTypes.CHAT;
  message.roomId = message.roomId || request.params.roomId;

  const callback = ({ data, error }) => {
    if (error) {
      restErrorChecker.checkAndSendError({ response, error, sentData: request.body.data });

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
        restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: '{ roomId in params or message object }' }) });

        return;
      }

      messageManager.sendChatMsg(messageData);

      break;
    }
  }
}

/**
 * Get messages. Called by the REST API.
 * @param {Object} params - Parameters.
 * @param {Object} params.request - Request.
 * @param {Object} params.response - Response
 */
function getMessages({ request, response }) {
  const { authorization: token } = request.headers;
  const { roomId } = request.params || request.query;
  const {
    startDate,
    shouldGetFuture,
    fullHistory,
  } = request.query;

  const callback = ({ error, data }) => {
    if (error) {
      restErrorChecker.checkAndSendError({ response, error });

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
  } else if (fullHistory) {
    messageManager.getFullHistory({
      token,
      callback,
    });
  } else {
    messageManager.getMessagesByUser({
      token,
      callback,
    });
  }
}

/**
 * Get forum posts. Called by the REST API.
 * @param {Object} params - Parameters.
 * @param {Object} params.request - Request.
 * @param {Object} params.response - Response.
 */
function getForumPosts({ request, response }) {
  const { threadId, forumId } = request.params || request.query;
  const { authorization: token } = request.headers;
  const { full } = request.query;

  const callback = ({ error, data }) => {
    if (error) {
      restErrorChecker.checkAndSendError({ response, error, sentData: request.body.data });

      return;
    }

    response.json({ data });
  };

  if (threadId) {
    forumPostManager.getPostsByThread({
      threadId,
      token,
      full,
      callback,
    });
  } else if (forumId) {
    forumPostManager.getPostsByForum({
      forumId,
      token,
      full,
      callback,
    });
  } else {
    forumPostManager.getPostsByUser({
      token,
      full,
      callback,
    });
  }
}

/**
 * Get forum threads. Called by REST API.
 * @param {Object} params - Parameters.
 * @param {Object} params.request - Request.
 * @param {Object} params.response - Response.
 */
function getForumThreads({ request, response }) {
  const { forumId } = request.params || request.query;
  const { authorization: token } = request.headers;
  const { full } = request.query;

  const callback = ({ error, data }) => {
    if (error) {
      restErrorChecker.checkAndSendError({ response, error });

      return;
    }

    response.json({ data });
  };

  if (forumId) {
    forumThreadManager.getForumThreadsByForum({
      forumId,
      token,
      full,
      callback,
    });
  } else {
    forumThreadManager.getThreadsByUser({
      token,
      callback,
      full,
    });
  }
}

/**
 * Create a forum post. Called by the REST API.
 * @param {Object} params - Parameters.
 * @param {Object} params.request - Request.
 * @param {Object} params.response - Response.
 * @param {Object} params.io - Socket.io.
 */
function createForumPost({ request, response, io }) {
  if (!objectValidator.isValidData(request.body, { data: { post: { text: true } } })) {
    restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: '{ data: { post } }' }), sentData: request.body.data });

    return;
  }

  const { authorization: token } = request.headers;
  const { post } = request.body.data;
  post.threadId = post.threadId || request.params.threadId;

  forumPostManager.createPost({
    io,
    token,
    post,
    callback: ({ error, data }) => {
      if (error) {
        restErrorChecker.checkAndSendError({ response, error, sentData: request.body.data });

        return;
      }

      response.json({ data });
    },
  });
}

/**
 * Create a forum thread. Called by the REST API.
 * @param {Object} params - Parameters.
 * @param {Object} params.request - Request.
 * @param {Object} params.response - Response.
 * @param {Object} params.io - Socket.io.
 */
function createThread({ request, response, io }) {
  if (!objectValidator.isValidData(request.body, { data: { thread: { title: true, text: true } } })) {
    restErrorChecker.checkAndSendError({ response, error: new errorCreator.InvalidData({ expected: 'data = { thread: { title, text } }' }), sentData: request.body.data });

    return;
  }

  const { authorization: token } = request.headers;
  const { thread } = request.body.data;
  thread.forumId = thread.forumId || request.params.forumId;

  forumThreadManager.createThread({
    io,
    token,
    thread,
    callback: ({ error, data }) => {
      if (error) {
        restErrorChecker.checkAndSendError({ response, error, sentData: request.body.data });

        return;
      }

      response.json({ data });
    },
  });
}

exports.sendMessage = sendMessage;
exports.createForumPost = createForumPost;
exports.getMessages = getMessages;
exports.getForumPosts = getForumPosts;
exports.getForumThreads = getForumThreads;
exports.createThread = createThread;
