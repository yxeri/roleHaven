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

const tools = require('../helper/tools');
const appConfig = require('../../../config/defaults/config').app;

const data = {};

data.privateDocFileToCreate = {
  title: tools.createRandString({ length: appConfig.docFileTitleMaxLength }),
  docFileId: tools.createRandString({ length: appConfig.docFileIdMaxLength }),
  text: [
    tools.createRandString({ length: appConfig.docFileMaxLength / 2 }),
    tools.createRandString({ length: appConfig.docFileMaxLength / 2 }),
  ],
  isPublic: false,
};
data.privateDocWithSameTitle = {
  title: data.privateDocFileToCreate.title,
  docFileId: tools.createRandString({ length: appConfig.docFileIdMaxLength }),
  text: [
    tools.createRandString({ length: appConfig.docFileMaxLength / 2 }),
    tools.createRandString({ length: appConfig.docFileMaxLength / 2 }),
  ],
  isPublic: false,
};
data.privateDocWithSameId = {
  title: tools.createRandString({ length: appConfig.docFileTitleMaxLength }),
  docFileId: data.privateDocFileToCreate.docFileId,
  text: [
    tools.createRandString({ length: appConfig.docFileMaxLength / 2 }),
    tools.createRandString({ length: appConfig.docFileMaxLength / 2 }),
  ],
  isPublic: false,
};
data.docWithNoText = {
  title: tools.createRandString({ length: appConfig.docFileTitleMaxLength }),
  docFileId: tools.createRandString({ length: appConfig.docFileIdMaxLength }),
  text: [],
};
data.docWithNoTitle = {
  title: '',
  docFileId: tools.createRandString({ length: appConfig.docFileIdMaxLength }),
  text: [
    tools.createRandString({ length: appConfig.docFileMaxLength / 2 }),
    tools.createRandString({ length: appConfig.docFileMaxLength / 2 }),
  ],
};
data.docWithNoDocFileId = {
  title: tools.createRandString({ length: appConfig.docFileTitleMaxLength }),
  docFileId: '',
  text: [
    tools.createRandString({ length: appConfig.docFileMaxLength / 2 }),
    tools.createRandString({ length: appConfig.docFileMaxLength / 2 }),
  ],
};
data.publicDocToCreate = {
  title: tools.createRandString({ length: appConfig.docFileTitleMaxLength }),
  docFileId: tools.createRandString({ length: appConfig.docFileIdMaxLength }),
  text: [
    tools.createRandString({ length: appConfig.docFileMaxLength / 2 }),
    tools.createRandString({ length: appConfig.docFileMaxLength / 2 }),
  ],
  isPublic: true,
};
data.publicDocFileToCreateAndGet = {
  title: tools.createRandString({ length: appConfig.docFileTitleMaxLength }),
  docFileId: tools.createRandString({ length: appConfig.docFileIdMaxLength }),
  text: [
    tools.createRandString({ length: appConfig.docFileMaxLength / 2 }),
    tools.createRandString({ length: appConfig.docFileMaxLength / 2 }),
  ],
  isPublic: true,
};
data.privateDocFileToCreateAndGet = {
  title: tools.createRandString({ length: appConfig.docFileTitleMaxLength }),
  docFileId: tools.createRandString({ length: appConfig.docFileIdMaxLength }),
  text: [
    tools.createRandString({ length: appConfig.docFileMaxLength / 2 }),
    tools.createRandString({ length: appConfig.docFileMaxLength / 2 }),
  ],
  isPublic: true,
};

module.exports = data;
