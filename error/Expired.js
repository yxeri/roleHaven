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

class Expired extends GeneralError.create {
  /**
   * Create an expired error object.
   * Indicates that object has expired.
   * @param {Object} params Parameters.
   * @param {string} [params.name] Retrieval source
   * @param {Date} [params.expiredAt] When the object expired
   * @param {Error} [params.errorObject] Error object
   */
  constructor({
    expiredAt,
    errorObject,
    extraData,
    name = '-',
  }) {
    super({
      errorObject,
      extraData,
      type: GeneralError.ErrorTypes.INTERNAL,
      text: [`Object has exired for ${name} at ${expiredAt}`],
    });
  }
}

module.exports = Expired;
