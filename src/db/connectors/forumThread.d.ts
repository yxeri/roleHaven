import { BaseSchema, ImageSchema } from 'src/db/databaseConnector.js';
export type ForumThreadSchema = BaseSchema & {
    forumId: string;
    title: string;
    text: string[];
    postIds: string[];
    likes: number;
    dislikes: number;
    images: ImageSchema[];
};
declare function createThread({ thread, callback, }: {
    thread: any;
    callback: any;
}): void;
declare function getThreadById({ threadId, callback, }: {
    threadId: any;
    callback: any;
}): void;
declare function getThreadsByForum({ forumId, callback, }: {
    forumId: any;
    callback: any;
}): void;
declare function getThreadsByForums({ forumIds, callback, }: {
    forumIds: any;
    callback: any;
}): void;
declare function updateThread({ threadId, thread, callback, options, }: {
    threadId: any;
    thread: any;
    callback: any;
    options?: {} | undefined;
}): void;
declare function removeThreads({ threadIds, fullRemoval, callback, }: {
    threadIds: any;
    fullRemoval: any;
    callback: any;
}): void;
declare function removeThread({ threadId, fullRemoval, callback, }: {
    threadId: any;
    fullRemoval: any;
    callback: any;
}): void;
declare function removeThreadsByForum({ forumId, fullRemoval, callback, }: {
    forumId: any;
    fullRemoval: any;
    callback: any;
}): void;
declare function updateAccess(params: any): void;
declare function getAllThreads({ callback }: {
    callback: any;
}): void;
declare function getThreadsByUser({ user, callback, }: {
    user: any;
    callback: any;
}): void;
export { createThread };
export { getThreadById };
export { getThreadsByForum };
export { getThreadsByForums };
export { removeThreads };
export { updateThread };
export { removeThreadsByForum };
export { updateAccess };
export { getAllThreads };
export { removeThread };
export { getThreadsByUser };
