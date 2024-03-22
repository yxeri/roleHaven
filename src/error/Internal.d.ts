import GeneralError, { ChildErrorProps } from '@/error/GeneralError.js';
declare class Internal extends GeneralError {
    constructor({ errorObject, verbose, extraData, name, }: ChildErrorProps);
}
export default Internal;
