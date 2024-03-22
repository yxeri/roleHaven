import GeneralError, { ErrorTypes } from '@/error/GeneralError.js';
class Insufficient extends GeneralError {
    constructor({ name = '', errorObject, extraData, }) {
        super({
            errorObject,
            extraData,
            type: ErrorTypes.INSUFFICIENT,
            text: [`${name} not enough`],
        });
    }
}
export default Insufficient;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiSW5zdWZmaWNpZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiSW5zdWZmaWNpZW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sWUFBWSxFQUFFLEVBQW1CLFVBQVUsRUFBRSxNQUFNLHlCQUF5QixDQUFDO0FBRXBGLE1BQU0sWUFBYSxTQUFRLFlBQVk7SUFNckMsWUFBWSxFQUNWLElBQUksR0FBRyxFQUFFLEVBQ1QsV0FBVyxFQUNYLFNBQVMsR0FDTztRQUNoQixLQUFLLENBQUM7WUFDSixXQUFXO1lBQ1gsU0FBUztZQUNULElBQUksRUFBRSxVQUFVLENBQUMsWUFBWTtZQUM3QixJQUFJLEVBQUUsQ0FBQyxHQUFHLElBQUksYUFBYSxDQUFDO1NBQzdCLENBQUMsQ0FBQztJQUNMLENBQUM7Q0FDRjtBQUVELGVBQWUsWUFBWSxDQUFDIn0=