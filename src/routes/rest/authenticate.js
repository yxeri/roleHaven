'use strict';
import express from 'express';
import authenticator from '../../helpers/authenticator';
import errorCreator from '../../error/errorCreator';
import restErrorChecker from '../../helpers/restErrorChecker';
import objectValidator from '../../utils/objectValidator';
const router = new express.Router();
function handle() {
    router.post('/', (request, response) => {
        const sentData = request.body.data;
        if (!objectValidator.isValidData(request.body, { data: { user: { password: true } } })) {
            restErrorChecker.checkAndSendError({
                response,
                error: new errorCreator.InvalidData({ expected: 'data = { user: { password } }' }),
                sentData,
            });
            return;
        }
        if (!request.body.data.user.username && !request.body.data.user.userId) {
            sentData.user.password = typeof sentData.user.password !== 'undefined';
            restErrorChecker.checkAndSendError({
                response,
                error: new errorCreator.InvalidData({ expected: 'userId or username has to be set' }),
                sentData,
            });
            return;
        }
        const { username, userId, password, } = request.body.data.user;
        authenticator.createToken({
            userId,
            username,
            password,
            callback: ({ error, data, }) => {
                if (error) {
                    restErrorChecker.checkAndSendError({
                        response,
                        error,
                        sentData,
                    });
                    return;
                }
                response.json({ data });
            },
        });
    });
    return router;
}
export default handle;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXV0aGVudGljYXRlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiYXV0aGVudGljYXRlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFlBQVksQ0FBQztBQUViLE9BQU8sT0FBTyxNQUFNLFNBQVMsQ0FBQztBQUU5QixPQUFPLGFBQWEsTUFBTSw2QkFBNkIsQ0FBQztBQUV4RCxPQUFPLFlBQVksTUFBTSwwQkFBMEIsQ0FBQztBQUNwRCxPQUFPLGdCQUFnQixNQUFNLGdDQUFnQyxDQUFDO0FBQzlELE9BQU8sZUFBZSxNQUFNLDZCQUE2QixDQUFDO0FBRTFELE1BQU0sTUFBTSxHQUFHLElBQUksT0FBTyxDQUFDLE1BQU0sRUFBRSxDQUFDO0FBS3BDLFNBQVMsTUFBTTtJQWtCYixNQUFNLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDLE9BQU8sRUFBRSxRQUFRLEVBQUUsRUFBRTtRQUNyQyxNQUFNLFFBQVEsR0FBRyxPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQztRQUVuQyxJQUFJLENBQUMsZUFBZSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLEVBQUUsSUFBSSxFQUFFLEVBQUUsSUFBSSxFQUFFLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUM7WUFDdkYsZ0JBQWdCLENBQUMsaUJBQWlCLENBQUM7Z0JBQ2pDLFFBQVE7Z0JBQ1IsS0FBSyxFQUFFLElBQUksWUFBWSxDQUFDLFdBQVcsQ0FBQyxFQUFFLFFBQVEsRUFBRSwrQkFBK0IsRUFBRSxDQUFDO2dCQUNsRixRQUFRO2FBQ1QsQ0FBQyxDQUFDO1lBRUgsT0FBTztRQUNULENBQUM7UUFFRCxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztZQUN2RSxRQUFRLENBQUMsSUFBSSxDQUFDLFFBQVEsR0FBRyxPQUFPLFFBQVEsQ0FBQyxJQUFJLENBQUMsUUFBUSxLQUFLLFdBQVcsQ0FBQztZQUV2RSxnQkFBZ0IsQ0FBQyxpQkFBaUIsQ0FBQztnQkFDakMsUUFBUTtnQkFDUixLQUFLLEVBQUUsSUFBSSxZQUFZLENBQUMsV0FBVyxDQUFDLEVBQUUsUUFBUSxFQUFFLGtDQUFrQyxFQUFFLENBQUM7Z0JBQ3JGLFFBQVE7YUFDVCxDQUFDLENBQUM7WUFFSCxPQUFPO1FBQ1QsQ0FBQztRQUVELE1BQU0sRUFDSixRQUFRLEVBQ1IsTUFBTSxFQUNOLFFBQVEsR0FDVCxHQUFHLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQztRQUUzQixhQUFhLENBQUMsV0FBVyxDQUFDO1lBQ3hCLE1BQU07WUFDTixRQUFRO1lBQ1IsUUFBUTtZQUNSLFFBQVEsRUFBRSxDQUFDLEVBQ1QsS0FBSyxFQUNMLElBQUksR0FDTCxFQUFFLEVBQUU7Z0JBQ0gsSUFBSSxLQUFLLEVBQUUsQ0FBQztvQkFDVixnQkFBZ0IsQ0FBQyxpQkFBaUIsQ0FBQzt3QkFDakMsUUFBUTt3QkFDUixLQUFLO3dCQUNMLFFBQVE7cUJBQ1QsQ0FBQyxDQUFDO29CQUVILE9BQU87Z0JBQ1QsQ0FBQztnQkFFRCxRQUFRLENBQUMsSUFBSSxDQUFDLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztZQUMxQixDQUFDO1NBQ0YsQ0FBQyxDQUFDO0lBQ0wsQ0FBQyxDQUFDLENBQUM7SUFFSCxPQUFPLE1BQU0sQ0FBQztBQUNoQixDQUFDO0FBRUQsZUFBZSxNQUFNLENBQUMifQ==