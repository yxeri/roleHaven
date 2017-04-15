const alphaNumbericRegex = /^[\w\d]+$/g;
const fullTextRegex = /^[\w\d\såäöÅÄÖ\-]+$/g;

/**
 * Does the string contain only alphanumeric values?
 * @param {string} text - String to check
 * @returns {boolean} Does the string contain only alphanumeric values?
 */
function isAlphaNumeric(text) {
  return alphaNumbericRegex.test(text);
}

/**
 * Does the string contain alphanumeric values, including space and åäö?
 * @param {string} text - String to check
 * @returns {boolean} Does the string contain alphanumeric values, including space and åäö?
 */
function isAllowedFull(text) {
  return fullTextRegex.test(text);
}

/**
 * Removes empty consecutive elements in the text array
 * @param {string} text - Array with text
 * @returns {string[]} Array with text without consecutive empty elements
 */
function cleanText(text) {
  const modifiedText = [];

  for (let i = 0; i < text.length; i += 1) {
    if (i === 0 && text[0] !== '') {
      modifiedText.push(text[0]);
    } else if (!(text[i - 1] === '' && text[i] === '') && !(i + 1 === text.length && text[i] === '')) {
      modifiedText.push(text[i]);
    }
  }

  return modifiedText;
}

/**
 * Converts string to boolean
 * @param {string} envar - Value
 * @returns {boolean} Converted boolean
 */
function convertToBoolean(envar) {
  if (envar === 'true') {
    return true;
  } else if (envar === 'false') {
    return false;
  }

  return undefined;
}

/**
 * Convert string to float
 * @param {string} float - Value to be converted
 * @returns {number|null} Converted number
 */
function convertToFloat(float) {
  const parsedFloat = parseFloat(float);

  return isNaN(parsedFloat) ? 0 : parsedFloat;
}

/**
 * Convert string to int
 * @param {string} int - Value to be converted
 * @returns {number} Converted number
 */
function convertToInt(int) {
  const parsedInt = parseInt(int, 10);

  return isNaN(parsedInt) ? 0 : parsedInt;
}

exports.isAlphaNumeric = isAlphaNumeric;
exports.isAllowedFull = isAllowedFull;
exports.cleanText = cleanText;
exports.convertToBoolean = convertToBoolean;
exports.convertToFloat = convertToFloat;
exports.convertToInt = convertToInt;
