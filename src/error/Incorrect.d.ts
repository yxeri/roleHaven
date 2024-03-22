import GeneralError, { ChildErrorProps } from '@/error/GeneralError.js';
declare class Incorrect extends GeneralError {
    constructor({ name, errorObject, extraData, }: ChildErrorProps);
}
export default Incorrect;
