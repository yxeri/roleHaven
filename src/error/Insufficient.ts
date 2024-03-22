import GeneralError, { ChildErrorProps, ErrorTypes } from '@/error/GeneralError.js';

class Insufficient extends GeneralError {
  /**
   * Create insufficient error
   * @param {string} [params.name] Name of the insufficient type
   * @param {Object} [params.errorObject] Error object
   */
  constructor({
    name = '',
    errorObject,
    extraData,
  }: ChildErrorProps) {
    super({
      errorObject,
      extraData,
      type: ErrorTypes.INSUFFICIENT,
      text: [`${name} not enough`],
    });
  }
}

export default Insufficient;
