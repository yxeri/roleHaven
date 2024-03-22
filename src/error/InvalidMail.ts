import GeneralError, { ChildErrorProps, ErrorTypes } from '@/error/GeneralError.js';

class InvalidDataError extends GeneralError {
  /**
   * Create invalid data error
   * @param {Object} [params.errorObject] Error object
   */
  constructor({
    errorObject,
    verbose,
    extraData,
  }: ChildErrorProps) {
    super({
      verbose,
      errorObject,
      extraData,
      type: ErrorTypes.INVALIDMAIL,
      text: [
        'Invalid mail address',
      ],
    });
  }
}

export default InvalidDataError;
