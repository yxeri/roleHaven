import GeneralError, { ErrorTypes } from '@/error/GeneralError.js';
class DoesNotExist extends GeneralError {
    constructor({ errorObject, verbose, extraData, suppressPrint, name = '-', }) {
        super({
            errorObject,
            verbose,
            extraData,
            suppressPrint,
            type: ErrorTypes.DOESNOTEXIST,
            text: [`${name} does not exist`],
        });
    }
}
export default DoesNotExist;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRG9lc05vdEV4aXN0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiRG9lc05vdEV4aXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sWUFBWSxFQUFFLEVBQW1CLFVBQVUsRUFBRSxNQUFNLHlCQUF5QixDQUFDO0FBRXBGLE1BQU0sWUFBYSxTQUFRLFlBQVk7SUFPckMsWUFBWSxFQUNWLFdBQVcsRUFDWCxPQUFPLEVBQ1AsU0FBUyxFQUNULGFBQWEsRUFDYixJQUFJLEdBQUcsR0FBRyxHQUNNO1FBQ2hCLEtBQUssQ0FBQztZQUNKLFdBQVc7WUFDWCxPQUFPO1lBQ1AsU0FBUztZQUNULGFBQWE7WUFDYixJQUFJLEVBQUUsVUFBVSxDQUFDLFlBQVk7WUFDN0IsSUFBSSxFQUFFLENBQUMsR0FBRyxJQUFJLGlCQUFpQixDQUFDO1NBQ2pDLENBQUMsQ0FBQztJQUNMLENBQUM7Q0FDRjtBQUVELGVBQWUsWUFBWSxDQUFDIn0=