import GeneralError, { ErrorTypes } from '@/error/GeneralError.js';
class External extends GeneralError {
    constructor({ name = '-', errorObject, extraData, }) {
        super({
            errorObject,
            extraData,
            type: ErrorTypes.EXTERNAL,
            text: [`Failed to retrieve data from ${name}`],
        });
    }
}
export default External;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRXh0ZXJuYWwuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJFeHRlcm5hbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLFlBQVksRUFBRSxFQUFtQixVQUFVLEVBQUUsTUFBTSx5QkFBeUIsQ0FBQztBQUVwRixNQUFNLFFBQVMsU0FBUSxZQUFZO0lBQ2pDLFlBQVksRUFDVixJQUFJLEdBQUcsR0FBRyxFQUNWLFdBQVcsRUFDWCxTQUFTLEdBQ087UUFDaEIsS0FBSyxDQUFDO1lBQ0osV0FBVztZQUNYLFNBQVM7WUFDVCxJQUFJLEVBQUUsVUFBVSxDQUFDLFFBQVE7WUFDekIsSUFBSSxFQUFFLENBQUMsZ0NBQWdDLElBQUksRUFBRSxDQUFDO1NBQy9DLENBQUMsQ0FBQztJQUNMLENBQUM7Q0FDRjtBQUVELGVBQWUsUUFBUSxDQUFDIn0=