import { ObjectId } from 'mongodb';
import mongoose from 'mongoose';
import dbConfig, { DbConfig } from 'src/config/defaults/dbConfig.js';
import dbForumThread from 'src/db/connectors/forumThread.js';
import { UserSchema } from 'src/db/connectors/user.js';
import dbConnector, { BaseSchema, ImageSchema } from 'src/db/databaseConnector.js';
import errorCreator from 'src/error/errorCreator.js';

export type ForumSchema = BaseSchema & {
  title: string;
  text: string[];
  isPersonal: boolean;
  image: ImageSchema;
};

const forumSchema = new mongoose.Schema<ForumSchema>({
  title: {
    type: String,
    unique: true
  },
  text: {
    type: [String],
    default: []
  },
  isPersonal: {
    type: Boolean,
    default: false
  },
  image: dbConnector.imageSchema,
}, { collection: 'forums' });

const Forum = mongoose.model('Forum', forumSchema);

async function updateObject({
  forumId,
  update,
}: {
  forumId: string,
  update: mongoose.UpdateQuery<ForumSchema>,
}) {
  const { error, data } = await dbConnector.updateObject({
    update,
    object: Forum,
    query: { _id: forumId },
    errorNameContent: 'updateForum',
  });

  if (error) {
    return { error };
  }

  if (!data?.object) {
    return { error: new errorCreator.DoesNotExist({ name: `forum ${forumId}` }) };
  }

  return { data: { forum: data.object } };
}

async function getForums({
  query,
  filter,
}: {
  query: mongoose.FilterQuery<ForumSchema>,
  filter?: mongoose.FilterQuery<ForumSchema>,

}) {
  const { error, data } = await dbConnector.getObjects({
    query,
    filter,
    object: Forum,
  });

  if (error) {
    return { error };
  }

  return {
    data: {
      forums: data?.objects,
    },
  };
}

async function getForum({
  query,
}: {
  query: mongoose.FilterQuery<ForumSchema>,
}) {
  const { error, data } = await dbConnector.getObject({
    query,
    object: Forum,
  });

  if (error) {
    return { error };
  }

  return { data: { forum: data.object } };
}

async function doesForumExist({
  title,
}: {
  title: string,
}) {
  return dbConnector.doesObjectExist({
    query: { title },
    object: Forum,
  });
}

async function createForum({
  forum,
  silentExistsError,
  options = {},
}: {
  forum: Partial<ForumSchema> & { title: string },
  silentExistsError?: boolean,
  options?: {
    setId?: boolean,
  },
}) {
  const { setId } = options;

  const { error, data } = await doesForumExist({
    title: forum.title,
  });

  if (error) {
    return { error };
  }

  if (data.exists) {
    if (silentExistsError) {
      return { data: { exists: true } };
    }

    return { error: new errorCreator.AlreadyExists({ name: `createForum ${forum.title}` }) };
  }

  const forumToSave = forum;

  if (setId) {
    forumToSave._id = new ObjectId(forumToSave.objectId);
  }

  const { error: saveError, data: saveData } = await dbConnector.saveObject({
    object: Forum,
    objectData: forumToSave,
    objectType: 'forum',
  });

  if (saveError) {
    return { error: saveError };
  }

  return { data: { forum: saveData.savedObject } };
}

async function getForumById({
  forumId,
}: {
  forumId: string,
}) {
  return getForum({
    query: { _id: forumId },
  });
}

async function getForumsByIds({
  forumIds,
}: {
  forumIds: string[],
}) {
  return getForums({
    query: { _id: { $in: forumIds } },
  });
}

async function getAllForums() {
  return getForums({ query: {} });
}

// TODO expand to match other update functions
async function updateForum({
  forumId,
  forum,
}: {
  forumId: string,
  forum: Partial<ForumSchema>,
}) {
  const update: mongoose.UpdateQuery<ForumSchema> = { $set: forum };

  if (forum.title) {
    const { error, data } = await doesForumExist({
      title: forum.title,
    });

    if (error) {
      return { error };
    }

    if (data.exists) {
      return { error: new errorCreator.AlreadyExists({ name: `forum title ${forum.title}` }) };
    }

    return updateObject({
      forumId,
      update,
    });
  }

  return updateObject({
    update,
    forumId,
  });
}

async function removeForum({
  forumId,
  fullRemoval,
}: {
  forumId: string,
  fullRemoval?: boolean,
}) {
  const { error } = await dbConnector.removeObjects({
    object: Forum,
    query: { _id: forumId },
  });

  if (error) {
    return {
      error: new errorCreator.Database({
        errorObject: error,
        name: 'removeForum'
      })
    };
  }

  if (fullRemoval) {
    const { error: getError, data: getData } = await dbForumThread.getThreadsByForum({
      forumId,
    });

    if (getError) {
      return { error: getError };
    }

    return dbForumThread.removeThreads({
      threadIds: getData.threads.map((forumThread) => forumThread.objectId),
      fullRemoval: true,
    });
  }

  return { data: { success: true } };
}

async function getForumsByUser({
  user,
}: {
  user: Partial<UserSchema>,
}) {
  const query = dbConnector.createUserQuery({ user });

  return getForums({
    query,
  });
}

async function populateDbForums() {
  console.info('Creating default forums, if needed');

  const { forums } = dbConfig;

  async function addForum(forumNames: Array<keyof DbConfig['forums']>) {
    const forumName = forumNames.shift();

    if (forumName) {
      const { error } = await createForum({
        forum: forums[forumName],
        silentExistsError: true,
        options: { setId: true },
      });

      if (error) {
        return { error };
      }

      return addForum(forumNames);
    }

    return { data: { success: true } };
  }

  return addForum(Object.keys(forums));
}

export default {
  createForum,
  getForumById,
  updateForum,
  getAllForums,
  getForumsByIds,
  removeForum,
  getForumsByUser,
  populateDbForums,
};
