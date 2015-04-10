var express = require('express');
var router = express.Router();
var debug = require('debug')('server:files');

var files = require('../bin/resources');

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.json(files);
  debug(JSON.stringify(files));
});

router.param('id', function(req, res, next, id) {
	files.forEach(function(file) {
		if(file.id === id) {
			req.file = file;
			next();
		}
	});

	if(!req.file) {
		var err = new Error('Not Found');
  	err.status = 404;
  	next(err);
	}
});

router.get('/:id', function(req, res, next) {
	res.json(req.file);
	debug(JSON.stringify(req.file));
});

module.exports = router;
