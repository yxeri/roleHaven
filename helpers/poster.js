/*
 Copyright 2017 Carmilla Mina Jankovic

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

const { appConfig } = require('../config/defaults/config');
const http = require('http');
const errorCreator = require('../error/errorCreator');

/**
 * Post request to external server
 * @param {Object} params - Parameters.
 * @param {string} params.host - Host name.
 * @param {string} params.path - Path.
 * @param {Function} params.callback - Callback.
 * @param {Object} params.data - Data to send.
 */
function postRequest({
  host,
  path,
  data,
  callback,
}) {
  if (appConfig.bypassExternalConnections || appConfig.mode === appConfig.Modes.TEST) {
    callback({ data: { statusCode: 200 } });

    return;
  }

  if (!host || !path) {
    callback({ error: new errorCreator.InvalidData({ name: 'post request host or path missing' }) });

    return;
  }

  const dataString = JSON.stringify(data);
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
    response.on('aborted', () => {
      if (response.statusCode >= 400) {
        callback({ error: new errorCreator.External({ name: `status code ${response.statusCode}` }) });
      } else {
        callback({ data: { statusCode: response.statusCode } });
      }
    });

    response.on('end', () => {
      if (response.statusCode >= 400) {
        callback({ error: new errorCreator.External({ name: `status code ${response.statusCode}` }) });
      } else {
        callback({ data: { statusCode: response.statusCode } });
      }
    });
  }).on('error', (error) => {
    callback({ error: new errorCreator.Internal({ name: 'hacking api host', errorObject: error }) });

    req.end();
  });

  req.write(dataString);
  req.end();
}

exports.postRequest = postRequest;
