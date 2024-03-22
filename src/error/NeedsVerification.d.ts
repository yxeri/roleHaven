import GeneralError, { ChildErrorProps } from '@/error/GeneralError.js';
declare class NeedsVerification extends GeneralError {
    constructor({ name, errorObject, extraData, }: ChildErrorProps);
}
export default NeedsVerification;
