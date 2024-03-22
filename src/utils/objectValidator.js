'use strict';
const { appConfig } = require('../config/defaults/config');
function checkKeys(data, expected, options) {
    const expectedKeys = Object.keys(expected);
    for (let i = 0; i < expectedKeys.length; i += 1) {
        const expectedKey = expectedKeys[i];
        if ((!data[expectedKey] || data[expectedKey] === null) && typeof data[expectedKey] !== 'boolean') {
            if (options.verbose || appConfig.verboseError) {
                console.error('Validation error', `Key missing: ${expectedKey}`);
            }
            return false;
        }
        const dataObj = data[expectedKey];
        const expectedDataObj = expected[expectedKey];
        if (!(expectedDataObj instanceof Array) && typeof expectedDataObj === 'object') {
            return checkKeys(dataObj, expected[expectedKey], options);
        }
    }
    return true;
}
function isValidData(data, expected, options = {}) {
    const validationOptions = options;
    validationOptions.verbose = typeof validationOptions.verbose === 'undefined'
        ?
            true
        :
            validationOptions.verbose;
    if ((!data || data === null) || (!expected || expected === null)) {
        if (validationOptions.verbose || appConfig.verboseError) {
            console.error('Validation error', 'Data and expected structure have to be set');
        }
        return false;
    }
    const isValid = checkKeys(data, expected, validationOptions);
    if (!isValid && (validationOptions.verbose || appConfig.verboseError)) {
        console.error('Validation error', `Expected: ${JSON.stringify(expected)}`);
    }
    return isValid;
}
export { isValidData };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib2JqZWN0VmFsaWRhdG9yLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsib2JqZWN0VmFsaWRhdG9yLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFlBQVksQ0FBQztBQUViLE1BQU0sRUFBRSxTQUFTLEVBQUUsR0FBRyxPQUFPLENBQUMsMkJBQTJCLENBQUMsQ0FBQztBQVUzRCxTQUFTLFNBQVMsQ0FBQyxJQUFJLEVBQUUsUUFBUSxFQUFFLE9BQU87SUFDeEMsTUFBTSxZQUFZLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUUzQyxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsWUFBWSxDQUFDLE1BQU0sRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7UUFDaEQsTUFBTSxXQUFXLEdBQUcsWUFBWSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBRXBDLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxJQUFJLENBQUMsV0FBVyxDQUFDLEtBQUssSUFBSSxDQUFDLElBQUksT0FBTyxJQUFJLENBQUMsV0FBVyxDQUFDLEtBQUssU0FBUyxFQUFFLENBQUM7WUFDakcsSUFBSSxPQUFPLENBQUMsT0FBTyxJQUFJLFNBQVMsQ0FBQyxZQUFZLEVBQUUsQ0FBQztnQkFDOUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxrQkFBa0IsRUFBRSxnQkFBZ0IsV0FBVyxFQUFFLENBQUMsQ0FBQztZQUNuRSxDQUFDO1lBRUQsT0FBTyxLQUFLLENBQUM7UUFDZixDQUFDO1FBRUQsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1FBQ2xDLE1BQU0sZUFBZSxHQUFHLFFBQVEsQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUU5QyxJQUFJLENBQUMsQ0FBQyxlQUFlLFlBQVksS0FBSyxDQUFDLElBQUksT0FBTyxlQUFlLEtBQUssUUFBUSxFQUFFLENBQUM7WUFDL0UsT0FBTyxTQUFTLENBQUMsT0FBTyxFQUFFLFFBQVEsQ0FBQyxXQUFXLENBQUMsRUFBRSxPQUFPLENBQUMsQ0FBQztRQUM1RCxDQUFDO0lBQ0gsQ0FBQztJQUVELE9BQU8sSUFBSSxDQUFDO0FBQ2QsQ0FBQztBQVVELFNBQVMsV0FBVyxDQUFDLElBQUksRUFBRSxRQUFRLEVBQUUsT0FBTyxHQUFHLEVBQUU7SUFDL0MsTUFBTSxpQkFBaUIsR0FBRyxPQUFPLENBQUM7SUFDbEMsaUJBQWlCLENBQUMsT0FBTyxHQUFHLE9BQU8saUJBQWlCLENBQUMsT0FBTyxLQUFLLFdBQVc7UUFDMUUsQ0FBQztZQUNELElBQUk7UUFDSixDQUFDO1lBQ0QsaUJBQWlCLENBQUMsT0FBTyxDQUFDO0lBRTVCLElBQUksQ0FBQyxDQUFDLElBQUksSUFBSSxJQUFJLEtBQUssSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLFFBQVEsSUFBSSxRQUFRLEtBQUssSUFBSSxDQUFDLEVBQUUsQ0FBQztRQUNqRSxJQUFJLGlCQUFpQixDQUFDLE9BQU8sSUFBSSxTQUFTLENBQUMsWUFBWSxFQUFFLENBQUM7WUFDeEQsT0FBTyxDQUFDLEtBQUssQ0FBQyxrQkFBa0IsRUFBRSw0Q0FBNEMsQ0FBQyxDQUFDO1FBQ2xGLENBQUM7UUFFRCxPQUFPLEtBQUssQ0FBQztJQUNmLENBQUM7SUFFRCxNQUFNLE9BQU8sR0FBRyxTQUFTLENBQUMsSUFBSSxFQUFFLFFBQVEsRUFBRSxpQkFBaUIsQ0FBQyxDQUFDO0lBRTdELElBQUksQ0FBQyxPQUFPLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxPQUFPLElBQUksU0FBUyxDQUFDLFlBQVksQ0FBQyxFQUFFLENBQUM7UUFDdEUsT0FBTyxDQUFDLEtBQUssQ0FBQyxrQkFBa0IsRUFBRSxhQUFhLElBQUksQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxDQUFDO0lBQzdFLENBQUM7SUFFRCxPQUFPLE9BQU8sQ0FBQztBQUNqQixDQUFDO0FBRUQsT0FBTyxFQUFFLFdBQVcsRUFBRSxDQUFDIn0=