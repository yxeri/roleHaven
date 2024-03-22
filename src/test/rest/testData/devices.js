'use strict';
const tools = require('../helper/tools');
const { appConfig } = require('../../../config/defaults/config');
const data = {};
data.create = {
    first: {
        deviceName: tools.createRandString({ length: appConfig.deviceAliasMaxLength }),
    },
    second: {
        deviceName: tools.createRandString({ length: appConfig.deviceAliasMaxLength }),
    },
    missing: {
        deviceName: tools.createRandString({ length: appConfig.deviceAliasMaxLength }),
    },
};
data.update = {
    toUpdate: {
        deviceName: tools.createRandString({ length: appConfig.deviceAliasMaxLength }),
    },
    updateWith: {
        deviceName: tools.createRandString({ length: appConfig.deviceAliasMaxLength }),
    },
};
data.remove = {
    toRemove: {
        deviceName: tools.createRandString({ length: appConfig.deviceAliasMaxLength }),
    },
    secondToRemove: {
        deviceName: tools.createRandString({ length: appConfig.deviceAliasMaxLength }),
    },
};
export default data;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGV2aWNlcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImRldmljZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsWUFBWSxDQUFDO0FBRWIsTUFBTSxLQUFLLEdBQUcsT0FBTyxDQUFDLGlCQUFpQixDQUFDLENBQUM7QUFDekMsTUFBTSxFQUFFLFNBQVMsRUFBRSxHQUFHLE9BQU8sQ0FBQyxpQ0FBaUMsQ0FBQyxDQUFDO0FBRWpFLE1BQU0sSUFBSSxHQUFHLEVBQUUsQ0FBQztBQUVoQixJQUFJLENBQUMsTUFBTSxHQUFHO0lBQ1osS0FBSyxFQUFFO1FBQ0wsVUFBVSxFQUFFLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFFLE1BQU0sRUFBRSxTQUFTLENBQUMsb0JBQW9CLEVBQUUsQ0FBQztLQUMvRTtJQUNELE1BQU0sRUFBRTtRQUNOLFVBQVUsRUFBRSxLQUFLLENBQUMsZ0JBQWdCLENBQUMsRUFBRSxNQUFNLEVBQUUsU0FBUyxDQUFDLG9CQUFvQixFQUFFLENBQUM7S0FDL0U7SUFDRCxPQUFPLEVBQUU7UUFDUCxVQUFVLEVBQUUsS0FBSyxDQUFDLGdCQUFnQixDQUFDLEVBQUUsTUFBTSxFQUFFLFNBQVMsQ0FBQyxvQkFBb0IsRUFBRSxDQUFDO0tBQy9FO0NBQ0YsQ0FBQztBQUVGLElBQUksQ0FBQyxNQUFNLEdBQUc7SUFDWixRQUFRLEVBQUU7UUFDUixVQUFVLEVBQUUsS0FBSyxDQUFDLGdCQUFnQixDQUFDLEVBQUUsTUFBTSxFQUFFLFNBQVMsQ0FBQyxvQkFBb0IsRUFBRSxDQUFDO0tBQy9FO0lBQ0QsVUFBVSxFQUFFO1FBQ1YsVUFBVSxFQUFFLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFFLE1BQU0sRUFBRSxTQUFTLENBQUMsb0JBQW9CLEVBQUUsQ0FBQztLQUMvRTtDQUNGLENBQUM7QUFFRixJQUFJLENBQUMsTUFBTSxHQUFHO0lBQ1osUUFBUSxFQUFFO1FBQ1IsVUFBVSxFQUFFLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFFLE1BQU0sRUFBRSxTQUFTLENBQUMsb0JBQW9CLEVBQUUsQ0FBQztLQUMvRTtJQUNELGNBQWMsRUFBRTtRQUNkLFVBQVUsRUFBRSxLQUFLLENBQUMsZ0JBQWdCLENBQUMsRUFBRSxNQUFNLEVBQUUsU0FBUyxDQUFDLG9CQUFvQixFQUFFLENBQUM7S0FDL0U7Q0FDRixDQUFDO0FBRUYsZUFBZSxJQUFJLENBQUMifQ==