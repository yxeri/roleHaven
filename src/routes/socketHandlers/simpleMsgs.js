'use strict';
import simpleMsgManager from '../../managers/simpleMsgs';
function handle(socket, io) {
    socket.on('sendSimpleMsg', (params, callback = () => {
    }) => {
        params.callback = callback;
        params.io = io;
        params.socket = socket;
        simpleMsgManager.sendSimpleMsg(params);
    });
    socket.on('updateSimpleMsg', (params, callback = () => {
    }) => {
        params.callback = callback;
        params.io = io;
        params.socket = socket;
        simpleMsgManager.updateSimpleMsg(params);
    });
    socket.on('removeSimpleMsg', (params, callback = () => {
    }) => {
        params.callback = callback;
        params.io = io;
        params.socket = socket;
        simpleMsgManager.removeSimpleMsg(params);
    });
    socket.on('getSimpleMsg', (params, callback = () => {
    }) => {
        params.callback = callback;
        params.io = io;
        params.socket = socket;
        simpleMsgManager.getSimpleMsgById(params);
    });
    socket.on('getSimpleMsgs', (params, callback = () => {
    }) => {
        params.callback = callback;
        params.io = io;
        params.socket = socket;
        simpleMsgManager.getSimpleMsgsByUser(params);
    });
}
export { handle };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2ltcGxlTXNncy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInNpbXBsZU1zZ3MudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsWUFBWSxDQUFDO0FBRWIsT0FBTyxnQkFBZ0IsTUFBTSwyQkFBMkIsQ0FBQztBQVF6RCxTQUFTLE1BQU0sQ0FBQyxNQUFNLEVBQUUsRUFBRTtJQUN4QixNQUFNLENBQUMsRUFBRSxDQUFDLGVBQWUsRUFBRSxDQUFDLE1BQU0sRUFBRSxRQUFRLEdBQUcsR0FBRyxFQUFFO0lBQ3BELENBQUMsRUFBRSxFQUFFO1FBQ0gsTUFBTSxDQUFDLFFBQVEsR0FBRyxRQUFRLENBQUM7UUFDM0IsTUFBTSxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUM7UUFDZixNQUFNLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQztRQUV2QixnQkFBZ0IsQ0FBQyxhQUFhLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDekMsQ0FBQyxDQUFDLENBQUM7SUFFSCxNQUFNLENBQUMsRUFBRSxDQUFDLGlCQUFpQixFQUFFLENBQUMsTUFBTSxFQUFFLFFBQVEsR0FBRyxHQUFHLEVBQUU7SUFDdEQsQ0FBQyxFQUFFLEVBQUU7UUFDSCxNQUFNLENBQUMsUUFBUSxHQUFHLFFBQVEsQ0FBQztRQUMzQixNQUFNLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQztRQUNmLE1BQU0sQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDO1FBRXZCLGdCQUFnQixDQUFDLGVBQWUsQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUMzQyxDQUFDLENBQUMsQ0FBQztJQUVILE1BQU0sQ0FBQyxFQUFFLENBQUMsaUJBQWlCLEVBQUUsQ0FBQyxNQUFNLEVBQUUsUUFBUSxHQUFHLEdBQUcsRUFBRTtJQUN0RCxDQUFDLEVBQUUsRUFBRTtRQUNILE1BQU0sQ0FBQyxRQUFRLEdBQUcsUUFBUSxDQUFDO1FBQzNCLE1BQU0sQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDO1FBQ2YsTUFBTSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUM7UUFFdkIsZ0JBQWdCLENBQUMsZUFBZSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQzNDLENBQUMsQ0FBQyxDQUFDO0lBRUgsTUFBTSxDQUFDLEVBQUUsQ0FBQyxjQUFjLEVBQUUsQ0FBQyxNQUFNLEVBQUUsUUFBUSxHQUFHLEdBQUcsRUFBRTtJQUNuRCxDQUFDLEVBQUUsRUFBRTtRQUNILE1BQU0sQ0FBQyxRQUFRLEdBQUcsUUFBUSxDQUFDO1FBQzNCLE1BQU0sQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDO1FBQ2YsTUFBTSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUM7UUFFdkIsZ0JBQWdCLENBQUMsZ0JBQWdCLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDNUMsQ0FBQyxDQUFDLENBQUM7SUFFSCxNQUFNLENBQUMsRUFBRSxDQUFDLGVBQWUsRUFBRSxDQUFDLE1BQU0sRUFBRSxRQUFRLEdBQUcsR0FBRyxFQUFFO0lBQ3BELENBQUMsRUFBRSxFQUFFO1FBQ0gsTUFBTSxDQUFDLFFBQVEsR0FBRyxRQUFRLENBQUM7UUFDM0IsTUFBTSxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUM7UUFDZixNQUFNLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQztRQUV2QixnQkFBZ0IsQ0FBQyxtQkFBbUIsQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUMvQyxDQUFDLENBQUMsQ0FBQztBQUNMLENBQUM7QUFFRCxPQUFPLEVBQUUsTUFBTSxFQUFFLENBQUMifQ==