import GeneralError, { ErrorTypes } from '@/error/GeneralError.js';
class TooFrequent extends GeneralError {
    constructor({ name = '-', errorObject, extraData, }) {
        super({
            errorObject,
            extraData,
            type: ErrorTypes.TOOFREQUENT,
            text: [`${name} is used too frequently`],
        });
    }
}
export default TooFrequent;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiVG9vRnJlcXVlbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJUb29GcmVxdWVudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLFlBQVksRUFBRSxFQUFtQixVQUFVLEVBQUUsTUFBTSx5QkFBeUIsQ0FBQztBQUVwRixNQUFNLFdBQVksU0FBUSxZQUFZO0lBT3BDLFlBQVksRUFDVixJQUFJLEdBQUcsR0FBRyxFQUNWLFdBQVcsRUFDWCxTQUFTLEdBQ087UUFDaEIsS0FBSyxDQUFDO1lBQ0osV0FBVztZQUNYLFNBQVM7WUFDVCxJQUFJLEVBQUUsVUFBVSxDQUFDLFdBQVc7WUFDNUIsSUFBSSxFQUFFLENBQUMsR0FBRyxJQUFJLHlCQUF5QixDQUFDO1NBQ3pDLENBQUMsQ0FBQztJQUNMLENBQUM7Q0FDRjtBQUVELGVBQWUsV0FBVyxDQUFDIn0=