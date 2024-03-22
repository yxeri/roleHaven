import GeneralError, { ChildErrorProps, ErrorTypes } from '@/error/GeneralError.js';

class TooFrequent extends GeneralError {
  /**
   * Create too frequent error
   * @param {string} [params.name] Name of whatever was sent
   * @param {Object} [params.errorObject] Error object
   * @param {Object} [params.extraData] Extra data that client can use when an error is sent
   */
  constructor({
    name = '-',
    errorObject,
    extraData,
  }: ChildErrorProps) {
    super({
      errorObject,
      extraData,
      type: ErrorTypes.TOOFREQUENT,
      text: [`${name} is used too frequently`],
    });
  }
}

export default TooFrequent;
