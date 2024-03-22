'use strict';
const tools = require('../helper/tools');
const baseObjects = require('./baseObjects');
const { dbConfig } = require('../../../config/defaults/config');
const schemas = {};
schemas.message = tools.buildLiteSchema({
    type: 'object',
    required: [
        'messageType',
        'text',
        'roomId',
    ],
    properties: {
        roomId: { type: 'string' },
        messageType: {
            type: 'string',
            enum: Object.values(dbConfig.MessageTypes),
        },
        coordinates: baseObjects.coordinates,
        intro: {
            type: 'array',
            items: { type: 'string' },
        },
        extro: {
            type: 'array',
            items: { type: 'string' },
        },
        image: {
            imageName: { type: 'string' },
            fileName: { type: 'string' },
            width: { type: 'number' },
            height: { type: 'number' },
        },
    },
});
schemas.fullMessage = tools.buildFullSchema({
    type: 'object',
    required: [
        'messageType',
        'text',
        'roomId',
    ],
    properties: {
        roomId: { type: 'string' },
        messageType: {
            type: 'string',
            enum: Object.values(dbConfig.MessageTypes),
        },
        coordinates: baseObjects.coordinates,
        intro: {
            type: 'array',
            items: { type: 'string' },
        },
        extro: {
            type: 'array',
            items: { type: 'string' },
        },
        image: {
            imageName: { type: 'string' },
            fileName: { type: 'string' },
            width: { type: 'number' },
            height: { type: 'number' },
        },
    },
});
schemas.messages = {
    type: 'array',
    items: schemas.message,
};
schemas.fullMessages = {
    type: 'array',
    items: schemas.fullMessage,
};
export default schemas;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVzc2FnZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJtZXNzYWdlcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxZQUFZLENBQUM7QUFFYixNQUFNLEtBQUssR0FBRyxPQUFPLENBQUMsaUJBQWlCLENBQUMsQ0FBQztBQUN6QyxNQUFNLFdBQVcsR0FBRyxPQUFPLENBQUMsZUFBZSxDQUFDLENBQUM7QUFDN0MsTUFBTSxFQUFFLFFBQVEsRUFBRSxHQUFHLE9BQU8sQ0FBQyxpQ0FBaUMsQ0FBQyxDQUFDO0FBRWhFLE1BQU0sT0FBTyxHQUFHLEVBQUUsQ0FBQztBQUVuQixPQUFPLENBQUMsT0FBTyxHQUFHLEtBQUssQ0FBQyxlQUFlLENBQUM7SUFDdEMsSUFBSSxFQUFFLFFBQVE7SUFDZCxRQUFRLEVBQUU7UUFDUixhQUFhO1FBQ2IsTUFBTTtRQUNOLFFBQVE7S0FDVDtJQUNELFVBQVUsRUFBRTtRQUNWLE1BQU0sRUFBRSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUU7UUFDMUIsV0FBVyxFQUFFO1lBQ1gsSUFBSSxFQUFFLFFBQVE7WUFDZCxJQUFJLEVBQUUsTUFBTSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsWUFBWSxDQUFDO1NBQzNDO1FBQ0QsV0FBVyxFQUFFLFdBQVcsQ0FBQyxXQUFXO1FBQ3BDLEtBQUssRUFBRTtZQUNMLElBQUksRUFBRSxPQUFPO1lBQ2IsS0FBSyxFQUFFLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRTtTQUMxQjtRQUNELEtBQUssRUFBRTtZQUNMLElBQUksRUFBRSxPQUFPO1lBQ2IsS0FBSyxFQUFFLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRTtTQUMxQjtRQUNELEtBQUssRUFBRTtZQUNMLFNBQVMsRUFBRSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUU7WUFDN0IsUUFBUSxFQUFFLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRTtZQUM1QixLQUFLLEVBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFO1lBQ3pCLE1BQU0sRUFBRSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUU7U0FDM0I7S0FDRjtDQUNGLENBQUMsQ0FBQztBQUVILE9BQU8sQ0FBQyxXQUFXLEdBQUcsS0FBSyxDQUFDLGVBQWUsQ0FBQztJQUMxQyxJQUFJLEVBQUUsUUFBUTtJQUNkLFFBQVEsRUFBRTtRQUNSLGFBQWE7UUFDYixNQUFNO1FBQ04sUUFBUTtLQUNUO0lBQ0QsVUFBVSxFQUFFO1FBQ1YsTUFBTSxFQUFFLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRTtRQUMxQixXQUFXLEVBQUU7WUFDWCxJQUFJLEVBQUUsUUFBUTtZQUNkLElBQUksRUFBRSxNQUFNLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxZQUFZLENBQUM7U0FDM0M7UUFDRCxXQUFXLEVBQUUsV0FBVyxDQUFDLFdBQVc7UUFDcEMsS0FBSyxFQUFFO1lBQ0wsSUFBSSxFQUFFLE9BQU87WUFDYixLQUFLLEVBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFO1NBQzFCO1FBQ0QsS0FBSyxFQUFFO1lBQ0wsSUFBSSxFQUFFLE9BQU87WUFDYixLQUFLLEVBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFO1NBQzFCO1FBQ0QsS0FBSyxFQUFFO1lBQ0wsU0FBUyxFQUFFLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRTtZQUM3QixRQUFRLEVBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFO1lBQzVCLEtBQUssRUFBRSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUU7WUFDekIsTUFBTSxFQUFFLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRTtTQUMzQjtLQUNGO0NBQ0YsQ0FBQyxDQUFDO0FBRUgsT0FBTyxDQUFDLFFBQVEsR0FBRztJQUNqQixJQUFJLEVBQUUsT0FBTztJQUNiLEtBQUssRUFBRSxPQUFPLENBQUMsT0FBTztDQUN2QixDQUFDO0FBRUYsT0FBTyxDQUFDLFlBQVksR0FBRztJQUNyQixJQUFJLEVBQUUsT0FBTztJQUNiLEtBQUssRUFBRSxPQUFPLENBQUMsV0FBVztDQUMzQixDQUFDO0FBRUYsZUFBZSxPQUFPLENBQUMifQ==