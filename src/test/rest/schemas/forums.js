'use strict';
const tools = require('../helper/tools');
const schemas = {};
schemas.forum = tools.buildLiteSchema({
    type: 'object',
    required: [
        'title',
        'text',
    ],
    properties: {
        title: { type: 'string' },
        text: {
            type: 'array',
            items: { type: 'string' },
        },
        threadIds: {
            type: 'array',
            items: { type: 'string' },
        },
    },
});
schemas.fullForum = tools.buildFullSchema({
    type: 'object',
    required: [
        'title',
        'text',
    ],
    properties: {
        title: { type: 'string' },
        text: {
            type: 'array',
            items: { type: 'string' },
        },
        threadIds: {
            type: 'array',
            items: { type: 'string' },
        },
    },
});
schemas.forums = {
    type: 'array',
    items: schemas.forum,
};
schemas.fullForums = {
    type: 'array',
    items: schemas.fullForum,
};
export default schemas;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZm9ydW1zLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZm9ydW1zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFlBQVksQ0FBQztBQUViLE1BQU0sS0FBSyxHQUFHLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO0FBRXpDLE1BQU0sT0FBTyxHQUFHLEVBQUUsQ0FBQztBQUVuQixPQUFPLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQyxlQUFlLENBQUM7SUFDcEMsSUFBSSxFQUFFLFFBQVE7SUFDZCxRQUFRLEVBQUU7UUFDUixPQUFPO1FBQ1AsTUFBTTtLQUNQO0lBQ0QsVUFBVSxFQUFFO1FBQ1YsS0FBSyxFQUFFLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRTtRQUN6QixJQUFJLEVBQUU7WUFDSixJQUFJLEVBQUUsT0FBTztZQUNiLEtBQUssRUFBRSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUU7U0FDMUI7UUFDRCxTQUFTLEVBQUU7WUFDVCxJQUFJLEVBQUUsT0FBTztZQUNiLEtBQUssRUFBRSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUU7U0FDMUI7S0FDRjtDQUNGLENBQUMsQ0FBQztBQUVILE9BQU8sQ0FBQyxTQUFTLEdBQUcsS0FBSyxDQUFDLGVBQWUsQ0FBQztJQUN4QyxJQUFJLEVBQUUsUUFBUTtJQUNkLFFBQVEsRUFBRTtRQUNSLE9BQU87UUFDUCxNQUFNO0tBQ1A7SUFDRCxVQUFVLEVBQUU7UUFDVixLQUFLLEVBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFO1FBQ3pCLElBQUksRUFBRTtZQUNKLElBQUksRUFBRSxPQUFPO1lBQ2IsS0FBSyxFQUFFLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRTtTQUMxQjtRQUNELFNBQVMsRUFBRTtZQUNULElBQUksRUFBRSxPQUFPO1lBQ2IsS0FBSyxFQUFFLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRTtTQUMxQjtLQUNGO0NBQ0YsQ0FBQyxDQUFDO0FBRUgsT0FBTyxDQUFDLE1BQU0sR0FBRztJQUNmLElBQUksRUFBRSxPQUFPO0lBQ2IsS0FBSyxFQUFFLE9BQU8sQ0FBQyxLQUFLO0NBQ3JCLENBQUM7QUFFRixPQUFPLENBQUMsVUFBVSxHQUFHO0lBQ25CLElBQUksRUFBRSxPQUFPO0lBQ2IsS0FBSyxFQUFFLE9BQU8sQ0FBQyxTQUFTO0NBQ3pCLENBQUM7QUFFRixlQUFlLE9BQU8sQ0FBQyJ9