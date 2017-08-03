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

const appConfig = require('../config/defaults/config').app;
const http = require('http');

/**
 * Post request to external server
 * @param {string} params.host Host name
 * @param {string} params.path Path
 * @param {boolean} params.shouldBypass Should the request be bypassed. Used if external sources no longer exists
 * @param {Function} params.callback Callback
 * @param {Object} params.data Data to send
 */
function postRequest({ host, path, data, shouldBypass, callback }) {
  if (shouldBypass || appConfig.mode === appConfig.Modes.TEST) {
    callback(200);

    return;
  }

  const dataString = JSON.stringify({ data });
  const options = {
    host,
    path,
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': dataString.length,
    },
    method: 'POST',
  };

  const req = http.request(options, (response) => {
    response.on('end', () => {
      callback(response.statusCode);
    });
  });

  req.write(dataString);
  req.end();
}

exports.postRequest = postRequest;
