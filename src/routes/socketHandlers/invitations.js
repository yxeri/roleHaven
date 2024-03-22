'use strict';
import invitationManager from '../../managers/invitations';
function handle(socket, io) {
    socket.on('declineInvitation', (params, callback = () => {
    }) => {
        params.callback = callback;
        params.io = io;
        params.socket = socket;
        invitationManager.declineInvitation(params);
    });
    socket.on('getInvitations', (params, callback = () => {
    }) => {
        params.callback = callback;
        params.io = io;
        params.socket = socket;
        invitationManager.getInvitations(params);
    });
}
export default { handle };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW52aXRhdGlvbnMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbnZpdGF0aW9ucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxZQUFZLENBQUM7QUFFYixPQUFPLGlCQUFpQixNQUFNLDRCQUE0QixDQUFDO0FBUTNELFNBQVMsTUFBTSxDQUFDLE1BQU0sRUFBRSxFQUFFO0lBQ3hCLE1BQU0sQ0FBQyxFQUFFLENBQUMsbUJBQW1CLEVBQUUsQ0FBQyxNQUFNLEVBQUUsUUFBUSxHQUFHLEdBQUcsRUFBRTtJQUN4RCxDQUFDLEVBQUUsRUFBRTtRQUNILE1BQU0sQ0FBQyxRQUFRLEdBQUcsUUFBUSxDQUFDO1FBQzNCLE1BQU0sQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDO1FBQ2YsTUFBTSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUM7UUFFdkIsaUJBQWlCLENBQUMsaUJBQWlCLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDOUMsQ0FBQyxDQUFDLENBQUM7SUFFSCxNQUFNLENBQUMsRUFBRSxDQUFDLGdCQUFnQixFQUFFLENBQUMsTUFBTSxFQUFFLFFBQVEsR0FBRyxHQUFHLEVBQUU7SUFDckQsQ0FBQyxFQUFFLEVBQUU7UUFDSCxNQUFNLENBQUMsUUFBUSxHQUFHLFFBQVEsQ0FBQztRQUMzQixNQUFNLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQztRQUNmLE1BQU0sQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDO1FBRXZCLGlCQUFpQixDQUFDLGNBQWMsQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUMzQyxDQUFDLENBQUMsQ0FBQztBQUNMLENBQUM7QUFFRCxlQUFlLEVBQUUsTUFBTSxFQUFFLENBQUMifQ==