import GeneralError, { ChildErrorProps } from '@/error/GeneralError.js';
declare class External extends GeneralError {
    constructor({ name, errorObject, extraData, }: ChildErrorProps);
}
export default External;
