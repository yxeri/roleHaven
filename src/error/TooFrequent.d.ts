import GeneralError, { ChildErrorProps } from '@/error/GeneralError.js';
declare class TooFrequent extends GeneralError {
    constructor({ name, errorObject, extraData, }: ChildErrorProps);
}
export default TooFrequent;
