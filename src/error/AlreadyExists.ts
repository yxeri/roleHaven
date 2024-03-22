import GeneralError, { ChildErrorProps, ErrorTypes } from '@/error/GeneralError.js';

class AlreadyExists extends GeneralError {
  /**
   * Create already exists error
   * @param {string} [params.name] Name of type of object that already exists
   * @param {Object} [params.errorObject] Error object
   * @param {Object} [params.extraData] Extra data that client can use when an error is sent
   */
  constructor({
    suppressPrint,
    errorObject,
    extraData,
    name = '',
  }: ChildErrorProps) {
    super({
      errorObject,
      extraData,
      suppressPrint,
      type: ErrorTypes.ALREADYEXISTS,
      text: [`${name} already exists`],
    });
  }
}

export default AlreadyExists;
