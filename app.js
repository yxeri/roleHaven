'use strict';

const express = require('express');
const socketIo = require('socket.io');
const path = require('path');
const logger = require('morgan');
const compression = require('compression');
const fs = require('fs');
const minifier = require('./minifier.js');
const manager = require('./manager.js');
const app = express();
// TODO: This should be moved
const eventsFunc = function(io) {
    manager.getPassedEvents(function(err, events) {
        if(err) {
            console.log('Failed to get events', err);
        } else if(events.length > 1) {
            for(let i = 0; i < events.length; i++) {

            }
        }
    });
};

app.io = socketIo();

// view engine setup
app.set('views', path.join(__dirname, 'public', 'views'));
app.set('view engine', 'html');
app.engine('html', require('hbs').__express);

app.use(compression());
app.use(logger('dev')); //TODO: process.env.LOGGINGLEVEL || 'tiny'
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', require('./routes/index')(app.io));

manager.populateDb();

/// catch 404 and forward to error handler
app.use(function(req, res, next) {
    const err = new Error('Not Found');
    err.status = 404;
    next(err);
});

/// error handlers

// development error handler
// will print stacktrace
if(app.get('env') === 'development') {
    app.use(function(err, req, res) {
        res.status(err.status || 500);
        res.render('error', {
            message : err.message,
            error : err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res) {
    res.status(err.status || 500);
    res.render('error', {
        message : err.message,
        error : {}
    });
});

setInterval(eventsFunc, 1000, app.io);

//TODO remove hardcoded paths
function watchPrivate() {
    // fs.watch is unstable. Recursive only works in OS X.
    fs.watch('private', { persistant : true, recursive : true },
             function(triggeredEvent, filePath) {
        const fullPath = path.join('private', filePath);

        if((triggeredEvent === 'rename' || triggeredEvent === 'change') &&
           path.extname(fullPath) !== '.tmp' && fullPath.indexOf('___') < 0) {
            fs.readFile(fullPath, function(err) {
                if(err) {
                    throw err;
                }

                minifier.minifyFile(fullPath, path.join('public', filePath));
                console.log('Event:', triggeredEvent, '. File:', fullPath);
            });
        }
    });
}

watchPrivate();

module.exports = app;
