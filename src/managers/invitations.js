'use strict';
import { dbConfig } from '../config/defaults/config';
import authenticator from '../helpers/authenticator';
import dbInvitation from '../db/connectors/invitation';
function declineInvitation({ invitationId, token, callback, socket, io, }) {
    authenticator.isUserAllowed({
        token,
        commandName: dbConfig.apiCommands.DeclineInvitation.name,
        callback: ({ error }) => {
            if (error) {
                callback({ error });
                return;
            }
            dbInvitation.useInvitation({
                invitationId,
                callback: ({ error: invitationError, data: invitationData, }) => {
                    if (invitationError) {
                        callback({ error: invitationError });
                        return;
                    }
                    const { invitation } = invitationData;
                    const dataToSend = {
                        data: {
                            invitation,
                            changeType: dbConfig.ChangeTypes.REMOVE,
                        },
                    };
                    if (!socket) {
                        io.to(invitation.receiver)
                            .emit(dbConfig.EmitTypes.INVITATION, dataToSend);
                    }
                    callback(dataToSend);
                },
            });
        },
    });
}
export { declineInvitation };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW52aXRhdGlvbnMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbnZpdGF0aW9ucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxZQUFZLENBQUM7QUFFYixPQUFPLEVBQUUsUUFBUSxFQUFFLE1BQU0sMkJBQTJCLENBQUM7QUFFckQsT0FBTyxhQUFhLE1BQU0sMEJBQTBCLENBQUM7QUFDckQsT0FBTyxZQUFZLE1BQU0sNkJBQTZCLENBQUM7QUFXdkQsU0FBUyxpQkFBaUIsQ0FBQyxFQUN6QixZQUFZLEVBQ1osS0FBSyxFQUNMLFFBQVEsRUFDUixNQUFNLEVBQ04sRUFBRSxHQUNIO0lBQ0MsYUFBYSxDQUFDLGFBQWEsQ0FBQztRQUMxQixLQUFLO1FBQ0wsV0FBVyxFQUFFLFFBQVEsQ0FBQyxXQUFXLENBQUMsaUJBQWlCLENBQUMsSUFBSTtRQUN4RCxRQUFRLEVBQUUsQ0FBQyxFQUFFLEtBQUssRUFBRSxFQUFFLEVBQUU7WUFDdEIsSUFBSSxLQUFLLEVBQUUsQ0FBQztnQkFDVixRQUFRLENBQUMsRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDO2dCQUVwQixPQUFPO1lBQ1QsQ0FBQztZQUVELFlBQVksQ0FBQyxhQUFhLENBQUM7Z0JBQ3pCLFlBQVk7Z0JBQ1osUUFBUSxFQUFFLENBQUMsRUFDVCxLQUFLLEVBQUUsZUFBZSxFQUN0QixJQUFJLEVBQUUsY0FBYyxHQUNyQixFQUFFLEVBQUU7b0JBQ0gsSUFBSSxlQUFlLEVBQUUsQ0FBQzt3QkFDcEIsUUFBUSxDQUFDLEVBQUUsS0FBSyxFQUFFLGVBQWUsRUFBRSxDQUFDLENBQUM7d0JBRXJDLE9BQU87b0JBQ1QsQ0FBQztvQkFFRCxNQUFNLEVBQUUsVUFBVSxFQUFFLEdBQUcsY0FBYyxDQUFDO29CQUN0QyxNQUFNLFVBQVUsR0FBRzt3QkFDakIsSUFBSSxFQUFFOzRCQUNKLFVBQVU7NEJBQ1YsVUFBVSxFQUFFLFFBQVEsQ0FBQyxXQUFXLENBQUMsTUFBTTt5QkFDeEM7cUJBQ0YsQ0FBQztvQkFFRixJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7d0JBQ1osRUFBRSxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDOzZCQUN2QixJQUFJLENBQUMsUUFBUSxDQUFDLFNBQVMsQ0FBQyxVQUFVLEVBQUUsVUFBVSxDQUFDLENBQUM7b0JBQ3JELENBQUM7b0JBRUQsUUFBUSxDQUFDLFVBQVUsQ0FBQyxDQUFDO2dCQUN2QixDQUFDO2FBQ0YsQ0FBQyxDQUFDO1FBQ0wsQ0FBQztLQUNGLENBQUMsQ0FBQztBQUNMLENBQUM7QUFFRCxPQUFPLEVBQUUsaUJBQWlCLEVBQUUsQ0FBQyJ9