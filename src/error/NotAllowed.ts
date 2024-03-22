import GeneralError, { ChildErrorProps, ErrorTypes } from '@/error/GeneralError.js';

class NotAllowedError extends GeneralError {
  constructor({
    name,
    errorObject,
    extraData,
    verbose,
  }: ChildErrorProps) {
    super({
      errorObject,
      extraData,
      verbose,
      type: ErrorTypes.NOTALLOWED,
      text: [
        'Insufficient permissions',
        `Tried to ${name}`,
      ],
    });
  }
}

export default NotAllowedError;
