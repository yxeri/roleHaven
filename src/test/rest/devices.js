'use strict';
import chai from 'chai';
import chaiHttp from 'chai-http';
import chaiJson from 'chai-json-schema';
import deviceSchemas from './schemas/devices';
import testData from './testData/devices';
import testBuilder from './helper/testBuilder';
chai.should();
chai.use(chaiHttp);
chai.use(chaiJson);
describe('Devices', () => {
    const apiPath = '/api/devices/';
    const objectIdType = 'deviceId';
    const objectType = 'device';
    const objectsType = 'devices';
    testBuilder.createTestCreate({
        objectType,
        objectIdType,
        apiPath,
        checkDuplicate: true,
        testData: testData.create,
        schema: deviceSchemas.device,
    });
    testBuilder.createTestUpdate({
        objectType,
        objectIdType,
        apiPath,
        testData: testData.update,
        schema: deviceSchemas.device,
    });
    testBuilder.createTestGet({
        objectIdType,
        apiPath,
        objectType,
        objectsType,
        testData: testData.create,
        singleLiteSchema: deviceSchemas.device,
        multiLiteSchema: deviceSchemas.devices,
        singleFullSchema: deviceSchemas.fullDevice,
        multiFullSchema: deviceSchemas.fullDevices,
    });
    testBuilder.createTestDelete({
        objectType,
        objectIdType,
        apiPath,
        testData: testData.remove,
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGV2aWNlcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImRldmljZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBRUEsWUFBWSxDQUFDO0FBRWIsT0FBTyxJQUFJLE1BQU0sTUFBTSxDQUFDO0FBQ3hCLE9BQU8sUUFBUSxNQUFNLFdBQVcsQ0FBQztBQUNqQyxPQUFPLFFBQVEsTUFBTSxrQkFBa0IsQ0FBQztBQUN4QyxPQUFPLGFBQWEsTUFBTSxtQkFBbUIsQ0FBQztBQUM5QyxPQUFPLFFBQVEsTUFBTSxvQkFBb0IsQ0FBQztBQUMxQyxPQUFPLFdBQVcsTUFBTSxzQkFBc0IsQ0FBQztBQUUvQyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7QUFDZCxJQUFJLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDO0FBQ25CLElBQUksQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUM7QUFFbkIsUUFBUSxDQUFDLFNBQVMsRUFBRSxHQUFHLEVBQUU7SUFDdkIsTUFBTSxPQUFPLEdBQUcsZUFBZSxDQUFDO0lBQ2hDLE1BQU0sWUFBWSxHQUFHLFVBQVUsQ0FBQztJQUNoQyxNQUFNLFVBQVUsR0FBRyxRQUFRLENBQUM7SUFDNUIsTUFBTSxXQUFXLEdBQUcsU0FBUyxDQUFDO0lBRTlCLFdBQVcsQ0FBQyxnQkFBZ0IsQ0FBQztRQUMzQixVQUFVO1FBQ1YsWUFBWTtRQUNaLE9BQU87UUFDUCxjQUFjLEVBQUUsSUFBSTtRQUNwQixRQUFRLEVBQUUsUUFBUSxDQUFDLE1BQU07UUFDekIsTUFBTSxFQUFFLGFBQWEsQ0FBQyxNQUFNO0tBQzdCLENBQUMsQ0FBQztJQUVILFdBQVcsQ0FBQyxnQkFBZ0IsQ0FBQztRQUMzQixVQUFVO1FBQ1YsWUFBWTtRQUNaLE9BQU87UUFDUCxRQUFRLEVBQUUsUUFBUSxDQUFDLE1BQU07UUFDekIsTUFBTSxFQUFFLGFBQWEsQ0FBQyxNQUFNO0tBQzdCLENBQUMsQ0FBQztJQUVILFdBQVcsQ0FBQyxhQUFhLENBQUM7UUFDeEIsWUFBWTtRQUNaLE9BQU87UUFDUCxVQUFVO1FBQ1YsV0FBVztRQUNYLFFBQVEsRUFBRSxRQUFRLENBQUMsTUFBTTtRQUN6QixnQkFBZ0IsRUFBRSxhQUFhLENBQUMsTUFBTTtRQUN0QyxlQUFlLEVBQUUsYUFBYSxDQUFDLE9BQU87UUFDdEMsZ0JBQWdCLEVBQUUsYUFBYSxDQUFDLFVBQVU7UUFDMUMsZUFBZSxFQUFFLGFBQWEsQ0FBQyxXQUFXO0tBQzNDLENBQUMsQ0FBQztJQUVILFdBQVcsQ0FBQyxnQkFBZ0IsQ0FBQztRQUMzQixVQUFVO1FBQ1YsWUFBWTtRQUNaLE9BQU87UUFDUCxRQUFRLEVBQUUsUUFBUSxDQUFDLE1BQU07S0FDMUIsQ0FBQyxDQUFDO0FBQ0wsQ0FBQyxDQUFDLENBQUMifQ==