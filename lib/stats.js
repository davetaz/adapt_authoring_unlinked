var server = require('./rest');
var configuration = require('./configuration');
var database = require('./database');
var logger = require('./logger');
//var modules = [];

exports = module.exports = {

	getAssessments: function(id,callback) {
		var assessments = [];
		database.getDatabase(function(err,db) {
			db.retrieve('article', { _parentId: [id] }, { jsonOnly: true }, function (error, results) {
				if (error) {
					return callback(error,null);
				}
				if (results.length === 0 ) {
					return callback(error,null);
				}
				let requests = results.map((item) => {
					return new Promise((resolve) => {
						try {
							assessments.push(item._extensions._assessment._id);
							resolve();
						} catch(err) {
							resolve();
						}
					})
				})
				Promise.all(requests).then(() =>callback(null,assessments));
			});
		}, configuration.getConfig('dbName'));
	},
	/**
	 * retrieves a single user
	 *
	 * @param {object} search - fields to match: should use 'email' which is unique
	 * @param {object} [options] - optional options to pass to db
	 * @param {function} callback - function of the form function (error, user)
	 */

	retrieveSearchStructure: function (id,callback) {
		var modules = {};
		localId = id;

		var self = this;
		database.getDatabase(function(err,db) {
			db.retrieve('contentobject', { _courseId: [localId] }, { jsonOnly: true }, function (error, results) {
				if (error) {
					return callback(error);
				}
				if (results.length === 0 ) {
					return callback(new Error('stats search got no results'));
				}		
				let requests = results.map((item) => {
					return new Promise((resolve) => {
						self.getAssessments(item._id, function(err, res) {
							modules[item._id] = res;
							resolve();
						});
					})
				})
				Promise.all(requests).then(() =>callback(null,modules));
			});
		}, configuration.getConfig('dbName'));
	},

	executeQuery: function(collection,query,callback) {
		database.getDatabase(function(err,db) {
			db.retrieve(collection, query , {} , function (error, results) {
				callback(null,results.length);
			});
		});
	},

	getModuleStats: function(courseID,module,modules,callback) {
		var path1 = [courseID] + ".progress." + module + "._isComplete";
		var path2 = [courseID] + ".progress." + module + ".progress";
		var path3 = [courseID] + ".progress." + module + ".answers._assessmentState";
		var path4 = [courseID] + ".assessments.isComplete";
		query = { $or : [ { [path1]: true } ] };
		query['$or'].push({ [path2]: 100 });
		query['$or'].push({ [path3]: "Passed" });
		query['$or'].push({ [path4]: true });
		if (modules[module].length > 0) {
			for (i=0;i<modules[module].length;i++) {
				path = [courseID] + ".progress." + module + ".assessments." + modules[module][i] + ".isComplete";
				query['$or'].push( { [path]: true } );
				if (i==(modules[module].length - 1)) {
					database.getDatabase(function(err,db) {
						this.executeQuery('stats',query,callback);
					});
				}
			}
		} else {
			this.executeQuery('stats',query,callback);
		}
	},


	isModuleComplete: function(user,courseID,mouldeID) {
		try {
			if (user.get(courseID).progress[moduleID]._isComplete == true || user.get(courseID).progress[moduleID].progress > 99) {
				return true;
			}
			if (user.get(courseID).progress[moduleID].answers) {
				if (user.get(courseID).progress[moduleID].answers._assessmentState == "Passed") {
					return true;
				}
			}
			if (user.get(courseID).assessments) {
				if (user.get(courseID).assessments.isComplete == true) {
					return true;
				}
			}
		} catch(err) {
			return false;
		}
	},

	getCompleteCountDetail: function(item, courseID, modules, callback) {
		var amountComplete = 0;
		for (i=0;i<Object.keys(modules).length;i++) {
			moduleID = Object.keys(modules)[i];
			if (item.get(courseID).progress[moduleID]) {
				if (this.isModuleComplete(item,courseID,moduleID)) {
					amountComplete++;
				}
			}
			if (i==(Object.keys(modules).length - 1)) {
				callback(null,amountComplete);
			}
		}
		//callback(null,amountComplete);
	}, 

	getUserProfile(userData,courseID,modules,callback) {
		var user = {};
		user.id = userData.get("user.id");
		user.emailPresent = false;
		if (userData.get("user.email")) {
			user.id = userData.get("user.email");
			user.emailPresent = true;
		}
		user["completedModulesCount"] = 0;
		for (i=0;i<Object.keys(modules).length;i++) {
			moduleID = Object.keys(modules)[i];
			if (userData.get(courseID).progress[moduleID]) {
				user[moduleID] = 0;
				if (this.isModuleComplete(userData,courseID,moduleID)) {
					user[moduleID] = 100;
					user["completedModulesCount"]++;
				} else {
					user[moduleID] = userData.get(courseID).progress[moduleID].progress;	
				}
			} else {
				user[moduleID] = 0;
			}
			if (i==(Object.keys(modules).length - 1)) {
				callback(null,user);
			}
		}
	},

	getUserProfiles: function(courseID,modules,callback) {
		var self = this;
		var query = { [courseID]: { $exists: true }};
		var userProfiles = [];
		database.getDatabase(function(err,db) {
			db.retrieve('stats', query , {} , function (error, results) {
				let requests = results.map((result) => {
					return new Promise((resolve) => {
						self.getUserProfile(result,courseID,modules,function(err,res) {
							userProfiles.push(res);
							resolve();
						})
					})
				})
				Promise.all(requests).then(() => callback(null,userProfiles));
			})
		})
	},

	getCompleteCount: function(courseID,modules,callback) {
		var completeCount = {};
		var query = { [courseID]: { $exists: true }};
		var self = this;
		database.getDatabase(function(err,db) {
			db.retrieve('stats', query , {} , function (error, results) {
				let requests = results.map((result) => {
					return new Promise((resolve) => {
						self.getCompleteCountDetail(result, courseID, modules, function(err,res) {
							if (err) {
								console.log(err);
								resolve();
							}
							if (res > 0) {
								hi = res;
								for (hi=res;hi>0;hi--) {
									if (!completeCount[hi]) {
										completeCount[hi] = 1;
									} else {
										completeCount[hi]++;
									}
									if (hi==1) {
										resolve();
									}
								}
							} else {
								resolve();
							}
						});
					})
				})
				Promise.all(requests).then(() => callback(null,completeCount));
			})
		})
	},

	outputResult: function(err,res,result) {
		if (err) {
			return next(err);
		}
		res.statusCode = 200;
		return res.json(result);
	},

	init: function (app) {
		var self = this;
		var rest = require('./rest');

		// yep
		app.stats = this;

		server.get('/stats/:id/moduleCompletion', function (req, res, next) {

			var id = req.params.id;

			if ('string' !== typeof id) {
				return next(new Error('id must be a valid objectid!'));
			}
			var stats = {};
			stats.moduleCompletion = {};
			self.retrieveSearchStructure(id,function (err, modules) {
				let requests = Object.keys(modules).map((module) =>{
					return new Promise((resolve) => {
						self.getModuleStats(id,module,modules,function(err,moduleStats) {      
							stats.moduleCompletion[module] = moduleStats;
							resolve();
						});
					});
				})
				Promise.all(requests).then(() => self.outputResult(err,res,stats));
			});
		});

		server.get('/stats/:id/completedModulesCount', function (req, res, next) {
			var id = req.params.id;

			if ('string' !== typeof id) {
				return next(new Error('id must be a valid objectid!'));
			}
			var stats = {};
			stats.completedModulesCount = {};

			self.retrieveSearchStructure(id,function (err, modules) {
				let requests = [];
				extra = new Promise((resolve) => {
					self.getCompleteCount(id,modules,function(err,completeCountStats) {
						stats.completedModulesCount = completeCountStats;
						resolve();
					});
				})
				requests.push(extra);
				Promise.all(requests).then(() => self.outputResult(err,res,stats));
			});
		});

		server.get('/stats/:id/userProfiles', function (req, res, next) {
			var id = req.params.id;

			if ('string' !== typeof id) {
				return next(new Error('id must be a valid objectid!'));
			}

			self.retrieveSearchStructure(id,function (err, modules) {
				self.getUserProfiles(id,modules,function(err,userProfiles) { 
					self.outputResult(err,res,userProfiles);     
				})
			})
		});

		server.get('/stats/:id', function (req, res, next) {

			var id = req.params.id;

			if ('string' !== typeof id) {
				return next(new Error('id must be a valid objectid!'));
			}
			var stats = {};
			stats.moduleCompletion = {};
			stats.completedModulesCount = {};

			self.retrieveSearchStructure(id,function (err, modules) {
				let requests = Object.keys(modules).map((module) =>{
					return new Promise((resolve) => {
						self.getModuleStats(id,module,modules,function(err,moduleStats) {      
							stats.moduleCompletion[module] = moduleStats;
							resolve();
						});
					});
				})
				extra = new Promise((resolve) => {
					self.getCompleteCount(id,modules,function(err,completeCountStats) {
						stats.completedModulesCount = completeCountStats;
						resolve();
					});
				})
				requests.push(extra);
				Promise.all(requests).then(() => self.outputResult(err,res,stats));
			});
		});

	}
}
