const config = {};
config.AccessLevels = {
    ANONYMOUS: 0,
    STANDARD: 1,
    PRIVILEGED: 2,
    MODERATOR: 3,
    ADMIN: 4,
    SUPERUSER: 5,
    GOD: 6,
};
config.customUserFields = [];
config.apiCommands = {};
config.apiCommands = {
    CancelCalibrationMission: {
        name: 'CancelCalibrationMission',
        accessLevel: config.AccessLevels.MODERATOR,
    },
    CompleteCalibrationMission: {
        name: 'CompleteCalibrationMission',
        accessLevel: config.AccessLevels.MODERATOR,
    },
    GetCalibrationMissions: {
        name: 'GetCalibrationMissions',
        accessLevel: config.AccessLevels.STANDARD,
    },
    GetCalibrationMission: {
        name: 'GetCalibrationMission',
        accessLevel: config.AccessLevels.STANDARD,
    },
    HackLantern: {
        name: 'HackLantern',
        accessLevel: config.AccessLevels.STANDARD,
    },
    CreateLanternStation: {
        name: 'CreateLanternStation',
        accessLevel: config.AccessLevels.MODERATOR,
    },
    DeleteLanternStation: {
        name: 'DeleteLanternStation',
        accessLevel: config.AccessLevels.MODERATOR,
    },
    UpdateLanternStation: {
        name: 'UpdateLanternStation',
        accessLevel: config.AccessLevels.MODERATOR,
    },
    StartLanternRound: {
        name: 'StartLanternRound',
        accessLevel: config.AccessLevels.MODERATOR,
    },
    GetLanternRound: {
        name: 'GetLanternRound',
        accessLevel: config.AccessLevels.ANONYMOUS,
    },
    GetLanternStations: {
        name: 'GetLanternStations',
        accessLevel: config.AccessLevels.ANONYMOUS,
    },
    CreateLanternTeam: {
        name: 'DeleteLanternTeam',
        accessLevel: config.AccessLevels.MODERATOR,
    },
    DeleteLanternTeam: {
        name: 'DeleteLanternTeam',
        accessLevel: config.AccessLevels.MODERATOR,
    },
    GetLanternTeam: {
        name: 'GetLanternTeam',
        accessLevel: config.AccessLevels.ANONYMOUS,
    },
    CreatePosition: {
        name: 'CreatePosition',
        accessLevel: Number(process.env.CREATEPOSITION || config.AccessLevels.PRIVILEGED),
    },
    CreateAlias: {
        name: 'CreateAlias',
        accessLevel: Number(process.env.CREATEALIASLEVEL || config.AccessLevels.STANDARD),
    },
    IncludeOff: config.apiCommands.IncludeOff || {
        name: 'IncludeOff',
        accessLevel: config.AccessLevels.MODERATOR,
    },
};
export default config;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGJDb25maWcuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJkYkNvbmZpZy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFFQSxNQUFNLE1BQU0sR0FBYSxFQUFjLENBQUM7QUFNeEMsTUFBTSxDQUFDLFlBQVksR0FBRztJQUNwQixTQUFTLEVBQUUsQ0FBQztJQUNaLFFBQVEsRUFBRSxDQUFDO0lBQ1gsVUFBVSxFQUFFLENBQUM7SUFDYixTQUFTLEVBQUUsQ0FBQztJQUNaLEtBQUssRUFBRSxDQUFDO0lBQ1IsU0FBUyxFQUFFLENBQUM7SUFDWixHQUFHLEVBQUUsQ0FBQztDQUNQLENBQUM7QUFFRixNQUFNLENBQUMsZ0JBQWdCLEdBQUcsRUFBRSxDQUFDO0FBRTdCLE1BQU0sQ0FBQyxXQUFXLEdBQUcsRUFBRSxDQUFDO0FBQ3hCLE1BQU0sQ0FBQyxXQUFXLEdBQUc7SUFJbkIsd0JBQXdCLEVBQUU7UUFDeEIsSUFBSSxFQUFFLDBCQUEwQjtRQUNoQyxXQUFXLEVBQUUsTUFBTSxDQUFDLFlBQVksQ0FBQyxTQUFTO0tBQzNDO0lBQ0QsMEJBQTBCLEVBQUU7UUFDMUIsSUFBSSxFQUFFLDRCQUE0QjtRQUNsQyxXQUFXLEVBQUUsTUFBTSxDQUFDLFlBQVksQ0FBQyxTQUFTO0tBQzNDO0lBQ0Qsc0JBQXNCLEVBQUU7UUFDdEIsSUFBSSxFQUFFLHdCQUF3QjtRQUM5QixXQUFXLEVBQUUsTUFBTSxDQUFDLFlBQVksQ0FBQyxRQUFRO0tBQzFDO0lBQ0QscUJBQXFCLEVBQUU7UUFDckIsSUFBSSxFQUFFLHVCQUF1QjtRQUM3QixXQUFXLEVBQUUsTUFBTSxDQUFDLFlBQVksQ0FBQyxRQUFRO0tBQzFDO0lBSUQsV0FBVyxFQUFFO1FBQ1gsSUFBSSxFQUFFLGFBQWE7UUFDbkIsV0FBVyxFQUFFLE1BQU0sQ0FBQyxZQUFZLENBQUMsUUFBUTtLQUMxQztJQUlELG9CQUFvQixFQUFFO1FBQ3BCLElBQUksRUFBRSxzQkFBc0I7UUFDNUIsV0FBVyxFQUFFLE1BQU0sQ0FBQyxZQUFZLENBQUMsU0FBUztLQUMzQztJQUNELG9CQUFvQixFQUFFO1FBQ3BCLElBQUksRUFBRSxzQkFBc0I7UUFDNUIsV0FBVyxFQUFFLE1BQU0sQ0FBQyxZQUFZLENBQUMsU0FBUztLQUMzQztJQUNELG9CQUFvQixFQUFFO1FBQ3BCLElBQUksRUFBRSxzQkFBc0I7UUFDNUIsV0FBVyxFQUFFLE1BQU0sQ0FBQyxZQUFZLENBQUMsU0FBUztLQUMzQztJQUNELGlCQUFpQixFQUFFO1FBQ2pCLElBQUksRUFBRSxtQkFBbUI7UUFDekIsV0FBVyxFQUFFLE1BQU0sQ0FBQyxZQUFZLENBQUMsU0FBUztLQUMzQztJQUNELGVBQWUsRUFBRTtRQUNmLElBQUksRUFBRSxpQkFBaUI7UUFDdkIsV0FBVyxFQUFFLE1BQU0sQ0FBQyxZQUFZLENBQUMsU0FBUztLQUMzQztJQUNELGtCQUFrQixFQUFFO1FBQ2xCLElBQUksRUFBRSxvQkFBb0I7UUFDMUIsV0FBVyxFQUFFLE1BQU0sQ0FBQyxZQUFZLENBQUMsU0FBUztLQUMzQztJQUlELGlCQUFpQixFQUFFO1FBQ2pCLElBQUksRUFBRSxtQkFBbUI7UUFDekIsV0FBVyxFQUFFLE1BQU0sQ0FBQyxZQUFZLENBQUMsU0FBUztLQUMzQztJQUNELGlCQUFpQixFQUFFO1FBQ2pCLElBQUksRUFBRSxtQkFBbUI7UUFDekIsV0FBVyxFQUFFLE1BQU0sQ0FBQyxZQUFZLENBQUMsU0FBUztLQUMzQztJQUNELGNBQWMsRUFBRTtRQUNkLElBQUksRUFBRSxnQkFBZ0I7UUFDdEIsV0FBVyxFQUFFLE1BQU0sQ0FBQyxZQUFZLENBQUMsU0FBUztLQUMzQztJQUlELGNBQWMsRUFBRTtRQUNkLElBQUksRUFBRSxnQkFBZ0I7UUFDdEIsV0FBVyxFQUFFLE1BQU0sQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLGNBQWMsSUFBSSxNQUFNLENBQUMsWUFBWSxDQUFDLFVBQVUsQ0FBQztLQUNsRjtJQUlELFdBQVcsRUFBRTtRQUNYLElBQUksRUFBRSxhQUFhO1FBQ25CLFdBQVcsRUFBRSxNQUFNLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxnQkFBZ0IsSUFBSSxNQUFNLENBQUMsWUFBWSxDQUFDLFFBQVEsQ0FBQztLQUNsRjtJQUlELFVBQVUsRUFBRSxNQUFNLENBQUMsV0FBVyxDQUFDLFVBQVUsSUFBSTtRQUMzQyxJQUFJLEVBQUUsWUFBWTtRQUNsQixXQUFXLEVBQUUsTUFBTSxDQUFDLFlBQVksQ0FBQyxTQUFTO0tBQzNDO0NBQ0YsQ0FBQztBQUVGLGVBQWUsTUFBTSxDQUFDIn0=