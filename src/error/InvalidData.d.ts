import GeneralError, { ChildErrorProps } from '@/error/GeneralError.js';
declare class InvalidDataError extends GeneralError {
    constructor({ expected, errorObject, verbose, extraData, }: Omit<ChildErrorProps, 'name'> & {
        expected?: string;
    });
}
export default InvalidDataError;
