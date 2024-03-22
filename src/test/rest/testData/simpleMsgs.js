'use strict';
const tools = require('../helper/tools');
const { appConfig } = require('../../../config/defaults/config');
const data = {};
data.create = {
    first: {
        text: tools.createRandString({ length: appConfig.messageMaxLength }),
    },
    second: {
        text: tools.createRandString({ length: appConfig.messageMaxLength }),
    },
    missing: {
        text: tools.createRandString({ length: appConfig.messageMaxLength }),
    },
};
data.update = {
    toUpdate: {
        text: tools.createRandString({ length: appConfig.messageMaxLength }),
    },
    updateWith: {
        text: tools.createRandString({ length: appConfig.messageMaxLength }),
    },
};
data.remove = {
    toRemove: {
        text: tools.createRandString({ length: appConfig.messageMaxLength }),
    },
    secondToRemove: {
        text: tools.createRandString({ length: appConfig.messageMaxLength }),
    },
};
export default data;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2ltcGxlTXNncy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInNpbXBsZU1zZ3MudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsWUFBWSxDQUFDO0FBRWIsTUFBTSxLQUFLLEdBQUcsT0FBTyxDQUFDLGlCQUFpQixDQUFDLENBQUM7QUFDekMsTUFBTSxFQUFFLFNBQVMsRUFBRSxHQUFHLE9BQU8sQ0FBQyxpQ0FBaUMsQ0FBQyxDQUFDO0FBRWpFLE1BQU0sSUFBSSxHQUFHLEVBQUUsQ0FBQztBQUVoQixJQUFJLENBQUMsTUFBTSxHQUFHO0lBQ1osS0FBSyxFQUFFO1FBQ0wsSUFBSSxFQUFFLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFFLE1BQU0sRUFBRSxTQUFTLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztLQUNyRTtJQUNELE1BQU0sRUFBRTtRQUNOLElBQUksRUFBRSxLQUFLLENBQUMsZ0JBQWdCLENBQUMsRUFBRSxNQUFNLEVBQUUsU0FBUyxDQUFDLGdCQUFnQixFQUFFLENBQUM7S0FDckU7SUFDRCxPQUFPLEVBQUU7UUFDUCxJQUFJLEVBQUUsS0FBSyxDQUFDLGdCQUFnQixDQUFDLEVBQUUsTUFBTSxFQUFFLFNBQVMsQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO0tBQ3JFO0NBQ0YsQ0FBQztBQUVGLElBQUksQ0FBQyxNQUFNLEdBQUc7SUFDWixRQUFRLEVBQUU7UUFDUixJQUFJLEVBQUUsS0FBSyxDQUFDLGdCQUFnQixDQUFDLEVBQUUsTUFBTSxFQUFFLFNBQVMsQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO0tBQ3JFO0lBQ0QsVUFBVSxFQUFFO1FBQ1YsSUFBSSxFQUFFLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFFLE1BQU0sRUFBRSxTQUFTLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztLQUNyRTtDQUNGLENBQUM7QUFFRixJQUFJLENBQUMsTUFBTSxHQUFHO0lBQ1osUUFBUSxFQUFFO1FBQ1IsSUFBSSxFQUFFLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFFLE1BQU0sRUFBRSxTQUFTLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztLQUNyRTtJQUNELGNBQWMsRUFBRTtRQUNkLElBQUksRUFBRSxLQUFLLENBQUMsZ0JBQWdCLENBQUMsRUFBRSxNQUFNLEVBQUUsU0FBUyxDQUFDLGdCQUFnQixFQUFFLENBQUM7S0FDckU7Q0FDRixDQUFDO0FBRUYsZUFBZSxJQUFJLENBQUMifQ==