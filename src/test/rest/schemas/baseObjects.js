'use strict';
const schemas = {};
schemas.remove = {
    type: 'object',
    required: ['objectId'],
    properties: {
        objectId: { type: 'string' },
    },
};
schemas.liteBaseObject = {
    type: 'object',
    required: [
        'lastUpdated',
        'ownerId',
        'timeCreated',
        'isPublic',
        'objectId',
        'accessLevel',
        'visibility',
    ],
    properties: {
        ownerId: { type: 'string' },
        lastUpdated: { type: 'string' },
        timeCreated: { type: 'string' },
        isPublic: { type: 'boolean' },
        objectId: { type: 'string' },
        accessLevel: { type: 'number' },
        visibility: { type: 'number' },
    },
    not: {
        required: [
            'ownerAliasId',
            'customLastUpdated',
            'customTimeCreated',
            'teamAdminIds',
            'userAdminIds',
            'bannedIds',
            'userIds',
            'teamIds',
        ],
    },
};
schemas.fullBaseObject = {
    type: 'object',
    required: [
        'objectId',
        'ownerId',
        'lastUpdated',
        'timeCreated',
        'visibility',
        'accessLevel',
        'teamAdminIds',
        'userAdminIds',
        'userIds',
        'teamIds',
        'bannedIds',
        'isPublic',
    ],
    properties: {
        objectId: { type: 'string' },
        ownerId: { type: 'string' },
        lastUpdated: { type: 'string' },
        timeCreated: { type: 'string' },
        visiblity: { type: 'number' },
        userIds: {
            type: 'array',
            items: { type: 'string' },
        },
        teamIds: {
            type: 'array',
            items: { type: 'string' },
        },
        isPublic: { type: 'boolean' },
        teamAdminIds: {
            type: 'array',
            items: { type: 'string' },
        },
        userAdminIds: {
            type: 'array',
            items: { type: 'string' },
        },
        bannedIds: {
            type: 'array',
            items: { type: 'string' },
        },
        ownerAliasId: { type: 'string' },
        customLastUpdated: { type: 'string' },
        customTimeCreated: { type: 'string' },
    },
};
schemas.error = {
    type: 'object',
    required: ['title', 'status', 'detail'],
    properties: {
        title: { type: 'string' },
        status: { type: 'number' },
        detail: { type: 'string' },
    },
};
schemas.returnData = {
    type: 'object',
    properties: {
        error: schemas.error,
        data: { type: 'object' },
    },
    oneOf: [
        { required: ['error'] },
        { required: ['data'] },
    ],
};
schemas.coordinates = {
    type: 'object',
    required: [
        'longitude',
        'latitude',
        'accuracy',
    ],
    properties: {
        longitude: { type: 'number' },
        latitude: { type: 'number' },
        accuracy: { type: 'number' },
        heading: { type: 'number' },
        speed: { type: 'number' },
        extraCoordinates: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    longitude: { type: 'number' },
                    latitude: { type: 'number' },
                },
            },
        },
    },
};
export default schemas;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFzZU9iamVjdHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJiYXNlT2JqZWN0cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxZQUFZLENBQUM7QUFFYixNQUFNLE9BQU8sR0FBRyxFQUFFLENBQUM7QUFFbkIsT0FBTyxDQUFDLE1BQU0sR0FBRztJQUNmLElBQUksRUFBRSxRQUFRO0lBQ2QsUUFBUSxFQUFFLENBQUMsVUFBVSxDQUFDO0lBQ3RCLFVBQVUsRUFBRTtRQUNWLFFBQVEsRUFBRSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUU7S0FDN0I7Q0FDRixDQUFDO0FBV0YsT0FBTyxDQUFDLGNBQWMsR0FBRztJQUN2QixJQUFJLEVBQUUsUUFBUTtJQUNkLFFBQVEsRUFBRTtRQUNSLGFBQWE7UUFDYixTQUFTO1FBQ1QsYUFBYTtRQUNiLFVBQVU7UUFDVixVQUFVO1FBQ1YsYUFBYTtRQUNiLFlBQVk7S0FDYjtJQUNELFVBQVUsRUFBRTtRQUNWLE9BQU8sRUFBRSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUU7UUFDM0IsV0FBVyxFQUFFLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRTtRQUMvQixXQUFXLEVBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFO1FBQy9CLFFBQVEsRUFBRSxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUU7UUFDN0IsUUFBUSxFQUFFLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRTtRQUM1QixXQUFXLEVBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFO1FBQy9CLFVBQVUsRUFBRSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUU7S0FDL0I7SUFDRCxHQUFHLEVBQUU7UUFDSCxRQUFRLEVBQUU7WUFDUixjQUFjO1lBQ2QsbUJBQW1CO1lBQ25CLG1CQUFtQjtZQUNuQixjQUFjO1lBQ2QsY0FBYztZQUNkLFdBQVc7WUFDWCxTQUFTO1lBQ1QsU0FBUztTQUNWO0tBQ0Y7Q0FDRixDQUFDO0FBRUYsT0FBTyxDQUFDLGNBQWMsR0FB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