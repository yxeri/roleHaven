import GeneralError, { ErrorTypes } from '@/error/GeneralError.js';
class InvalidDataError extends GeneralError {
    constructor({ errorObject, verbose, extraData, }) {
        super({
            verbose,
            errorObject,
            extraData,
            type: ErrorTypes.INVALIDMAIL,
            text: [
                'Invalid mail address',
            ],
        });
    }
}
export default InvalidDataError;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiSW52YWxpZE1haWwuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJJbnZhbGlkTWFpbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLFlBQVksRUFBRSxFQUFtQixVQUFVLEVBQUUsTUFBTSx5QkFBeUIsQ0FBQztBQUVwRixNQUFNLGdCQUFpQixTQUFRLFlBQVk7SUFLekMsWUFBWSxFQUNWLFdBQVcsRUFDWCxPQUFPLEVBQ1AsU0FBUyxHQUNPO1FBQ2hCLEtBQUssQ0FBQztZQUNKLE9BQU87WUFDUCxXQUFXO1lBQ1gsU0FBUztZQUNULElBQUksRUFBRSxVQUFVLENBQUMsV0FBVztZQUM1QixJQUFJLEVBQUU7Z0JBQ0osc0JBQXNCO2FBQ3ZCO1NBQ0YsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztDQUNGO0FBRUQsZUFBZSxnQkFBZ0IsQ0FBQyJ9