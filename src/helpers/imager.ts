'use strict';

import sharp from 'sharp';
import { appConfig } from '../config/defaults/config';

import textTools from '../utils/textTools';

/**
 * Write an image and return image data.
 * A second smaller version of the image will also be generated with "imgThumb-" prepended to the file name.
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
  const imgBuffer = Buffer.from(image.source.replace(/data:image\/((png)|(jpeg)|(pjpeg));base64,/, ''), 'base64');

  sharp(imgBuffer)
    .resize(appConfig.imageMaxWidth, appConfig.imageMaxHeight, { fit: 'inside' })
    .rotate()
    .toFile(`${appConfig.publicBase}/images/upload/${fileName}`, (error, info) => {
      if (error) {
        callback({ error });

        return;
      }

      sharp(imgBuffer)
        .resize(appConfig.imageThumbMaxWidth, appConfig.imageThumbMaxHeight, { fit: 'inside' })
        .rotate()
        .toFile(`${appConfig.publicBase}/images/upload/imgThumb-${fileName}`, (thumbError) => {
          if (thumbError) {
            callback({ error: thumbError });

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
    });
}

export { createImage };
