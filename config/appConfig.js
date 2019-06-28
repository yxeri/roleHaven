const config = {};

config.routes = [
  { sitePath: '/api/calibrationMissions', filePath: '/routes/rest/bbr/calibrationMissions.js' },
  { sitePath: '/api/lanternStations', filePath: '/routes/rest/bbr/lanternStations.js' },
  { sitePath: '/api/lanternRounds', filePath: '/routes/rest/bbr/lanternRounds.js' },
  { sitePath: '/api/lanternTeams', filePath: '/routes/rest/bbr/lanternTeams.js' },
];

config.handlers = [
  '/routes/socketHandlers/bbr/calibrationMissions',
  '/routes/socketHandlers/bbr/lanternHacking',
];

config.hackingApiHost = process.env.HACKINGAPIHOST || '34.245.62.115';

module.exports = config;
