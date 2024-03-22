'use strict';
const tools = require('../helper/tools');
const schemas = {};
schemas.triggerEvent = tools.buildLiteSchema({
    type: 'object',
    required: [
        'content',
        'eventType',
        'changeType',
        'triggerType',
    ],
    properties: {
        content: { type: 'object' },
        eventType: { type: 'string' },
        startTime: { type: 'date' },
        terminationTime: { type: 'date' },
        coordinates: { type: 'object' },
        iterations: { type: 'number' },
        isRecurring: { type: 'boolean' },
        isActive: { type: 'boolean' },
        changeType: { type: 'string' },
        triggerType: { type: 'string' },
        singleUse: { type: 'boolean' },
        duration: { type: 'number' },
        triggeredBy: {
            type: 'array',
            items: { type: 'string' },
        },
        shouldTargetSingle: { type: 'boolean' },
    },
});
schemas.fullTriggerEvent = tools.buildFullSchema({
    type: 'object',
    required: [
        'content',
        'eventType',
        'changeType',
        'triggerType',
    ],
    properties: {
        content: { type: 'object' },
        eventType: { type: 'string' },
        startTime: { type: 'date' },
        terminationTime: { type: 'date' },
        coordinates: { type: 'object' },
        iterations: { type: 'number' },
        isRecurring: { type: 'boolean' },
        isActive: { type: 'boolean' },
        changeType: { type: 'string' },
        triggerType: { type: 'string' },
        singleUse: { type: 'boolean' },
        duration: { type: 'number' },
        triggeredBy: {
            type: 'array',
            items: { type: 'string' },
        },
        shouldTargetSingle: { type: 'boolean' },
    },
});
schemas.triggerEvents = {
    type: 'array',
    items: schemas.triggerEvent,
};
schemas.fullTriggerEvents = {
    type: 'array',
    items: schemas.fullTriggerEvent,
};
export default schemas;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHJpZ2dlckV2ZW50cy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInRyaWdnZXJFdmVudHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsWUFBWSxDQUFDO0FBRWIsTUFBTSxLQUFLLEdBQUcsT0FBTyxDQUFDLGlCQUFpQixDQUFDLENBQUM7QUFFekMsTUFBTSxPQUFPLEdBQUcsRUFBRSxDQUFDO0FBRW5CLE9BQU8sQ0FBQyxZQUFZLEdBQUcsS0FBSyxDQUFDLGVBQWUsQ0FBQztJQUMzQyxJQUFJLEVBQUUsUUFBUTtJQUNkLFFBQVEsRUFBRTtRQUNSLFNBQVM7UUFDVCxXQUFXO1FBQ1gsWUFBWTtRQUNaLGFBQWE7S0FDZDtJQUNELFVBQVUsRUFBRTtRQUNWLE9BQU8sRUFBRSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUU7UUFDM0IsU0FBUyxFQUFFLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRTtRQUM3QixTQUFTLEVBQUUsRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFO1FBQzNCLGVBQWUsRUFBRSxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUU7UUFDakMsV0FBVyxFQUFFLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRTtRQUMvQixVQUFVLEVBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFO1FBQzlCLFdBQVcsRUFBRSxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUU7UUFDaEMsUUFBUSxFQUFFLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRTtRQUM3QixVQUFVLEVBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFO1FBQzlCLFdBQVcsRUFBRSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUU7UUFDL0IsU0FBUyxFQUFFLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRTtRQUM5QixRQUFRLEVBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFO1FBQzVCLFdBQVcsRUFBRTtZQUNYLElBQUksRUFBRSxPQUFPO1lBQ2IsS0FBSyxFQUFFLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRTtTQUMxQjtRQUNELGtCQUFrQixFQUFFLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRTtLQUN4QztDQUNGLENBQUMsQ0FBQztBQUVILE9BQU8sQ0FBQyxnQkFBZ0IsR0FBRyxLQUFLLENBQUMsZUFBZSxDQUFDO0lBQy9DLElBQUksRUFBRSxRQUFRO0lBQ2QsUUFBUSxFQUFFO1FBQ1IsU0FBUztRQUNULFdBQVc7UUFDWCxZQUFZO1FBQ1osYUFBYTtLQUNkO0lBQ0QsVUFBVSxFQUFFO1FBQ1YsT0FBTyxFQUFFLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRTtRQUMzQixTQUFTLEVBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFO1FBQzdCLFNBQVMsRUFBRSxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUU7UUFDM0IsZUFBZSxFQUFFLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRTtRQUNqQyxXQUFXLEVBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFO1FBQy9CLFVBQVUsRUFBRSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUU7UUFDOUIsV0FBVyxFQUFFLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRTtRQUNoQyxRQUFRLEVBQUUsRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFO1FBQzdCLFVBQVUsRUFBRSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUU7UUFDOUIsV0FBVyxFQUFFLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRTtRQUMvQixTQUFTLEVBQUUsRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFO1FBQzlCLFFBQVEsRUFBRSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUU7UUFDNUIsV0FBVyxFQUFFO1lBQ1gsSUFBSSxFQUFFLE9BQU87WUFDYixLQUFLLEVBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFO1NBQzFCO1FBQ0Qsa0JBQWtCLEVBQUUsRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFO0tBQ3hDO0NBQ0YsQ0FBQyxDQUFDO0FBRUgsT0FBTyxDQUFDLGFBQWEsR0FBRztJQUN0QixJQUFJLEVBQUUsT0FBTztJQUNiLEtBQUssRUFBRSxPQUFPLENBQUMsWUFBWTtDQUM1QixDQUFDO0FBRUYsT0FBTyxDQUFDLGlCQUFpQixHQUFHO0lBQzFCLElBQUksRUFBRSxPQUFPO0lBQ2IsS0FBSyxFQUFFLE9BQU8sQ0FBQyxnQkFBZ0I7Q0FDaEMsQ0FBQztBQUVGLGVBQWUsT0FBTyxDQUFDIn0=