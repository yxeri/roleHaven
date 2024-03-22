'use strict';
const tools = require('../helper/tools');
const schemas = {};
schemas.liteUser = tools.buildLiteSchema({
    type: 'object',
    required: [
        'username',
    ],
    properties: {
        username: { type: 'string' },
        usernameLowerCase: { type: 'string' },
        isVerified: { type: 'boolean' },
        isBanned: { type: 'boolean' },
        isOnline: { type: 'boolean' },
    },
    not: {
        required: [
            'password',
            'mailAddress',
            'hasFullAccess',
            'socketId',
            'isLootable',
            'defaultRoomId',
            'followingRooms',
            'registerDevice',
        ],
    },
});
schemas.fullUser = tools.buildFullSchema({
    type: 'object',
    required: [
        'username',
        'isVerified',
        'isBanned',
        'isOnline',
        'hasFullAccess',
        'isLootable',
        'defaultRoomId',
        'followingRooms',
        'registerDevice',
    ],
    properties: {
        password: { type: 'boolean' },
        socketId: { type: 'string' },
        username: { type: 'string' },
        usernameLowerCase: { type: 'string' },
        isVerified: { type: 'boolean' },
        isBanned: { type: 'boolean' },
        isOnline: { type: 'boolean' },
        hasFullAccess: { type: 'boolean' },
        isLootable: { type: 'boolean' },
        defaultRoomId: { type: 'string' },
        registerDevice: { type: 'string' },
        followingRooms: {
            type: 'array',
            items: { type: 'string' },
        },
    },
});
schemas.users = {
    type: 'array',
    items: schemas.liteUser,
};
schemas.fullUsers = {
    type: 'array',
    items: schemas.fullUser,
};
export default schemas;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXNlcnMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJ1c2Vycy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxZQUFZLENBQUM7QUFFYixNQUFNLEtBQUssR0FBRyxPQUFPLENBQUMsaUJBQWlCLENBQUMsQ0FBQztBQUV6QyxNQUFNLE9BQU8sR0FBRyxFQUFFLENBQUM7QUFFbkIsT0FBTyxDQUFDLFFBQVEsR0FBRyxLQUFLLENBQUMsZUFBZSxDQUFDO0lBQ3ZDLElBQUksRUFBRSxRQUFRO0lBQ2QsUUFBUSxFQUFFO1FBQ1IsVUFBVTtLQUNYO0lBQ0QsVUFBVSxFQUFFO1FBQ1YsUUFBUSxFQUFFLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRTtRQUM1QixpQkFBaUIsRUFBRSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUU7UUFDckMsVUFBVSxFQUFFLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRTtRQUMvQixRQUFRLEVBQUUsRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFO1FBQzdCLFFBQVEsRUFBRSxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUU7S0FDOUI7SUFDRCxHQUFHLEVBQUU7UUFDSCxRQUFRLEVBQUU7WUFDUixVQUFVO1lBQ1YsYUFBYTtZQUNiLGVBQWU7WUFDZixVQUFVO1lBQ1YsWUFBWTtZQUNaLGVBQWU7WUFDZixnQkFBZ0I7WUFDaEIsZ0JBQWdCO1NBQ2pCO0tBQ0Y7Q0FDRixDQUFDLENBQUM7QUFFSCxPQUFPLENBQUMsUUFBUSxHQUFHLEtBQUssQ0FBQyxlQUFlLENBQUM7SUFDdkMsSUFBSSxFQUFFLFFBQVE7SUFDZCxRQUFRLEVBQUU7UUFDUixVQUFVO1FBQ1YsWUFBWTtRQUNaLFVBQVU7UUFDVixVQUFVO1FBQ1YsZUFBZTtRQUNmLFlBQVk7UUFDWixlQUFlO1FBQ2YsZ0JBQWdCO1FBQ2hCLGdCQUFnQjtLQUNqQjtJQUNELFVBQVUsRUFBRTtRQUNWLFFBQVEsRUFBRSxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUU7UUFDN0IsUUFBUSxFQUFFLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRTtRQUM1QixRQUFRLEVBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFO1FBQzVCLGlCQUFpQixFQUFFLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRTtRQUNyQyxVQUFVLEVBQUUsRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFO1FBQy9CLFFBQVEsRUFBRSxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUU7UUFDN0IsUUFBUSxFQUFFLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRTtRQUM3QixhQUFhLEVBQUUsRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFO1FBQ2xDLFVBQVUsRUFBRSxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUU7UUFDL0IsYUFBYSxFQUFFLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRTtRQUNqQyxjQUFjLEVBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFO1FBQ2xDLGNBQWMsRUFBRTtZQUNkLElBQUksRUFBRSxPQUFPO1lBQ2IsS0FBSyxFQUFFLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRTtTQUMxQjtLQUNGO0NBQ0YsQ0FBQyxDQUFDO0FBRUgsT0FBTyxDQUFDLEtBQUssR0FBRztJQUNkLElBQUksRUFBRSxPQUFPO0lBQ2IsS0FBSyxFQUFFLE9BQU8sQ0FBQyxRQUFRO0NBQ3hCLENBQUM7QUFFRixPQUFPLENBQUMsU0FBUyxHQUFHO0lBQ2xCLElBQUksRUFBRSxPQUFPO0lBQ2IsS0FBSyxFQUFFLE9BQU8sQ0FBQyxRQUFRO0NBQ3hCLENBQUM7QUFFRixlQUFlLE9BQU8sQ0FBQyJ9