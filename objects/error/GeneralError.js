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

const ErrorTypes = {
  GENERAL: 'general error',
  DATABASE: 'database',
  DOESNOTEXIST: 'does not exist',
  EXTERNAL: 'external',
  ALREADYEXISTS: 'already exists',
  INCORRECT: 'incorrect',
  INVALIDCHARACTERS: 'invalid characters',
  INVALIDDATA: 'invalid data',
  NOTALLOWED: 'not allowed',
};

class GeneralError {
  /**
   * Create a general error
   * @param {string} [params.text] Human-readable text to send back with the error
   * @param {string} [params.type] Type of error
   * @param {Error} [params.errorObject] Error object
   */
  constructor({ text = ['Something went wrong'], type = ErrorTypes.GENERAL, errorObject = {} }) {
    this.text = text;
    this.type = type;
    this.errorObject = errorObject;
  }
}

module.exports = GeneralError;
exports.ErrorTypes = ErrorTypes;
