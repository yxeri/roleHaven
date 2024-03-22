'use strict';

import mongoose from 'mongoose';
import dbConnector, { BaseSchema, BaseSchemaDef } from 'src/db/databaseConnector.js';
import ErrorCreator from 'src/error/errorCreator.js';
import errorCreator from 'src/error/errorCreator.js';

export type SimpleMsgSchema = BaseSchema & {
  text: string;
};

const simpleMsgSchema = new mongoose.Schema<SimpleMsgSchema>({
  ...BaseSchemaDef,
  text: String,
}, { collection: 'simpleMsgs' });

const SimpleMsg = mongoose.model('SimpleMsg', simpleMsgSchema);

async function updateObject({
  update,
  simpleMsgId,
}: {
  update: mongoose.UpdateQuery<SimpleMsgSchema>;
  simpleMsgId: string;
}) {
  const { error, data } = await dbConnector.updateObject({
    update,
    query: { _id: simpleMsgId },
    object: SimpleMsg,
    errorNameContent: 'updateSimpleMsg',
  });

  if (error) {
    return { error };
  }

  if (!data?.object) {
    return { error: new ErrorCreator.DoesNotExist({ name: `Simple msg ${simpleMsgId}` })};
  }

  return { data: { simpleMsg: data.object } };
}

async function createSimpleMsg({
  simpleMsg,
}: {
  simpleMsg: Partial<SimpleMsgSchema>;
}) {
  const { error, data } = await dbConnector.saveObject({
    object: SimpleMsg,
    objectData: simpleMsg,
    objectType: 'Simple msg',
  });

  if (error) {
    return { error };
  }

  return { data: { simpleMsg: data.savedObject } };
}

async function getSimpleMsgs({
  query,
  filter,
}: {
  query: mongoose.FilterQuery<SimpleMsgSchema>;
  filter?: mongoose.ProjectionType<SimpleMsgSchema>;
}) {
  const { error, data } = await dbConnector.getObjects({
    query,
    filter,
    object: SimpleMsg,
  });

  if (error) {
    return { error };
  }

  return {
    data: {
      simpleMsgs: data?.objects,
    },
  };
}

async function getSimpleMsg({
  query,
}: {
  query: mongoose.FilterQuery<SimpleMsgSchema>;
}) {
  const { error, data } = await dbConnector.getObject({
    query,
    object: SimpleMsg,
  });

  if (error) {
    return { error };
  }

  if (!data.object) {
    return { error: new errorCreator.DoesNotExist({ name: `simpleMsg ${JSON.stringify(query, null, 4)}` }) };
  }

  return { data: { simpleMsg: data.object } };
}

async function removeSimpleMsgsByUser({
  userId,
}: {
  userId: string;
}) {
  return dbConnector.removeObjects({
    object: SimpleMsg,
    query: { userId },
  });
}

async function removeSimpleMsg({
  simpleMsgId,
}: {
  simpleMsgId: string;
}) {
  return dbConnector.removeObject({
    object: SimpleMsg,
    query: { _id: simpleMsgId },
  });
}

async function getAllSimpleMsgs() {
  return getSimpleMsgs({
    query: {},
  });
}

async function updateSimpleMsg({
  simpleMsgId,
  simpleMsg,
}: {
  simpleMsgId: string;
  simpleMsg: Partial<SimpleMsgSchema>;
}) {
  const { text } = simpleMsg;
  const update: mongoose.UpdateQuery<SimpleMsgSchema> & { $set: NonNullable<mongoose.UpdateQuery<SimpleMsgSchema>['$set']> } = { $set: {} };

  if (text) {
    update.$set.text = text;
  }

  return updateObject({
    update,
    simpleMsgId,
  });
}

async function getSimpleMsgById({
  simpleMsgId,
}: {
  simpleMsgId: string;
}) {
  return getSimpleMsg({
    query: { _id: simpleMsgId },
  });
}

export default {
  createSimpleMsg,
  removeSimpleMsgsByUser,
  getAllSimpleMsgs,
  updateSimpleMsg,
  getSimpleMsgById,
  removeSimpleMsg,
};
