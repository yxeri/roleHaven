import GeneralError, { ErrorTypes } from '@/error/GeneralError.js';
class Incorrect extends GeneralError {
    constructor({ name = '-', errorObject, extraData, }) {
        super({
            errorObject,
            extraData,
            type: ErrorTypes.INCORRECT,
            text: [`Incorrect ${name}`],
        });
    }
}
export default Incorrect;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiSW5jb3JyZWN0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiSW5jb3JyZWN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sWUFBWSxFQUFFLEVBQW1CLFVBQVUsRUFBRSxNQUFNLHlCQUF5QixDQUFDO0FBRXBGLE1BQU0sU0FBVSxTQUFRLFlBQVk7SUFNbEMsWUFBWSxFQUNWLElBQUksR0FBRyxHQUFHLEVBQ1YsV0FBVyxFQUNYLFNBQVMsR0FDTztRQUNoQixLQUFLLENBQUM7WUFDSixXQUFXO1lBQ1gsU0FBUztZQUNULElBQUksRUFBRSxVQUFVLENBQUMsU0FBUztZQUMxQixJQUFJLEVBQUUsQ0FBQyxhQUFhLElBQUksRUFBRSxDQUFDO1NBQzVCLENBQUMsQ0FBQztJQUNMLENBQUM7Q0FDRjtBQUVELGVBQWUsU0FBUyxDQUFDIn0=