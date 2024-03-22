'use strict';
const tools = require('../helper/tools');
const { appConfig } = require('../../../config/defaults/config');
const data = {};
data.create = {
    first: {
        title: 'createOne',
        text: [
            tools.createRandString({ length: appConfig.messageMaxLength / 2 }),
            tools.createRandString({ length: appConfig.messageMaxLength / 2 }),
        ],
    },
    second: {
        title: 'createTwo',
        text: [
            tools.createRandString({ length: appConfig.messageMaxLength / 2 }),
            tools.createRandString({ length: appConfig.messageMaxLength / 2 }),
        ],
    },
    missing: {
        title: 'missing',
        text: [
            tools.createRandString({ length: appConfig.messageMaxLength / 2 }),
            tools.createRandString({ length: appConfig.messageMaxLength / 2 }),
        ],
    },
};
data.update = {
    toUpdate: {
        title: 'createThree',
        text: [
            tools.createRandString({ length: appConfig.messageMaxLength / 2 }),
            tools.createRandString({ length: appConfig.messageMaxLength / 2 }),
        ],
    },
    updateWith: {
        text: [
            tools.createRandString({ length: appConfig.messageMaxLength / 2 }),
            tools.createRandString({ length: appConfig.messageMaxLength / 2 }),
        ],
    },
};
data.remove = {
    toRemove: {
        title: 'createFour',
        text: [
            tools.createRandString({ length: appConfig.messageMaxLength / 2 }),
            tools.createRandString({ length: appConfig.messageMaxLength / 2 }),
        ],
    },
    secondToRemove: {
        title: 'createFive',
        text: [
            tools.createRandString({ length: appConfig.messageMaxLength / 2 }),
            tools.createRandString({ length: appConfig.messageMaxLength / 2 }),
        ],
    },
};
export default data;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZm9ydW1UaHJlYWRzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZm9ydW1UaHJlYWRzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFlBQVksQ0FBQztBQUViLE1BQU0sS0FBSyxHQUFHLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO0FBQ3pDLE1BQU0sRUFBRSxTQUFTLEVBQUUsR0FBRyxPQUFPLENBQUMsaUNBQWlDLENBQUMsQ0FBQztBQUVqRSxNQUFNLElBQUksR0FBRyxFQUFFLENBQUM7QUFFaEIsSUFBSSxDQUFDLE1BQU0sR0FBRztJQUNaLEtBQUssRUFBRTtRQUNMLEtBQUssRUFBRSxXQUFXO1FBQ2xCLElBQUksRUFBRTtZQUNKLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFFLE1BQU0sRUFBRSxTQUFTLENBQUMsZ0JBQWdCLEdBQUcsQ0FBQyxFQUFFLENBQUM7WUFDbEUsS0FBSyxDQUFDLGdCQUFnQixDQUFDLEVBQUUsTUFBTSxFQUFFLFNBQVMsQ0FBQyxnQkFBZ0IsR0FBRyxDQUFDLEVBQUUsQ0FBQztTQUNuRTtLQUNGO0lBQ0QsTUFBTSxFQUFFO1FBQ04sS0FBSyxFQUFFLFdBQVc7UUFDbEIsSUFBSSxFQUFFO1lBQ0osS0FBSyxDQUFDLGdCQUFnQixDQUFDLEVBQUUsTUFBTSxFQUFFLFNBQVMsQ0FBQyxnQkFBZ0IsR0FBRyxDQUFDLEVBQUUsQ0FBQztZQUNsRSxLQUFLLENBQUMsZ0JBQWdCLENBQUMsRUFBRSxNQUFNLEVBQUUsU0FBUyxDQUFDLGdCQUFnQixHQUFHLENBQUMsRUFBRSxDQUFDO1NBQ25FO0tBQ0Y7SUFDRCxPQUFPLEVBQUU7UUFDUCxLQUFLLEVBQUUsU0FBUztRQUNoQixJQUFJLEVBQUU7WUFDSixLQUFLLENBQUMsZ0JBQWdCLENBQUMsRUFBRSxNQUFNLEVBQUUsU0FBUyxDQUFDLGdCQUFnQixHQUFHLENBQUMsRUFBRSxDQUFDO1lBQ2xFLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFFLE1BQU0sRUFBRSxTQUFTLENBQUMsZ0JBQWdCLEdBQUcsQ0FBQyxFQUFFLENBQUM7U0FDbkU7S0FDRjtDQUNGLENBQUM7QUFFRixJQUFJLENBQUMsTUFBTSxHQUFHO0lBQ1osUUFBUSxFQUFFO1FBQ1IsS0FBSyxFQUFFLGFBQWE7UUFDcEIsSUFBSSxFQUFFO1lBQ0osS0FBSyxDQUFDLGdCQUFnQixDQUFDLEVBQUUsTUFBTSxFQUFFLFNBQVMsQ0FBQyxnQkFBZ0IsR0FBRyxDQUFDLEVBQUUsQ0FBQztZQUNsRSxLQUFLLENBQUMsZ0JBQWdCLENBQUMsRUFBRSxNQUFNLEVBQUUsU0FBUyxDQUFDLGdCQUFnQixHQUFHLENBQUMsRUFBRSxDQUFDO1NBQ25FO0tBQ0Y7SUFDRCxVQUFVLEVBQUU7UUFDVixJQUFJLEVBQUU7WUFDSixLQUFLLENBQUMsZ0JBQWdCLENBQUMsRUFBRSxNQUFNLEVBQUUsU0FBUyxDQUFDLGdCQUFnQixHQUFHLENBQUMsRUFBRSxDQUFDO1lBQ2xFLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFFLE1BQU0sRUFBRSxTQUFTLENBQUMsZ0JBQWdCLEdBQUcsQ0FBQyxFQUFFLENBQUM7U0FDbkU7S0FDRjtDQUNGLENBQUM7QUFFRixJQUFJLENBQUMsTUFBTSxHQUFHO0lBQ1osUUFBUSxFQUFFO1FBQ1IsS0FBSyxFQUFFLFlBQVk7UUFDbkIsSUFBSSxFQUFFO1lBQ0osS0FBSyxDQUFDLGdCQUFnQixDQUFDLEVBQUUsTUFBTSxFQUFFLFNBQVMsQ0FBQyxnQkFBZ0IsR0FBRyxDQUFDLEVBQUUsQ0FBQztZQUNsRSxLQUFLLENBQUMsZ0JBQWdCLENBQUMsRUFBRSxNQUFNLEVBQUUsU0FBUyxDQUFDLGdCQUFnQixHQUFHLENBQUMsRUFBRSxDQUFDO1NBQ25FO0tBQ0Y7SUFDRCxjQUFjLEVBQUU7UUFDZCxLQUFLLEVBQUUsWUFBWTtRQUNuQixJQUFJLEVBQUU7WUFDSixLQUFLLENBQUMsZ0JBQWdCLENBQUMsRUFBRSxNQUFNLEVBQUUsU0FBUyxDQUFDLGdCQUFnQixHQUFHLENBQUMsRUFBRSxDQUFDO1lBQ2xFLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFFLE1BQU0sRUFBRSxTQUFTLENBQUMsZ0JBQWdCLEdBQUcsQ0FBQyxFQUFFLENBQUM7U0FDbkU7S0FDRjtDQUNGLENBQUM7QUFFRixlQUFlLElBQUksQ0FBQyJ9