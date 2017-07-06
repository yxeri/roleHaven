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

const schemas = {};

schemas.authenticate = {
  type: 'object',
  required: ['data'],
  properties: {
    data: {
      type: 'object',
      required: ['token'],
      properties: {
        token: { type: 'string' },
      },
    },
  },
};

schemas.users = {
  type: 'object',
  required: ['data'],
  properties: {
    data: {
      type: 'object',
      required: ['users'],
      properties: {
        users: {
          type: 'array',
          items: {
            type: 'object',
            required: ['userName', 'online'],
            optional: ['team'],
            properties: {
              userName: { type: 'string' },
              team: { type: 'string' },
              online: { type: 'boolean' },
            },
          },
        },
      },
    },
  },
};

schemas.success = {
  type: 'object',
  required: ['data'],
  properties: {
    data: {
      type: 'object',
      required: ['success'],
      properties: {
        success: { type: 'boolean', enum: [true] },
      },
    },
  },
};

// TODO Double check what retrieval of user contains
schemas.user = {
  type: 'object',
  required: ['data'],
  properties: {
    data: {
      type: 'object',
      required: ['user'],
      properties: {
        user: {
          required: [
            'userName',
            'verified',
            'banned',
            'online',
            'lootable',
            'accessLevel',
            'visibility',
            'warnings',
            'mail',
            'rooms',
            'whisperRooms',
            'registeredAt',
            'registerDevice',
            'aliases',
          ],
          properties: {
            userName: { type: 'string' },
            verified: { type: 'boolean' },
            banned: { type: 'boolean' },
            online: { type: 'boolean' },
            lootable: { type: 'boolean' },
            accessLevel: { type: 'number' },
            visibility: { type: 'number' },
            warnings: { type: 'number' },
            mail: { type: 'string' },
            rooms: { type: 'array', items: { type: 'string' } },
            whisperRooms: { type: 'array', items: { type: 'string' } },
            registeredAt: { type: 'string' },
            registerDevice: { type: 'string' },
            aliases: { type: 'array', items: { type: 'string' } },
          },
        },
      },
    },
  },
};

schemas.aliases = {
  type: 'object',
  required: ['data'],
  properties: {
    data: {
      type: 'object',
      required: ['aliases', 'user'],
      properties: {
        aliases: { type: 'array', items: { type: 'string' } },
        user: {
          type: 'object',
          required: ['userName'],
          properties: {
            userName: { type: 'string' },
          },
        },
      },
    },
  },
};

schemas.alias = {
  type: 'object',
  required: ['data'],
  properties: {
    data: {
      type: 'object',
      required: ['alias'],
      properties: {
        alias: { type: 'string' },
      },
    },
  },
};

schemas.wallet = {
  type: 'object',
  required: ['data'],
  properties: {
    data: {
      type: 'object',
      required: ['owner', 'amount', 'accessLevel', 'protected'],
      properties: {
        owner: { type: 'string' },
        amount: { type: 'number' },
        accessLevel: { type: 'number' },
        protected: { type: 'boolean' },
      },
    },
  },
};

schemas.transactionBase = {
  type: 'object',
  required: ['from', 'to', 'time', 'amount'],
  properties: {
    from: { type: 'string' },
    to: { type: 'string' },
    time: { type: 'string' },
    amount: { type: 'number' },
  },
};

schemas.fullTransaction = {
  type: 'object',
  required: ['data'],
  properties: {
    data: {
      type: 'object',
      required: ['wallet', 'transaction'],
      properties: {
        wallet: {
          type: 'object',
          required: ['amount'],
          properties: {
            amount: { type: 'number' },
          },
        },
        transaction: schemas.transactionBase,
      },
    },
  },
};

schemas.allTransactions = {
  type: 'object',
  required: ['data'],
  properties: {
    data: {
      type: 'object',
      required: ['toTransactions', 'fromTransactions'],
      properties: {
        toTransactions: {
          type: 'array',
          items: schemas.transactionBase,
        },
        fromTransactions: {
          type: 'array',
          items: schemas.transactionBase,
        },
      },
    },
  },
};

schemas.rooms = {
  type: 'object',
  required: ['data'],
  properties: {
    data: {
      type: 'object',
      required: ['rooms'],
      properties: {
        rooms: {
          type: 'array',
          items: { type: 'string' },
        },
      },
    },
  },
};

schemas.room = {
  type: 'object',
  required: ['data'],
  properties: {
    data: {
      type: 'object',
      required: ['room'],
      properties: {
        room: {
          type: 'object',
          required: [
            'roomName',
            'accessLevel',
            'visibility',
            'owner',
            'anonymous',
          ],
          properties: {
            roomName: { type: 'string' },
            accessLevel: { type: 'number' },
            visibility: { type: 'number' },
            owner: { type: 'string' },
            anonymous: { type: 'boolean' },
          },
        },
      },
    },
  },
};

module.exports = schemas;
