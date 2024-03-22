'use strict';
import mongoose from 'mongoose';
import dbConnector, { BaseSchemaDef } from 'src/db/databaseConnector.js';
import errorCreator from 'src/error/errorCreator.js';
const teamSchema = new mongoose.Schema({
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
async function updateObject({ teamId, update, }) {
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
async function getTeams({ query, filter, }) {
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
async function getTeam({ query, }) {
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
async function doesTeamExist({ teamName, shortName, }) {
    if (!teamName && !shortName) {
        return { data: { exists: false, object: null } };
    }
    const query = {};
    if (teamName && shortName) {
        query.$or = [
            { shortNameLowerCase: shortName.toLowerCase() },
            { teamNameLowerCase: teamName.toLowerCase() },
        ];
    }
    else if (teamName) {
        query.teamNameLowerCase = teamName.toLowerCase();
    }
    else {
        query.shortNameLowerCase = shortName.toLowerCase();
    }
    return dbConnector.doesObjectExist({
        query,
        object: Team,
    });
}
async function createTeam({ team, }) {
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
async function updateTeam({ teamId, team, options = {}, }) {
    const { teamName, shortName, ownerAliasId, isVerified, isProtected, isPermissionsOnly, } = team;
    const { resetOwnerAliasId } = options;
    const update = {};
    const set = {};
    const unset = {};
    const updateCallback = () => {
        return updateObject({
            update,
            teamId,
        });
    };
    if (resetOwnerAliasId) {
        unset.ownerAliasId = '';
    }
    else if (ownerAliasId) {
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
async function getTeamsByUser({ user, includeInactive, }) {
    const query = dbConnector.createUserQuery({ user });
    if (!includeInactive) {
        query.isVerified = true;
    }
    return getTeams({
        query,
    });
}
async function getTeamById({ teamId, }) {
    return getTeam({
        query: { _id: teamId },
    });
}
async function verifyTeam({ teamId, }) {
    return updateTeam({
        teamId,
        team: { isVerified: true },
    });
}
async function addTeamMembers({ memberIds, teamId, }) {
    return updateObject({
        teamId,
        update: { $addToSet: { members: { $each: memberIds } } },
    });
}
async function removeTeamMembers({ memberIds, teamId, }) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVhbS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInRlYW0udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsWUFBWSxDQUFDO0FBRWIsT0FBTyxRQUFRLE1BQU0sVUFBVSxDQUFDO0FBRWhDLE9BQU8sV0FBVyxFQUFFLEVBQWMsYUFBYSxFQUFlLE1BQU0sNkJBQTZCLENBQUM7QUFDbEcsT0FBTyxZQUFZLE1BQU0sMkJBQTJCLENBQUM7QUFlckQsTUFBTSxVQUFVLEdBQUcsSUFBSSxRQUFRLENBQUMsTUFBTSxDQUFhO0lBQ2pELEdBQUcsYUFBYTtJQUNoQixRQUFRLEVBQUU7UUFDUixJQUFJLEVBQUUsTUFBTTtRQUNaLE1BQU0sRUFBRSxJQUFJO0tBQ2I7SUFDRCxTQUFTLEVBQUU7UUFDVCxJQUFJLEVBQUUsTUFBTTtRQUNaLE1BQU0sRUFBRSxJQUFJO0tBQ2I7SUFDRCxpQkFBaUIsRUFBRTtRQUNqQixJQUFJLEVBQUUsTUFBTTtRQUNaLE1BQU0sRUFBRSxJQUFJO0tBQ2I7SUFDRCxrQkFBa0IsRUFBRTtRQUNsQixJQUFJLEVBQUUsTUFBTTtRQUNaLE1BQU0sRUFBRSxJQUFJO0tBQ2I7SUFDRCxVQUFVLEVBQUU7UUFDVixJQUFJLEVBQUUsT0FBTztRQUNiLE9BQU8sRUFBRSxLQUFLO0tBQ2Y7SUFDRCxXQUFXLEVBQUU7UUFDWCxJQUFJLEVBQUUsT0FBTztRQUNiLE9BQU8sRUFBRSxLQUFLO0tBQ2Y7SUFDRCxPQUFPLEVBQUU7UUFDUCxJQUFJLEVBQUUsQ0FBQyxNQUFNLENBQUM7UUFDZCxPQUFPLEVBQUUsRUFBRTtLQUNaO0lBQ0QsS0FBSyxFQUFFLFdBQVcsQ0FBQyxXQUFXO0lBQzlCLFlBQVksRUFBRSxNQUFNO0lBQ3BCLGlCQUFpQixFQUFFO1FBQ2pCLElBQUksRUFBRSxPQUFPO1FBQ2IsT0FBTyxFQUFFLEtBQUs7S0FDZjtDQUNGLEVBQUUsRUFBRSxVQUFVLEVBQUUsT0FBTyxFQUFFLENBQUMsQ0FBQztBQUU1QixNQUFNLENBQUMsTUFBTSxJQUFJLEdBQUcsUUFBUSxDQUFDLEtBQUssQ0FBQyxNQUFNLEVBQUUsVUFBVSxDQUFDLENBQUM7QUFFdkQsS0FBSyxVQUFVLFlBQVksQ0FBQyxFQUMxQixNQUFNLEVBQ04sTUFBTSxHQUlQO0lBQ0MsTUFBTSxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsR0FBRyxNQUFNLFdBQVcsQ0FBQyxZQUFZLENBQUM7UUFDckQsTUFBTTtRQUNOLEtBQUssRUFBRSxFQUFFLEdBQUcsRUFBRSxNQUFNLEVBQUU7UUFDdEIsTUFBTSxFQUFFLElBQUk7UUFDWixnQkFBZ0IsRUFBRSxZQUFZO0tBQy9CLENBQUMsQ0FBQztJQUVILElBQUksS0FBSyxFQUFFLENBQUM7UUFDVixPQUFPLEVBQUUsS0FBSyxFQUFFLENBQUM7SUFDbkIsQ0FBQztJQUVELE9BQU8sRUFBRSxJQUFJLEVBQUUsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxFQUFFLENBQUM7QUFDMUMsQ0FBQztBQUVELEtBQUssVUFBVSxRQUFRLENBQUMsRUFDdEIsS0FBSyxFQUNMLE1BQU0sR0FJUDtJQUNDLE1BQU0sRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLEdBQUcsTUFBTSxXQUFXLENBQUMsVUFBVSxDQUFDO1FBQ25ELEtBQUs7UUFDTCxNQUFNO1FBQ04sTUFBTSxFQUFFLElBQUk7S0FDYixDQUFDLENBQUM7SUFFSCxJQUFJLEtBQUssRUFBRSxDQUFDO1FBQ1YsT0FBTyxFQUFFLEtBQUssRUFBRSxDQUFDO0lBQ25CLENBQUM7SUFFRCxPQUFPO1FBQ0wsSUFBSSxFQUFFO1lBQ0osS0FBSyxFQUFFLElBQUksRUFBRSxPQUFPO1NBQ3JCO0tBQ0YsQ0FBQztBQUNKLENBQUM7QUFFRCxLQUFLLFVBQVUsT0FBTyxDQUFDLEVBQ3JCLEtBQUssR0FHTjtJQUNDLE1BQU0sRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLEdBQUcsTUFBTSxXQUFXLENBQUMsU0FBUyxDQUFDO1FBQ2xELEtBQUs7UUFDTCxNQUFNLEVBQUUsSUFBSTtLQUNiLENBQUMsQ0FBQztJQUVILElBQUksS0FBSyxFQUFFLENBQUM7UUFDVixPQUFPLEVBQUUsS0FBSyxFQUFFLENBQUM7SUFDbkIsQ0FBQztJQUVELElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7UUFDakIsT0FBTyxFQUFFLEtBQUssRUFBRSxJQUFJLFlBQVksQ0FBQyxZQUFZLENBQUMsRUFBRSxJQUFJLEVBQUUsUUFBUSxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQztJQUN0RyxDQUFDO0lBRUQsT0FBTyxFQUFFLElBQUksRUFBRSxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQztBQUN6QyxDQUFDO0FBRUQsS0FBSyxVQUFVLGFBQWEsQ0FBQyxFQUMzQixRQUFRLEVBQ1IsU0FBUyxHQUlWO0lBQ0MsSUFBSSxDQUFDLFFBQVEsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDO1FBQzVCLE9BQU8sRUFBRSxJQUFJLEVBQUUsRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsRUFBRSxDQUFDO0lBQ25ELENBQUM7SUFFRCxNQUFNLEtBQUssR0FBcUMsRUFBRSxDQUFDO0lBRW5ELElBQUksUUFBUSxJQUFJLFNBQVMsRUFBRSxDQUFDO1FBQzFCLEtBQUssQ0FBQyxHQUFHLEdBQUc7WUFDVixFQUFFLGtCQUFrQixFQUFFLFNBQVMsQ0FBQyxXQUFXLEVBQUUsRUFBRTtZQUMvQyxFQUFFLGlCQUFpQixFQUFFLFFBQVEsQ0FBQyxXQUFXLEVBQUUsRUFBRTtTQUM5QyxDQUFDO0lBQ0osQ0FBQztTQUFNLElBQUksUUFBUSxFQUFFLENBQUM7UUFDcEIsS0FBSyxDQUFDLGlCQUFpQixHQUFHLFFBQVEsQ0FBQyxXQUFXLEVBQUUsQ0FBQztJQUNuRCxDQUFDO1NBQU0sQ0FBQztRQUNOLEtBQUssQ0FBQyxrQkFBa0IsR0FBSSxTQUFvQixDQUFDLFdBQVcsRUFBRSxDQUFDO0lBQ2pFLENBQUM7SUFFRCxPQUFPLFdBQVcsQ0FBQyxlQUFlLENBQUM7UUFDakMsS0FBSztRQUNMLE1BQU0sRUFBRSxJQUFJO0tBQ2IsQ0FBQyxDQUFDO0FBQ0wsQ0FBQztBQUVELEtBQUssVUFBVSxVQUFVLENBQUMsRUFDeEIsSUFBSSxHQUdMO0lBQ0MsTUFBTSxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsR0FBRyxNQUFNLGFBQWEsQ0FBQztRQUMxQyxRQUFRLEVBQUUsSUFBSSxDQUFDLFFBQVE7UUFDdkIsU0FBUyxFQUFFLElBQUksQ0FBQyxTQUFTO0tBQzFCLENBQUMsQ0FBQztJQUVILElBQUksS0FBSyxFQUFFLENBQUM7UUFDVixPQUFPLEVBQUUsS0FBSyxFQUFFLENBQUM7SUFDbkIsQ0FBQztJQUVELElBQUksSUFBSSxFQUFFLE1BQU0sRUFBRSxDQUFDO1FBQ2pCLE9BQU8sRUFBRSxLQUFLLEVBQUUsSUFBSSxZQUFZLENBQUMsYUFBYSxDQUFDLEVBQUUsSUFBSSxFQUFFLFFBQVEsSUFBSSxDQUFDLFFBQVEsSUFBSSxJQUFJLENBQUMsU0FBUyxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUM7SUFDeEcsQ0FBQztJQUVELE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQztJQUN4QixVQUFVLENBQUMsaUJBQWlCLEdBQUcsVUFBVSxDQUFDLFFBQVEsRUFBRSxXQUFXLEVBQUUsQ0FBQztJQUNsRSxVQUFVLENBQUMsa0JBQWtCLEdBQUcsVUFBVSxDQUFDLFNBQVMsRUFBRSxXQUFXLEVBQUUsQ0FBQztJQUVwRSxNQUFNLEVBQUUsS0FBSyxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLEdBQUcsTUFBTSxXQUFXLENBQUMsVUFBVSxDQUFDO1FBQ3hFLE1BQU0sRUFBRSxJQUFJO1FBQ1osVUFBVSxFQUFFLElBQUk7UUFDaEIsVUFBVSxFQUFFLE1BQU07S0FDbkIsQ0FBQyxDQUFDO0lBRUgsSUFBSSxTQUFTLEVBQUUsQ0FBQztRQUNkLE9BQU8sRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFLENBQUM7SUFDOUIsQ0FBQztJQUVELE9BQU8sRUFBRSxJQUFJLEVBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxDQUFDLFdBQVcsRUFBRSxFQUFFLENBQUM7QUFDbEQsQ0FBQztBQUVELEtBQUssVUFBVSxVQUFVLENBQUMsRUFDeEIsTUFBTSxFQUNOLElBQUksRUFDSixPQUFPLEdBQUcsRUFBRSxHQU9iO0lBQ0MsTUFBTSxFQUNKLFFBQVEsRUFDUixTQUFTLEVBQ1QsWUFBWSxFQUNaLFVBQVUsRUFDVixXQUFXLEVBQ1gsaUJBQWlCLEdBQ2xCLEdBQUcsSUFBSSxDQUFDO0lBQ1QsTUFBTSxFQUFFLGlCQUFpQixFQUFFLEdBQUcsT0FBTyxDQUFDO0lBQ3RDLE1BQU0sTUFBTSxHQUFxQyxFQUFFLENBQUM7SUFDcEQsTUFBTSxHQUFHLEdBQTZDLEVBQUUsQ0FBQztJQUN6RCxNQUFNLEtBQUssR0FBK0MsRUFBRSxDQUFDO0lBRTdELE1BQU0sY0FBYyxHQUFHLEdBQUcsRUFBRTtRQUMxQixPQUFPLFlBQVksQ0FBQztZQUNsQixNQUFNO1lBQ04sTUFBTTtTQUNQLENBQUMsQ0FBQztJQUNMLENBQUMsQ0FBQztJQUVGLElBQUksaUJBQWlCLEVBQUUsQ0FBQztRQUN0QixLQUFLLENBQUMsWUFBWSxHQUFHLEVBQUUsQ0FBQztJQUMxQixDQUFDO1NBQU0sSUFBSSxZQUFZLEVBQUUsQ0FBQztRQUN4QixHQUFHLENBQUMsWUFBWSxHQUFHLFlBQVksQ0FBQztJQUNsQyxDQUFDO0lBRUQsSUFBSSxPQUFPLFVBQVUsS0FBSyxTQUFTLEVBQUUsQ0FBQztRQUNwQyxHQUFHLENBQUMsVUFBVSxHQUFHLFVBQVUsQ0FBQztJQUM5QixDQUFDO0lBQ0QsSUFBSSxPQUFPLFdBQVcsS0FBSyxTQUFTLEVBQUUsQ0FBQztRQUNyQyxHQUFHLENBQUMsV0FBVyxHQUFHLFdBQVcsQ0FBQztJQUNoQyxDQUFDO0lBQ0QsSUFBSSxPQUFPLGlCQUFpQixLQUFLLFNBQVMsRUFBRSxDQUFDO1FBQzNDLEdBQUcsQ0FBQyxpQkFBaUIsR0FBRyxpQkFBaUIsQ0FBQztJQUM1QyxDQUFDO0lBRUQsSUFBSSxRQUFRLEVBQUUsQ0FBQztRQUNiLEdBQUcsQ0FBQyxRQUFRLEdBQUcsUUFBUSxDQUFDO1FBQ3hCLEdBQUcsQ0FBQyxpQkFBaUIsR0FBRyxRQUFRLENBQUMsV0FBVyxFQUFFLENBQUM7SUFDakQsQ0FBQztJQUNELElBQUksU0FBUyxFQUFFLENBQUM7UUFDZCxHQUFHLENBQUMsU0FBUyxHQUFHLFNBQVMsQ0FBQztRQUMxQixHQUFHLENBQUMsa0JBQWtCLEdBQUcsU0FBUyxDQUFDLFdBQVcsRUFBRSxDQUFDO0lBQ25ELENBQUM7SUFFRCxJQUFJLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDO1FBQ2hDLE1BQU0sQ0FBQyxJQUFJLEdBQUcsR0FBRyxDQUFDO0lBQ3BCLENBQUM7SUFDRCxJQUFJLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDO1FBQ2xDLE1BQU0sQ0FBQyxNQUFNLEdBQUcsS0FBSyxDQUFDO0lBQ3hCLENBQUM7SUFFRCxJQUFJLFFBQVEsSUFBSSxTQUFTLEVBQUUsQ0FBQztRQUMxQixNQUFNLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxHQUFHLE1BQU0sYUFBYSxDQUFDO1lBQzFDLFNBQVM7WUFDVCxRQUFRO1NBQ1QsQ0FBQyxDQUFDO1FBRUgsSUFBSSxLQUFLLEVBQUUsQ0FBQztZQUNWLE9BQU8sRUFBRSxLQUFLLEVBQUUsQ0FBQztRQUNuQixDQUFDO1FBRUQsSUFBSSxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7WUFDaEIsT0FBTyxFQUFFLEtBQUssRUFBRSxJQUFJLFlBQVksQ0FBQyxhQUFhLENBQUMsRUFBRSxJQUFJLEVBQUUsWUFBWSxRQUFRLElBQUksU0FBUyxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUM7UUFDbEcsQ0FBQztRQUVELE9BQU8sY0FBYyxFQUFFLENBQUM7SUFDMUIsQ0FBQztJQUVELE9BQU8sY0FBYyxFQUFFLENBQUM7QUFDMUIsQ0FBQztBQUVELEtBQUssVUFBVSxjQUFjLENBQUMsRUFDNUIsSUFBSSxFQUNKLGVBQWUsR0FJaEI7SUFDQyxNQUFNLEtBQUssR0FBRyxXQUFXLENBQUMsZUFBZSxDQUFDLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztJQUVwRCxJQUFJLENBQUMsZUFBZSxFQUFFLENBQUM7UUFDckIsS0FBSyxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUM7SUFDMUIsQ0FBQztJQUVELE9BQU8sUUFBUSxDQUFDO1FBQ2QsS0FBSztLQUNOLENBQUMsQ0FBQztBQUNMLENBQUM7QUFFRCxLQUFLLFVBQVUsV0FBVyxDQUFDLEVBQ3pCLE1BQU0sR0FHUDtJQUNDLE9BQU8sT0FBTyxDQUFDO1FBQ2IsS0FBSyxFQUFFLEVBQUUsR0FBRyxFQUFFLE1BQU0sRUFBRTtLQUN2QixDQUFDLENBQUM7QUFDTCxDQUFDO0FBRUQsS0FBSyxVQUFVLFVBQVUsQ0FBQyxFQUN4QixNQUFNLEdBR1A7SUFDQyxPQUFPLFVBQVUsQ0FBQztRQUNoQixNQUFNO1FBQ04sSUFBSSxFQUFFLEVBQUUsVUFBVSxFQUFFLElBQUksRUFBRTtLQUMzQixDQUFDLENBQUM7QUFDTCxDQUFDO0FBRUQsS0FBSyxVQUFVLGNBQWMsQ0FBQyxFQUM1QixTQUFTLEVBQ1QsTUFBTSxHQUlQO0lBQ0MsT0FBTyxZQUFZLENBQUM7UUFDbEIsTUFBTTtRQUNOLE1BQU0sRUFBRSxFQUFFLFNBQVMsRUFBRSxFQUFFLE9BQU8sRUFBRSxFQUFFLEtBQUssRUFBRSxTQUFTLEVBQUUsRUFBRSxFQUFFO0tBQ3pELENBQUMsQ0FBQztBQUNMLENBQUM7QUFFRCxLQUFLLFVBQVUsaUJBQWlCLENBQUMsRUFDL0IsU0FBUyxFQUNULE1BQU0sR0FJUDtJQUNDLE9BQU8sWUFBWSxDQUFDO1FBQ2xCLE1BQU07UUFDTixNQUFNLEVBQUUsRUFBRSxLQUFLLEVBQUUsRUFBRSxPQUFPLEVBQUUsRUFBRSxHQUFHLEVBQUUsU0FBUyxFQUFFLEVBQUUsRUFBRTtLQUNuRCxDQUFDLENBQUM7QUFDTCxDQUFDO0FBRUQsZUFBZTtJQUNiLFVBQVU7SUFDVixjQUFjO0lBQ2QsVUFBVTtJQUNWLFdBQVc7SUFDWCxVQUFVO0lBQ1YsY0FBYztJQUNkLGlCQUFpQjtDQUNsQixDQUFDIn0=