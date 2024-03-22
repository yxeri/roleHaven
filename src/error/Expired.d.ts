import GeneralError, { ChildErrorProps } from '@/error/GeneralError.js';
declare class Expired extends GeneralError {
    constructor({ expiredAt, errorObject, extraData, name, }: ChildErrorProps & {
        expiredAt: Date;
    });
}
export default Expired;
