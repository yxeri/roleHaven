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

const GeneralError = require('./GeneralError');

class InvalidCharacters extends GeneralError.create {
  /**
   * Create invalid characters error.
   * @param {Object} params Parameters.
   * @param {string} [params.name] Name of the string being checked.
   * @param {string} [params.expected] Expected valid characters.
   * @param {Object} [params.errorObject] Error object.
   */
  constructor({
    errorObject,
    extraData,
    name = '-',
    expected = '-',
  }) {
    super({
      errorObject,
      extraData,
      type: GeneralError.ErrorTypes.INVALIDCHARACTERS,
      text: [
        `Property ${name} has invalid characters`,
        `Valid characters: ${expected}`,
      ],
    });
  }
}

module.exports = InvalidCharacters;
