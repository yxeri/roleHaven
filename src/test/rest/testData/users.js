'use strict';
const { appConfig } = require('../../../config/defaults/config');
const tools = require('../helper/tools');
const data = {};
data.create = {
    first: {
        username: tools.createRandString({ length: appConfig.usernameMaxLength }),
        password: tools.createRandString({ length: appConfig.passwordMaxLength }),
        registerDevice: tools.createRandString({ length: appConfig.deviceIdLength }),
    },
    second: {
        username: tools.createRandString({ length: appConfig.usernameMaxLength }),
        password: tools.createRandString({ length: appConfig.passwordMaxLength }),
        registerDevice: tools.createRandString({ length: appConfig.deviceIdLength }),
    },
    missing: {
        username: tools.createRandString({ length: appConfig.usernameMaxLength }),
        password: tools.createRandString({ length: appConfig.passwordMaxLength }),
    },
};
data.update = {
    toUpdate: {
        username: tools.createRandString({ length: appConfig.usernameMaxLength }),
        password: tools.createRandString({ length: appConfig.passwordMaxLength }),
        registerDevice: tools.createRandString({ length: appConfig.deviceIdLength }),
    },
    updateWith: {
        username: tools.createRandString({ length: appConfig.usernameMaxLength }),
    },
};
data.remove = {
    toRemove: {
        username: tools.createRandString({ length: appConfig.usernameMaxLength }),
        password: tools.createRandString({ length: appConfig.passwordMaxLength }),
        registerDevice: tools.createRandString({ length: appConfig.deviceIdLength }),
    },
    secondToRemove: {
        username: tools.createRandString({ length: appConfig.usernameMaxLength }),
        password: tools.createRandString({ length: appConfig.passwordMaxLength }),
        registerDevice: tools.createRandString({ length: appConfig.deviceIdLength }),
    },
};
export default data;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXNlcnMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJ1c2Vycy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxZQUFZLENBQUM7QUFFYixNQUFNLEVBQUUsU0FBUyxFQUFFLEdBQUcsT0FBTyxDQUFDLGlDQUFpQyxDQUFDLENBQUM7QUFDakUsTUFBTSxLQUFLLEdBQUcsT0FBTyxDQUFDLGlCQUFpQixDQUFDLENBQUM7QUFFekMsTUFBTSxJQUFJLEdBQUcsRUFBRSxDQUFDO0FBRWhCLElBQUksQ0FBQyxNQUFNLEdBQUc7SUFDWixLQUFLLEVBQUU7UUFDTCxRQUFRLEVBQUUsS0FBSyxDQUFDLGdCQUFnQixDQUFDLEVBQUUsTUFBTSxFQUFFLFNBQVMsQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO1FBQ3pFLFFBQVEsRUFBRSxLQUFLLENBQUMsZ0JBQWdCLENBQUMsRUFBRSxNQUFNLEVBQUUsU0FBUyxDQUFDLGlCQUFpQixFQUFFLENBQUM7UUFDekUsY0FBYyxFQUFFLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFFLE1BQU0sRUFBRSxTQUFTLENBQUMsY0FBYyxFQUFFLENBQUM7S0FDN0U7SUFDRCxNQUFNLEVBQUU7UUFDTixRQUFRLEVBQUUsS0FBSyxDQUFDLGdCQUFnQixDQUFDLEVBQUUsTUFBTSxFQUFFLFNBQVMsQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO1FBQ3pFLFFBQVEsRUFBRSxLQUFLLENBQUMsZ0JBQWdCLENBQUMsRUFBRSxNQUFNLEVBQUUsU0FBUyxDQUFDLGlCQUFpQixFQUFFLENBQUM7UUFDekUsY0FBYyxFQUFFLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFFLE1BQU0sRUFBRSxTQUFTLENBQUMsY0FBYyxFQUFFLENBQUM7S0FDN0U7SUFDRCxPQUFPLEVBQUU7UUFDUCxRQUFRLEVBQUUsS0FBSyxDQUFDLGdCQUFnQixDQUFDLEVBQUUsTUFBTSxFQUFFLFNBQVMsQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO1FBQ3pFLFFBQVEsRUFBRSxLQUFLLENBQUMsZ0JBQWdCLENBQUMsRUFBRSxNQUFNLEVBQUUsU0FBUyxDQUFDLGlCQUFpQixFQUFFLENBQUM7S0FDMUU7Q0FDRixDQUFDO0FBRUYsSUFBSSxDQUFDLE1BQU0sR0FBRztJQUNaLFFBQVEsRUFBRTtRQUNSLFFBQVEsRUFBRSxLQUFLLENBQUMsZ0JBQWdCLENBQUMsRUFBRSxNQUFNLEVBQUUsU0FBUyxDQUFDLGlCQUFpQixFQUFFLENBQUM7UUFDekUsUUFBUSxFQUFFLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFFLE1BQU0sRUFBRSxTQUFTLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztRQUN6RSxjQUFjLEVBQUUsS0FBSyxDQUFDLGdCQUFnQixDQUFDLEVBQUUsTUFBTSxFQUFFLFNBQVMsQ0FBQyxjQUFjLEVBQUUsQ0FBQztLQUM3RTtJQUNELFVBQVUsRUFBRTtRQUNWLFFBQVEsRUFBRSxLQUFLLENBQUMsZ0JBQWdCLENBQUMsRUFBRSxNQUFNLEVBQUUsU0FBUyxDQUFDLGlCQUFpQixFQUFFLENBQUM7S0FDMUU7Q0FDRixDQUFDO0FBRUYsSUFBSSxDQUFDLE1BQU0sR0FBRztJQUNaLFFBQVEsRUFBRTtRQUNSLFFBQVEsRUFBRSxLQUFLLENBQUMsZ0JBQWdCLENBQUMsRUFBRSxNQUFNLEVBQUUsU0FBUyxDQUFDLGlCQUFpQixFQUFFLENBQUM7UUFDekUsUUFBUSxFQUFFLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFFLE1BQU0sRUFBRSxTQUFTLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztRQUN6RSxjQUFjLEVBQUUsS0FBSyxDQUFDLGdCQUFnQixDQUFDLEVBQUUsTUFBTSxFQUFFLFNBQVMsQ0FBQyxjQUFjLEVBQUUsQ0FBQztLQUM3RTtJQUNELGNBQWMsRUFBRTtRQUNkLFFBQVEsRUFBRSxLQUFLLENBQUMsZ0JBQWdCLENBQUMsRUFBRSxNQUFNLEVBQUUsU0FBUyxDQUFDLGlCQUFpQixFQUFFLENBQUM7UUFDekUsUUFBUSxFQUFFLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFFLE1BQU0sRUFBRSxTQUFTLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztRQUN6RSxjQUFjLEVBQUUsS0FBSyxDQUFDLGdCQUFnQixDQUFDLEVBQUUsTUFBTSxFQUFFLFNBQVMsQ0FBQyxjQUFjLEVBQUUsQ0FBQztLQUM3RTtDQUNGLENBQUM7QUFFRixlQUFlLElBQUksQ0FBQyJ9