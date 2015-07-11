'use strict';

const config = {};

// Relative to Node application dir
config.publicBase = 'public';
config.privateBase = 'private';

// Will be appended to the public/private base path
config.paths = {
  views : 'views',
  styles : 'styles',
  scripts : 'scripts'
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

config.mode = process.env.MODE || 'dev';

module.exports = config;