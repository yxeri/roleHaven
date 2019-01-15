/*
 Copyright 2017 Carmilla Mina Jankovic

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

'use strict';

const allowedRegex = /^[\w\d-_]+$/;
const fullTextRegex = /^[\w\d\såäöÅÄÖ_-]+$/;

/**
 * Replaces part of the sent string and returns it
 * @param {string} text - Original string
 * @param {string} find - Substring to replace
 * @param {string} replaceWith - String that will replace the found substring
 * @returns {string} - Modified string
 */
function findOneReplace(text, find, replaceWith) {
  return text.replace(new RegExp(find), replaceWith);
}

/**
 * Does the string contain only alphanumeric values?
 * @param {string} text - String to check
 * @returns {boolean} Does the string contain only alphanumeric values?
 */
function hasAllowedText(text) {
  return allowedRegex.test(text);
}

/**
 * Does the string contain alphanumeric values, including space and åäö?
 * @param {string} text - String to check.
 * @returns {boolean} Does the string contain alphanumeric values, including space and åäö?
 */
function isAllowedFull(text) {
  return fullTextRegex.test(text);
}

/**
 * Removes empty consecutive elements in the text array.
 * @param {string} text - Array with text.
 * @returns {string[]} Array with text without consecutive empty elements.
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
 * Converts string to boolean.
 * @param {string} envar - Value.
 * @returns {boolean} Converted boolean.
 */
function convertToBoolean(envar) {
  if (envar) {
    return envar === 'true';
  }

  return undefined;
}

/**
 * Convert string to float.
 * @param {string} float - Value to be converted.
 * @returns {number|null} Converted number.
 */
function convertToFloat(float) {
  const parsedFloat = parseFloat(float);

  return Number.isNaN(parsedFloat)
    ? 0
    : parsedFloat;
}

/**
 * Convert string to int.
 * @param {string} int - Value to be converted.
 * @returns {number} Converted number.
 */
function convertToInt(int) {
  const parsedInt = parseInt(int, 10);

  return Number.isNaN(parsedInt)
    ? 0
    : parsedInt;
}

/**
 * @param {string[]} array - Array to be shuffled.
 * @returns {string[]} Shuffled array.
 */
function shuffleArray(array) {
  const shuffledArray = array;
  let currentIndex = array.length;
  let tempVal;
  let randIndex;

  while (currentIndex !== 0) {
    randIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;
    tempVal = array[currentIndex];
    shuffledArray[currentIndex] = array[randIndex];
    shuffledArray[randIndex] = tempVal;
  }

  return shuffledArray;
}

/**
 * Get minutes between dates.
 * @param {Object} params - Parameters.
 * @param {Date} params.firstDate - Start date.
 * @param {Date} params.laterDate - Later date.
 * @returns {Date} Difference date.
 */
function getDifference({ firstDate, laterDate }) {
  const difference = new Date(laterDate) - new Date(firstDate);

  return new Date(difference);
}

/**
 * Is the sent address a valid mail address?
 * @param {string} address Mail address to check
 * @returns {boolean} Is it valid?
 */
function isValidMail(address) {
  return /^[-!#$%&'*+/0-9=?A-Z^_a-z{|}~](\.?[-!#$%&'*+/0-9=?A-Z^_a-z`{|}~])*@[a-zA-Z0-9](-?\.?[a-zA-Z0-9])*\.[a-zA-Z](-?[a-zA-Z0-9])+$/.test(address);
}

/**
 * Get minutes between dates.
 * @param {Object} params - Parameters.
 * @param {Date} params.startDate - Start date.
 * @param {Date} params.endDate - Later date.
 * @returns {number} Minutes.
 */
function calculateMinutesDifference({ firstDate, secondDate }) {
  const difference = new Date(firstDate) - new Date(secondDate);

  return Math.floor((difference / 1000) / 60);
}

/**
 * Create text code.
 * @param {number} amount - Amount of characters.
 * @returns {string} - Alphanumerical text code.
 */
function generateTextCode(amount = 8) {
  return shuffleArray(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'D', 'E', 'F', 'G', 'H', 'L', 'M', 'N', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z']).slice(0, amount).join('');
}

/**
 * Trims whitespaces from beginning and end of the string
 * Needed for Android 2.1. trim() is not supported
 * @static
 * @param {string} sentText - String to be trimmed
 * @returns {string} - String with no whitespaces in the beginning and end
 */
function trimSpace(sentText) {
  return findOneReplace(sentText, /^\s+|\s+$/, '');
}

exports.hasAllowedText = hasAllowedText;
exports.isAllowedFull = isAllowedFull;
exports.cleanText = cleanText;
exports.convertToBoolean = convertToBoolean;
exports.convertToFloat = convertToFloat;
exports.convertToInt = convertToInt;
exports.shuffleArray = shuffleArray;
exports.getDifference = getDifference;
exports.isValidMail = isValidMail;
exports.calculateMinutesDifference = calculateMinutesDifference;
exports.generateTextCode = generateTextCode;
exports.trimSpace = trimSpace;
