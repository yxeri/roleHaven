import GeneralError, { ChildErrorProps, ErrorTypes } from '@/error/GeneralError.js';

class Banned extends GeneralError {
  constructor({
    name = '',
    errorObject,
    extraData,
  }: ChildErrorProps) {
    super({
      errorObject,
      extraData,
      type: ErrorTypes.BANNED,
      text: [`${name} is banned`],
    });
  }
}

export default Banned;
