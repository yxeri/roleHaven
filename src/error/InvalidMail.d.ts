import GeneralError, { ChildErrorProps } from '@/error/GeneralError.js';
declare class InvalidDataError extends GeneralError {
    constructor({ errorObject, verbose, extraData, }: ChildErrorProps);
}
export default InvalidDataError;
