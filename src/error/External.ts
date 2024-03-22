import GeneralError, { ChildErrorProps, ErrorTypes } from '@/error/GeneralError.js';

class External extends GeneralError {
  constructor({
    name = '-',
    errorObject,
    extraData,
  }: ChildErrorProps) {
    super({
      errorObject,
      extraData,
      type: ErrorTypes.EXTERNAL,
      text: [`Failed to retrieve data from ${name}`],
    });
  }
}

export default External;
