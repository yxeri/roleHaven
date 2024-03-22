'use strict';
const tools = require('../helper/tools');
const schemas = {};
schemas.forumPost = tools.buildLiteSchema({
    type: 'object',
    required: [
        'text',
    ],
    properties: {
        parentPostId: { type: 'string' },
        depth: { type: 'number' },
        text: {
            type: 'array',
            items: { type: 'string' },
        },
    },
});
schemas.fullForumPost = tools.buildFullSchema({
    type: 'object',
    required: [
        'text',
    ],
    properties: {
        parentPostId: { type: 'string' },
        depth: { type: 'number' },
        text: {
            type: 'array',
            items: { type: 'string' },
        },
    },
});
schemas.forumPosts = {
    type: 'array',
    items: schemas.forumPost,
};
schemas.fullForumPosts = {
    type: 'array',
    items: schemas.fullForumPost,
};
export default schemas;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZm9ydW1Qb3N0cy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImZvcnVtUG9zdHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsWUFBWSxDQUFDO0FBRWIsTUFBTSxLQUFLLEdBQUcsT0FBTyxDQUFDLGlCQUFpQixDQUFDLENBQUM7QUFFekMsTUFBTSxPQUFPLEdBQUcsRUFBRSxDQUFDO0FBRW5CLE9BQU8sQ0FBQyxTQUFTLEdBQUcsS0FBSyxDQUFDLGVBQWUsQ0FBQztJQUN4QyxJQUFJLEVBQUUsUUFBUTtJQUNkLFFBQVEsRUFBRTtRQUNSLE1BQU07S0FDUDtJQUNELFVBQVUsRUFBRTtRQUNWLFlBQVksRUFBRSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUU7UUFDaEMsS0FBSyxFQUFFLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRTtRQUN6QixJQUFJLEVBQUU7WUFDSixJQUFJLEVBQUUsT0FBTztZQUNiLEtBQUssRUFBRSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUU7U0FDMUI7S0FDRjtDQUNGLENBQUMsQ0FBQztBQUVILE9BQU8sQ0FBQyxhQUFhLEdBQUcsS0FBSyxDQUFDLGVBQWUsQ0FBQztJQUM1QyxJQUFJLEVBQUUsUUFBUTtJQUNkLFFBQVEsRUFBRTtRQUNSLE1BQU07S0FDUDtJQUNELFVBQVUsRUFBRTtRQUNWLFlBQVksRUFBRSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUU7UUFDaEMsS0FBSyxFQUFFLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRTtRQUN6QixJQUFJLEVBQUU7WUFDSixJQUFJLEVBQUUsT0FBTztZQUNiLEtBQUssRUFBRSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUU7U0FDMUI7S0FDRjtDQUNGLENBQUMsQ0FBQztBQUVILE9BQU8sQ0FBQyxVQUFVLEdBQUc7SUFDbkIsSUFBSSxFQUFFLE9BQU87SUFDYixLQUFLLEVBQUUsT0FBTyxDQUFDLFNBQVM7Q0FDekIsQ0FBQztBQUVGLE9BQU8sQ0FBQyxjQUFjLEdBQUc7SUFDdkIsSUFBSSxFQUFFLE9BQU87SUFDYixLQUFLLEVBQUUsT0FBTyxDQUFDLGFBQWE7Q0FDN0IsQ0FBQztBQUVGLGVBQWUsT0FBTyxDQUFDIn0=