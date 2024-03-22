'use strict';
const transactionManager = require('../../managers/transactions');
function handle(socket, io) {
    socket.on('createTransaction', (params, callback = () => {
    }) => {
        params.callback = callback;
        params.io = io;
        params.socket = socket;
        transactionManager.createTransaction(params);
    });
    socket.on('updateTransaction', (params, callback = () => {
    }) => {
        params.callback = callback;
        params.io = io;
        params.socket = socket;
        transactionManager.updateTransaction(params);
    });
    socket.on('removeTransaction', (params, callback = () => {
    }) => {
        params.callback = callback;
        params.io = io;
        params.socket = socket;
        transactionManager.removeTransaction(params);
    });
    socket.on('getTransaction', (params, callback = () => {
    }) => {
        params.callback = callback;
        params.io = io;
        params.socket = socket;
        transactionManager.getTransactionById(params);
    });
    socket.on('getTransactions', (params, callback = () => {
    }) => {
        params.callback = callback;
        params.io = io;
        params.socket = socket;
        transactionManager.getTransactionsByUser(params);
    });
    socket.on('getTransactionsByWallet', (params, callback = () => {
    }) => {
        params.callback = callback;
        params.io = io;
        params.socket = socket;
        transactionManager.getTransactionsByWallet(params);
    });
}
export { handle };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHJhbnNhY3Rpb25zLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsidHJhbnNhY3Rpb25zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFlBQVksQ0FBQztBQUViLE1BQU0sa0JBQWtCLEdBQUcsT0FBTyxDQUFDLDZCQUE2QixDQUFDLENBQUM7QUFRbEUsU0FBUyxNQUFNLENBQUMsTUFBTSxFQUFFLEVBQUU7SUFDeEIsTUFBTSxDQUFDLEVBQUUsQ0FBQyxtQkFBbUIsRUFBRSxDQUFDLE1BQU0sRUFBRSxRQUFRLEdBQUcsR0FBRyxFQUFFO0lBQ3hELENBQUMsRUFBRSxFQUFFO1FBQ0gsTUFBTSxDQUFDLFFBQVEsR0FBRyxRQUFRLENBQUM7UUFDM0IsTUFBTSxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUM7UUFDZixNQUFNLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQztRQUV2QixrQkFBa0IsQ0FBQyxpQkFBaUIsQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUMvQyxDQUFDLENBQUMsQ0FBQztJQUVILE1BQU0sQ0FBQyxFQUFFLENBQUMsbUJBQW1CLEVBQUUsQ0FBQyxNQUFNLEVBQUUsUUFBUSxHQUFHLEdBQUcsRUFBRTtJQUN4RCxDQUFDLEVBQUUsRUFBRTtRQUNILE1BQU0sQ0FBQyxRQUFRLEdBQUcsUUFBUSxDQUFDO1FBQzNCLE1BQU0sQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDO1FBQ2YsTUFBTSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUM7UUFFdkIsa0JBQWtCLENBQUMsaUJBQWlCLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDL0MsQ0FBQyxDQUFDLENBQUM7SUFFSCxNQUFNLENBQUMsRUFBRSxDQUFDLG1CQUFtQixFQUFFLENBQUMsTUFBTSxFQUFFLFFBQVEsR0FBRyxHQUFHLEVBQUU7SUFDeEQsQ0FBQyxFQUFFLEVBQUU7UUFDSCxNQUFNLENBQUMsUUFBUSxHQUFHLFFBQVEsQ0FBQztRQUMzQixNQUFNLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQztRQUNmLE1BQU0sQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDO1FBRXZCLGtCQUFrQixDQUFDLGlCQUFpQixDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQy9DLENBQUMsQ0FBQyxDQUFDO0lBRUgsTUFBTSxDQUFDLEVBQUUsQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDLE1BQU0sRUFBRSxRQUFRLEdBQUcsR0FBRyxFQUFFO0lBQ3JELENBQUMsRUFBRSxFQUFFO1FBQ0gsTUFBTSxDQUFDLFFBQVEsR0FBRyxRQUFRLENBQUM7UUFDM0IsTUFBTSxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUM7UUFDZixNQUFNLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQztRQUV2QixrQkFBa0IsQ0FBQyxrQkFBa0IsQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUNoRCxDQUFDLENBQUMsQ0FBQztJQUVILE1BQU0sQ0FBQyxFQUFFLENBQUMsaUJBQWlCLEVBQUUsQ0FBQyxNQUFNLEVBQUUsUUFBUSxHQUFHLEdBQUcsRUFBRTtJQUN0RCxDQUFDLEVBQUUsRUFBRTtRQUNILE1BQU0sQ0FBQyxRQUFRLEdBQUcsUUFBUSxDQUFDO1FBQzNCLE1BQU0sQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDO1FBQ2YsTUFBTSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUM7UUFFdkIsa0JBQWtCLENBQUMscUJBQXFCLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDbkQsQ0FBQyxDQUFDLENBQUM7SUFFSCxNQUFNLENBQUMsRUFBRSxDQUFDLHlCQUF5QixFQUFFLENBQUMsTUFBTSxFQUFFLFFBQVEsR0FBRyxHQUFHLEVBQUU7SUFDOUQsQ0FBQyxFQUFFLEVBQUU7UUFDSCxNQUFNLENBQUMsUUFBUSxHQUFHLFFBQVEsQ0FBQztRQUMzQixNQUFNLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQztRQUNmLE1BQU0sQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDO1FBRXZCLGtCQUFrQixDQUFDLHVCQUF1QixDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQ3JELENBQUMsQ0FBQyxDQUFDO0FBQ0wsQ0FBQztBQUVELE9BQU8sRUFBRSxNQUFNLEVBQUUsQ0FBQyJ9