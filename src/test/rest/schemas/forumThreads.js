'use strict';
import tools from '../helper/tools';
const schemas = {};
schemas.forumThread = tools.buildLiteSchema({
    type: 'object',
    required: [
        'forumId',
        'title',
        'postIds',
        'text',
    ],
    properties: {
        forumId: { type: 'string' },
        title: { type: 'string' },
        text: {
            type: 'array',
            items: { type: 'string' },
        },
        postIds: {
            type: 'array',
            items: { type: 'string' },
        },
    },
});
schemas.fullForumThread = tools.buildFullSchema({
    type: 'object',
    required: [
        'forumId',
        'title',
        'postIds',
        'text',
    ],
    properties: {
        forumId: { type: 'string' },
        title: { type: 'string' },
        text: {
            type: 'array',
            items: { type: 'string' },
        },
        postIds: {
            type: 'array',
            items: { type: 'string' },
        },
    },
});
schemas.forumThreads = {
    type: 'array',
    items: schemas.forumThread,
};
schemas.fullForumThreads = {
    type: 'array',
    items: schemas.fullForumThread,
};
export default schemas;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZm9ydW1UaHJlYWRzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZm9ydW1UaHJlYWRzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFlBQVksQ0FBQztBQUViLE9BQU8sS0FBSyxNQUFNLGlCQUFpQixDQUFDO0FBRXBDLE1BQU0sT0FBTyxHQUFHLEVBQUUsQ0FBQztBQUVuQixPQUFPLENBQUMsV0FBVyxHQUFHLEtBQUssQ0FBQyxlQUFlLENBQUM7SUFDMUMsSUFBSSxFQUFFLFFBQVE7SUFDZCxRQUFRLEVBQUU7UUFDUixTQUFTO1FBQ1QsT0FBTztRQUNQLFNBQVM7UUFDVCxNQUFNO0tBQ1A7SUFDRCxVQUFVLEVBQUU7UUFDVixPQUFPLEVBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFO1FBQzNCLEtBQUssRUFBRSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUU7UUFDekIsSUFBSSxFQUFFO1lBQ0osSUFBSSxFQUFFLE9BQU87WUFDYixLQUFLLEVBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFO1NBQzFCO1FBQ0QsT0FBTyxFQUFFO1lBQ1AsSUFBSSxFQUFFLE9BQU87WUFDYixLQUFLLEVBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFO1NBQzFCO0tBQ0Y7Q0FDRixDQUFDLENBQUM7QUFFSCxPQUFPLENBQUMsZUFBZSxHQUFHLEtBQUssQ0FBQyxlQUFlLENBQUM7SUFDOUMsSUFBSSxFQUFFLFFBQVE7SUFDZCxRQUFRLEVBQUU7UUFDUixTQUFTO1FBQ1QsT0FBTztRQUNQLFNBQVM7UUFDVCxNQUFNO0tBQ1A7SUFDRCxVQUFVLEVBQUU7UUFDVixPQUFPLEVBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFO1FBQzNCLEtBQUssRUFBRSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUU7UUFDekIsSUFBSSxFQUFFO1lBQ0osSUFBSSxFQUFFLE9BQU87WUFDYixLQUFLLEVBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFO1NBQzFCO1FBQ0QsT0FBTyxFQUFFO1lBQ1AsSUFBSSxFQUFFLE9BQU87WUFDYixLQUFLLEVBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFO1NBQzFCO0tBQ0Y7Q0FDRixDQUFDLENBQUM7QUFFSCxPQUFPLENBQUMsWUFBWSxHQUFHO0lBQ3JCLElBQUksRUFBRSxPQUFPO0lBQ2IsS0FBSyxFQUFFLE9BQU8sQ0FBQyxXQUFXO0NBQzNCLENBQUM7QUFFRixPQUFPLENBQUMsZ0JBQWdCLEdBQUc7SUFDekIsSUFBSSxFQUFFLE9BQU87SUFDYixLQUFLLEVBQUUsT0FBTyxDQUFDLGVBQWU7Q0FDL0IsQ0FBQztBQUVGLGVBQWUsT0FBTyxDQUFDIn0=