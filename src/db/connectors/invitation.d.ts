declare function createInvitation({ invitation, callback, }: {
    invitation: any;
    callback: any;
}): void;
declare function getInvitationById({ invitationId, callback, }: {
    invitationId: any;
    callback: any;
}): void;
declare function getInvitationsByReceiver({ user, callback, }: {
    user: any;
    callback: any;
}): void;
declare function getInvitationsBySender({ senderId, callback, }: {
    senderId: any;
    callback: any;
}): void;
declare function removeInvitation({ invitationId, callback, }: {
    invitationId: any;
    callback: any;
}): void;
declare function useInvitation({ invitationId, callback, }: {
    invitationId: any;
    callback: any;
}): void;
export { createInvitation };
export { getInvitationsBySender };
export { getInvitationsByReceiver };
export { removeInvitation };
export { useInvitation };
export { getInvitationById };
