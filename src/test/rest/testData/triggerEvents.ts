'use strict';

import { dbConfig } from '../../../config/defaults/config';

const data = {};

data.create = {
  first: {
    content: {
      message: {
        text: ['Text'],
        roomId: dbConfig.rooms.public.objectId,
      },
    },
    eventType: dbConfig.TriggerEventTypes.CHATMSG,
    changeType: dbConfig.TriggerChangeTypes.CREATE,
  },
  second: {
    content: {
      docFile: {
        text: ['Text'],
        title: 'title',
        code: 'code',
      },
    },
    eventType: dbConfig.TriggerEventTypes.DOCFILE,
    changeType: dbConfig.TriggerChangeTypes.CREATE,
  },
  missing: {
    content: {
      message: {
        text: ['Text'],
        roomId: dbConfig.rooms.public.objectId,
      },
    },
    eventType: dbConfig.TriggerEventTypes.CHATMSG,
    changeType: dbConfig.TriggerChangeTypes.CREATE,
  },
};

data.update = {
  toUpdate: {
    content: {
      message: {
        text: ['Text'],
        roomId: dbConfig.rooms.public.objectId,
      },
    },
    eventType: dbConfig.TriggerEventTypes.CHATMSG,
    changeType: dbConfig.TriggerChangeTypes.CREATE,
  },
  updateWith: {
    content: {
      message: {
        text: ['New Text'],
        roomId: dbConfig.rooms.public.objectId,
      },
    },
  },
};

data.remove = {
  toRemove: {
    content: {
      message: {
        text: ['Text'],
        roomId: dbConfig.rooms.public.objectId,
      },
    },
    eventType: dbConfig.TriggerEventTypes.CHATMSG,
    changeType: dbConfig.TriggerChangeTypes.CREATE,
  },
  secondToRemove: {
    content: {
      docFile: {
        text: ['Text'],
        title: 'title',
        code: 'code',
      },
    },
    eventType: dbConfig.TriggerEventTypes.DOCFILE,
    changeType: dbConfig.TriggerChangeTypes.CREATE,
  },
};

export default data;
