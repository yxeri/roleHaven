'use strict';

const config = {};

config.publicBase = 'public';
config.privateBase = 'private';

// Will be appended to the public/private base path
config.paths = {
    views : 'views',
    styles : 'styles',
    scripts : 'scripts'
};

config.logLevel = 'tiny';

config.dbHost = 'localhost';
config.dbPort = 27017;
config.dbName = 'bbr2';

module.exports = config;