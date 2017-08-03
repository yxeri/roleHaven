/*
 Copyright 2017 Aleksandar Jankovic

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

const alphaNumericRegex = /^[\w\d]+$/;
const fullTextRegex = /^[\w\d\såäöÅÄÖ-]+$/;

/**
 * Does the string contain only alphanumeric values?
 * @param {string} text String to check
 * @returns {boolean} Does the string contain only alphanumeric values?
 */
function isAlphaNumeric(text) {
  return alphaNumericRegex.test(text);
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

/**
 * @param {string[]} array - Array to be shuffled
 * @returns {string[]} Shuffled array
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
 * Get minutes between dates
 * @param {Date} params.startDate Start date
 * @param {Date} params.endDate Later date
 * @returns {number} Minutes
 */
function calculateMinutesDifference({ firstDate, secondDate }) {
  const difference = new Date(firstDate) - new Date(secondDate);

  return Math.floor((difference / 1000) / 60);
}

exports.isAlphaNumeric = isAlphaNumeric;
exports.isAllowedFull = isAllowedFull;
exports.cleanText = cleanText;
exports.convertToBoolean = convertToBoolean;
exports.convertToFloat = convertToFloat;
exports.convertToInt = convertToInt;
exports.shuffleArray = shuffleArray;
exports.calculateMinutesDifference = calculateMinutesDifference;
