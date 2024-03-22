import GeneralError, { ChildErrorProps } from '@/error/GeneralError.js';
declare class Banned extends GeneralError {
    constructor({ name, errorObject, extraData, }: ChildErrorProps);
}
export default Banned;
