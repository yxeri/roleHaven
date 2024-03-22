import GeneralError, { ChildErrorProps } from '@/error/GeneralError.js';
declare class Insufficient extends GeneralError {
    constructor({ name, errorObject, extraData, }: ChildErrorProps);
}
export default Insufficient;
