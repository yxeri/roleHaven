'use strict';
const tools = require('../helper/tools');
const { appConfig } = require('../../../config/defaults/config');
const data = {};
data.create = {
    first: {
        text: [
            tools.createRandString({ length: appConfig.messageMaxLength / 2 }),
            tools.createRandString({ length: appConfig.messageMaxLength / 2 }),
        ],
    },
    second: {
        text: [
            tools.createRandString({ length: appConfig.messageMaxLength / 2 }),
            tools.createRandString({ length: appConfig.messageMaxLength / 2 }),
        ],
    },
    missing: {
        text: [
            tools.createRandString({ length: appConfig.messageMaxLength / 2 }),
            tools.createRandString({ length: appConfig.messageMaxLength / 2 }),
        ],
    },
};
data.update = {
    toUpdate: {
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
        text: [
            tools.createRandString({ length: appConfig.messageMaxLength / 2 }),
            tools.createRandString({ length: appConfig.messageMaxLength / 2 }),
        ],
    },
    secondToRemove: {
        text: [
            tools.createRandString({ length: appConfig.messageMaxLength / 2 }),
            tools.createRandString({ length: appConfig.messageMaxLength / 2 }),
        ],
    },
};
export default data;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVzc2FnZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJtZXNzYWdlcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxZQUFZLENBQUM7QUFFYixNQUFNLEtBQUssR0FBRyxPQUFPLENBQUMsaUJBQWlCLENBQUMsQ0FBQztBQUN6QyxNQUFNLEVBQUUsU0FBUyxFQUFFLEdBQUcsT0FBTyxDQUFDLGlDQUFpQyxDQUFDLENBQUM7QUFFakUsTUFBTSxJQUFJLEdBQUcsRUFBRSxDQUFDO0FBRWhCLElBQUksQ0FBQyxNQUFNLEdBQUc7SUFDWixLQUFLLEVBQUU7UUFDTCxJQUFJLEVBQUU7WUFDSixLQUFLLENBQUMsZ0JBQWdCLENBQUMsRUFBRSxNQUFNLEVBQUUsU0FBUyxDQUFDLGdCQUFnQixHQUFHLENBQUMsRUFBRSxDQUFDO1lBQ2xFLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFFLE1BQU0sRUFBRSxTQUFTLENBQUMsZ0JBQWdCLEdBQUcsQ0FBQyxFQUFFLENBQUM7U0FDbkU7S0FDRjtJQUNELE1BQU0sRUFBRTtRQUNOLElBQUksRUFBRTtZQUNKLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFFLE1BQU0sRUFBRSxTQUFTLENBQUMsZ0JBQWdCLEdBQUcsQ0FBQyxFQUFFLENBQUM7WUFDbEUsS0FBSyxDQUFDLGdCQUFnQixDQUFDLEVBQUUsTUFBTSxFQUFFLFNBQVMsQ0FBQyxnQkFBZ0IsR0FBRyxDQUFDLEVBQUUsQ0FBQztTQUNuRTtLQUNGO0lBQ0QsT0FBTyxFQUFFO1FBQ1AsSUFBSSxFQUFFO1lBQ0osS0FBSyxDQUFDLGdCQUFnQixDQUFDLEVBQUUsTUFBTSxFQUFFLFNBQVMsQ0FBQyxnQkFBZ0IsR0FBRyxDQUFDLEVBQUUsQ0FBQztZQUNsRSxLQUFLLENBQUMsZ0JBQWdCLENBQUMsRUFBRSxNQUFNLEVBQUUsU0FBUyxDQUFDLGdCQUFnQixHQUFHLENBQUMsRUFBRSxDQUFDO1NBQ25FO0tBQ0Y7Q0FDRixDQUFDO0FBRUYsSUFBSSxDQUFDLE1BQU0sR0FBRztJQUNaLFFBQVEsRUFBRTtRQUNSLElBQUksRUFBRTtZQUNKLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFFLE1BQU0sRUFBRSxTQUFTLENBQUMsZ0JBQWdCLEdBQUcsQ0FBQyxFQUFFLENBQUM7WUFDbEUsS0FBSyxDQUFDLGdCQUFnQixDQUFDLEVBQUUsTUFBTSxFQUFFLFNBQVMsQ0FBQyxnQkFBZ0IsR0FBRyxDQUFDLEVBQUUsQ0FBQztTQUNuRTtLQUNGO0lBQ0QsVUFBVSxFQUFFO1FBQ1YsSUFBSSxFQUFFO1lBQ0osS0FBSyxDQUFDLGdCQUFnQixDQUFDLEVBQUUsTUFBTSxFQUFFLFNBQVMsQ0FBQyxnQkFBZ0IsR0FBRyxDQUFDLEVBQUUsQ0FBQztZQUNsRSxLQUFLLENBQUMsZ0JBQWdCLENBQUMsRUFBRSxNQUFNLEVBQUUsU0FBUyxDQUFDLGdCQUFnQixHQUFHLENBQUMsRUFBRSxDQUFDO1NBQ25FO0tBQ0Y7Q0FDRixDQUFDO0FBRUYsSUFBSSxDQUFDLE1BQU0sR0FBRztJQUNaLFFBQVEsRUFBRTtRQUNSLElBQUksRUFBRTtZQUNKLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFFLE1BQU0sRUFBRSxTQUFTLENBQUMsZ0JBQWdCLEdBQUcsQ0FBQyxFQUFFLENBQUM7WUFDbEUsS0FBSyxDQUFDLGdCQUFnQixDQUFDLEVBQUUsTUFBTSxFQUFFLFNBQVMsQ0FBQyxnQkFBZ0IsR0FBRyxDQUFDLEVBQUUsQ0FBQztTQUNuRTtLQUNGO0lBQ0QsY0FBYyxFQUFFO1FBQ2QsSUFBSSxFQUFFO1lBQ0osS0FBSyxDQUFDLGdCQUFnQixDQUFDLEVBQUUsTUFBTSxFQUFFLFNBQVMsQ0FBQyxnQkFBZ0IsR0FBRyxDQUFDLEVBQUUsQ0FBQztZQUNsRSxLQUFLLENBQUMsZ0JBQWdCLENBQUMsRUFBRSxNQUFNLEVBQUUsU0FBUyxDQUFDLGdCQUFnQixHQUFHLENBQUMsRUFBRSxDQUFDO1NBQ25FO0tBQ0Y7Q0FDRixDQUFDO0FBRUYsZUFBZSxJQUFJLENBQUMifQ==