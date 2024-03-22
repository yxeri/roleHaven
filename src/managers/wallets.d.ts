declare function getWalletById({ walletId, token, internalCallUser, callback, needsAccess, }: {
    walletId: any;
    token: any;
    internalCallUser: any;
    callback: any;
    needsAccess: any;
}): void;
declare function updateWallet({ walletId, wallet, token, callback, io, internalCallUser, socket, options, }: {
    walletId: any;
    wallet: any;
    token: any;
    callback: any;
    io: any;
    internalCallUser: any;
    socket: any;
    options?: {} | undefined;
}): void;
declare function runTransaction({ transaction, callback, }: {
    transaction: any;
    callback: any;
}): void;
declare function checkAmount({ walletId, amount, callback, }: {
    walletId: any;
    amount: any;
    callback: any;
}): void;
declare function getWalletsByUser({ callback, token, }: {
    callback: any;
    token: any;
}): void;
declare function updateAccess({ token, walletId, teamAdminIds, userAdminIds, userIds, teamIds, bannedIds, shouldRemove, callback, }: {
    token: any;
    walletId: any;
    teamAdminIds: any;
    userAdminIds: any;
    userIds: any;
    teamIds: any;
    bannedIds: any;
    shouldRemove: any;
    callback: any;
}): void;
export { updateWallet };
export { getWalletById };
export { runTransaction };
export { checkAmount };
export { getWalletsByUser };
export { updateAccess };
