'use strict';
import tools from '../helper/tools';
import baseObjects from './baseObjects';
const schemas = {};
schemas.position = tools.buildLiteSchema({
    type: 'object',
    required: [
        'positionName',
        'positionType',
        'radius',
    ],
    properties: {
        deviceId: { type: 'string' },
        coordinatesHistory: {
            type: 'array',
            items: baseObjects.coordinates,
        },
        positionName: { type: 'string' },
        positionType: { type: 'string' },
        radius: { type: 'number' },
        isStationary: { type: 'boolean' },
        description: {
            type: 'array',
            items: { type: 'string' },
        },
    },
});
schemas.fullPosition = tools.buildFullSchema({
    type: 'object',
    required: [
        'positionName',
        'positionType',
        'radius',
    ],
    properties: {
        deviceId: { type: 'string' },
        coordinatesHistory: {
            type: 'array',
            items: baseObjects.coordinates,
        },
        positionName: { type: 'string' },
        positionType: { type: 'string' },
        radius: { type: 'number' },
        isStationary: { type: 'boolean' },
        description: {
            type: 'array',
            items: { type: 'string' },
        },
    },
});
schemas.positions = {
    type: 'array',
    items: schemas.position,
};
schemas.fullPositions = {
    type: 'array',
    items: schemas.fullPosition,
};
export default schemas;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9zaXRpb25zLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsicG9zaXRpb25zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFlBQVksQ0FBQztBQUViLE9BQU8sS0FBSyxNQUFNLGlCQUFpQixDQUFDO0FBQ3BDLE9BQU8sV0FBVyxNQUFNLGVBQWUsQ0FBQztBQUV4QyxNQUFNLE9BQU8sR0FBRyxFQUFFLENBQUM7QUFFbkIsT0FBTyxDQUFDLFFBQVEsR0FBRyxLQUFLLENBQUMsZUFBZSxDQUFDO0lBQ3ZDLElBQUksRUFBRSxRQUFRO0lBQ2QsUUFBUSxFQUFFO1FBQ1IsY0FBYztRQUNkLGNBQWM7UUFDZCxRQUFRO0tBQ1Q7SUFDRCxVQUFVLEVBQUU7UUFDVixRQUFRLEVBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFO1FBQzVCLGtCQUFrQixFQUFFO1lBQ2xCLElBQUksRUFBRSxPQUFPO1lBQ2IsS0FBSyxFQUFFLFdBQVcsQ0FBQyxXQUFXO1NBQy9CO1FBQ0QsWUFBWSxFQUFFLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRTtRQUNoQyxZQUFZLEVBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFO1FBQ2hDLE1BQU0sRUFBRSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUU7UUFDMUIsWUFBWSxFQUFFLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRTtRQUNqQyxXQUFXLEVBQUU7WUFDWCxJQUFJLEVBQUUsT0FBTztZQUNiLEtBQUssRUFBRSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUU7U0FDMUI7S0FDRjtDQUNGLENBQUMsQ0FBQztBQUVILE9BQU8sQ0FBQyxZQUFZLEdBQUcsS0FBSyxDQUFDLGVBQWUsQ0FBQztJQUMzQyxJQUFJLEVBQUUsUUFBUTtJQUNkLFFBQVEsRUFBRTtRQUNSLGNBQWM7UUFDZCxjQUFjO1FBQ2QsUUFBUTtLQUNUO0lBQ0QsVUFBVSxFQUFFO1FBQ1YsUUFBUSxFQUFFLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRTtRQUM1QixrQkFBa0IsRUFBRTtZQUNsQixJQUFJLEVBQUUsT0FBTztZQUNiLEtBQUssRUFBRSxXQUFXLENBQUMsV0FBVztTQUMvQjtRQUNELFlBQVksRUFBRSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUU7UUFDaEMsWUFBWSxFQUFFLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRTtRQUNoQyxNQUFNLEVBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFO1FBQzFCLFlBQVksRUFBRSxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUU7UUFDakMsV0FBVyxFQUFFO1lBQ1gsSUFBSSxFQUFFLE9BQU87WUFDYixLQUFLLEVBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFO1NBQzFCO0tBQ0Y7Q0FDRixDQUFDLENBQUM7QUFFSCxPQUFPLENBQUMsU0FBUyxHQUFHO0lBQ2xCLElBQUksRUFBRSxPQUFPO0lBQ2IsS0FBSyxFQUFFLE9BQU8sQ0FBQyxRQUFRO0NBQ3hCLENBQUM7QUFFRixPQUFPLENBQUMsYUFBYSxHQUFHO0lBQ3RCLElBQUksRUFBRSxPQUFPO0lBQ2IsS0FBSyxFQUFFLE9BQU8sQ0FBQyxZQUFZO0NBQzVCLENBQUM7QUFFRixlQUFlLE9BQU8sQ0FBQyJ9