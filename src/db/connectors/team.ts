'use strict';

import mongoose from 'mongoose';
import { UserSchema } from 'src/db/connectors/user.js';
import dbConnector, { BaseSchema, BaseSchemaDef, ImageSchema } from 'src/db/databaseConnector.js';
import errorCreator from 'src/error/errorCreator.js';

type TeamSchema = BaseSchema & {
  teamName: string;
  shortName: string;
  teamNameLowerCase: string;
  shortNameLowerCase: string;
  isVerified: boolean;
  isProtected: boolean;
  members: string[];
  image: ImageSchema;
  locationName: string;
  isPermissionsOnly: boolean;
};

const teamSchema = new mongoose.Schema<TeamSchema>({
  ...BaseSchemaDef,
  teamName: {
    type: String,
    unique: true,
  },
  shortName: {
    type: String,
    unique: true,
  },
  teamNameLowerCase: {
    type: String,
    unique: true,
  },
  shortNameLowerCase: {
    type: String,
    unique: true,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  isProtected: {
    type: Boolean,
    default: false,
  },
  members: {
    type: [String],
    default: [],
  },
  image: dbConnector.imageSchema,
  locationName: String,
  isPermissionsOnly: {
    type: Boolean,
    default: false,
  },
}, { collection: 'teams' });

export const Team = mongoose.model('Team', teamSchema);

async function updateObject({
  teamId,
  update,
}: {
  teamId: string;
  update: mongoose.UpdateQuery<TeamSchema>;
}) {
  const { error, data } = await dbConnector.updateObject({
    update,
    query: { _id: teamId },
    object: Team,
    errorNameContent: 'updateTeam',
  });

  if (error) {
    return { error };
  }

  return { data: { team: data?.object } };
}

async function getTeams({
  query,
  filter,
}: {
  query: mongoose.FilterQuery<TeamSchema>;
  filter?: mongoose.ProjectionType<TeamSchema>;
}) {
  const { error, data } = await dbConnector.getObjects({
    query,
    filter,
    object: Team,
  });

  if (error) {
    return { error };
  }

  return {
    data: {
      teams: data?.objects,
    },
  };
}

async function getTeam({
  query,
}: {
  query: mongoose.FilterQuery<TeamSchema>;
}) {
  const { error, data } = await dbConnector.getObject({
    query,
    object: Team,
  });

  if (error) {
    return { error };
  }

  if (!data.object) {
    return { error: new errorCreator.DoesNotExist({ name: `team ${JSON.stringify(query, null, 4)}` }) };
  }

  return { data: { team: data.object } };
}

async function doesTeamExist({
  teamName,
  shortName,
}: {
  teamName?: string;
  shortName?: string;
}) {
  if (!teamName && !shortName) {
    return { data: { exists: false, object: null } };
  }

  const query: mongoose.FilterQuery<TeamSchema> = {};

  if (teamName && shortName) {
    query.$or = [
      { shortNameLowerCase: shortName.toLowerCase() },
      { teamNameLowerCase: teamName.toLowerCase() },
    ];
  } else if (teamName) {
    query.teamNameLowerCase = teamName.toLowerCase();
  } else {
    query.shortNameLowerCase = (shortName as string).toLowerCase();
  }

  return dbConnector.doesObjectExist({
    query,
    object: Team,
  });
}

async function createTeam({
  team,
}: {
  team: Partial<TeamSchema>;
}) {
  const { error, data } = await doesTeamExist({
    teamName: team.teamName,
    shortName: team.shortName,
  });

  if (error) {
    return { error };
  }

  if (data?.exists) {
    return { error: new errorCreator.AlreadyExists({ name: `team ${team.teamName} ${team.shortName}` }) };
  }

  const teamToSave = team;
  teamToSave.teamNameLowerCase = teamToSave.teamName?.toLowerCase();
  teamToSave.shortNameLowerCase = teamToSave.shortName?.toLowerCase();

  const { error: saveError, data: saveData } = await dbConnector.saveObject({
    object: Team,
    objectData: team,
    objectType: 'team',
  });

  if (saveError) {
    return { error: saveError };
  }

  return { data: { team: saveData.savedObject } };
}

async function updateTeam({
  teamId,
  team,
  options = {},
}: {
  teamId: string;
  team: Partial<TeamSchema>;
  options?: {
    resetOwnerAliasId?: boolean;
  };
}) {
  const {
    teamName,
    shortName,
    ownerAliasId,
    isVerified,
    isProtected,
    isPermissionsOnly,
  } = team;
  const { resetOwnerAliasId } = options;
  const update: mongoose.UpdateQuery<TeamSchema> = {};
  const set: mongoose.UpdateQuery<TeamSchema>['$set'] = {};
  const unset: mongoose.UpdateQuery<TeamSchema>['$unset'] = {};

  const updateCallback = () => {
    return updateObject({
      update,
      teamId,
    });
  };

  if (resetOwnerAliasId) {
    unset.ownerAliasId = '';
  } else if (ownerAliasId) {
    set.ownerAliasId = ownerAliasId;
  }

  if (typeof isVerified === 'boolean') {
    set.isVerified = isVerified;
  }
  if (typeof isProtected === 'boolean') {
    set.isProtected = isProtected;
  }
  if (typeof isPermissionsOnly === 'boolean') {
    set.isPermissionsOnly = isPermissionsOnly;
  }

  if (teamName) {
    set.teamName = teamName;
    set.teamNameLowerCase = teamName.toLowerCase();
  }
  if (shortName) {
    set.shortName = shortName;
    set.shortNameLowerCase = shortName.toLowerCase();
  }

  if (Object.keys(set).length > 0) {
    update.$set = set;
  }
  if (Object.keys(unset).length > 0) {
    update.$unset = unset;
  }

  if (teamName || shortName) {
    const { data, error } = await doesTeamExist({
      shortName,
      teamName,
    });

    if (error) {
      return { error };
    }

    if (data.exists) {
      return { error: new errorCreator.AlreadyExists({ name: `teamName ${teamName} ${shortName}` }) };
    }

    return updateCallback();
  }

  return updateCallback();
}

async function getTeamsByUser({
  user,
  includeInactive,
}: {
  user: Partial<UserSchema>;
  includeInactive?: boolean;
}) {
  const query = dbConnector.createUserQuery({ user });

  if (!includeInactive) {
    query.isVerified = true;
  }

  return getTeams({
    query,
  });
}

async function getTeamById({
  teamId,
}: {
  teamId: string;
}) {
  return getTeam({
    query: { _id: teamId },
  });
}

async function verifyTeam({
  teamId,
}: {
  teamId: string;
}) {
  return updateTeam({
    teamId,
    team: { isVerified: true },
  });
}

async function addTeamMembers({
  memberIds,
  teamId,
}: {
  memberIds: string[];
  teamId: string;
}) {
  return updateObject({
    teamId,
    update: { $addToSet: { members: { $each: memberIds } } },
  });
}

async function removeTeamMembers({
  memberIds,
  teamId,
}: {
  memberIds: string[];
  teamId: string;
}) {
  return updateObject({
    teamId,
    update: { $pull: { members: { $in: memberIds } } },
  });
}

export default {
  createTeam,
  getTeamsByUser,
  updateTeam,
  getTeamById,
  verifyTeam,
  addTeamMembers,
  removeTeamMembers,
};
