import GeneralError, { ErrorTypes } from '@/error/GeneralError.js';
class InvalidCharacters extends GeneralError {
    constructor({ errorObject, extraData, name = '-', }) {
        super({
            errorObject,
            extraData,
            type: ErrorTypes.INVALIDCHARACTERS,
            text: [
                `Property ${name} contains invalid characters`,
            ],
        });
    }
}
export default InvalidCharacters;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiSW52YWxpZENoYXJhY3RlcnMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJJbnZhbGlkQ2hhcmFjdGVycy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLFlBQVksRUFBRSxFQUFtQixVQUFVLEVBQUUsTUFBTSx5QkFBeUIsQ0FBQztBQUVwRixNQUFNLGlCQUFrQixTQUFRLFlBQVk7SUFPMUMsWUFBWSxFQUNWLFdBQVcsRUFDWCxTQUFTLEVBQ1QsSUFBSSxHQUFHLEdBQUcsR0FDTTtRQUNoQixLQUFLLENBQUM7WUFDSixXQUFXO1lBQ1gsU0FBUztZQUNULElBQUksRUFBRSxVQUFVLENBQUMsaUJBQWlCO1lBQ2xDLElBQUksRUFBRTtnQkFDSixZQUFZLElBQUksOEJBQThCO2FBQy9DO1NBQ0YsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztDQUNGO0FBRUQsZUFBZSxpQkFBaUIsQ0FBQyJ9