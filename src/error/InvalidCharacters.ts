import GeneralError, { ChildErrorProps, ErrorTypes } from '@/error/GeneralError.js';

class InvalidCharacters extends GeneralError {
  /**
   * Create invalid length error.
   * @param {Object} params Parameters.
   * @param {string} [params.name] Name of the string being checked.
   * @param {Object} [params.errorObject] Error object.
   */
  constructor({
    errorObject,
    extraData,
    name = '-',
  }: ChildErrorProps) {
    super({
      errorObject,
      extraData,
      type: ErrorTypes.INVALIDCHARACTERS,
      text: [
        `Property ${name} contains invalid characters`,
      ],
    });
  }
}

export default InvalidCharacters;
