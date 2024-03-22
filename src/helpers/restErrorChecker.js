import errorCreator from '../error/errorCreator';
import { appConfig } from '../config/defaults/config';
function checkAndSendError({ response, error, title, detail, sentData, }) {
    const sendError = {
        status: 500,
        title: title || 'Internal server error',
        detail: detail || 'Internal server error',
    };
    if ((appConfig.mode === appConfig.Modes.TEST || appConfig.mode === appConfig.Modes.DEV) && sentData) {
        sendError.sentData = sentData;
    }
    switch (error.type) {
        case errorCreator.ErrorTypes.INVALIDCHARACTERS: {
            sendError.status = 400;
            sendError.title = title || 'Invalid characters or length';
            sendError.detail = detail || 'Invalid characters or length';
            break;
        }
        case errorCreator.ErrorTypes.INSUFFICIENT: {
            sendError.status = 400;
            sendError.title = title || 'Insufficient';
            sendError.detail = detail || 'Insufficient';
            break;
        }
        case errorCreator.ErrorTypes.INVALIDDATA: {
            sendError.status = 400;
            sendError.title = title || 'Invalid data';
            sendError.detail = detail || 'Invalid data';
            break;
        }
        case errorCreator.ErrorTypes.INVALIDMAIL: {
            sendError.status = 400;
            sendError.title = title || 'Invalid mail address';
            sendError.detail = detail || 'Invalid mail address';
            break;
        }
        case errorCreator.ErrorTypes.INCORRECT: {
            sendError.status = 400;
            sendError.title = title || 'Incorrect information sent';
            sendError.detail = detail || 'Incorrect information sent';
            break;
        }
        case errorCreator.ErrorTypes.NOTALLOWED: {
            sendError.status = 401;
            sendError.title = title || 'Unauthorized';
            sendError.detail = detail || 'Not allowed';
            break;
        }
        case errorCreator.ErrorTypes.BANNED: {
            sendError.status = 401;
            sendError.title = title || 'Banned';
            sendError.detail = detail || 'Banned';
            break;
        }
        case errorCreator.ErrorTypes.ALREADYEXISTS: {
            sendError.status = 403;
            sendError.title = title || 'Already exists';
            sendError.detail = detail || 'Already exists';
            break;
        }
        case errorCreator.ErrorTypes.DOESNOTEXIST: {
            sendError.status = 404;
            sendError.title = title || 'Does not exist';
            sendError.detail = detail || 'Does not exist';
            break;
        }
        default: {
            break;
        }
    }
    response.status(sendError.status)
        .json({
        error: sendError,
    });
}
export { checkAndSendError };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVzdEVycm9yQ2hlY2tlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInJlc3RFcnJvckNoZWNrZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxZQUFZLE1BQU0sdUJBQXVCLENBQUM7QUFDakQsT0FBTyxFQUFFLFNBQVMsRUFBRSxNQUFNLDJCQUEyQixDQUFDO0FBV3RELFNBQVMsaUJBQWlCLENBQUMsRUFDekIsUUFBUSxFQUNSLEtBQUssRUFDTCxLQUFLLEVBQ0wsTUFBTSxFQUNOLFFBQVEsR0FDVDtJQUNDLE1BQU0sU0FBUyxHQUFHO1FBQ2hCLE1BQU0sRUFBRSxHQUFHO1FBQ1gsS0FBSyxFQUFFLEtBQUssSUFBSSx1QkFBdUI7UUFDdkMsTUFBTSxFQUFFLE1BQU0sSUFBSSx1QkFBdUI7S0FDMUMsQ0FBQztJQUVGLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxLQUFLLFNBQVMsQ0FBQyxLQUFLLENBQUMsSUFBSSxJQUFJLFNBQVMsQ0FBQyxJQUFJLEtBQUssU0FBUyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsSUFBSSxRQUFRLEVBQUUsQ0FBQztRQUNwRyxTQUFTLENBQUMsUUFBUSxHQUFHLFFBQVEsQ0FBQztJQUNoQyxDQUFDO0lBRUQsUUFBUSxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDckIsS0FBSyxZQUFZLENBQUMsVUFBVSxDQUFDLGlCQUFpQixDQUFDLENBQUMsQ0FBQztZQUMvQyxTQUFTLENBQUMsTUFBTSxHQUFHLEdBQUcsQ0FBQztZQUN2QixTQUFTLENBQUMsS0FBSyxHQUFHLEtBQUssSUFBSSw4QkFBOEIsQ0FBQztZQUMxRCxTQUFTLENBQUMsTUFBTSxHQUFHLE1BQU0sSUFBSSw4QkFBOEIsQ0FBQztZQUU1RCxNQUFNO1FBQ1IsQ0FBQztRQUNELEtBQUssWUFBWSxDQUFDLFVBQVUsQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDO1lBQzFDLFNBQVMsQ0FBQyxNQUFNLEdBQUcsR0FBRyxDQUFDO1lBQ3ZC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