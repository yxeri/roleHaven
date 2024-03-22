'use strict';

const schemas = {};

schemas.authenticate = {
  type: 'object',
  required: ['token'],
  properties: {
    token: { type: 'string' },
  },
};

export default schemas;
