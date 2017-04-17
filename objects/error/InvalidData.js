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

const GeneralError = require('./GeneralError');

class InvalidDataError extends GeneralError {
  /**
   * Create invalid data error
   * @param {string} [params.expected] Expected data structure
   * @param {Object} [params.errorObject] Error object
   */
  constructor({ expected = '-', errorObject }) {
    super({
      type: GeneralError.ErrorTypes.INVALIDDATA,
      text: [
        'Invalid data sent',
        `Expected: ${expected}`,
      ],
      errorObject,
    });
  }
}

module.exports = InvalidDataError;
