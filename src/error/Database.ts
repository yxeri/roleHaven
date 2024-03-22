import GeneralError, { ChildError, ErrorTypes } from 'src/error/GeneralError.js';

class Database extends GeneralError {
  /**
   * Creates a database error
   * @param {Error} [params.errorObject] Error object
   */
  constructor({
    errorObject,
    name = '',
    extraData,
  }: ChildError) {
    super({
      errorObject,
      extraData,
      type: ErrorTypes.DATABASE,
      text: [`Failed to save/retrieve data ${name}`],
    });
  }
}

export default Database;
