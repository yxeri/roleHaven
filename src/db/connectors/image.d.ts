declare function updateImage({ imageId, image, callback, options, }: {
    imageId: any;
    image: any;
    callback: any;
    options?: {} | undefined;
}): void;
declare function createImage({ image, callback, }: {
    image: any;
    callback: any;
}): void;
declare function updateAccess(params: any): void;
declare function getAllImages({ callback }: {
    callback: any;
}): void;
declare function getImagesByUser({ userId, callback, }: {
    userId: any;
    callback: any;
}): void;
declare function getImageById({ imageId, callback, }: {
    imageId: any;
    callback: any;
}): void;
declare function removeImage({ imageId, callback, }: {
    imageId: any;
    callback: any;
}): void;
export { updateAccess };
export { updateImage };
export { getAllImages as getAllDevices };
export { createImage as createDevice };
export { getImagesByUser };
export { getImageById as getDeviceById };
export { removeImage };
