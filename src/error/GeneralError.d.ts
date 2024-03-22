export type GeneralErrorProps = {
    errorObject: unknown;
    text: string[];
    type: ErrorTypes;
    extraData?: {
        [key: string]: unknown;
    };
    suppressPrint?: boolean;
    verbose?: boolean;
};
export type ChildError = Partial<GeneralErrorProps> & {
    name?: string;
};
export declare enum ErrorTypes {
    GENERAL = "general error",
    DATABASE = "database",
    DOESNOTEXIST = "does not exist",
    EXTERNAL = "external",
    ALREADYEXISTS = "already exists",
    INCORRECT = "incorrect",
    INVALIDCHARACTERS = "invalid characters",
    INVALIDDATA = "invalid data",
    INVALIDLENGTH = "invalid length",
    NOTALLOWED = "not allowed",
    NEEDSVERIFICATION = "needs verification",
    BANNED = "banned",
    INSUFFICIENT = "insufficient",
    INTERNAL = "general internal error",
    EXPIRED = "expired",
    INVALIDMAIL = "invalid mail",
    TOOFREQUENT = "too frequent"
}
declare class GeneralError {
    text: GeneralErrorProps['text'];
    type: GeneralErrorProps['type'];
    extraData: GeneralErrorProps['extraData'];
    constructor({ errorObject, extraData, suppressPrint, text, type, verbose, }: GeneralErrorProps);
}
export default GeneralError;
