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

// require('request').get('http://wiki.bbreloaded.se/api.php?action=query&prop=revisions&rvprop=content&rvlimit=1&rvparse&format=json&titles=Water_Federation', (err, response, body) => {
//   if (err || response.statusCode !== 200) {
//     console.log('Error request', response, err);
//
//     return;
//   }
//
//   const wikiQuery = JSON.parse(body).query;
//   const wikiBody = wikiQuery.pages[Object.keys(wikiQuery.pages)[0]];
//
//   console.log('Title:', wikiBody.title);
//   console.log(wikiBody.revisions[0]);
// });
