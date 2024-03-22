'use strict';
import tools from '../helper/tools';
import { dbConfig } from '../../../config/defaults/config';
const schemas = {};
schemas.gameCode = tools.buildLiteSchema({
    type: 'object',
    required: [
        'code',
        'codeType',
    ],
    properties: {
        code: { type: 'string' },
        codeType: {
            type: 'string',
            enum: Object.values(dbConfig.GameCodeTypes),
        },
        codeContent: {
            type: 'array',
            items: { type: 'string' },
        },
        used: { type: 'boolean' },
        isRenewable: { type: 'boolean' },
    },
});
schemas.fullGameCode = tools.buildFullSchema({
    type: 'object',
    required: [
        'code',
        'codeType',
    ],
    properties: {
        code: { type: 'string' },
        codeType: {
            type: 'string',
            enum: Object.values(dbConfig.GameCodeTypes),
        },
        codeContent: {
            type: 'array',
            items: { type: 'string' },
        },
        used: { type: 'boolean' },
        isRenewable: { type: 'boolean' },
    },
});
schemas.gameCodes = {
    type: 'array',
    items: schemas.gameCode,
};
schemas.fullGameCodes = {
    type: 'array',
    items: schemas.fullGameCode,
};
export default schemas;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2FtZUNvZGVzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZ2FtZUNvZGVzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFlBQVksQ0FBQztBQUViLE9BQU8sS0FBSyxNQUFNLGlCQUFpQixDQUFDO0FBQ3BDLE9BQU8sRUFBRSxRQUFRLEVBQUUsTUFBTSxpQ0FBaUMsQ0FBQztBQUUzRCxNQUFNLE9BQU8sR0FBRyxFQUFFLENBQUM7QUFFbkIsT0FBTyxDQUFDLFFBQVEsR0FBRyxLQUFLLENBQUMsZUFBZSxDQUFDO0lBQ3ZDLElBQUksRUFBRSxRQUFRO0lBQ2QsUUFBUSxFQUFFO1FBQ1IsTUFBTTtRQUNOLFVBQVU7S0FDWDtJQUNELFVBQVUsRUFBRTtRQUNWLElBQUksRUFBRSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUU7UUFDeEIsUUFBUSxFQUFFO1lBQ1IsSUFBSSxFQUFFLFFBQVE7WUFDZCxJQUFJLEVBQUUsTUFBTSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsYUFBYSxDQUFDO1NBQzVDO1FBQ0QsV0FBVyxFQUFFO1lBQ1gsSUFBSSxFQUFFLE9BQU87WUFDYixLQUFLLEVBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFO1NBQzFCO1FBQ0QsSUFBSSxFQUFFLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRTtRQUN6QixXQUFXLEVBQUUsRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFO0tBQ2pDO0NBQ0YsQ0FBQyxDQUFDO0FBRUgsT0FBTyxDQUFDLFlBQVksR0FBRyxLQUFLLENBQUMsZUFBZSxDQUFDO0lBQzNDLElBQUksRUFBRSxRQUFRO0lBQ2QsUUFBUSxFQUFFO1FBQ1IsTUFBTTtRQUNOLFVBQVU7S0FDWDtJQUNELFVBQVUsRUFBRTtRQUNWLElBQUksRUFBRSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUU7UUFDeEIsUUFBUSxFQUFFO1lBQ1IsSUFBSSxFQUFFLFFBQVE7WUFDZCxJQUFJLEVBQUUsTUFBTSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsYUFBYSxDQUFDO1NBQzVDO1FBQ0QsV0FBVyxFQUFFO1lBQ1gsSUFBSSxFQUFFLE9BQU87WUFDYixLQUFLLEVBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFO1NBQzFCO1FBQ0QsSUFBSSxFQUFFLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRTtRQUN6QixXQUFXLEVBQUUsRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFO0tBQ2pDO0NBQ0YsQ0FBQyxDQUFDO0FBRUgsT0FBTyxDQUFDLFNBQVMsR0FBRztJQUNsQixJQUFJLEVBQUUsT0FBTztJQUNiLEtBQUssRUFBRSxPQUFPLENBQUMsUUFBUTtDQUN4QixDQUFDO0FBRUYsT0FBTyxDQUFDLGFBQWEsR0FBRztJQUN0QixJQUFJLEVBQUUsT0FBTztJQUNiLEtBQUssRUFBRSxPQUFPLENBQUMsWUFBWTtDQUM1QixDQUFDO0FBRUYsZUFBZSxPQUFPLENBQUMifQ==