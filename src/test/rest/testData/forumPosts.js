'use strict';
const tools = require('../helper/tools');
const { appConfig } = require('../../../config/defaults/config');
const data = {};
data.create = {
    first: {
        text: [
            'first',
            tools.createRandString({ length: appConfig.messageMaxLength / 2 }),
        ],
    },
    second: {
        text: [
            'second',
            tools.createRandString({ length: appConfig.messageMaxLength / 2 }),
        ],
    },
    missing: {
        text: [tools.createRandString({ length: appConfig.messageMaxLength / 2 })],
    },
};
data.update = {
    toUpdate: {
        text: [
            'toUpdate',
            tools.createRandString({ length: appConfig.messageMaxLength / 2 }),
        ],
    },
    updateWith: {
        text: [
            'updateWith',
            tools.createRandString({ length: appConfig.messageMaxLength / 2 }),
        ],
    },
};
data.remove = {
    toRemove: {
        text: [
            'toRemove',
            tools.createRandString({ length: appConfig.messageMaxLength / 2 }),
        ],
    },
    secondToRemove: {
        text: [
            'secondToRemove',
            tools.createRandString({ length: appConfig.messageMaxLength / 2 }),
        ],
    },
};
export default data;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZm9ydW1Qb3N0cy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImZvcnVtUG9zdHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsWUFBWSxDQUFDO0FBRWIsTUFBTSxLQUFLLEdBQUcsT0FBTyxDQUFDLGlCQUFpQixDQUFDLENBQUM7QUFDekMsTUFBTSxFQUFFLFNBQVMsRUFBRSxHQUFHLE9BQU8sQ0FBQyxpQ0FBaUMsQ0FBQyxDQUFDO0FBRWpFLE1BQU0sSUFBSSxHQUFHLEVBQUUsQ0FBQztBQUVoQixJQUFJLENBQUMsTUFBTSxHQUFHO0lBQ1osS0FBSyxFQUFFO1FBQ0wsSUFBSSxFQUFFO1lBQ0osT0FBTztZQUNQLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFFLE1BQU0sRUFBRSxTQUFTLENBQUMsZ0JBQWdCLEdBQUcsQ0FBQyxFQUFFLENBQUM7U0FDbkU7S0FDRjtJQUNELE1BQU0sRUFBRTtRQUNOLElBQUksRUFBRTtZQUNKLFFBQVE7WUFDUixLQUFLLENBQUMsZ0JBQWdCLENBQUMsRUFBRSxNQUFNLEVBQUUsU0FBUyxDQUFDLGdCQUFnQixHQUFHLENBQUMsRUFBRSxDQUFDO1NBQ25FO0tBQ0Y7SUFDRCxPQUFPLEVBQUU7UUFDUCxJQUFJLEVBQUUsQ0FBQyxLQUFLLENBQUMsZ0JBQWdCLENBQUMsRUFBRSxNQUFNLEVBQUUsU0FBUyxDQUFDLGdCQUFnQixHQUFHLENBQUMsRUFBRSxDQUFDLENBQUM7S0FDM0U7Q0FDRixDQUFDO0FBRUYsSUFBSSxDQUFDLE1BQU0sR0FBRztJQUNaLFFBQVEsRUFBRTtRQUNSLElBQUksRUFBRTtZQUNKLFVBQVU7WUFDVixLQUFLLENBQUMsZ0JBQWdCLENBQUMsRUFBRSxNQUFNLEVBQUUsU0FBUyxDQUFDLGdCQUFnQixHQUFHLENBQUMsRUFBRSxDQUFDO1NBQ25FO0tBQ0Y7SUFDRCxVQUFVLEVBQUU7UUFDVixJQUFJLEVBQUU7WUFDSixZQUFZO1lBQ1osS0FBSyxDQUFDLGdCQUFnQixDQUFDLEVBQUUsTUFBTSxFQUFFLFNBQVMsQ0FBQyxnQkFBZ0IsR0FBRyxDQUFDLEVBQUUsQ0FBQztTQUNuRTtLQUNGO0NBQ0YsQ0FBQztBQUVGLElBQUksQ0FBQyxNQUFNLEdBQUc7SUFDWixRQUFRLEVBQUU7UUFDUixJQUFJLEVBQUU7WUFDSixVQUFVO1lBQ1YsS0FBSyxDQUFDLGdCQUFnQixDQUFDLEVBQUUsTUFBTSxFQUFFLFNBQVMsQ0FBQyxnQkFBZ0IsR0FBRyxDQUFDLEVBQUUsQ0FBQztTQUNuRTtLQUNGO0lBQ0QsY0FBYyxFQUFFO1FBQ2QsSUFBSSxFQUFFO1lBQ0osZ0JBQWdCO1lBQ2hCLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFFLE1BQU0sRUFBRSxTQUFTLENBQUMsZ0JBQWdCLEdBQUcsQ0FBQyxFQUFFLENBQUM7U0FDbkU7S0FDRjtDQUNGLENBQUM7QUFFRixlQUFlLElBQUksQ0FBQyJ9