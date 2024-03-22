'use strict';
const { appConfig } = require('../../../config/defaults/config');
const tools = require('../helper/tools');
const data = {};
data.create = {
    first: {
        roomName: tools.createRandString({ length: appConfig.roomNameMaxLength }),
    },
    second: {
        roomName: tools.createRandString({ length: appConfig.roomNameMaxLength }),
    },
    missing: {
        roomName: tools.createRandString({ length: appConfig.roomNameMaxLength }),
    },
};
data.update = {
    toUpdate: {
        roomName: tools.createRandString({ length: appConfig.roomNameMaxLength }),
    },
    updateWith: {
        roomName: tools.createRandString({ length: appConfig.roomNameMaxLength }),
    },
};
data.remove = {
    toRemove: {
        roomName: tools.createRandString({ length: appConfig.roomNameMaxLength }),
    },
    secondToRemove: {
        roomName: tools.createRandString({ length: appConfig.roomNameMaxLength }),
    },
};
export default data;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm9vbXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJyb29tcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxZQUFZLENBQUM7QUFFYixNQUFNLEVBQUUsU0FBUyxFQUFFLEdBQUcsT0FBTyxDQUFDLGlDQUFpQyxDQUFDLENBQUM7QUFDakUsTUFBTSxLQUFLLEdBQUcsT0FBTyxDQUFDLGlCQUFpQixDQUFDLENBQUM7QUFFekMsTUFBTSxJQUFJLEdBQUcsRUFBRSxDQUFDO0FBRWhCLElBQUksQ0FBQyxNQUFNLEdBQUc7SUFDWixLQUFLLEVBQUU7UUFDTCxRQUFRLEVBQUUsS0FBSyxDQUFDLGdCQUFnQixDQUFDLEVBQUUsTUFBTSxFQUFFLFNBQVMsQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO0tBQzFFO0lBQ0QsTUFBTSxFQUFFO1FBQ04sUUFBUSxFQUFFLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFFLE1BQU0sRUFBRSxTQUFTLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztLQUMxRTtJQUNELE9BQU8sRUFBRTtRQUNQLFFBQVEsRUFBRSxLQUFLLENBQUMsZ0JBQWdCLENBQUMsRUFBRSxNQUFNLEVBQUUsU0FBUyxDQUFDLGlCQUFpQixFQUFFLENBQUM7S0FDMUU7Q0FDRixDQUFDO0FBRUYsSUFBSSxDQUFDLE1BQU0sR0FBRztJQUNaLFFBQVEsRUFBRTtRQUNSLFFBQVEsRUFBRSxLQUFLLENBQUMsZ0JBQWdCLENBQUMsRUFBRSxNQUFNLEVBQUUsU0FBUyxDQUFDLGlCQUFpQixFQUFFLENBQUM7S0FDMUU7SUFDRCxVQUFVLEVBQUU7UUFDVixRQUFRLEVBQUUsS0FBSyxDQUFDLGdCQUFnQixDQUFDLEVBQUUsTUFBTSxFQUFFLFNBQVMsQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO0tBQzFFO0NBQ0YsQ0FBQztBQUVGLElBQUksQ0FBQyxNQUFNLEdBQUc7SUFDWixRQUFRLEVBQUU7UUFDUixRQUFRLEVBQUUsS0FBSyxDQUFDLGdCQUFnQixDQUFDLEVBQUUsTUFBTSxFQUFFLFNBQVMsQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO0tBQzFFO0lBQ0QsY0FBYyxFQUFFO1FBQ2QsUUFBUSxFQUFFLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFFLE1BQU0sRUFBRSxTQUFTLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztLQUMxRTtDQUNGLENBQUM7QUFFRixlQUFlLElBQUksQ0FBQyJ9