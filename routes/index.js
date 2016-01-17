var express = require('express');
var router = express.Router();


module.exports.getRouter = function(io){

	router.get('/', function(req, res, next) {
		res.render('index.html');
	});

	io.on('connection', function(socket){

	});

	return router;
};
