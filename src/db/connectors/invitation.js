'use strict';
import mongoose from 'mongoose';
import errorCreator from '../../error/errorCreator';
import dbConnector from '../databaseConnector';
const invitationSchema = new mongoose.Schema(dbConnector.createSchema({
    receiverId: String,
    invitationType: String,
    itemId: String,
}), { collection: 'invitations' });
const Invitation = mongoose.model('Invitation', invitationSchema);
function getInvitations({ query, callback, }) {
    dbConnector.getObjects({
        query,
        object: Invitation,
        callback: ({ error, data, }) => {
            if (error) {
                callback({ error });
                return;
            }
            callback({
                data: {
                    invitations: data.objects,
                },
            });
        },
    });
}
function getInvitation({ query, callback, }) {
    dbConnector.getObject({
        query,
        object: Invitation,
        callback: ({ error, data, }) => {
            if (error) {
                callback({ error });
                return;
            }
            if (!data.object) {
                callback({ error: new errorCreator.DoesNotExist({ name: `invitation ${JSON.stringify(query, null, 4)}` }) });
                return;
            }
            callback({ data: { invitation: data.object } });
        },
    });
}
function doesInvitationExist({ itemId, receiverId, callback, }) {
    dbConnector.getObject({
        query: {
            itemId,
            receiverId,
        },
        object: Invitation,
        callback: ({ error, data, }) => {
            if (error) {
                callback({ error });
                return;
            }
            if (!data.object) {
                callback({ data: { exists: false } });
                return;
            }
            callback({ data: { exists: true } });
        },
    });
}
function createInvitation({ invitation, callback, }) {
    doesInvitationExist({
        itemId: invitation.itemId,
        receiverId: invitation.receiverId,
        callback: ({ error, data, }) => {
            if (error) {
                callback({
                    error: new errorCreator.Database({
                        errorObject: error,
                        name: 'createInvitation',
                    }),
                });
                return;
            }
            if (data.exists) {
                callback({ error: new errorCreator.AlreadyExists({ name: `invitation ${invitation.invitationType} ${invitation.itemId}` }) });
                return;
            }
            dbConnector.saveObject({
                object: new Invitation(invitation),
                objectType: 'invitation',
                callback: ({ error: invitationError, data: invitationData, }) => {
                    if (invitationError) {
                        callback({ error: invitationError });
                        return;
                    }
                    callback({ data: { invitation: invitationData.savedObject } });
                },
            });
        },
    });
}
function getInvitationById({ invitationId, callback, }) {
    getInvitations({
        callback,
        query: { _id: invitationId },
    });
}
function getInvitationsByReceiver({ user, callback, }) {
    getInvitations({
        callback,
        query: {
            $or: [
                { receiverId: user.objectId },
                { receiverId: { $in: user.aliases } },
            ],
        },
    });
}
function getInvitationsBySender({ senderId, callback, }) {
    getInvitations({
        callback,
        query: {
            $or: [
                { ownerId: senderId },
                { ownerAliasId: senderId },
            ],
        },
    });
}
function removeInvitation({ invitationId, callback, }) {
    dbConnector.removeObject({
        callback,
        object: Invitation,
        query: { _id: invitationId },
    });
}
function removeInvitationsByItemId({ itemId, callback, }) {
    const query = {
        itemId,
    };
    dbConnector.removeObjects({
        callback,
        query,
        object: Invitation,
    });
}
function useInvitation({ invitationId, callback, }) {
    getInvitation({
        query: { _id: invitationId },
        callback: ({ error, data, }) => {
            if (error) {
                callback({ error });
                return;
            }
            const { itemId, } = data.invitation;
            removeInvitationsByItemId({
                itemId,
                callback: ({ error: removeError }) => {
                    if (removeError) {
                        callback({ error: removeError });
                        return;
                    }
                    callback({ data });
                },
            });
        },
    });
}
export { createInvitation };
export { getInvitationsBySender };
export { getInvitationsByReceiver };
export { removeInvitation };
export { useInvitation };
export { getInvitationById };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW52aXRhdGlvbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImludml0YXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsWUFBWSxDQUFDO0FBRWIsT0FBTyxRQUFRLE1BQU0sVUFBVSxDQUFDO0FBQ2hDLE9BQU8sWUFBWSxNQUFNLDBCQUEwQixDQUFDO0FBQ3BELE9BQU8sV0FBVyxNQUFNLHNCQUFzQixDQUFDO0FBRS9DLE1BQU0sZ0JBQWdCLEdBQUcsSUFBSSxRQUFRLENBQUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxZQUFZLENBQUM7SUFDcEUsVUFBVSxFQUFFLE1BQU07SUFDbEIsY0FBYyxFQUFFLE1BQU07SUFDdEIsTUFBTSxFQUFFLE1BQU07Q0FDZixDQUFDLEVBQUUsRUFBRSxVQUFVLEVBQUUsYUFBYSxFQUFFLENBQUMsQ0FBQztBQUVuQyxNQUFNLFVBQVUsR0FBRyxRQUFRLENBQUMsS0FBSyxDQUFDLFlBQVksRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDO0FBU2xFLFNBQVMsY0FBYyxDQUFDLEVBQ3RCLEtBQUssRUFDTCxRQUFRLEdBQ1Q7SUFDQyxXQUFXLENBQUMsVUFBVSxDQUFDO1FBQ3JCLEtBQUs7UUFDTCxNQUFNLEVBQUUsVUFBVTtRQUNsQixRQUFRLEVBQUUsQ0FBQyxFQUNULEtBQUssRUFDTCxJQUFJLEdBQ0wsRUFBRSxFQUFFO1lBQ0gsSUFBSSxLQUFLLEVBQUUsQ0FBQztnQkFDVixRQUFRLENBQUMsRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDO2dCQUVwQixPQUFPO1lBQ1QsQ0FBQztZQUVELFFBQVEsQ0FBQztnQkFDUCxJQUFJLEVBQUU7b0JBQ0osV0FBVyxFQUFFLElBQUksQ0FBQyxPQUFPO2lCQUMxQjthQUNGLENBQUMsQ0FBQztRQUNMLENBQUM7S0FDRixDQUFDLENBQUM7QUFDTCxDQUFDO0FBU0QsU0FBUyxhQUFhLENBQUMsRUFDckIsS0FBSyxFQUNMLFFBQVEsR0FDVDtJQUNDLFdBQVcsQ0FBQyxTQUFTLENBQUM7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