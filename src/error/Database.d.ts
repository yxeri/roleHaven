import GeneralError, { ChildError } from 'src/error/GeneralError.js';
declare class Database extends GeneralError {
    constructor({ errorObject, name, extraData, }: ChildError);
}
export default Database;
