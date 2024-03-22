import GeneralError, { ErrorTypes } from '@/error/GeneralError.js';
class NotAllowedError extends GeneralError {
    constructor({ name, errorObject, extraData, verbose, }) {
        super({
            errorObject,
            extraData,
            verbose,
            type: ErrorTypes.NOTALLOWED,
            text: [
                'Insufficient permissions',
                `Tried to ${name}`,
            ],
        });
    }
}
export default NotAllowedError;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTm90QWxsb3dlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIk5vdEFsbG93ZWQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxZQUFZLEVBQUUsRUFBbUIsVUFBVSxFQUFFLE1BQU0seUJBQXlCLENBQUM7QUFFcEYsTUFBTSxlQUFnQixTQUFRLFlBQVk7SUFDeEMsWUFBWSxFQUNWLElBQUksRUFDSixXQUFXLEVBQ1gsU0FBUyxFQUNULE9BQU8sR0FDUztRQUNoQixLQUFLLENBQUM7WUFDSixXQUFXO1lBQ1gsU0FBUztZQUNULE9BQU87WUFDUCxJQUFJLEVBQUUsVUFBVSxDQUFDLFVBQVU7WUFDM0IsSUFBSSxFQUFFO2dCQUNKLDBCQUEwQjtnQkFDMUIsWUFBWSxJQUFJLEVBQUU7YUFDbkI7U0FDRixDQUFDLENBQUM7SUFDTCxDQUFDO0NBQ0Y7QUFFRCxlQUFlLGVBQWUsQ0FBQyJ9