declare function createTestCreate({ testData, objectType, apiPath, schema, createByAdmin, checkDuplicate, }: {
    testData: any;
    objectType: any;
    apiPath: any;
    schema: any;
    createByAdmin: any;
    checkDuplicate?: boolean | undefined;
}): void;
declare function createTestUpdate({ testData, objectType, objectIdType, apiPath, schema, createByAdmin, skipCreation, }: {
    testData: any;
    objectType: any;
    objectIdType: any;
    apiPath: any;
    schema: any;
    createByAdmin: any;
    skipCreation?: boolean | undefined;
}): void;
declare function createTestDelete({ testData, objectType, objectIdType, apiPath, skipCreation, skipOwner, createByAdmin, }: {
    testData: any;
    objectType: any;
    objectIdType: any;
    apiPath: any;
    skipCreation: any;
    skipOwner: any;
    createByAdmin: any;
}): void;
declare function createTestGet({ testData, objectType, objectsType, objectIdType, apiPath, singleLiteSchema, multiLiteSchema, singleFullSchema, multiFullSchema, createByAdmin, skipCreation, }: {
    testData: any;
    objectType: any;
    objectsType: any;
    objectIdType: any;
    apiPath: any;
    singleLiteSchema: any;
    multiLiteSchema: any;
    singleFullSchema: any;
    multiFullSchema: any;
    createByAdmin?: boolean | undefined;
    skipCreation?: boolean | undefined;
}): void;
export { createTestGet };
export { createTestDelete };
export { createTestCreate };
export { createTestUpdate };
