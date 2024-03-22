import GeneralError, { ChildErrorProps, ErrorTypes } from '@/error/GeneralError.js';

class Expired extends GeneralError {
  /**
   * Create an expired error object.
   * Indicates that object has expired.
   * @param {Object} params Parameters.
   * @param {string} [params.name] Retrieval source
   * @param {Date} [params.expiredAt] When the object expired
   * @param {Error} [params.errorObject] Error object
   */
  constructor({
    expiredAt,
    errorObject,
    extraData,
    name = '-',
  }: ChildErrorProps & { expiredAt: Date }) {
    super({
      errorObject,
      extraData,
      type: ErrorTypes.INTERNAL,
      text: [`Object has exired for ${name} at ${expiredAt}`],
    });
  }
}

export default Expired;
