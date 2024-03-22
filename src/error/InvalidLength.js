import GeneralError, { ErrorTypes } from '@/error/GeneralError.js';
class InvalidCharacters extends GeneralError {
    constructor({ errorObject, extraData, name = '-', expected = '-', }) {
        super({
            errorObject,
            extraData,
            type: ErrorTypes.INVALIDLENGTH,
            text: [
                `Property ${name} has an invalid length`,
                `Valid length span: ${expected}`,
            ],
        });
    }
}
export default InvalidCharacters;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiSW52YWxpZExlbmd0aC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIkludmFsaWRMZW5ndGgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxZQUFZLEVBQUUsRUFBbUIsVUFBVSxFQUFFLE1BQU0seUJBQXlCLENBQUM7QUFFcEYsTUFBTSxpQkFBa0IsU0FBUSxZQUFZO0lBUTFDLFlBQVksRUFDVixXQUFXLEVBQ1gsU0FBUyxFQUNULElBQUksR0FBRyxHQUFHLEVBQ1YsUUFBUSxHQUFHLEdBQUcsR0FDMEI7UUFDeEMsS0FBSyxDQUFDO1lBQ0osV0FBVztZQUNYLFNBQVM7WUFDVCxJQUFJLEVBQUUsVUFBVSxDQUFDLGFBQWE7WUFDOUIsSUFBSSxFQUFFO2dCQUNKLFlBQVksSUFBSSx3QkFBd0I7Z0JBQ3hDLHNCQUFzQixRQUFRLEVBQUU7YUFDakM7U0FDRixDQUFDLENBQUM7SUFDTCxDQUFDO0NBQ0Y7QUFFRCxlQUFlLGlCQUFpQixDQUFDIn0=