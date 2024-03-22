'use strict';
const tools = require('../helper/tools');
const baseObjects = require('./baseObjects');
const schemas = {};
schemas.transaction = tools.buildLiteSchema({
    type: 'object',
    required: [
        'amount',
        'toWalletId',
        'fromWalletId',
    ],
    properties: {
        amount: { type: 'number' },
        toWalletId: { type: 'string' },
        fromWalletId: { type: 'string' },
        note: { type: 'string' },
        coordinates: baseObjects.coordinates,
    },
});
schemas.fullTransaction = tools.buildFullSchema({
    type: 'object',
    required: [
        'amount',
        'toWalletId',
        'fromWalletId',
    ],
    properties: {
        amount: { type: 'number' },
        toWalletId: { type: 'string' },
        fromWalletId: { type: 'string' },
        note: { type: 'string' },
        coordinates: baseObjects.coordinates,
    },
});
schemas.transactions = {
    type: 'array',
    items: schemas.transaction,
};
schemas.fullTransactions = {
    type: 'array',
    items: schemas.fullTransaction,
};
export default schemas;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHJhbnNhY3Rpb25zLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsidHJhbnNhY3Rpb25zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFlBQVksQ0FBQztBQUViLE1BQU0sS0FBSyxHQUFHLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO0FBQ3pDLE1BQU0sV0FBVyxHQUFHLE9BQU8sQ0FBQyxlQUFlLENBQUMsQ0FBQztBQUU3QyxNQUFNLE9BQU8sR0FBRyxFQUFFLENBQUM7QUFFbkIsT0FBTyxDQUFDLFdBQVcsR0FBRyxLQUFLLENBQUMsZUFBZSxDQUFDO0lBQzFDLElBQUksRUFBRSxRQUFRO0lBQ2QsUUFBUSxFQUFFO1FBQ1IsUUFBUTtRQUNSLFlBQVk7UUFDWixjQUFjO0tBQ2Y7SUFDRCxVQUFVLEVBQUU7UUFDVixNQUFNLEVBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFO1FBQzFCLFVBQVUsRUFBRSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUU7UUFDOUIsWUFBWSxFQUFFLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRTtRQUNoQyxJQUFJLEVBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFO1FBQ3hCLFdBQVcsRUFBRSxXQUFXLENBQUMsV0FBVztLQUNyQztDQUNGLENBQUMsQ0FBQztBQUVILE9BQU8sQ0FBQyxlQUFlLEdBQUcsS0FBSyxDQUFDLGVBQWUsQ0FBQztJQUM5QyxJQUFJLEVBQUUsUUFBUTtJQUNkLFFBQVEsRUFBRTtRQUNSLFFBQVE7UUFDUixZQUFZO1FBQ1osY0FBYztLQUNmO0lBQ0QsVUFBVSxFQUFFO1FBQ1YsTUFBTSxFQUFFLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRTtRQUMxQixVQUFVLEVBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFO1FBQzlCLFlBQVksRUFBRSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUU7UUFDaEMsSUFBSSxFQUFFLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRTtRQUN4QixXQUFXLEVBQUUsV0FBVyxDQUFDLFdBQVc7S0FDckM7Q0FDRixDQUFDLENBQUM7QUFFSCxPQUFPLENBQUMsWUFBWSxHQUFHO0lBQ3JCLElBQUksRUFBRSxPQUFPO0lBQ2IsS0FBSyxFQUFFLE9BQU8sQ0FBQyxXQUFXO0NBQzNCLENBQUM7QUFFRixPQUFPLENBQUMsZ0JBQWdCLEdBQUc7SUFDekIsSUFBSSxFQUFFLE9BQU87SUFDYixLQUFLLEVBQUUsT0FBTyxDQUFDLGVBQWU7Q0FDL0IsQ0FBQztBQUVGLGVBQWUsT0FBTyxDQUFDIn0=