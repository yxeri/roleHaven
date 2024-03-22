import GeneralError, { ChildErrorProps, ErrorTypes } from '@/error/GeneralError.js';

class InvalidCharacters extends GeneralError {
  /**
   * Create invalid characters error.
   * @param {Object} params Parameters.
   * @param {string} [params.name] Name of the string being checked.
   * @param {string} [params.expected] Expected valid characters.
   * @param {Object} [params.errorObject] Error object.
   */
  constructor({
    errorObject,
    extraData,
    name = '-',
    expected = '-',
  }: ChildErrorProps & { expected?: string }) {
    super({
      errorObject,
      extraData,
      type: ErrorTypes.INVALIDLENGTH,
      text: [
        `Property ${name} has an invalid length`,
        `Valid length span: ${expected}`,
      ],
    });
  }
}

export default InvalidCharacters;
