'use strict';
const tools = require('../helper/tools');
const schemas = {};
schemas.alias = tools.buildLiteSchema({
    type: 'object',
    required: [
        'aliasName',
    ],
    properties: {
        aliasName: { type: 'string' },
        aliasNameLowerCase: { type: 'string' },
    },
});
schemas.fullAlias = tools.buildFullSchema({
    type: 'object',
    required: [
        'aliasName',
    ],
    properties: {
        aliasName: { type: 'string' },
        aliasNameLowerCase: { type: 'string' },
    },
});
schemas.aliases = {
    type: 'array',
    items: schemas.alias,
};
schemas.fullAliases = {
    type: 'array',
    items: schemas.fullAlias,
};
export default schemas;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWxpYXNlcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImFsaWFzZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsWUFBWSxDQUFDO0FBRWIsTUFBTSxLQUFLLEdBQUcsT0FBTyxDQUFDLGlCQUFpQixDQUFDLENBQUM7QUFFekMsTUFBTSxPQUFPLEdBQUcsRUFBRSxDQUFDO0FBRW5CLE9BQU8sQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDLGVBQWUsQ0FBQztJQUNwQyxJQUFJLEVBQUUsUUFBUTtJQUNkLFFBQVEsRUFBRTtRQUNSLFdBQVc7S0FDWjtJQUNELFVBQVUsRUFBRTtRQUNWLFNBQVMsRUFBRSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUU7UUFDN0Isa0JBQWtCLEVBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFO0tBQ3ZDO0NBQ0YsQ0FBQyxDQUFDO0FBRUgsT0FBTyxDQUFDLFNBQVMsR0FBRyxLQUFLLENBQUMsZUFBZSxDQUFDO0lBQ3hDLElBQUksRUFBRSxRQUFRO0lBQ2QsUUFBUSxFQUFFO1FBQ1IsV0FBVztLQUNaO0lBQ0QsVUFBVSxFQUFFO1FBQ1YsU0FBUyxFQUFFLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRTtRQUM3QixrQkFBa0IsRUFBRSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUU7S0FDdkM7Q0FDRixDQUFDLENBQUM7QUFFSCxPQUFPLENBQUMsT0FBTyxHQUFHO0lBQ2hCLElBQUksRUFBRSxPQUFPO0lBQ2IsS0FBSyxFQUFFLE9BQU8sQ0FBQyxLQUFLO0NBQ3JCLENBQUM7QUFFRixPQUFPLENBQUMsV0FBVyxHQUFHO0lBQ3BCLElBQUksRUFBRSxPQUFPO0lBQ2IsS0FBSyxFQUFFLE9BQU8sQ0FBQyxTQUFTO0NBQ3pCLENBQUM7QUFDRixlQUFlLE9BQU8sQ0FBQyJ9