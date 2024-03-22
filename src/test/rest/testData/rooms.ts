'use strict';

const { appConfig } = require('../../../config/defaults/config');
const tools = require('../helper/tools');

const data = {};

data.create = {
  first: {
    roomName: tools.createRandString({ length: appConfig.roomNameMaxLength }),
  },
  second: {
    roomName: tools.createRandString({ length: appConfig.roomNameMaxLength }),
  },
  missing: {
    roomName: tools.createRandString({ length: appConfig.roomNameMaxLength }),
  },
};

data.update = {
  toUpdate: {
    roomName: tools.createRandString({ length: appConfig.roomNameMaxLength }),
  },
  updateWith: {
    roomName: tools.createRandString({ length: appConfig.roomNameMaxLength }),
  },
};

data.remove = {
  toRemove: {
    roomName: tools.createRandString({ length: appConfig.roomNameMaxLength }),
  },
  secondToRemove: {
    roomName: tools.createRandString({ length: appConfig.roomNameMaxLength }),
  },
};

export default data;
