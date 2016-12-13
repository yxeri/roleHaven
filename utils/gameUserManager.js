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

/**
 * @param {string} password - String to generate hints from
 * @returns {string[]} - Returns password hints
 */
function createHints(password) {
  const hints = [];
  const startAmount = Math.floor(Math.random() * 2);
  const endAmount = startAmount === 0 ? Math.floor(Math.random() * 2) : 0;

  /**
   * start *characters*
   * Example: start pi
   */
  hints.push(`start ${password.substr(0, 1 + startAmount)}`);

  /**
   * end *characters*
   * Example: end za
   */
  hints.push(`end ${password.substr((password.length - 1) - endAmount)}`);

  if (password.length > 5) {
    const position = Math.floor((Math.random() * ((password.length - 3) - 2)) + 2);

    /**
     * middle *position* *characters*
     * Example: middle 3 z
     */
    hints.push(`middle ${position + 1} ${password.charAt(position)}`);
  }

  /**
   * length *number*
   * Example:length 5
   */
  hints.push(`length ${password.length}`);

  return hints;
}

exports.createHints = createHints;
