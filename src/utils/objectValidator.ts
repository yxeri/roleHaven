'use strict';

const { appConfig } = require('../config/defaults/config');

/**
 * Checks if the sent object has the expected structure. It will returns false if it doesn't
 * @param {Object} data The object that was sent
 * @param {Object} expected The expected structure of the object
 * @param {Object} options Options
 * @param {boolean} options.verbose Should error messages be printed?
 * @returns {boolean} Does the data have the correct structure?
 */
function checkKeys(data, expected, options) {
  const expectedKeys = Object.keys(expected);

  for (let i = 0; i < expectedKeys.length; i += 1) {
    const expectedKey = expectedKeys[i];

    if ((!data[expectedKey] || data[expectedKey] === null) && typeof data[expectedKey] !== 'boolean') {
      if (options.verbose || appConfig.verboseError) {
        console.error('Validation error', `Key missing: ${expectedKey}`);
      }

      return false;
    }

    const dataObj = data[expectedKey];
    const expectedDataObj = expected[expectedKey];

    if (!(expectedDataObj instanceof Array) && typeof expectedDataObj === 'object') {
      return checkKeys(dataObj, expected[expectedKey], options);
    }
  }

  return true;
}

/**
 * Calls checkKeys to check if the data has the expected structure
 * @param {Object} data Sent object
 * @param {Object} expected Expected structure of the object
 * @param {Object} options Options
 * @param {boolean} options.verbose Should error messages be printed?
 * @returns {boolean} Does the data have the expected structure?
 */
function isValidData(data, expected, options = {}) {
  const validationOptions = options;
  validationOptions.verbose = typeof validationOptions.verbose === 'undefined'
    ?
    true
    :
    validationOptions.verbose;

  if ((!data || data === null) || (!expected || expected === null)) {
    if (validationOptions.verbose || appConfig.verboseError) {
      console.error('Validation error', 'Data and expected structure have to be set');
    }

    return false;
  }

  const isValid = checkKeys(data, expected, validationOptions);

  if (!isValid && (validationOptions.verbose || appConfig.verboseError)) {
    console.error('Validation error', `Expected: ${JSON.stringify(expected)}`);
  }

  return isValid;
}

export { isValidData };
