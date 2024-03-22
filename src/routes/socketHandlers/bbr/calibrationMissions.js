'use strict';
const calibrationMissionManager = require('../../../managers/bbr/calibrationMissions');
function handle(socket) {
    socket.on('getCalibrationMission', ({ userName, token, stationId, }, callback = () => {
    }) => {
        calibrationMissionManager.getActiveCalibrationMission({
            token,
            userName,
            stationId,
            callback,
        });
    });
    socket.on('getValidCalibrationStations', ({ userName, token, }, callback = () => {
    }) => {
        calibrationMissionManager.getValidStations({
            userName,
            token,
            callback,
        });
    });
}
export { handle };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2FsaWJyYXRpb25NaXNzaW9ucy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImNhbGlicmF0aW9uTWlzc2lvbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsWUFBWSxDQUFDO0FBRWIsTUFBTSx5QkFBeUIsR0FBRyxPQUFPLENBQUMsMkNBQTJDLENBQUMsQ0FBQztBQUt2RixTQUFTLE1BQU0sQ0FBQyxNQUFNO0lBQ3BCLE1BQU0sQ0FBQyxFQUFFLENBQUMsdUJBQXVCLEVBQUUsQ0FBQyxFQUNsQyxRQUFRLEVBQ1IsS0FBSyxFQUNMLFNBQVMsR0FDVixFQUFFLFFBQVEsR0FBRyxHQUFHLEVBQUU7SUFDbkIsQ0FBQyxFQUFFLEVBQUU7UUFDSCx5QkFBeUIsQ0FBQywyQkFBMkIsQ0FBQztZQUNwRCxLQUFLO1lBQ0wsUUFBUTtZQUNSLFNBQVM7WUFDVCxRQUFRO1NBQ1QsQ0FBQyxDQUFDO0lBQ0wsQ0FBQyxDQUFDLENBQUM7SUFFSCxNQUFNLENBQUMsRUFBRSxDQUFDLDZCQUE2QixFQUFFLENBQUMsRUFDeEMsUUFBUSxFQUNSLEtBQUssR0FDTixFQUFFLFFBQVEsR0FBRyxHQUFHLEVBQUU7SUFDbkIsQ0FBQyxFQUFFLEVBQUU7UUFDSCx5QkFBeUIsQ0FBQyxnQkFBZ0IsQ0FBQztZQUN6QyxRQUFRO1lBQ1IsS0FBSztZQUNMLFFBQVE7U0FDVCxDQUFDLENBQUM7SUFDTCxDQUFDLENBQUMsQ0FBQztBQUNMLENBQUM7QUFFRCxPQUFPLEVBQUUsTUFBTSxFQUFFLENBQUMifQ==