'use strict';

const config = {};

// Relative to Node application dir
config.publicBase = 'public';
config.privateBase = 'private';

// Will be appended to the public/private base path
config.paths = {
  views : 'views',
  styles : 'styles',
  scripts : 'scripts',
  favicon : 'images/favicon.ico'
};

// Morgan log level
config.logLevel = process.env.LOGLEVEL || 'tiny';

// MongoDB host name
config.dbHost = process.env.DBHOST || 'localhost';

// MongoDB port
config.dbPort = process.env.DBPORT || 27017;

// MongoDB database name
config.dbName = process.env.DBNAME || 'bbr2';

// Node server port number
config.port = process.env.PORT || 8888;

config.mode = process.env.MODE || 'prod';

config.gameLocation = {
  country : 'Sweden',
  lat : '59.751429',
  lon : '15.198645'
};

config.historyLines = 30;

config.chunkLength = 10;

config.userVerify = false;

module.exports = config;