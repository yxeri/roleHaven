import GeneralError, { ErrorTypes } from '@/error/GeneralError.js';
class Internal extends GeneralError {
    constructor({ errorObject, verbose, extraData, name = '-', }) {
        super({
            errorObject,
            verbose,
            extraData,
            type: ErrorTypes.INTERNAL,
            text: [`Failed to retrieve data from ${name}`],
        });
    }
}
export default Internal;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiSW50ZXJuYWwuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJJbnRlcm5hbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLFlBQVksRUFBRSxFQUFtQixVQUFVLEVBQUUsTUFBTSx5QkFBeUIsQ0FBQztBQUVwRixNQUFNLFFBQVMsU0FBUSxZQUFZO0lBUWpDLFlBQVksRUFDVixXQUFXLEVBQ1gsT0FBTyxFQUNQLFNBQVMsRUFDVCxJQUFJLEdBQUcsR0FBRyxHQUNNO1FBQ2hCLEtBQUssQ0FBQztZQUNKLFdBQVc7WUFDWCxPQUFPO1lBQ1AsU0FBUztZQUNULElBQUksRUFBRSxVQUFVLENBQUMsUUFBUTtZQUN6QixJQUFJLEVBQUUsQ0FBQyxnQ0FBZ0MsSUFBSSxFQUFFLENBQUM7U0FDL0MsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztDQUNGO0FBRUQsZUFBZSxRQUFRLENBQUMifQ==