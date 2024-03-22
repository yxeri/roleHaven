'use strict';
import sharp from 'sharp';
import { appConfig } from '../config/defaults/config';
import textTools from '../utils/textTools';
function createImage({ image, callback, }) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW1hZ2VyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiaW1hZ2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFlBQVksQ0FBQztBQUViLE9BQU8sS0FBSyxNQUFNLE9BQU8sQ0FBQztBQUMxQixPQUFPLEVBQUUsU0FBUyxFQUFFLE1BQU0sMkJBQTJCLENBQUM7QUFFdEQsT0FBTyxTQUFTLE1BQU0sb0JBQW9CLENBQUM7QUFTM0MsU0FBUyxXQUFXLENBQUMsRUFDbkIsS0FBSyxFQUNMLFFBQVEsR0FDVDtJQUNDLE1BQU0sUUFBUSxHQUFHLFNBQVMsQ0FBQyxhQUFhLENBQUM7UUFDdkMsSUFBSSxFQUFFLEtBQUssQ0FBQyxTQUFTO0tBQ3RCLENBQUMsQ0FBQztJQUNILE1BQU0sU0FBUyxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsNENBQTRDLEVBQUUsRUFBRSxDQUFDLEVBQUUsUUFBUSxDQUFDLENBQUM7SUFFaEgsS0FBSyxDQUFDLFNBQVMsQ0FBQztTQUNiLE1BQU0sQ0FBQyxTQUFTLENBQUMsYUFBYSxFQUFFLFNBQVMsQ0FBQyxjQUFjLEVBQUUsRUFBRSxHQUFHLEVBQUUsUUFBUSxFQUFFLENBQUM7U0FDNUUsTUFBTSxFQUFFO1NBQ1IsTUFBTSxDQUFDLEdBQUcsU0FBUyxDQUFDLFVBQVUsa0JBQWtCLFFBQVEsRUFBRSxFQUFFLENBQUMsS0FBSyxFQUFFLElBQUksRUFBRSxFQUFFO1FBQzNFLElBQUksS0FBSyxFQUFFLENBQUM7WUFDVixRQUFRLENBQUMsRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDO1lBRXBCLE9BQU87UUFDVCxDQUFDO1FBRUQsS0FBSyxDQUFDLFNBQVMsQ0FBQzthQUNiLE1BQU0sQ0FBQyxTQUFTLENBQUMsa0JBQWtCLEVBQUUsU0FBUyxDQUFDLG1CQUFtQixFQUFFLEVBQUUsR0FBRyxFQUFFLFFBQVEsRUFBRSxDQUFDO2FBQ3RGLE1BQU0sRUFBRTthQUNSLE1BQU0sQ0FBQyxHQUFHLFNBQVMsQ0FBQyxVQUFVLDJCQUEyQixRQUFRLEVBQUUsRUFBRSxDQUFDLFVBQVUsRUFBRSxFQUFFO1lBQ25GLElBQUksVUFBVSxFQUFFLENBQUM7Z0JBQ2YsUUFBUSxDQUFDLEVBQUUsS0FBSyxFQUFFLFVBQVUsRUFBRSxDQUFDLENBQUM7Z0JBRWhDLE9BQU87WUFDVCxDQUFDO1lBRUQsUUFBUSxDQUFDO2dCQUNQLElBQUksRUFBRTtvQkFDSixLQUFLLEVBQUU7d0JBQ0wsUUFBUTt3QkFDUixTQUFTLEVBQUUsS0FBSyxDQUFDLFNBQVM7d0JBQzFCLEtBQUssRUFBRSxJQUFJLENBQUMsS0FBSzt3QkFDakIsTUFBTSxFQUFFLElBQUksQ0FBQyxNQUFNO3FCQUNwQjtpQkFDRjthQUNGLENBQUMsQ0FBQztRQUNMLENBQUMsQ0FBQyxDQUFDO0lBQ1AsQ0FBQyxDQUFDLENBQUM7QUFDUCxDQUFDO0FBRUQsT0FBTyxFQUFFLFdBQVcsRUFBRSxDQUFDIn0=