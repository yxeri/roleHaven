import GeneralError, { ErrorTypes } from '@/error/GeneralError.js';
class Expired extends GeneralError {
    constructor({ expiredAt, errorObject, extraData, name = '-', }) {
        super({
            errorObject,
            extraData,
            type: ErrorTypes.INTERNAL,
            text: [`Object has exired for ${name} at ${expiredAt}`],
        });
    }
}
export default Expired;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRXhwaXJlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIkV4cGlyZWQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxZQUFZLEVBQUUsRUFBbUIsVUFBVSxFQUFFLE1BQU0seUJBQXlCLENBQUM7QUFFcEYsTUFBTSxPQUFRLFNBQVEsWUFBWTtJQVNoQyxZQUFZLEVBQ1YsU0FBUyxFQUNULFdBQVcsRUFDWCxTQUFTLEVBQ1QsSUFBSSxHQUFHLEdBQUcsR0FDNEI7UUFDdEMsS0FBSyxDQUFDO1lBQ0osV0FBVztZQUNYLFNBQVM7WUFDVCxJQUFJLEVBQUUsVUFBVSxDQUFDLFFBQVE7WUFDekIsSUFBSSxFQUFFLENBQUMseUJBQXlCLElBQUksT0FBTyxTQUFTLEVBQUUsQ0FBQztTQUN4RCxDQUFDLENBQUM7SUFDTCxDQUFDO0NBQ0Y7QUFFRCxlQUFlLE9BQU8sQ0FBQyJ9