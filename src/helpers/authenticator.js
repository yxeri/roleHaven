import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { appConfig, dbConfig } from '../config/defaults/config';
import dbUser from '../db/connectors/user';
import errorCreator from '../error/errorCreator';
function createToken({ username, userId, password, callback, }) {
    if (!appConfig.jsonKey) {
        callback({ error: new errorCreator.Internal({ name: 'json key not set' }) });
        return;
    }
    dbUser.getUserById({
        userId,
        username,
        getPassword: true,
        callback: ({ error, data, }) => {
            if (error) {
                callback({ error });
                return;
            }
            const { user } = data;
            if (user.isBanned) {
                callback({ error: new errorCreator.Banned({ name: `user ${user.username}` }) });
                return;
            }
            if (!user.isVerified) {
                callback({ error: new errorCreator.NeedsVerification({ name: user.username }) });
                return;
            }
            bcrypt.compare(password, user.password, (hashError, result) => {
                if (hashError) {
                    callback({ error: new errorCreator.Internal({ errorObject: hashError }) });
                    return;
                }
                if (!result) {
                    callback({ error: new errorCreator.NotAllowed({ name: `user ${user.username} wrong password` }) });
                    return;
                }
                const jwtUser = { userId: user.objectId };
                user.password = true;
                jwt.sign({ data: jwtUser }, appConfig.jsonKey, (err, token) => {
                    if (err) {
                        callback({
                            error: new errorCreator.Internal({
                                name: 'jwt',
                                errorObject: err,
                            }),
                        });
                        return;
                    }
                    callback({
                        data: {
                            token,
                            user,
                        },
                    });
                });
            });
        },
    });
}
function isUserAllowed({ commandName, token, internalCallUser, callback, }) {
    const commandUsed = dbConfig.apiCommands[commandName];
    const anonUser = dbConfig.anonymousUser;
    if (internalCallUser) {
        callback({ data: { user: internalCallUser } });
        return;
    }
    if (!commandUsed) {
        callback({ error: new errorCreator.DoesNotExist({ name: commandName }) });
        return;
    }
    if (!token) {
        if (commandUsed.accessLevel > anonUser.accessLevel) {
            callback({
                error: new errorCreator.NotAllowed({
                    name: commandName,
                    verbose: false,
                }),
            });
            return;
        }
        callback({ data: { user: anonUser } });
        return;
    }
    jwt.verify(token, appConfig.jsonKey, (err, decoded) => {
        if (err || !decoded) {
            callback({ error: new errorCreator.NotAllowed({ name: commandName }) });
            return;
        }
        const { userId } = decoded.data;
        dbUser.getUserById({
            userId,
            callback: ({ error, data, }) => {
                if (error) {
                    callback({ error });
                    return;
                }
                const { user } = data;
                const { accessLevel } = commandUsed;
                if (user.isBanned || !user.isVerified || accessLevel > user.accessLevel) {
                    callback({ error: new errorCreator.NotAllowed({ name: commandName }) });
                    return;
                }
                callback({ data: { user } });
            },
        });
    });
}
function isAllowedAccessLevel({ objectToCreate, toAuth, }) {
    return (!objectToCreate.accessLevel || toAuth.accessLevel >= objectToCreate.accessLevel) || (!objectToCreate.visibility || toAuth.accessLevel >= objectToCreate.visibility);
}
function hasAccessTo({ objectToAccess, toAuth, }) {
    const { teamIds = [], userIds = [], userAdminIds = [], teamAdminIds = [], ownerId, ownerAliasId, isPublic, visibility, } = objectToAccess;
    const { hasFullAccess, accessLevel, objectId: authUserId, teamIds: authTeamIds = [], aliases = [], } = toAuth;
    const foundOwnerAlias = ownerAliasId && aliases.find((aliasId) => aliasId === ownerAliasId);
    const userHasAccess = userIds.concat([ownerId])
        .includes(authUserId);
    const teamHasAccess = teamIds.find((teamId) => authTeamIds.includes(teamId));
    const aliasHasAccess = foundOwnerAlias || aliases.find((aliasId) => userIds.includes(aliasId));
    const userHasAdminAccess = userAdminIds.includes(authUserId);
    const aliasHasAdminAccess = foundOwnerAlias || aliases.find((aliasId) => userAdminIds.includes(aliasId));
    const teamHasAdminAccess = teamAdminIds.find((adminId) => authTeamIds.includes(adminId));
    const isAdmin = ownerId === authUserId || hasFullAccess || accessLevel >= dbConfig.AccessLevels.ADMIN;
    return {
        canSee: isAdmin || isPublic || userHasAccess || teamHasAccess || aliasHasAccess || accessLevel >= visibility,
        hasAccess: isAdmin || isPublic || userHasAccess || teamHasAccess || aliasHasAccess,
        hasFullAccess: isAdmin || userHasAdminAccess || teamHasAdminAccess || aliasHasAdminAccess,
    };
}
export { isUserAllowed };
export { createToken };
export { hasAccessTo };
export { isAllowedAccessLevel };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXV0aGVudGljYXRvci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImF1dGhlbnRpY2F0b3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxNQUFNLE1BQU0sUUFBUSxDQUFDO0FBQzVCLE9BQU8sR0FBRyxNQUFNLGNBQWMsQ0FBQztBQUMvQixPQUFPLEVBQUUsU0FBUyxFQUFFLFFBQVEsRUFBRSxNQUFNLDJCQUEyQixDQUFDO0FBQ2hFLE9BQU8sTUFBTSxNQUFNLHVCQUF1QixDQUFDO0FBQzNDLE9BQU8sWUFBWSxNQUFNLHVCQUF1QixDQUFDO0FBVWpELFNBQVMsV0FBVyxDQUFDLEVBQ25CLFFBQVEsRUFDUixNQUFNLEVBQ04sUUFBUSxFQUNSLFFBQVEsR0FDVDtJQUNDLElBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDdkIsUUFBUSxDQUFDLEVBQUUsS0FBSyxFQUFFLElBQUksWUFBWSxDQUFDLFFBQVEsQ0FBQyxFQUFFLElBQUksRUFBRSxrQkFBa0IsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBRTdFLE9BQU87SUFDVCxDQUFDO0lBRUQsTUFBTSxDQUFDLFdBQVcsQ0FBQztRQUNqQixNQUFNO1FBQ04sUUFBUTtRQUNSLFdBQVcsRUFBRSxJQUFJO1FBQ2pCLFFBQVEsRUFBRSxDQUFDLEVBQ1QsS0FBSyxFQUNMLElBQUksR0FDTCxFQUFFLEVBQUU7WUFDSCxJQUFJLEtBQUssRUFBRSxDQUFDO2dCQUNWLFFBQVEsQ0FBQyxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUM7Z0JBRXBCLE9BQU87WUFDVCxDQUFDO1lBRUQsTUFBTSxFQUFFLElBQUksRUFBRSxHQUFHLElBQUksQ0FBQztZQUV0QixJQUFJLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztnQkFDbEIsUUFBUSxDQUFDLEVBQUUsS0FBSyxFQUFFLElBQUksWUFBWSxDQUFDLE1BQU0sQ0FBQyxFQUFFLElBQUksRUFBRSxRQUFRLElBQUksQ0FBQyxRQUFRLEVB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