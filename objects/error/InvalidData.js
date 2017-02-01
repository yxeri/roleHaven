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

const General = require('./General');

class InvalidDataError extends General {
  /**
   * InvalidDataError constructor
   * @param {string} [params.incorrectProperties] - String with incorrect/missing properties
   * @param {string} [params.expected] - String with the data that was expected
   */
  constructor({ incorrectProperties, expected }) {
    const text = ['Invalid data sent'];

    if (incorrectProperties) {
      text.push(`Incorrect or missing properties: ${incorrectProperties}`);
    }

    if (expected) {
      text.push(`Expected: ${expected}`);
    }

    super({
      type: 'Invalid data',
      text,
    });
  }
}

module.exports = InvalidDataError;
