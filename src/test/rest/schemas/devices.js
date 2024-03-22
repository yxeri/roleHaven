'use strict';
const tools = require('../helper/tools');
const { dbConfig } = require('../../../config/defaults/config');
const schemas = {};
schemas.device = tools.buildLiteSchema({
    type: 'object',
    required: [
        'deviceName',
        'deviceType',
    ],
    properties: {
        deviceName: { type: 'string' },
        deviceType: {
            type: 'string',
            enum: Object.values(dbConfig.DeviceTypes),
        },
        lastUserId: { type: 'string' },
        socketId: { type: 'string' },
    },
});
schemas.fullDevice = tools.buildFullSchema({
    type: 'object',
    required: [
        'deviceName',
        'deviceType',
    ],
    properties: {
        deviceName: { type: 'string' },
        deviceType: {
            type: 'string',
            enum: Object.values(dbConfig.DeviceTypes),
        },
        lastUserId: { type: 'string' },
        socketId: { type: 'string' },
    },
});
schemas.devices = {
    type: 'array',
    items: schemas.device,
};
schemas.fullDevices = {
    type: 'array',
    items: schemas.fullDevice,
};
export default schemas;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGV2aWNlcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImRldmljZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsWUFBWSxDQUFDO0FBRWIsTUFBTSxLQUFLLEdBQUcsT0FBTyxDQUFDLGlCQUFpQixDQUFDLENBQUM7QUFDekMsTUFBTSxFQUFFLFFBQVEsRUFBRSxHQUFHLE9BQU8sQ0FBQyxpQ0FBaUMsQ0FBQyxDQUFDO0FBRWhFLE1BQU0sT0FBTyxHQUFHLEVBQUUsQ0FBQztBQUVuQixPQUFPLENBQUMsTUFBTSxHQUFHLEtBQUssQ0FBQyxlQUFlLENBQUM7SUFDckMsSUFBSSxFQUFFLFFBQVE7SUFDZCxRQUFRLEVBQUU7UUFDUixZQUFZO1FBQ1osWUFBWTtLQUNiO0lBQ0QsVUFBVSxFQUFFO1FBQ1YsVUFBVSxFQUFFLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRTtRQUM5QixVQUFVLEVBQUU7WUFDVixJQUFJLEVBQUUsUUFBUTtZQUNkLElBQUksRUFBRSxNQUFNLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUM7U0FDMUM7UUFDRCxVQUFVLEVBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFO1FBQzlCLFFBQVEsRUFBRSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUU7S0FDN0I7Q0FDRixDQUFDLENBQUM7QUFFSCxPQUFPLENBQUMsVUFBVSxHQUFHLEtBQUssQ0FBQyxlQUFlLENBQUM7SUFDekMsSUFBSSxFQUFFLFFBQVE7SUFDZCxRQUFRLEVBQUU7UUFDUixZQUFZO1FBQ1osWUFBWTtLQUNiO0lBQ0QsVUFBVSxFQUFFO1FBQ1YsVUFBVSxFQUFFLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRTtRQUM5QixVQUFVLEVBQUU7WUFDVixJQUFJLEVBQUUsUUFBUTtZQUNkLElBQUksRUFBRSxNQUFNLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUM7U0FDMUM7UUFDRCxVQUFVLEVBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFO1FBQzlCLFFBQVEsRUFBRSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUU7S0FDN0I7Q0FDRixDQUFDLENBQUM7QUFFSCxPQUFPLENBQUMsT0FBTyxHQUFHO0lBQ2hCLElBQUksRUFBRSxPQUFPO0lBQ2IsS0FBSyxFQUFFLE9BQU8sQ0FBQyxNQUFNO0NBQ3RCLENBQUM7QUFFRixPQUFPLENBQUMsV0FBVyxHQUFHO0lBQ3BCLElBQUksRUFBRSxPQUFPO0lBQ2IsS0FBSyxFQUFFLE9BQU8sQ0FBQyxVQUFVO0NBQzFCLENBQUM7QUFFRixlQUFlLE9BQU8sQ0FBQyJ9