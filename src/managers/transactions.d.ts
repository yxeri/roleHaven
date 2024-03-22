declare function getTransactionById({ transactionId, token, internalCallUser, callback, }: {
    transactionId: any;
    token: any;
    internalCallUser: any;
    callback: any;
}): void;
declare function getTransactionsByWallet({ walletId, token, callback, }: {
    walletId: any;
    token: any;
    callback: any;
}): void;
declare function createTransaction({ transaction, io, socket, callback, }: {
    transaction: any;
    io: any;
    socket: any;
    callback: any;
}): void;
declare function createTransactionBasedOnToken({ transaction, io, token, socket, callback, }: {
    transaction: any;
    io: any;
    token: any;
    socket: any;
    callback: any;
}): void;
declare function removeTransaction({ token, transactionId, callback, io, }: {
    token: any;
    transactionId: any;
    callback: any;
    io: any;
}): void;
declare function updateTransaction({ token, transaction, transactionId, options, callback, io, socket, }: {
    token: any;
    transaction: any;
    transactionId: any;
    options: any;
    callback: any;
    io: any;
    socket: any;
}): void;
declare function getTransactionsByUser({ token, callback, }: {
    token: any;
    callback: any;
}): void;
export { createTransactionBasedOnToken };
export { getTransactionsByWallet };
export { createTransaction };
export { getTransactionById };
export { removeTransaction };
export { updateTransaction };
export { getTransactionsByUser };
