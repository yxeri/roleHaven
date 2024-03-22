'use strict';

import http from 'http';
import { appConfig } from '../config/defaults/config';

import errorCreator from '../error/errorCreator';

/**
 * Post request to external server
 * @param {Object} params Parameters.
 * @param {string} params.host Host name.
 * @param {string} params.path Path.
 * @param {Function} params.callback Callback.
 * @param {Object} params.data Data to send.
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
  })
    .on('error', (error) => {
      callback({
        error: new errorCreator.Internal({
          name: 'hacking api host',
          errorObject: error,
        }),
      });

      req.end();
    });

  req.write(dataString);
  req.end();
}

export { postRequest };
