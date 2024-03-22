declare function hasAllowedText(text: any): boolean;
declare function isAllowedFull(text: any): boolean;
declare function cleanText(text: any): any[];
declare function convertToBoolean(envar: any): boolean | undefined;
declare function convertToFloat(float: any): number;
declare function convertToInt(int: any): number;
declare function shuffleArray(array: any): any;
declare function getDifference({ firstDate, laterDate, }: {
    firstDate: any;
    laterDate: any;
}): Date;
declare function isValidMail(address: any): boolean;
declare function calculateMinutesDifference({ firstDate, secondDate, }: {
    firstDate: any;
    secondDate: any;
}): number;
declare function generateTextCode(amount?: number): any;
declare function trimSpace(sentText: any): any;
declare function buildFileName({ name, }: {
    name: any;
}): string;
declare const _default: {
    hasAllowedText: typeof hasAllowedText;
    isAllowedFull: typeof isAllowedFull;
    cleanText: typeof cleanText;
    convertToBoolean: typeof convertToBoolean;
    convertToFloat: typeof convertToFloat;
    convertToInt: typeof convertToInt;
    shuffleArray: typeof shuffleArray;
    getDifference: typeof getDifference;
    isValidMail: typeof isValidMail;
    calculateMinutesDifference: typeof calculateMinutesDifference;
    generateTextCode: typeof generateTextCode;
    trimSpace: typeof trimSpace;
    buildFileName: typeof buildFileName;
};
export default _default;
