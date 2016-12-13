/*
 Copyright 2015 Aleksandar Jankovic

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

const defaultLanguage = require('./../config/defaults/config').app.defaultLanguage;

/**
 * Appends property name with the set default language in the configuration
 * @param {string} propertyName Name of the property
 * @returns {String} Property name with the set default language in the configuration
 */
function appendLanguageCode(propertyName) {
  if (defaultLanguage !== '') {
    return `${propertyName}_${defaultLanguage}`;
  }

  return propertyName;
}

exports.appendLanguageCode = appendLanguageCode;
