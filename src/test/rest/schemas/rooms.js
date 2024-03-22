'use strict';
const tools = require('../helper/tools');
const schemas = {};
schemas.createdRoom = tools.buildLiteSchema({
    type: 'object',
    required: [
        'roomName',
    ],
    properties: {
        roomName: { type: 'string' },
        isAnonymous: { type: 'boolean' },
        isWhisper: { type: 'boolean' },
        nameIsLocked: { type: 'boolean' },
        isSystemRoom: { type: 'boolean' },
        password: { type: 'boolean' },
    },
});
schemas.room = tools.buildLiteSchema({
    type: 'object',
    required: [
        'roomName',
    ],
    properties: {
        roomName: { type: 'string' },
        isAnonymous: { type: 'boolean' },
        isWhisper: { type: 'boolean' },
        nameIsLocked: { type: 'boolean' },
        isSystemRoom: { type: 'boolean' },
        participantIds: {
            type: 'array',
            items: { type: 'string ' },
        },
        password: { type: 'boolean' },
    },
});
schemas.fullRoom = tools.buildFullSchema({
    type: 'object',
    required: [
        'roomName',
    ],
    properties: {
        roomName: { type: 'string' },
        isAnonymous: { type: 'boolean' },
        isWhisper: { type: 'boolean' },
        nameIsLocked: { type: 'boolean' },
        isSystemRoom: { type: 'boolean' },
        participantIds: {
            type: 'array',
            items: { type: 'string' },
        },
        password: { type: 'boolean' },
    },
});
schemas.rooms = {
    type: 'array',
    items: schemas.room,
};
schemas.followedRooms = {
    type: 'array',
    items: schemas.followedRoom,
};
schemas.fullRooms = {
    type: 'array',
    items: schemas.fullRoom,
};
export default schemas;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm9vbXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJyb29tcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxZQUFZLENBQUM7QUFFYixNQUFNLEtBQUssR0FBRyxPQUFPLENBQUMsaUJBQWlCLENBQUMsQ0FBQztBQUV6QyxNQUFNLE9BQU8sR0FBRyxFQUFFLENBQUM7QUFFbkIsT0FBTyxDQUFDLFdBQVcsR0FBRyxLQUFLLENBQUMsZUFBZSxDQUFDO0lBQzFDLElBQUksRUFBRSxRQUFRO0lBQ2QsUUFBUSxFQUFFO1FBQ1IsVUFBVTtLQUNYO0lBQ0QsVUFBVSxFQUFFO1FBQ1YsUUFBUSxFQUFFLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRTtRQUM1QixXQUFXLEVBQUUsRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFO1FBQ2hDLFNBQVMsRUFBRSxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUU7UUFDOUIsWUFBWSxFQUFFLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRTtRQUNqQyxZQUFZLEVBQUUsRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFO1FBQ2pDLFFBQVEsRUFBRSxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUU7S0FDOUI7Q0FDRixDQUFDLENBQUM7QUFFSCxPQUFPLENBQUMsSUFBSSxHQUFHLEtBQUssQ0FBQyxlQUFlLENBQUM7SUFDbkMsSUFBSSxFQUFFLFFBQVE7SUFDZCxRQUFRLEVBQUU7UUFDUixVQUFVO0tBQ1g7SUFDRCxVQUFVLEVBQUU7UUFDVixRQUFRLEVBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFO1FBQzVCLFdBQVcsRUFBRSxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUU7UUFDaEMsU0FBUyxFQUFFLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRTtRQUM5QixZQUFZLEVBQUUsRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFO1FBQ2pDLFlBQVksRUFBRSxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUU7UUFDakMsY0FBYyxFQUFFO1lBQ2QsSUFBSSxFQUFFLE9BQU87WUFDYixLQUFLLEVBQUUsRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFO1NBQzNCO1FBQ0QsUUFBUSxFQUFFLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRTtLQUM5QjtDQUNGLENBQUMsQ0FBQztBQUVILE9BQU8sQ0FBQyxRQUFRLEdBQUcsS0FBSyxDQUFDLGVBQWUsQ0FBQztJQUN2QyxJQUFJLEVBQUUsUUFBUTtJQUNkLFFBQVEsRUFBRTtRQUNSLFVBQVU7S0FDWDtJQUNELFVBQVUsRUFBRTtRQUNWLFFBQVEsRUFBRSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUU7UUFDNUIsV0FBVyxFQUFFLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRTtRQUNoQyxTQUFTLEVBQUUsRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFO1FBQzlCLFlBQVksRUFBRSxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUU7UUFDakMsWUFBWSxFQUFFLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRTtRQUNqQyxjQUFjLEVBQUU7WUFDZCxJQUFJLEVBQUUsT0FBTztZQUNiLEtBQUssRUFBRSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUU7U0FDMUI7UUFDRCxRQUFRLEVBQUUsRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFO0tBQzlCO0NBQ0YsQ0FBQyxDQUFDO0FBRUgsT0FBTyxDQUFDLEtBQUssR0FBRztJQUNkLElBQUksRUFBRSxPQUFPO0lBQ2IsS0FBSyxFQUFFLE9BQU8sQ0FBQyxJQUFJO0NBQ3BCLENBQUM7QUFFRixPQUFPLENBQUMsYUFBYSxHQUFHO0lBQ3RCLElBQUksRUFBRSxPQUFPO0lBQ2IsS0FBSyxFQUFFLE9BQU8sQ0FBQyxZQUFZO0NBQzVCLENBQUM7QUFFRixPQUFPLENBQUMsU0FBUyxHQUFHO0lBQ2xCLElBQUksRUFBRSxPQUFPO0lBQ2IsS0FBSyxFQUFFLE9BQU8sQ0FBQyxRQUFRO0NBQ3hCLENBQUM7QUFFRixlQUFlLE9BQU8sQ0FBQyJ9