import GeneralError, { ErrorTypes } from '@/error/GeneralError.js';
class AlreadyExists extends GeneralError {
    constructor({ suppressPrint, errorObject, extraData, name = '', }) {
        super({
            errorObject,
            extraData,
            suppressPrint,
            type: ErrorTypes.ALREADYEXISTS,
            text: [`${name} already exists`],
        });
    }
}
export default AlreadyExists;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQWxyZWFkeUV4aXN0cy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIkFscmVhZHlFeGlzdHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxZQUFZLEVBQUUsRUFBbUIsVUFBVSxFQUFFLE1BQU0seUJBQXlCLENBQUM7QUFFcEYsTUFBTSxhQUFjLFNBQVEsWUFBWTtJQU90QyxZQUFZLEVBQ1YsYUFBYSxFQUNiLFdBQVcsRUFDWCxTQUFTLEVBQ1QsSUFBSSxHQUFHLEVBQUUsR0FDTztRQUNoQixLQUFLLENBQUM7WUFDSixXQUFXO1lBQ1gsU0FBUztZQUNULGFBQWE7WUFDYixJQUFJLEVBQUUsVUFBVSxDQUFDLGFBQWE7WUFDOUIsSUFBSSxFQUFFLENBQUMsR0FBRyxJQUFJLGlCQUFpQixDQUFDO1NBQ2pDLENBQUMsQ0FBQztJQUNMLENBQUM7Q0FDRjtBQUVELGVBQWUsYUFBYSxDQUFDIn0=