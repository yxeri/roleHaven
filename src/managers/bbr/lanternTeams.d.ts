declare function getLanternTeams({ token, callback, }: {
    token: any;
    callback: any;
}): void;
declare function deleteLanternTeam({ token, teamId, callback, }: {
    token: any;
    teamId: any;
    callback: any;
}): void;
declare function createLanternTeam({ io, team, token, callback, }: {
    io: any;
    team: any;
    token: any;
    callback: any;
}): void;
declare function updateLanternTeam({ teamId, io, team, token, callback, }: {
    teamId: any;
    io: any;
    team: any;
    token: any;
    callback: any;
}): void;
export { deleteLanternTeam };
export { getLanternTeams };
export { createLanternTeam };
export { updateLanternTeam };
