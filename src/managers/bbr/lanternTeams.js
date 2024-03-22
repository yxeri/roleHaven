'use strict';
import { dbConfig } from '../../config/defaults/config';
import dbLanternHack from '../../db/connectors/bbr/lanternHack';
import errorCreator from '../../error/errorCreator';
import authenticator from '../../helpers/authenticator';
import objectValidator from '../../utils/objectValidator';
function getLanternTeams({ token, callback, }) {
    authenticator.isUserAllowed({
        token,
        commandName: dbConfig.apiCommands.GetLanternTeam.name,
        callback: ({ error }) => {
            if (error) {
                callback({ error });
                return;
            }
            dbLanternHack.getTeams({
                callback: ({ error: teamError, data: teamData, }) => {
                    if (teamError) {
                        callback({ error: teamError });
                        return;
                    }
                    callback({ data: teamData });
                },
            });
        },
    });
}
function deleteLanternTeam({ token, teamId, callback, }) {
    authenticator.isUserAllowed({
        token,
        commandName: dbConfig.apiCommands.DeleteLanternTeam.name,
        callback: ({ error }) => {
            if (error) {
                callback({ error });
                return;
            }
            dbLanternHack.deleteTeam({
                teamId,
                callback,
            });
        },
    });
}
function createLanternTeam({ io, team, token, callback, }) {
    authenticator.isUserAllowed({
        token,
        commandName: dbConfig.apiCommands.CreateLanternTeam.name,
        callback: ({ error }) => {
            if (error) {
                callback({ error });
                return;
            }
            if (!objectValidator.isValidData({ team }, {
                team: {
                    teamName: true,
                    shortName: true,
                    teamId: true,
                },
            })) {
                callback({ error: new errorCreator.InvalidData({ expected: '{ team: { teamName, shortName, teamId } }' }) });
                return;
            }
            const newTeam = team;
            newTeam.teamName = newTeam.teamName.toLowerCase();
            newTeam.shortName.toLowerCase();
            createLanternTeam({
                team,
                callback: ({ error: teamError, data: teamData, }) => {
                    if (teamError) {
                        callback({ error: teamError });
                        return;
                    }
                    io.emit('lanternTeam', {
                        data: {
                            team: teamData.team,
                            changeType: dbConfig.ChangeTypes.CREATE,
                        },
                    });
                    callback({ data: teamData });
                },
            });
        },
    });
}
function updateLanternTeam({ teamId, io, team, token, callback, }) {
    authenticator.isUserAllowed({
        token,
        commandName: dbConfig.apiCommands.UpdateLanternStation.name,
        callback: ({ error }) => {
            if (error) {
                callback({ error });
                return;
            }
            const { teamName, shortName, points, isActive, resetPoints, } = team;
            updateLanternTeam({
                teamId,
                isActive,
                resetPoints,
                teamName: teamName
                    ?
                        teamName.toLowerCase()
                    :
                        undefined,
                shortName: shortName
                    ?
                        shortName.toLowerCase()
                    :
                        undefined,
                points: typeof points === 'number' && team.points > -1
                    ?
                        points
                    :
                        undefined,
                callback: ({ error: teamError, data: teamData, }) => {
                    if (teamError) {
                        callback({ error: teamError });
                        return;
                    }
                    io.emit('lanternTeam', {
                        data: {
                            team: teamData.team,
                        },
                    });
                    callback({ data: teamData });
                },
            });
        },
    });
}
export { deleteLanternTeam };
export { getLanternTeams };
export { createLanternTeam };
export { updateLanternTeam };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGFudGVyblRlYW1zLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibGFudGVyblRlYW1zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFlBQVksQ0FBQztBQUViLE9BQU8sRUFBRSxRQUFRLEVBQUUsTUFBTSw4QkFBOEIsQ0FBQztBQUN4RCxPQUFPLGFBQWEsTUFBTSxxQ0FBcUMsQ0FBQztBQUNoRSxPQUFPLFlBQVksTUFBTSwwQkFBMEIsQ0FBQztBQUNwRCxPQUFPLGFBQWEsTUFBTSw2QkFBNkIsQ0FBQztBQUN4RCxPQUFPLGVBQWUsTUFBTSw2QkFBNkIsQ0FBQztBQVExRCxTQUFTLGVBQWUsQ0FBQyxFQUN2QixLQUFLLEVBQ0wsUUFBUSxHQUNUO0lBQ0MsYUFBYSxDQUFDLGFBQWEsQ0FBQztRQUMxQixLQUFLO1FBQ0wsV0FBVyxFQUFFLFFBQVEsQ0FBQyxXQUFXLENBQUMsY0FBYyxDQUFDLElBQUk7UUFDckQsUUFBUSxFQUFFLENBQUMsRUFBRSxLQUFLLEVBQUUsRUFBRSxFQUFFO1lBQ3RCLElBQUksS0FBSyxFQUFFLENBQUM7Z0JBQ1YsUUFBUSxDQUFDLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQztnQkFFcEIsT0FBTztZQUNULENBQUM7WUFFRCxhQUFhLENBQUMsUUFBUSxDQUFDO2dCQUNyQixRQUFRLEVBQUUsQ0FBQyxFQUNULEtBQUssRUFBRSxTQUFTLEVBQ2hCLElBQUksRUFBRSxRQUFRLEdBQ2YsRUFBRSxFQUFFO29CQUNILElBQUksU0FBUyxFQUFFLENBQUM7d0JBQ2QsUUFBUSxDQUFDLEVBQUUsS0FBSyxFQUFFLFNBQVMsRUFBRSxDQUFDLENBQUM7d0JBRS9CLE9BQU87b0JBQ1QsQ0FBQztvQkFFRCxRQUFRLENBQUMsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLENBQUMsQ0FBQztnQkFDL0IsQ0FBQzthQUNGLENBQUMsQ0FBQztRQUNMLENBQUM7S0FDRixDQUFDLENBQUM7QUFDTCxDQUFDO0FBU0QsU0FBUyxpQkFBaUIsQ0FB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