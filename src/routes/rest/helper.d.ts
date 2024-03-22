declare function sendMessage({ request, response, io, }: {
    request: any;
    response: any;
    io: any;
}): void;
declare function getMessages({ request, response, }: {
    request: any;
    response: any;
}): void;
declare function getForumPosts({ request, response, }: {
    request: any;
    response: any;
}): void;
declare function getForumThreads({ request, response, }: {
    request: any;
    response: any;
}): void;
declare function createForumPost({ request, response, io, }: {
    request: any;
    response: any;
    io: any;
}): void;
declare function createThread({ request, response, io, }: {
    request: any;
    response: any;
    io: any;
}): void;
export { sendMessage };
export { createForumPost };
export { getMessages };
export { getForumPosts };
export { getForumThreads };
export { createThread };
