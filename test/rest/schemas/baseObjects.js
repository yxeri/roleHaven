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

schemas.remove = {
  type: 'object',
  required: ['objectId'],
  properties: {
    objectId: { type: 'string' },
  },
};

/**
 *   modifiedObject.teamAdminIds = undefined;
 modifiedObject.userAdminIds = undefined;
 modifiedObject.userIds = undefined;
 modifiedObject.teamIds = undefined;
 modifiedObject.bannedIds = undefined
 * @type {{type: string, required: string[], properties: {ownerId: {type: string}, lastUpdated: {type: string}, timeCreated: {type: string}, isPublic: {type: string}, objectId: {type: string}, accessLevel: {type: string}, visibility: {type: string}}, not: {required: string[]}}}
 */

schemas.liteBaseObject = {
  type: 'object',
  required: [
    'lastUpdated',
    'ownerId',
    'timeCreated',
    'isPublic',
    'objectId',
    'accessLevel',
    'visibility',
  ],
  properties: {
    ownerId: { type: 'string' },
    lastUpdated: { type: 'string' },
    timeCreated: { type: 'string' },
    isPublic: { type: 'boolean' },
    objectId: { type: 'string' },
    accessLevel: { type: 'number' },
    visibility: { type: 'number' },
  },
  not: {
    required: [
      'ownerAliasId',
      'customLastUpdated',
      'customTimeCreated',
      'teamAdminIds',
      'userAdminIds',
      'bannedIds',
      'userIds',
      'teamIds',
    ],
  },
};

schemas.fullBaseObject = {
  type: 'object',
  required: [
    'objectId',
    'ownerId',
    'lastUpdated',
    'timeCreated',
    'visibility',
    'accessLevel',
    'teamAdminIds',
    'userAdminIds',
    'userIds',
    'teamIds',
    'bannedIds',
    'isPublic',
  ],
  properties: {
    objectId: { type: 'string' },
    ownerId: { type: 'string' },
    lastUpdated: { type: 'string' },
    timeCreated: { type: 'string' },
    visiblity: { type: 'number' },
    userIds: {
      type: 'array',
      items: { type: 'string' },
    },
    teamIds: {
      type: 'array',
      items: { type: 'string' },
    },
    isPublic: { type: 'boolean' },
    teamAdminIds: {
      type: 'array',
      items: { type: 'string' },
    },
    userAdminIds: {
      type: 'array',
      items: { type: 'string' },
    },
    bannedIds: {
      type: 'array',
      items: { type: 'string' },
    },
    ownerAliasId: { type: 'string' },
    customLastUpdated: { type: 'string' },
    customTimeCreated: { type: 'string' },
  },
};

schemas.error = {
  type: 'object',
  required: ['title', 'status', 'detail'],
  properties: {
    title: { type: 'string' },
    status: { type: 'number' },
    detail: { type: 'string' },
  },
};

schemas.returnData = {
  type: 'object',
  properties: {
    error: schemas.error,
    data: { type: 'object' },
  },
  oneOf: [
    { required: ['error'] },
    { required: ['data'] },
  ],
};

schemas.coordinates = {
  type: 'object',
  required: [
    'longitude',
    'latitude',
    'accuracy',
  ],
  properties: {
    longitude: { type: 'number' },
    latitude: { type: 'number' },
    accuracy: { type: 'number' },
    heading: { type: 'number' },
    speed: { type: 'number' },
    extraCoordinates: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          longitude: { type: 'number' },
          latitude: { type: 'number' },
        },
      },
    },
  },
};

module.exports = schemas;

