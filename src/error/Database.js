import GeneralError, { ErrorTypes } from 'src/error/GeneralError.js';
class Database extends GeneralError {
    constructor({ errorObject, name = '', extraData, }) {
        super({
            errorObject,
            extraData,
            type: ErrorTypes.DATABASE,
            text: [`Failed to save/retrieve data ${name}`],
        });
    }
}
export default Database;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRGF0YWJhc2UuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJEYXRhYmFzZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLFlBQVksRUFBRSxFQUFjLFVBQVUsRUFBRSxNQUFNLDJCQUEyQixDQUFDO0FBRWpGLE1BQU0sUUFBUyxTQUFRLFlBQVk7SUFLakMsWUFBWSxFQUNWLFdBQVcsRUFDWCxJQUFJLEdBQUcsRUFBRSxFQUNULFNBQVMsR0FDRTtRQUNYLEtBQUssQ0FBQztZQUNKLFdBQVc7WUFDWCxTQUFTO1lBQ1QsSUFBSSxFQUFFLFVBQVUsQ0FBQyxRQUFRO1lBQ3pCLElBQUksRUFBRSxDQUFDLGdDQUFnQyxJQUFJLEVBQUUsQ0FBQztTQUMvQyxDQUFDLENBQUM7SUFDTCxDQUFDO0NBQ0Y7QUFFRCxlQUFlLFFBQVEsQ0FBQyJ9