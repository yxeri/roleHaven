import GeneralError, { ChildErrorProps } from '@/error/GeneralError.js';
declare class InvalidCharacters extends GeneralError {
    constructor({ errorObject, extraData, name, expected, }: ChildErrorProps & {
        expected?: string;
    });
}
export default InvalidCharacters;
