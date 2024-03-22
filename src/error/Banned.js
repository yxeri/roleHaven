import GeneralError, { ErrorTypes } from '@/error/GeneralError.js';
class Banned extends GeneralError {
    constructor({ name = '', errorObject, extraData, }) {
        super({
            errorObject,
            extraData,
            type: ErrorTypes.BANNED,
            text: [`${name} is banned`],
        });
    }
}
export default Banned;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQmFubmVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiQmFubmVkLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sWUFBWSxFQUFFLEVBQW1CLFVBQVUsRUFBRSxNQUFNLHlCQUF5QixDQUFDO0FBRXBGLE1BQU0sTUFBTyxTQUFRLFlBQVk7SUFDL0IsWUFBWSxFQUNWLElBQUksR0FBRyxFQUFFLEVBQ1QsV0FBVyxFQUNYLFNBQVMsR0FDTztRQUNoQixLQUFLLENBQUM7WUFDSixXQUFXO1lBQ1gsU0FBUztZQUNULElBQUksRUFBRSxVQUFVLENBQUMsTUFBTTtZQUN2QixJQUFJLEVBQUUsQ0FBQyxHQUFHLElBQUksWUFBWSxDQUFDO1NBQzVCLENBQUMsQ0FBQztJQUNMLENBQUM7Q0FDRjtBQUVELGVBQWUsTUFBTSxDQUFDIn0=