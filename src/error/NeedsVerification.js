import GeneralError, { ErrorTypes } from '@/error/GeneralError.js';
class NeedsVerification extends GeneralError {
    constructor({ name = '', errorObject, extraData, }) {
        super({
            errorObject,
            extraData,
            type: ErrorTypes.NEEDSVERIFICATION,
            text: [`${name} needs to be verified`],
        });
    }
}
export default NeedsVerification;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTmVlZHNWZXJpZmljYXRpb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJOZWVkc1ZlcmlmaWNhdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLFlBQVksRUFBRSxFQUFtQixVQUFVLEVBQUUsTUFBTSx5QkFBeUIsQ0FBQztBQUVwRixNQUFNLGlCQUFrQixTQUFRLFlBQVk7SUFNMUMsWUFBWSxFQUNWLElBQUksR0FBRyxFQUFFLEVBQ1QsV0FBVyxFQUNYLFNBQVMsR0FDTztRQUNoQixLQUFLLENBQUM7WUFDSixXQUFXO1lBQ1gsU0FBUztZQUNULElBQUksRUFBRSxVQUFVLENBQUMsaUJBQWlCO1lBQ2xDLElBQUksRUFBRSxDQUFDLEdBQUcsSUFBSSx1QkFBdUIsQ0FBQztTQUN2QyxDQUFDLENBQUM7SUFDTCxDQUFDO0NBQ0Y7QUFFRCxlQUFlLGlCQUFpQixDQUFDIn0=