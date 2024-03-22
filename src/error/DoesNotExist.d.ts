import GeneralError, { ChildErrorProps } from '@/error/GeneralError.js';
declare class DoesNotExist extends GeneralError {
    constructor({ errorObject, verbose, extraData, suppressPrint, name, }: ChildErrorProps);
}
export default DoesNotExist;
