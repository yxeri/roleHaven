'use strict';
const dbLanternHack = require('../../db/connectors/bbr/lanternHack');
const authenticator = require('../../helpers/authenticator');
const { dbConfig } = require('../../config/defaults/config');
function createGameUsers({ gameUsers, token, callback, }) {
    authenticator.isUserAllowed({
        token,
        commandName: dbConfig.apiCommands.CreateGameItems.name,
        callback: ({ error }) => {
            if (error) {
                callback({ error });
                return;
            }
            dbLanternHack.createGameUsers({ gameUsers });
            callback({ data: { message: 'Action done' } });
        },
    });
}
function createFakePasswords({ passwords, token, callback, }) {
    authenticator.isUserAllowed({
        token,
        commandName: dbConfig.apiCommands.CreateGameItems.name,
        callback: ({ error }) => {
            if (error) {
                callback({ error });
                return;
            }
            dbLanternHack.addFakePasswords({
                passwords,
                callback: ({ error: passwordError, data: passwordData, }) => {
                    if (passwordError) {
                        callback({ error: passwordError });
                        return;
                    }
                    callback({ data: passwordData });
                },
            });
        },
    });
}
function getGameUsers({ stationId, token, callback, }) {
    authenticator.isUserAllowed({
        token,
        commandName: dbConfig.apiCommands.GetGameItems.name,
        callback: ({ error }) => {
            if (error) {
                callback({ error });
                return;
            }
            dbLanternHack.getGameUsers({
                stationId,
                callback: ({ error: usersError, data: usersData, }) => {
                    if (usersError) {
                        callback({ error: usersError });
                        return;
                    }
                    callback({ data: usersData });
                },
            });
        },
    });
}
function getFakePasswords({ token, callback, }) {
    authenticator.isUserAllowed({
        token,
        commandName: dbConfig.apiCommands.GetGameItems.name,
        callback: ({ error }) => {
            if (error) {
                callback({ error });
                return;
            }
            dbLanternHack.getAllFakePasswords({
                callback: ({ error: passwordError, data: passwordData, }) => {
                    if (passwordError) {
                        callback({ error: passwordError });
                        return;
                    }
                    callback({ data: passwordData });
                },
            });
        },
    });
}
export { createGameUsers };
export { createFakePasswords };
export { getGameUsers };
export { getFakePasswords };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2FtZUl0ZW1zLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZ2FtZUl0ZW1zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFlBQVksQ0FBQztBQUViLE1BQU0sYUFBYSxHQUFHLE9BQU8sQ0FBQyxxQ0FBcUMsQ0FBQyxDQUFDO0FBQ3JFLE1BQU0sYUFBYSxHQUFHLE9BQU8sQ0FBQyw2QkFBNkIsQ0FBQyxDQUFDO0FBQzdELE1BQU0sRUFBRSxRQUFRLEVBQUUsR0FBRyxPQUFPLENBQUMsOEJBQThCLENBQUMsQ0FBQztBQVE3RCxTQUFTLGVBQWUsQ0FBQyxFQUN2QixTQUFTLEVBQ1QsS0FBSyxFQUNMLFFBQVEsR0FDVDtJQUNDLGFBQWEsQ0FBQyxhQUFhLENBQUM7UUFDMUIsS0FBSztRQUNMLFdBQVcsRUFBRSxRQUFRLENBQUMsV0FBVyxDQUFDLGVBQWUsQ0FBQyxJQUFJO1FBQ3RELFFBQVEsRUFBRSxDQUFDLEVBQUUsS0FBSyxFQUFFLEVBQUUsRUFBRTtZQUN0QixJQUFJLEtBQUssRUFBRSxDQUFDO2dCQUNWLFFBQVEsQ0FBQyxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUM7Z0JBRXBCLE9BQU87WUFDVCxDQUFDO1lBRUQsYUFBYSxDQUFDLGVBQWUsQ0FBQyxFQUFFLFNBQVMsRUFBRSxDQUFDLENBQUM7WUFDN0MsUUFBUSxDQUFDLEVBQUUsSUFBSSxFQUFFLEVBQUUsT0FBTyxFQUFFLGFBQWEsRUFBRSxFQUFFLENBQUMsQ0FBQztRQUNqRCxDQUFDO0tBQ0YsQ0FBQyxDQUFDO0FBQ0wsQ0FBQztBQVFELFNBQVMsbUJBQW1CLENBQUMsRUFDM0IsU0FBUyxFQUNULEtBQUssRUFDTCxRQUFRLEdBQ1Q7SUFDQyxhQUFhLENBQUMsYUFBYSxDQUFDO1FBQzFCLEtBQUs7UUFDTCxXQUFXLEVBQUUsUUFBUSxDQUFDLFdBQVcsQ0FBQyxlQUFlLENBQUMsSUFBSTtRQUN0RCxRQUFRLEVBQUUsQ0FBQyxFQUFFLEtBQUssRUFBRSxFQUFFLEVBQUU7WUFDdEIsSUFBSSxLQUFLLEVBQUUsQ0FBQztnQkFDVixRQUFRLENBQUMsRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDO2dCQUVwQixPQUFPO1lBQ1QsQ0FBQztZQUVELGFBQWEsQ0FBQyxnQkFBZ0IsQ0FBQztnQkFDN0IsU0FBUztnQkFDVCxRQUFRLEVBQUUsQ0FBQyxFQUNULEtBQUssRUFBRSxhQUFhLEVBQ3BCLElBQUksRUFBRSxZQUFZLEdBQ25CLEVBQUUsRUFBRTtvQkFDSCxJQUFJLGFBQWEsRUFBRSxDQUFDO3dCQUNsQixRQUFRLENBQUMsRUFBRSxLQUFLLEVBQUUsYUFBYSxFQUFFLENBQUMsQ0FBQzt3QkFFbkMsT0FBTztvQkFDVCxDQUFDO29CQUVELFFBQVEsQ0FBQyxFQUFFLElBQUksRUFBRSxZQUFZLEVBQUUsQ0FBQyxDQUFDO2dCQUNuQyxDQUFDO2FBQ0YsQ0FBQyxDQUFDO1FBQ0wsQ0FBQztLQUNGLENBQUMsQ0FBQztBQUNMLENBQUM7QUFRRCxTQUFTLFlBQVksQ0FBQyxFQUNwQixTQUFTLEVBQ1QsS0FBSyxFQUNMLFFBQVEsR0FDVDtJQUNDLGFBQWEsQ0FBQyxhQUFhLENBQUM7UUFDMUIsS0FBSztRQUNMLFdBQVcsRUFBRSxRQUFRLENBQUMsV0FBVyxDQUFDLFlBQVksQ0FBQyxJQUFJO1FBQ25ELFFBQVEsRUFBRSxDQUFDLEVBQUUsS0FBSyxFQUFFLEVBQUUsRUFBRTtZQUN0QixJQUFJLEtBQUssRUFBRSxDQUFDO2dCQUNWLFFBQVEsQ0FBQyxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUM7Z0JBRXBCLE9BQU87WUFDVCxDQUFDO1lBRUQsYUFBYSxDQUFDLFlBQVksQ0FBQztnQkFDekIsU0FBUztnQkFDVCxRQUFRLEVBQUUsQ0FBQyxFQUNULEtBQUssRUFBRSxVQUFVLEVBQ2pCLElBQUksRUFBRSxTQUFTLEdBQ2hCLEVBQUUsRUFBRTtvQkFDSCxJQUFJLFVBQVUsRUFBRSxDQUFDO3dCQUNmLFFBQVEsQ0FBQyxFQUFFLEtBQUssRUFBRSxVQUFVLEVBQUUsQ0FBQyxDQUFDO3dCQUVoQyxPQUFPO29CQUNULENBQUM7b0JBRUQsUUFBUSxDQUFDLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxDQUFDLENBQUM7Z0JBQ2hDLENBQUM7YUFDRixDQUFDLENBQUM7UUFDTCxDQUFDO0tBQ0YsQ0FBQyxDQUFDO0FBQ0wsQ0FBQztBQU9ELFNBQVMsZ0JBQWdCLENBQUMsRUFDeEIsS0FBSyxFQUNMLFFBQVEsR0FDVDtJQUNDLGFBQWEsQ0FBQyxhQUFhLENBQUM7UUFDMUIsS0FBSztRQUNMLFdBQVcsRUFBRSxRQUFRLENBQUMsV0FBVyxDQUFDLFlBQVksQ0FBQyxJQUFJO1FBQ25ELFFBQVEsRUFBRSxDQUFDLEVBQUUsS0FBSyxFQUFFLEVBQUUsRUFBRTtZQUN0QixJQUFJLEtBQUssRUFBRSxDQUFDO2dCQUNWLFFBQVEsQ0FBQyxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUM7Z0JBRXBCLE9BQU87WUFDVCxDQUFDO1lBRUQsYUFBYSxDQUFDLG1CQUFtQixDQUFDO2dCQUNoQyxRQUFRLEVBQUUsQ0FBQyxFQUNULEtBQUssRUFBRSxhQUFhLEVBQ3BCLElBQUksRUFBRSxZQUFZLEdBQ25CLEVBQUUsRUFBRTtvQkFDSCxJQUFJLGFBQWEsRUFBRSxDQUFDO3dCQUNsQixRQUFRLENBQUMsRUFBRSxLQUFLLEVBQUUsYUFBYSxFQUFFLENBQUMsQ0FBQzt3QkFFbkMsT0FBTztvQkFDVCxDQUFDO29CQUVELFFBQVEsQ0FBQyxFQUFFLElBQUksRUFBRSxZQUFZLEVBQUUsQ0FBQyxDQUFDO2dCQUNuQyxDQUFDO2FBQ0YsQ0FBQyxDQUFDO1FBQ0wsQ0FBQztLQUNGLENBQUMsQ0FBQztBQUNMLENBQUM7QUFFRCxPQUFPLEVBQUUsZUFBZSxFQUFFLENBQUM7QUFDM0IsT0FBTyxFQUFFLG1CQUFtQixFQUFFLENBQUM7QUFDL0IsT0FBTyxFQUFFLFlBQVksRUFBRSxDQUFDO0FBQ3hCLE9BQU8sRUFBRSxnQkFBZ0IsRUFBRSxDQUFDIn0=