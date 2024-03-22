import GeneralError, { ChildErrorProps, ErrorTypes } from '@/error/GeneralError.js';

class Incorrect extends GeneralError {
  /**
   * Create incorrect error
   * @param {string} [params.name] Name of whatever was sent
   * @param {Object} [params.errorObject] Error object
   */
  constructor({
    name = '-',
    errorObject,
    extraData,
  }: ChildErrorProps) {
    super({
      errorObject,
      extraData,
      type: ErrorTypes.INCORRECT,
      text: [`Incorrect ${name}`],
    });
  }
}

export default Incorrect;
