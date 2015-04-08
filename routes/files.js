var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.json(files);
});

router.param('id', function(req, res, next, id) {
	files.forEach(function(file) {
		if(file.id === id) {
			req.file = file;
			next();
		}
	})
});

router.get('/:id', function(req, res, next) {
	res.json(req.file);
});

var files = [
	{
		"id": "c4580a1bff257c7f956e7e8239cbce9f",
		"name": "Sintel HD 1080p",
		"candidades": [
			{
				"url": "http://ftp.nluug.nl/pub/graphics/blender/demo/movies/Sintel.2010.1080p.mkv",
				"priority": 0
			},
			{
				"url": "http://ftp.halifax.rwth-aachen.de/blender/demo/movies/Sintel.2010.1080p.mkv",
				"priority": 1
			},
			{
				"url": "http://download.blender.org/demo/movies/Sintel.2010.1080p.mkv",
				"priority": 2
			}
		],
	}, 
	{
		"id": "d2e1e3dca3cbe3d0d226e0fdd03a1900",
		"name": "Sintel HD 720p",
		"candidades": [
			{
				"url": "http://ftp.nluug.nl/pub/graphics/blender/demo/movies/Sintel.2010.720p.mkv",
				"priority": 1
			},
			{
				"url": "http://ftp.halifax.rwth-aachen.de/blender/demo/movies/Sintel.2010.720p.mkv",
				"priority": 2
			},
			{
				"url": "http://download.blender.org/demo/movies/Sintel.2010.720p.mkv",
				"priority": 0
			}
		],
	}
];

module.exports = router;
