'use strict';

import mongoose from 'mongoose';
import { UserSchema } from 'src/db/connectors/user.js';
import dbConnector, { BaseSchema, ImageSchema } from 'src/db/databaseConnector.js';
import errorCreator from 'src/error/errorCreator.js';

type DocFileSchema = BaseSchema & {
  code: string;
  title: string;
  text: string[];
  videoCodes: string[];
  images: ImageSchema[];
};

const docFileSchema = new mongoose.Schema<DocFileSchema>({
  code: {
    type: String,
    unique: true,
  },
  title: {
    type: String,
    unique: true,
  },
  text: [String],
  videoCodes: [String],
  images: [dbConnector.imageSchema],
}, { collection: 'docFiles' });

const DocFile = mongoose.model('DocFile', docFileSchema);

async function updateObject({
  docFileId,
  update,
}: {
  docFileId: string,
  update: mongoose.UpdateQuery<DocFileSchema>,
}) {
  const { error, data } = await dbConnector.updateObject({
    update,
    query: { _id: docFileId },
    object: DocFile,
    errorNameContent: 'updateDocFile',
  });

  if (error) {
    return { error };
  }

  if (!data?.object) {
    return { error: new errorCreator.DoesNotExist({ name: `docFile ${docFileId}` }) };
  }

  return { data: { docFile: data.object } };
}

async function getDocFiles({
  query,
  filter,
}: {
  query: mongoose.FilterQuery<DocFileSchema>,
  filter?: mongoose.FilterQuery<DocFileSchema>,
}) {
  const { error, data } = await dbConnector.getObjects({
    query,
    filter,
    object: DocFile,
  });

  if (error) {
    return { error };
  }

  return { data: { docFiles: data?.objects } };
}

async function getDocFile({
  query,
  filter,
}: {
  query: mongoose.FilterQuery<DocFileSchema>,
  filter?: mongoose.ProjectionType<DocFileSchema>,
}) {
  const { error, data } = await dbConnector.getObject({
    query,
    filter,
    object: DocFile,
  });

  if (error) {
    return { error };
  }

  if (!data.object) {
    return { error: new errorCreator.DoesNotExist({ name: `docFile ${JSON.stringify(query, null, 4)}` }) };
  }

  return { data: { docFile: data.object } };
}

async function doesDocFileExist({
  title,
  code,
}: {
  title?: string,
  code?: string,
}) {
  const query: mongoose.FilterQuery<DocFileSchema> & { $or: [] } = { $or: [] };

  if (title) {
    query.$or.push({ title });
  }
  if (code) {
    query.$or.push({ code });
  }

  return dbConnector.doesObjectExist({
    query,
    object: DocFile,
  });
}

async function createDocFile({
  docFile,
}: {
  docFile: Partial<DocFileSchema>,
}) {
  const { error, data } = await doesDocFileExist({
    code: docFile.code,
    title: docFile.title,
  });

  if (error) {
    return { error };
  }

  if (data.exists) {
    return { error: new errorCreator.AlreadyExists({ name: `Docfile ${docFile.code} ${docFile.title}` }) };
  }

  const { error: saveError, data: saveData } = await dbConnector.saveObject({
    object: DocFile,
    objectData: docFile,
    objectType: 'docFile',
  });

  if (saveError) {
    return { error: saveError };
  }

  return { data: { docFile: saveData.savedObject } };
}

async function updateDocFile({
  docFileId,
  docFile,
  options = {},
}: {
  docFileId: string,
  docFile: Partial<DocFileSchema>,
  options?: {
    resetOwnerAliasId?: boolean,
  },
}) {
  const { resetOwnerAliasId } = options;
  const {
    text,
    title,
    visibility,
    isPublic,
    ownerAliasId,
  } = docFile;

  const update: mongoose.UpdateQuery<DocFileSchema> = {};
  const set: mongoose.UpdateQuery<DocFileSchema>['$set'] = {};
  const unset: mongoose.UpdateQuery<DocFileSchema>['$unset'] = {};

  if (text) {
    set.text = text;
  }
  if (title) {
    set.title = title;
  }
  if (visibility) {
    set.visibility = visibility;
  }
  if (typeof isPublic === 'boolean') {
    set.isPublic = isPublic;
  }

  if (resetOwnerAliasId) {
    unset.ownerAliasId = '';
  } else if (ownerAliasId) {
    set.ownerAliasId = ownerAliasId;
  }

  if (Object.keys(set).length > 0) {
    update.$set = set;
  }
  if (Object.keys(unset).length > 0) {
    update.$unset = unset;
  }

  return updateObject({
    docFileId,
    update,
  });
}

async function removeDocFile({
  docFileId,
}: {
  docFileId: string,

}) {
  const query: mongoose.FilterQuery<DocFileSchema> = { _id: docFileId };

  return dbConnector.removeObject({
    query,
    object: DocFile,
  });
}

async function getAllDocFiles() {
  return getDocFiles({
    query: {},
  });
}

async function getDocFileById({
  docFileId,
}: {
  docFileId: string,
}) {
  return getDocFile({
    query: { _id: docFileId },
  });
}

async function getDocFileByCode({
  code,
}: {
  code: string,

}) {
  return getDocFile({
    query: { code },
  });
}

async function getDocFilesByUser({
  user,
}: {
  user: Partial<UserSchema>,
}) {
  const query = dbConnector.createUserQuery({ user });

  return getDocFiles({
    query,
  });
}

async function getDocFilesList() {
  return getDocFiles({
    query: {},
  });
}

export default {
  createDocFile,
  updateDocFile,
  getDocFileById,
  removeDocFile,
  getAllDocFiles,
  getDocFileByCode,
  getDocFilesByUser,
  getDocFilesList,
};
