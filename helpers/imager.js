/*
 Copyright 2019 Carmilla Mina Jankovic

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

const sharp = require('sharp');

const { appConfig } = require('../config/defaults/config');
const textTools = require('../utils/textTools');

/**
 * Write an image and return image data.
 * @param {Object} params Parameters.
 * @param {Object} params.image Image data.
 * @param {Function} params.callback Callback.
 */
function createImage({
  image,
  callback,
}) {
  const fileName = textTools.buildFileName({
    name: image.imageName,
  });
  const imgBuffer = Buffer.from(image.source.replace(/data:image\/((png)|(jpeg));base64,/, ''), 'base64');

  sharp(imgBuffer)
    .resize(appConfig.imageMaxWidth, appConfig.imageMaxHeight, { fit: 'inside' })
    .toFile(`${appConfig.publicBase}/images/upload/${fileName}`, (error, info) => {
      if (error) {
        console.log(error);
        callback({ error });

        return;
      }

      callback({
        data: {
          image: {
            fileName,
            imageName: image.imageName,
            width: info.width,
            height: info.height,
          },
        },
      });
    });
}

exports.createImage = createImage;
