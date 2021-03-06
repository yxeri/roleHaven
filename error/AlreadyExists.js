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

class AlreadyExists extends GeneralError.create {
  /**
   * Create already exists error
   * @param {string} [params.name] Name of type of object that already exists
   * @param {Object} [params.errorObject] Error object
   * @param {Object} [params.extraData] Extra data that client can use when an error is sent
   */
  constructor({
    suppressPrint,
    errorObject,
    extraData,
    name = '',
  }) {
    super({
      errorObject,
      extraData,
      suppressPrint,
      type: GeneralError.ErrorTypes.ALREADYEXISTS,
      text: [`${name} already exists`],
    });
  }
}

module.exports = AlreadyExists;
