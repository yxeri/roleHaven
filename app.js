var express = require('express');
var socketIo = require('socket.io');
var path = require('path');
// var favicon = require('static-favicon');
var logger = require('morgan');
var compression = require('compression');
// var cookieParser = require('cookie-parser');
// var bodyParser = require('body-parser');

var app = express();
app.io = socketIo();

var routes = require('./routes/index')(app.io);

// view engine setup
app.set('views', path.join(__dirname, 'public', 'views'));
app.set('view engine', 'html');
app.engine('html', require('hbs').__express);

app.use(compression());
// app.use(favicon());
app.use(logger('dev')); //TODO: process.env.LOGGINGLEVEL || 'tiny'
// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded());
// app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);

/// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

/// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});


module.exports = app;
