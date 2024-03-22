'use strict';
const tools = require('../helper/tools');
const { appConfig } = require('../../../config/defaults/config');
const data = {};
data.create = {
    first: {
        aliasName: tools.createRandString({ length: appConfig.usernameMaxLength }),
    },
    second: {
        aliasName: tools.createRandString({ length: appConfig.usernameMaxLength }),
    },
    missing: {
        aliasName: tools.createRandString({ length: appConfig.usernameMaxLength }),
    },
};
data.update = {
    toUpdate: {
        aliasName: tools.createRandString({ length: appConfig.usernameMaxLength }),
    },
    updateWith: {
        aliasName: tools.createRandString({ length: appConfig.usernameMaxLength }),
    },
};
data.remove = {
    toRemove: {
        aliasName: tools.createRandString({ length: appConfig.usernameMaxLength }),
    },
    secondToRemove: {
        aliasName: tools.createRandString({ length: appConfig.usernameMaxLength }),
    },
};
export default data;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWxpYXNlcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImFsaWFzZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsWUFBWSxDQUFDO0FBRWIsTUFBTSxLQUFLLEdBQUcsT0FBTyxDQUFDLGlCQUFpQixDQUFDLENBQUM7QUFDekMsTUFBTSxFQUFFLFNBQVMsRUFBRSxHQUFHLE9BQU8sQ0FBQyxpQ0FBaUMsQ0FBQyxDQUFDO0FBRWpFLE1BQU0sSUFBSSxHQUFHLEVBQUUsQ0FBQztBQUVoQixJQUFJLENBQUMsTUFBTSxHQUFHO0lBQ1osS0FBSyxFQUFFO1FBQ0wsU0FBUyxFQUFFLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFFLE1BQU0sRUFBRSxTQUFTLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztLQUMzRTtJQUNELE1BQU0sRUFBRTtRQUNOLFNBQVMsRUFBRSxLQUFLLENBQUMsZ0JBQWdCLENBQUMsRUFBRSxNQUFNLEVBQUUsU0FBUyxDQUFDLGlCQUFpQixFQUFFLENBQUM7S0FDM0U7SUFDRCxPQUFPLEVBQUU7UUFDUCxTQUFTLEVBQUUsS0FBSyxDQUFDLGdCQUFnQixDQUFDLEVBQUUsTUFBTSxFQUFFLFNBQVMsQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO0tBQzNFO0NBQ0YsQ0FBQztBQUVGLElBQUksQ0FBQyxNQUFNLEdBQUc7SUFDWixRQUFRLEVBQUU7UUFDUixTQUFTLEVBQUUsS0FBSyxDQUFDLGdCQUFnQixDQUFDLEVBQUUsTUFBTSxFQUFFLFNBQVMsQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO0tBQzNFO0lBQ0QsVUFBVSxFQUFFO1FBQ1YsU0FBUyxFQUFFLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFFLE1BQU0sRUFBRSxTQUFTLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztLQUMzRTtDQUNGLENBQUM7QUFFRixJQUFJLENBQUMsTUFBTSxHQUFHO0lBQ1osUUFBUSxFQUFFO1FBQ1IsU0FBUyxFQUFFLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFFLE1BQU0sRUFBRSxTQUFTLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztLQUMzRTtJQUNELGNBQWMsRUFBRTtRQUNkLFNBQVMsRUFBRSxLQUFLLENBQUMsZ0JBQWdCLENBQUMsRUFBRSxNQUFNLEVBQUUsU0FBUyxDQUFDLGlCQUFpQixFQUFFLENBQUM7S0FDM0U7Q0FDRixDQUFDO0FBRUYsZUFBZSxJQUFJLENBQUMifQ==