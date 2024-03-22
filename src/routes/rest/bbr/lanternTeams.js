'use strict';
import express from 'express';
import errorCreator from '../../../error/errorCreator';
import restErrorChecker from '../../../helpers/restErrorChecker';
import lanternTeamManager from '../../../managers/bbr/lanternTeams';
import objectValidator from '../../../utils/objectValidator';
const router = new express.Router();
function handle(io) {
    router.delete('/:teamId', (request, response) => {
        if (!objectValidator.isValidData(request.params, { teamId: true })) {
            restErrorChecker.checkAndSendError({
                response,
                error: new errorCreator.InvalidData({ expected: '' }),
                sentData: request.body.data,
            });
            return;
        }
        lanternTeamManager.deleteLanternTeam({
            token: request.headers.authorization,
            teamId: request.params.teamId,
            callback: ({ error, data, }) => {
                if (error) {
                    restErrorChecker.checkAndSendError({
                        response,
                        error,
                    });
                    return;
                }
                response.json({ data });
            },
        });
    });
    router.get('/', (request, response) => {
        lanternTeamManager.getLanternTeams({
            token: request.headers.authorization,
            callback: ({ error, data, }) => {
                if (error) {
                    restErrorChecker.checkAndSendError({
                        response,
                        error,
                        sentData: request.body.data,
                    });
                    return;
                }
                response.json({ data });
            },
        });
    });
    router.post('/', (request, response) => {
        if (!objectValidator.isValidData(request.body, {
            data: {
                team: {
                    shortName: true,
                    teamName: true,
                },
            },
        })) {
            restErrorChecker.checkAndSendError({
                response,
                error: new errorCreator.InvalidData({ expected: '' }),
                sentData: request.body.data,
            });
            return;
        }
        lanternTeamManager.createLanternTeam({
            io,
            team: request.body.data.team,
            token: request.headers.authorization,
            callback: ({ error, data, }) => {
                if (error) {
                    restErrorChecker.checkAndSendError({
                        response,
                        error,
                        sentData: request.body.data,
                    });
                    return;
                }
                response.json({ data });
            },
        });
    });
    router.post('/:teamId', (request, response) => {
        if (!objectValidator.isValidData(request.params, { teamId: true })) {
            restErrorChecker.checkAndSendError({
                response,
                error: new errorCreator.InvalidData({ expected: '' }),
                sentData: request.body.data,
            });
            return;
        }
        if (!objectValidator.isValidData(request.body, { data: { team: true } })) {
            restErrorChecker.checkAndSendError({
                response,
                error: new errorCreator.InvalidData({ expected: '' }),
                sentData: request.body.data,
            });
            return;
        }
        lanternTeamManager.updateLanternTeam({
            io,
            teamId: request.params.teamId,
            team: request.body.data.team,
            token: request.headers.authorization,
            callback: ({ error, data, }) => {
                if (error) {
                    restErrorChecker.checkAndSendError({
                        response,
                        error,
                        sentData: request.body.data,
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGFudGVyblRlYW1zLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibGFudGVyblRlYW1zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFlBQVksQ0FBQztBQUViLE9BQU8sT0FBTyxNQUFNLFNBQVMsQ0FBQztBQUM5QixPQUFPLFlBQVksTUFBTSw2QkFBNkIsQ0FBQztBQUN2RCxPQUFPLGdCQUFnQixNQUFNLG1DQUFtQyxDQUFDO0FBQ2pFLE9BQU8sa0JBQWtCLE1BQU0sb0NBQW9DLENBQUM7QUFDcEUsT0FBTyxlQUFlLE1BQU0sZ0NBQWdDLENBQUM7QUFFN0QsTUFBTSxNQUFNLEdBQUcsSUFBSSxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUM7QUFNcEMsU0FBUyxNQUFNLENBQUMsRUFBRTtJQXNCaEIsTUFBTSxDQUFDLE1BQU0sQ0FBQyxVQUFVLEVBQUUsQ0FBQyxPQUFPLEVBQUUsUUFBUSxFQUFFLEVBQUU7UUFDOUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUFFLENBQUM7WUFDbkUsZ0JBQWdCLENBQUMsaUJBQWlCLENBQUM7Z0JBQ2pDLFFBQVE7Z0JBQ1IsS0FBSyxFQUFFLElBQUksWUFBWSxDQUFDLFdBQVcsQ0FBQyxFQUFFLFFBQVEsRUFBRSxFQUFFLEVBQUUsQ0FBQztnQkFDckQsUUFBUSxFQUFFLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSTthQUM1QixDQUFDLENBQUM7WUFFSCxPQUFPO1FBQ1QsQ0FBQztRQUVELGtCQUFrQixDQUFDLGlCQUFpQixDQUFDO1lBQ25DLEtBQUssRUFBRSxPQUFPLENBQUMsT0FBTyxDQUFDLGFBQWE7WUFDcEMsTUFBTSxFQUFFLE9BQU8sQ0FBQyxNQUFNLENBQUMsTUFBTTtZQUM3QixRQUFRLEVBQUUsQ0FBQyxFQUNULEtBQUssRUFDTCxJQUFJLEdBQ0wsRUFBRSxFQUFFO2dCQUNILElBQUksS0FB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