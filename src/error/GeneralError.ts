import configs from '../config/defaults/index.js';

const { appConfig } = configs;

export type GeneralErrorProps = {
  errorObject: unknown;
  text: string[];
  type: ErrorTypes;
  extraData?: {
    [key: string]: unknown
  };
  suppressPrint?: boolean;
  verbose?: boolean;
}

export type ChildError = Partial<GeneralErrorProps> & {
  name?: string;
}

export enum ErrorTypes {
  GENERAL = 'general error',
  DATABASE = 'database',
  DOESNOTEXIST = 'does not exist',
  EXTERNAL = 'external',
  ALREADYEXISTS = 'already exists',
  INCORRECT = 'incorrect',
  INVALIDCHARACTERS = 'invalid characters',
  INVALIDDATA = 'invalid data',
  INVALIDLENGTH = 'invalid length',
  NOTALLOWED = 'not allowed',
  NEEDSVERIFICATION = 'needs verification',
  BANNED = 'banned',
  INSUFFICIENT = 'insufficient',
  INTERNAL = 'general internal error',
  EXPIRED = 'expired',
  INVALIDMAIL = 'invalid mail',
  TOOFREQUENT = 'too frequent',
}

function printError(errorObject: unknown & {
  name?: string;
  message?: string;
  stack?: string
}) {
  if (errorObject) {
    if (errorObject.name) {
      console.error(errorObject.name);
    }
    if (errorObject.message) {
      console.error(errorObject.message);
    }
    if (errorObject.stack) {
      console.error(errorObject.stack);
    }
  }
}

class GeneralError {
  public text: GeneralErrorProps['text'];
  public type: GeneralErrorProps['type'];
  public extraData: GeneralErrorProps['extraData'];

  constructor({
    errorObject,
    extraData,
    suppressPrint,
    text = ['Something went wrong'],
    type = ErrorTypes.GENERAL,
    verbose = true,
  }: GeneralErrorProps) {
    this.text = text;
    this.type = type;
    this.extraData = extraData;

    if ((appConfig.verboseError || verbose) && !suppressPrint) {
      console.error(`Error Type: ${type}. `, text.join(' ')
        .replace(/"password": ".*"/g, '"password": true'));
      printError(errorObject as {
        name?: string;
        message?: string;
        stack?: string
      });
    }
  }
}

export default GeneralError;
