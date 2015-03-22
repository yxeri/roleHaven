var express = require('express');
var router = express.Router();

function handle(io) {
	router.get('/', function(req, res) {
		res.render('index', { title: 'Express' });
	});

	io.on('connection', function(socket){
		console.log('a user connected');
	});

    return router;
}

module.exports = handle;