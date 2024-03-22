import GeneralError, { ErrorTypes } from '@/error/GeneralError.js';
class InvalidDataError extends GeneralError {
    constructor({ expected = '-', errorObject, verbose, extraData, }) {
        super({
            verbose,
            errorObject,
            extraData,
            type: ErrorTypes.INVALIDDATA,
            text: [
                'Invalid data sent',
                `Expected: ${expected}`,
            ],
        });
    }
}
export default InvalidDataError;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiSW52YWxpZERhdGEuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJJbnZhbGlkRGF0YS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLFlBQVksRUFBRSxFQUFtQixVQUFVLEVBQUUsTUFBTSx5QkFBeUIsQ0FBQztBQUVwRixNQUFNLGdCQUFpQixTQUFRLFlBQVk7SUFPekMsWUFBWSxFQUNWLFFBQVEsR0FBRyxHQUFHLEVBQ2QsV0FBVyxFQUNYLE9BQU8sRUFDUCxTQUFTLEdBR1Y7UUFDQyxLQUFLLENBQUM7WUFDSixPQUFPO1lBQ1AsV0FBVztZQUNYLFNBQVM7WUFDVCxJQUFJLEVBQUUsVUFBVSxDQUFDLFdBQVc7WUFDNUIsSUFBSSxFQUFFO2dCQUNKLG1CQUFtQjtnQkFDbkIsYUFBYSxRQUFRLEVBQUU7YUFDeEI7U0FDRixDQUFDLENBQUM7SUFDTCxDQUFDO0NBQ0Y7QUFFRCxlQUFlLGdCQUFnQixDQUFDIn0=