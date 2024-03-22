'use strict';
import http from 'http';
import { appConfig } from '../config/defaults/config';
import errorCreator from '../error/errorCreator';
function postRequest({ host, path, data, callback, }) {
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
            }
            else {
                callback({ data: { statusCode: response.statusCode } });
            }
        });
        response.on('end', () => {
            if (response.statusCode >= 400) {
                callback({ error: new errorCreator.External({ name: `status code ${response.statusCode}` }) });
            }
            else {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9zdGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsicG9zdGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFlBQVksQ0FBQztBQUViLE9BQU8sSUFBSSxNQUFNLE1BQU0sQ0FBQztBQUN4QixPQUFPLEVBQUUsU0FBUyxFQUFFLE1BQU0sMkJBQTJCLENBQUM7QUFFdEQsT0FBTyxZQUFZLE1BQU0sdUJBQXVCLENBQUM7QUFVakQsU0FBUyxXQUFXLENBQUMsRUFDbkIsSUFBSSxFQUNKLElBQUksRUFDSixJQUFJLEVBQ0osUUFBUSxHQUNUO0lBQ0MsSUFBSSxTQUFTLENBQUMseUJBQXlCLElBQUksU0FBUyxDQUFDLElBQUksS0FBSyxTQUFTLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxDQUFDO1FBQ25GLFFBQVEsQ0FBQyxFQUFFLElBQUksRUFBRSxFQUFFLFVBQVUsRUFBRSxHQUFHLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFFeEMsT0FBTztJQUNULENBQUM7SUFFRCxJQUFJLENBQUMsSUFBSSxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDbkIsUUFBUSxDQUFDLEVBQUUsS0FBSyxFQUFFLElBQUksWUFBWSxDQUFDLFdBQVcsQ0FBQyxFQUFFLElBQUksRUFBRSxtQ0FBbUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBRWpHLE9BQU87SUFDVCxDQUFDO0lBRUQsTUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUN4QyxNQUFNLE9BQU8sR0FBRztRQUNkLElBQUk7UUFDSixJQUFJO1FBQ0osT0FBTyxFQUFFO1lBQ1AsY0FBYyxFQUFFLGtCQUFrQjtZQUNsQyxnQkFBZ0IsRUFBRSxVQUFVLENBQUMsTUFBTTtTQUNwQztRQUNELE1BQU0sRUFBRSxNQUFNO0tBQ2YsQ0FBQztJQUVGLE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUMsUUFBUSxFQUFFLEVBQUU7UUFDN0MsUUFBUSxDQUFDLEVBQUUsQ0FBQyxTQUFTLEVBQUUsR0FBRyxFQUFFO1lBQzFCLElBQUksUUFBUSxDQUFDLFVBQVUsSUFBSSxHQUFHLEVBQUUsQ0FBQztnQkFDL0IsUUFBUSxDQUFDLEVBQUUsS0FBSyxFQUFFLElBQUksWUFBWSxDQUFDLFFBQVEsQ0FBQyxFQUFFLElBQUksRUFBRSxlQUFlLFFBQVEsQ0FBQyxVQUFVLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQ2pHLENBQUM7aUJBQU0sQ0FBQztnQkFDTixRQUFRLENBQUMsRUFBRSxJQUFJLEVBQUUsRUFBRSxVQUFVLEVBQUUsUUFBUSxDQUFDLFVBQVUsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUMxRCxDQUFDO1FBQ0gsQ0FBQyxDQUFDLENBQUM7UUFFSCxRQUFRLENBQUMsRUFBRSxDQUFDLEtBQUssRUFBRSxHQUFHLEVBQUU7WUFDdEIsSUFBSSxRQUFRLENBQUMsVUFBVSxJQUFJLEdBQUcsRUFBRSxDQUFDO2dCQUMvQixRQUFRLENBQUMsRUFBRSxLQUFLLEVBQUUsSUFBSSxZQUFZLENBQUMsUUFBUSxDQUFDLEVBQUUsSUFBSSxFQUFFLGVBQWUsUUFBUSxDQUFDLFVBQVUsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDakcsQ0FBQztpQkFBTSxDQUFDO2dCQUNOLFFBQVEsQ0FBQyxFQUFFLElBQUksRUFBRSxFQUFFLFVBQVUsRUFBRSxRQUFRLENBQUMsVUFBVSxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQzFELENBQUM7UUFDSCxDQUFDLENBQUMsQ0FBQztJQUNMLENBQUMsQ0FBQztTQUNDLEVBQUUsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxLQUFLLEVBQUUsRUFBRTtRQUNyQixRQUFRLENBQUM7WUFDUCxLQUFLLEVBQUUsSUFBSSxZQUFZLENBQUMsUUFBUSxDQUFDO2dCQUMvQixJQUFJLEVBQUUsa0JBQWtCO2dCQUN4QixXQUFXLEVBQUUsS0FBSzthQUNuQixDQUFDO1NBQ0gsQ0FBQyxDQUFDO1FBRUgsR0FBRyxDQUFDLEdBQUcsRUFBRSxDQUFDO0lBQ1osQ0FBQyxDQUFDLENBQUM7SUFFTCxHQUFHLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxDQUFDO0lBQ3RCLEdBQUcsQ0FBQyxHQUFHLEVBQUUsQ0FBQztBQUNaLENBQUM7QUFFRCxPQUFPLEVBQUUsV0FBVyxFQUFFLENBQUMifQ==