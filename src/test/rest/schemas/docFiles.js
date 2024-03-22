'use strict';
const tools = require('../helper/tools');
const schemas = {};
schemas.liteDocFile = tools.buildLiteSchema({
    type: 'object',
    required: [
        'title',
    ],
    properties: {
        title: { type: 'string' },
        code: { type: 'string' },
    },
});
schemas.docFile = tools.buildLiteSchema({
    type: 'object',
    required: [
        'code',
        'title',
        'text',
    ],
    properties: {
        code: { type: 'string' },
        title: { type: 'string' },
        text: {
            type: 'array',
            items: { type: 'string' },
        },
    },
});
schemas.fullDocFile = tools.buildFullSchema({
    type: 'object',
    required: [
        'code',
        'title',
        'text',
    ],
    properties: {
        code: { type: 'string' },
        title: { type: 'string' },
        text: {
            type: 'array',
            items: { type: 'string' },
        },
    },
});
schemas.docFiles = {
    type: 'array',
    items: schemas.docFile,
};
schemas.fullDocFiles = {
    type: 'array',
    items: schemas.fullDocFile,
};
schemas.liteDocFiles = {
    type: 'array',
    items: schemas.liteDocFile,
};
export default schemas;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZG9jRmlsZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJkb2NGaWxlcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxZQUFZLENBQUM7QUFFYixNQUFNLEtBQUssR0FBRyxPQUFPLENBQUMsaUJBQWlCLENBQUMsQ0FBQztBQUV6QyxNQUFNLE9BQU8sR0FBRyxFQUFFLENBQUM7QUFFbkIsT0FBTyxDQUFDLFdBQVcsR0FBRyxLQUFLLENBQUMsZUFBZSxDQUFDO0lBQzFDLElBQUksRUFBRSxRQUFRO0lBQ2QsUUFBUSxFQUFFO1FBQ1IsT0FBTztLQUNSO0lBQ0QsVUFBVSxFQUFFO1FBQ1YsS0FBSyxFQUFFLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRTtRQUN6QixJQUFJLEVBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFO0tBQ3pCO0NBQ0YsQ0FBQyxDQUFDO0FBRUgsT0FBTyxDQUFDLE9BQU8sR0FBRyxLQUFLLENBQUMsZUFBZSxDQUFDO0lBQ3RDLElBQUksRUFBRSxRQUFRO0lBQ2QsUUFBUSxFQUFFO1FBQ1IsTUFBTTtRQUNOLE9BQU87UUFDUCxNQUFNO0tBQ1A7SUFDRCxVQUFVLEVBQUU7UUFDVixJQUFJLEVBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFO1FBQ3hCLEtBQUssRUFBRSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUU7UUFDekIsSUFBSSxFQUFFO1lBQ0osSUFBSSxFQUFFLE9BQU87WUFDYixLQUFLLEVBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFO1NBQzFCO0tBQ0Y7Q0FDRixDQUFDLENBQUM7QUFFSCxPQUFPLENBQUMsV0FBVyxHQUFHLEtBQUssQ0FBQyxlQUFlLENBQUM7SUFDMUMsSUFBSSxFQUFFLFFBQVE7SUFDZCxRQUFRLEVBQUU7UUFDUixNQUFNO1FBQ04sT0FBTztRQUNQLE1BQU07S0FDUDtJQUNELFVBQVUsRUFBRTtRQUNWLElBQUksRUFBRSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUU7UUFDeEIsS0FBSyxFQUFFLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRTtRQUN6QixJQUFJLEVBQUU7WUFDSixJQUFJLEVBQUUsT0FBTztZQUNiLEtBQUssRUFBRSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUU7U0FDMUI7S0FDRjtDQUNGLENBQUMsQ0FBQztBQUVILE9BQU8sQ0FBQyxRQUFRLEdBQUc7SUFDakIsSUFBSSxFQUFFLE9BQU87SUFDYixLQUFLLEVBQUUsT0FBTyxDQUFDLE9BQU87Q0FDdkIsQ0FBQztBQUVGLE9BQU8sQ0FBQyxZQUFZLEdBQUc7SUFDckIsSUFBSSxFQUFFLE9BQU87SUFDYixLQUFLLEVBQUUsT0FBTyxDQUFDLFdBQVc7Q0FDM0IsQ0FBQztBQUVGLE9BQU8sQ0FBQyxZQUFZLEdBQUc7SUFDckIsSUFBSSxFQUFFLE9BQU87SUFDYixLQUFLLEVBQUUsT0FBTyxDQUFDLFdBQVc7Q0FDM0IsQ0FBQztBQUVGLGVBQWUsT0FBTyxDQUFDIn0=