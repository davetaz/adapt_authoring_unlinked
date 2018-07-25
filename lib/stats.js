var server = require('./rest');

server.get('/api/stats/:id', function (req, res, next) {
	var id = req.params.id;

	if ('string' !== typeof id) {
		return next(new Error('id must be a valid objectid!'));
	}

	var data = {};
	data.moduleCompletion = { '581c76824d7b7e82691e408b': 86, '584928ca4d7b7e82691e4bd1': 57, '584928ce4d7b7e82691e4c28': 45, '584928f24d7b7e82691e4cf1': 36, '58d17f03d084d5167a04ba01': 28, '594a4e5ad084d5167a04ffb6': 28 };
	data.completedModulesCount = { '1': 100, '2': 61, '3': 40, '4': 33, '5': 16, '6': 14 };
	return data;
});