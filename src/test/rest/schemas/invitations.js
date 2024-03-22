'use strict';
const tools = require('../helper/tools');
const { dbConfig } = require('../../../config/defaults/config');
const schemas = {};
schemas.invitation = tools.buildLiteSchema({
    type: 'object',
    required: [
        'invitationType',
        'itemId',
        'receiverId',
    ],
    properties: {
        invitationType: {
            type: 'string',
            enum: Object.keys(dbConfig.InvitationTypes),
        },
        itemId: { type: 'string' },
        receiverId: { type: 'string' },
    },
});
schemas.fullInvitation = tools.buildFullSchema({
    type: 'object',
    required: [
        'invitationType',
        'itemId',
        'receiverId',
    ],
    properties: {
        invitationType: {
            type: 'string',
            enum: Object.keys(dbConfig.InvitationTypes),
        },
        itemId: { type: 'string' },
        receiverId: { type: 'string' },
    },
});
schemas.invitations = {
    type: 'array',
    items: schemas.invitation,
};
schemas.fullInvitations = {
    type: 'array',
    items: schemas.fullInvitation,
};
export default schemas;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW52aXRhdGlvbnMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbnZpdGF0aW9ucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxZQUFZLENBQUM7QUFFYixNQUFNLEtBQUssR0FBRyxPQUFPLENBQUMsaUJBQWlCLENBQUMsQ0FBQztBQUN6QyxNQUFNLEVBQUUsUUFBUSxFQUFFLEdBQUcsT0FBTyxDQUFDLGlDQUFpQyxDQUFDLENBQUM7QUFFaEUsTUFBTSxPQUFPLEdBQUcsRUFBRSxDQUFDO0FBRW5CLE9BQU8sQ0FBQyxVQUFVLEdBQUcsS0FBSyxDQUFDLGVBQWUsQ0FBQztJQUN6QyxJQUFJLEVBQUUsUUFBUTtJQUNkLFFBQVEsRUFBRTtRQUNSLGdCQUFnQjtRQUNoQixRQUFRO1FBQ1IsWUFBWTtLQUNiO0lBQ0QsVUFBVSxFQUFFO1FBQ1YsY0FBYyxFQUFFO1lBQ2QsSUFBSSxFQUFFLFFBQVE7WUFDZCxJQUFJLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsZUFBZSxDQUFDO1NBQzVDO1FBQ0QsTUFBTSxFQUFFLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRTtRQUMxQixVQUFVLEVBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFO0tBQy9CO0NBQ0YsQ0FBQyxDQUFDO0FBRUgsT0FBTyxDQUFDLGNBQWMsR0FBRyxLQUFLLENBQUMsZUFBZSxDQUFDO0lBQzdDLElBQUksRUFBRSxRQUFRO0lBQ2QsUUFBUSxFQUFFO1FBQ1IsZ0JBQWdCO1FBQ2hCLFFBQVE7UUFDUixZQUFZO0tBQ2I7SUFDRCxVQUFVLEVBQUU7UUFDVixjQUFjLEVBQUU7WUFDZCxJQUFJLEVBQUUsUUFBUTtZQUNkLElBQUksRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxlQUFlLENBQUM7U0FDNUM7UUFDRCxNQUFNLEVBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFO1FBQzFCLFVBQVUsRUFBRSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUU7S0FDL0I7Q0FDRixDQUFDLENBQUM7QUFFSCxPQUFPLENBQUMsV0FBVyxHQUFHO0lBQ3BCLElBQUksRUFBRSxPQUFPO0lBQ2IsS0FBSyxFQUFFLE9BQU8sQ0FBQyxVQUFVO0NBQzFCLENBQUM7QUFFRixPQUFPLENBQUMsZUFBZSxHQUFHO0lBQ3hCLElBQUksRUFBRSxPQUFPO0lBQ2IsS0FBSyxFQUFFLE9BQU8sQ0FBQyxjQUFjO0NBQzlCLENBQUM7QUFFRixlQUFlLE9BQU8sQ0FBQyJ9