import GeneralError, { ChildErrorProps, ErrorTypes } from '@/error/GeneralError.js';

class NeedsVerification extends GeneralError {
  /**
   * Create needs verification error
   * @param {string} [params.name] Name of object that needs to be verified
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
      type: ErrorTypes.NEEDSVERIFICATION,
      text: [`${name} needs to be verified`],
    });
  }
}

export default NeedsVerification;
