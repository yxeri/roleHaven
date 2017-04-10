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

exports.isAlphaNumeric = isAlphaNumeric;
exports.isAllowedFull = isAllowedFull;
exports.cleanText = cleanText;
