'use strict';
const lanternHackManager = require('../../../managers/bbr/lanternHacking');
function handle(socket, io) {
    socket.on('manipulateStation', ({ password, boostingSignal, stationId, token, }, callback = () => {
    }) => {
        lanternHackManager.manipulateStation({
            socket,
            io,
            password,
            boostingSignal,
            token,
            stationId,
            callback,
        });
    });
    socket.on('getLanternHack', ({ stationId, token, }, callback = () => {
    }) => {
        lanternHackManager.getLanternHack({
            stationId,
            token,
            callback,
        });
    });
    socket.on('getLanternInfo', ({ token }, callback = () => {
    }) => {
        lanternHackManager.getLanternInfo({
            token,
            callback,
        });
    });
}
export { handle };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGFudGVybkhhY2tpbmcuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJsYW50ZXJuSGFja2luZy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxZQUFZLENBQUM7QUFFYixNQUFNLGtCQUFrQixHQUFHLE9BQU8sQ0FBQyxzQ0FBc0MsQ0FBQyxDQUFDO0FBTTNFLFNBQVMsTUFBTSxDQUFDLE1BQU0sRUFBRSxFQUFFO0lBQ3hCLE1BQU0sQ0FBQyxFQUFFLENBQUMsbUJBQW1CLEVBQUUsQ0FBQyxFQUM5QixRQUFRLEVBQ1IsY0FBYyxFQUNkLFNBQVMsRUFDVCxLQUFLLEdBQ04sRUFBRSxRQUFRLEdBQUcsR0FBRyxFQUFFO0lBQ25CLENBQUMsRUFBRSxFQUFFO1FBQ0gsa0JBQWtCLENBQUMsaUJBQWlCLENBQUM7WUFDbkMsTUFBTTtZQUNOLEVBQUU7WUFDRixRQUFRO1lBQ1IsY0FBYztZQUNkLEtBQUs7WUFDTCxTQUFTO1lBQ1QsUUFBUTtTQUNULENBQUMsQ0FBQztJQUNMLENBQUMsQ0FBQyxDQUFDO0lBRUgsTUFBTSxDQUFDLEVBQUUsQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDLEVBQzNCLFNBQVMsRUFDVCxLQUFLLEdBQ04sRUFBRSxRQUFRLEdBQUcsR0FBRyxFQUFFO0lBQ25CLENBQUMsRUFBRSxFQUFFO1FBQ0gsa0JBQWtCLENBQUMsY0FBYyxDQUFDO1lBQ2hDLFNBQVM7WUFDVCxLQUFLO1lBQ0wsUUFBUTtTQUNULENBQUMsQ0FBQztJQUNMLENBQUMsQ0FBQyxDQUFDO0lBRUgsTUFBTSxDQUFDLEVBQUUsQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDLEVBQUUsS0FBSyxFQUFFLEVBQUUsUUFBUSxHQUFHLEdBQUcsRUFBRTtJQUN4RCxDQUFDLEVBQUUsRUFBRTtRQUNILGtCQUFrQixDQUFDLGNBQWMsQ0FBQztZQUNoQyxLQUFLO1lBQ0wsUUFBUTtTQUNULENBQUMsQ0FBQztJQUNMLENBQUMsQ0FBQyxDQUFDO0FBQ0wsQ0FBQztBQUVELE9BQU8sRUFBRSxNQUFNLEVBQUUsQ0FBQyJ9