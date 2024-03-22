'use strict';
import tools from '../helper/tools';
const schemas = {};
schemas.wallet = tools.buildLiteSchema({
    type: 'object',
    required: [
        'amount',
    ],
    properties: {
        amount: { type: 'number' },
        isProtected: { type: 'boolean' },
    },
});
schemas.fullWallet = tools.buildFullSchema({
    type: 'object',
    required: [
        'amount',
    ],
    properties: {
        amount: { type: 'number' },
        isProtected: { type: 'boolean' },
    },
});
schemas.wallets = {
    type: 'array',
    items: schemas.wallet,
};
schemas.fullWallets = {
    type: 'array',
    items: schemas.fullWallet,
};
export default schemas;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2FsbGV0cy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIndhbGxldHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsWUFBWSxDQUFDO0FBRWIsT0FBTyxLQUFLLE1BQU0saUJBQWlCLENBQUM7QUFFcEMsTUFBTSxPQUFPLEdBQUcsRUFBRSxDQUFDO0FBRW5CLE9BQU8sQ0FBQyxNQUFNLEdBQUcsS0FBSyxDQUFDLGVBQWUsQ0FBQztJQUNyQyxJQUFJLEVBQUUsUUFBUTtJQUNkLFFBQVEsRUFBRTtRQUNSLFFBQVE7S0FDVDtJQUNELFVBQVUsRUFBRTtRQUNWLE1BQU0sRUFBRSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUU7UUFDMUIsV0FBVyxFQUFFLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRTtLQUNqQztDQUNGLENBQUMsQ0FBQztBQUVILE9BQU8sQ0FBQyxVQUFVLEdBQUcsS0FBSyxDQUFDLGVBQWUsQ0FBQztJQUN6QyxJQUFJLEVBQUUsUUFBUTtJQUNkLFFBQVEsRUFBRTtRQUNSLFFBQVE7S0FDVDtJQUNELFVBQVUsRUFBRTtRQUNWLE1BQU0sRUFBRSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUU7UUFDMUIsV0FBVyxFQUFFLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRTtLQUNqQztDQUNGLENBQUMsQ0FBQztBQUVILE9BQU8sQ0FBQyxPQUFPLEdBQUc7SUFDaEIsSUFBSSxFQUFFLE9BQU87SUFDYixLQUFLLEVBQUUsT0FBTyxDQUFDLE1BQU07Q0FDdEIsQ0FBQztBQUVGLE9BQU8sQ0FBQyxXQUFXLEdBQUc7SUFDcEIsSUFBSSxFQUFFLE9BQU87SUFDYixLQUFLLEVBQUUsT0FBTyxDQUFDLFVBQVU7Q0FDMUIsQ0FBQztBQUVGLGVBQWUsT0FBTyxDQUFDIn0=