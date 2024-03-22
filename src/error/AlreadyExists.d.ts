import GeneralError, { ChildErrorProps } from '@/error/GeneralError.js';
declare class AlreadyExists extends GeneralError {
    constructor({ suppressPrint, errorObject, extraData, name, }: ChildErrorProps);
}
export default AlreadyExists;
