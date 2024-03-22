import GeneralError, { ChildErrorProps, ErrorTypes } from '@/error/GeneralError.js';

class Internal extends GeneralError {
  /**
   * Create an internal error object.
   * Indicates that something went wrong locally
   * @param {Object} params Parameters.
   * @param {string} [params.name] Retrieval source.
   * @param {Error} [params.errorObject] Error object.
   */
  constructor({
    errorObject,
    verbose,
    extraData,
    name = '-',
  }: ChildErrorProps) {
    super({
      errorObject,
      verbose,
      extraData,
      type: ErrorTypes.INTERNAL,
      text: [`Failed to retrieve data from ${name}`],
    });
  }
}

export default Internal;
