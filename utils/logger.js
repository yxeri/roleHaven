/*
 Copyright 2015 Aleksandar Jankovic

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

const messenger = require('./../socketHelpers/messenger');
const objectValidator = require('./objectValidator');

/*
 * Possible error codes with number and text representation, for usage towards users or internal
 */
const ErrorCodes = {
  db: {
    text: 'Database',
    num: 1,
  },
  unauth: {
    text: 'Unauthorized',
    num: 2,
  },
  notFound: {
    text: 'Not found',
    num: 3,
  },
  general: {
    text: 'General',
    num: 4,
  },
};

/**
 * Prints error message to server log
 * @param {Object} code - Error code
 * @param {string[]} text - Text to be printed
 * @param {Object} err - Thrown error
 */
function printErrorMsg(code, text, err) {
  console.log('[ERROR]', code.text, text.join('\n'), '- Error:', err || '');
}

/**
 * Prepares the error message and prints it
 * @param {Object} params - Parameters
 * @param {Object} params.code - Error code
 * @param {string[]} params.text - Error text
 * @param {Object} [params.err] - Thrown error
 */
function sendErrorMsg({ code, text, err }) {
  if (!objectValidator.isValidData({ code, text, err }, { code: true, text: true })) {
    return;
  }

  printErrorMsg(code, text, err);
}

/**
 * Prepares the errmor message and prints it both server log and to client
 * @param {Object} params - Parameters
 * @param {Object} params.code - Error code
 * @param {string[]} params.text - Error text
 * @param {string[]} [params.text_se] - Error text (Swedish)
 * @param {Object} params.socket - Socket.IO socket
 * @param {Object} [params.err] - Thrown error
 */
function sendSocketErrorMsg({ socket, code, text, err }) {
  if (!objectValidator.isValidData({ socket, code, text, err }, { socket: true, code: true, text: true })) {
    return;
  }

  const modifiedText = text;
  modifiedText[0] = `[${code.num}] ${text[0]}`;

  messenger.sendSelfMsg({
    socket,
    message: {
      text: modifiedText,
    },
  });
  printErrorMsg(code, modifiedText, err);
}

/**
 * Prints info message to server log
 * @param {string} text - Text to be printed
 */
function sendInfoMsg(text) {
  console.log('[INFO]', text);
}

exports.ErrorCodes = ErrorCodes;
exports.sendErrorMsg = sendErrorMsg;
exports.sendSocketErrorMsg = sendSocketErrorMsg;
exports.sendInfoMsg = sendInfoMsg;
