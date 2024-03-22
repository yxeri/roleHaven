import GeneralError, { ChildErrorProps, ErrorTypes } from '@/error/GeneralError.js';

class InvalidDataError extends GeneralError {
  /**
   * Create invalid data error.
   * @param {Object} params Parameters.
   * @param {string} [params.expected] Expected data structure.
   * @param {Object} [params.errorObject] Error object.
   */
  constructor({
    expected = '-',
    errorObject,
    verbose,
    extraData,
  }: Omit<ChildErrorProps, 'name'> & {
    expected?: string
  }) {
    super({
      verbose,
      errorObject,
      extraData,
      type: ErrorTypes.INVALIDDATA,
      text: [
        'Invalid data sent',
        `Expected: ${expected}`,
      ],
    });
  }
}

export default InvalidDataError;
