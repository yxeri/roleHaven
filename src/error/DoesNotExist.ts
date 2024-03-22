import GeneralError, { ChildErrorProps, ErrorTypes } from '@/error/GeneralError.js';

class DoesNotExist extends GeneralError {
  /**
   * Creates a does not exist error.
   * @param {Object} params Parameters.
   * @param {string} [params.name] Name of whatever did not exist.
   * @param {Error} [params.errorObject] Error object.
   */
  constructor({
    errorObject,
    verbose,
    extraData,
    suppressPrint,
    name = '-',
  }: ChildErrorProps) {
    super({
      errorObject,
      verbose,
      extraData,
      suppressPrint,
      type: ErrorTypes.DOESNOTEXIST,
      text: [`${name} does not exist`],
    });
  }
}

export default DoesNotExist;
