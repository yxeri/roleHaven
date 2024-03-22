import authenticator from '../helpers/authenticator';
import teamManager from './teams';
import { dbConfig } from '../config/defaults/config';
export function createMission({ internalCallUser, token, }) {
    authenticator.isUserAllowed({
        internalCallUser,
        token,
        commandName: dbConfig.apiCommands.CreateMission,
        callback: () => {
        },
    });
}
export function completeMission({ socket, io, }) {
    teamManager.updateTeam({
        teamId,
        team,
        callback: () => {
        },
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWlzc2lvbnMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJtaXNzaW9ucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLGFBQWEsTUFBTSwwQkFBMEIsQ0FBQztBQUNyRCxPQUFPLFdBQVcsTUFBTSxTQUFTLENBQUM7QUFDbEMsT0FBTyxFQUFFLFFBQVEsRUFBRSxNQUFNLDJCQUEyQixDQUFDO0FBRXJELE1BQU0sVUFBVSxhQUFhLENBQUMsRUFDNUIsZ0JBQWdCLEVBQ2hCLEtBQUssR0FDTjtJQUNDLGFBQWEsQ0FBQyxhQUFhLENBQUM7UUFDMUIsZ0JBQWdCO1FBQ2hCLEtBQUs7UUFDTCxXQUFXLEVBQUUsUUFBUSxDQUFDLFdBQVcsQ0FBQyxhQUFhO1FBQy9DLFFBQVEsRUFBRSxHQUFHLEVBQUU7UUFFZixDQUFDO0tBQ0YsQ0FBQyxDQUFDO0FBQ0wsQ0FBQztBQUVELE1BQU0sVUFBVSxlQUFlLENBQUMsRUFDOUIsTUFBTSxFQUNOLEVBQUUsR0FDSDtJQUNDLFdBQVcsQ0FBQyxVQUFVLENBQUM7UUFDckIsTUFBTTtRQUNOLElBQUk7UUFDSixRQUFRLEVBQUUsR0FBRyxFQUFFO1FBRWYsQ0FBQztLQUNGLENBQUMsQ0FBQztBQUNMLENBQUMifQ==