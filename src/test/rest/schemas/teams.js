'use strict';
const tools = require('../helper/tools');
const schemas = {};
schemas.team = tools.buildLiteSchema({
    type: 'object',
    required: [
        'teamName',
        'shortName',
    ],
    properties: {
        teamName: { type: 'string' },
        shortName: { type: 'string' },
        isVerified: { type: 'boolean' },
        isProtected: { type: 'boolean' },
    },
});
schemas.fullTeam = tools.buildFullSchema({
    type: 'object',
    required: [
        'teamName',
        'shortName',
    ],
    properties: {
        teamName: { type: 'string' },
        shortName: { type: 'string' },
        isVerified: { type: 'boolean' },
        isProtected: { type: 'boolean' },
    },
});
schemas.teams = {
    type: 'array',
    items: schemas.team,
};
schemas.fullTeams = {
    type: 'array',
    items: schemas.fullTeam,
};
export default schemas;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVhbXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJ0ZWFtcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxZQUFZLENBQUM7QUFFYixNQUFNLEtBQUssR0FBRyxPQUFPLENBQUMsaUJBQWlCLENBQUMsQ0FBQztBQUV6QyxNQUFNLE9BQU8sR0FBRyxFQUFFLENBQUM7QUFFbkIsT0FBTyxDQUFDLElBQUksR0FBRyxLQUFLLENBQUMsZUFBZSxDQUFDO0lBQ25DLElBQUksRUFBRSxRQUFRO0lBQ2QsUUFBUSxFQUFFO1FBQ1IsVUFBVTtRQUNWLFdBQVc7S0FDWjtJQUNELFVBQVUsRUFBRTtRQUNWLFFBQVEsRUFBRSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUU7UUFDNUIsU0FBUyxFQUFFLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRTtRQUM3QixVQUFVLEVBQUUsRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFO1FBQy9CLFdBQVcsRUFBRSxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUU7S0FDakM7Q0FDRixDQUFDLENBQUM7QUFFSCxPQUFPLENBQUMsUUFBUSxHQUFHLEtBQUssQ0FBQyxlQUFlLENBQUM7SUFDdkMsSUFBSSxFQUFFLFFBQVE7SUFDZCxRQUFRLEVBQUU7UUFDUixVQUFVO1FBQ1YsV0FBVztLQUNaO0lBQ0QsVUFBVSxFQUFFO1FBQ1YsUUFBUSxFQUFFLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRTtRQUM1QixTQUFTLEVBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFO1FBQzdCLFVBQVUsRUFBRSxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUU7UUFDL0IsV0FBVyxFQUFFLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRTtLQUNqQztDQUNGLENBQUMsQ0FBQztBQUVILE9BQU8sQ0FBQyxLQUFLLEdBQUc7SUFDZCxJQUFJLEVBQUUsT0FBTztJQUNiLEtBQUssRUFBRSxPQUFPLENBQUMsSUFBSTtDQUNwQixDQUFDO0FBRUYsT0FBTyxDQUFDLFNBQVMsR0FBRztJQUNsQixJQUFJLEVBQUUsT0FBTztJQUNiLEtBQUssRUFBRSxPQUFPLENBQUMsUUFBUTtDQUN4QixDQUFDO0FBRUYsZUFBZSxPQUFPLENBQUMifQ==