import GeneralError, { ChildErrorProps } from '@/error/GeneralError.js';
declare class NotAllowedError extends GeneralError {
    constructor({ name, errorObject, extraData, verbose, }: ChildErrorProps);
}
export default NotAllowedError;
