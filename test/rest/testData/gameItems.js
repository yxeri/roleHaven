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

const data = {};

data.gameUsersToCreate = [
  {
    userName: 'createdgameuser',
    passwords: ['banan', 'apple', 'honey'],
    stationId: 1,
  }, {
    userName: 'othergameuser',
    passwords: ['pizza', 'hamburger', 'meatball'],
    stationId: 1,
  }, {
    userName: 'thisgameuser',
    passwords: ['alpha', 'bravo', 'charlie'],
    stationId: 2,
  }, {
    userName: 'thatgameuser',
    passwords: ['crew', 'bar', 'home'],
    stationId: 3,
  }, {
    userName: 'whatgameuser',
    passwords: ['movie', 'music', 'book'],
    stationId: 4,
  },
];
data.fakePasswords = [
  'house',
  'lantern',
  'bottle',
  'road',
  'computer',
  'razor',
  'screen',
  'grass',
  'snow',
  'keyboard',
  'laser',
  'camera',
  'phone',
  'game',
  'code',
];

module.exports = data;
