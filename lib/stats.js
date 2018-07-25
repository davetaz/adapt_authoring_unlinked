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
          			return callback(null,null);
        		}
        		if (results.length === 0 ) {
        			return callback(null,null);
        		}
        		let requests = results.map((item) => {
        			return new Promise((resolve) => {
        				if (item._extensions._assessment._id) {
        					assessments.push(item._extensions._assessment._id);
        					resolve();
        				} else {
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
  		
  		/*
  		 * used in debugging and testing, allows courses to be imported and exported.
  		 *
  		 */
  		if(id == "581c767d4d7b7e82691e408a") { localId = "5b58589452fb762f90847e61"; }
  		modules = { '581c76824d7b7e82691e408b': [ 'assessment0' ],
  '584928ca4d7b7e82691e4bd1': [ 'assessment1' ],
  '584928ce4d7b7e82691e4c28': [ 'assessment2' ],
  '584928f24d7b7e82691e4cf1': [ 'assessment3' ],
  '58d17f03d084d5167a04ba01': [ 'assessment4' ],
  '594a4e5ad084d5167a04ffb6': [ 'assessment5' ] };
  		callback(null,modules);

  		/*
  		 * Step 1: Get list of modules in course and assessments to make the big query
  		 *
  		 */
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

  	getModuleStats: function(courseID,module,modules,callback) {
  		var path1 = [courseID] + ".progress." + module + "._isComplete";
		var path2 = [courseID] + ".progress." + module + ".progress";
		var path3 = [courseID] + ".progress." + module + ".answers._assessmentState";
		var path4 = [courseID] + ".assessments.isComplete";
		query = { $or : [ { [path1]: true } ] };
		query['$or'].push({ [path2]: 100 });
		query['$or'].push({ [path3]: "Passed" });
		query['$or'].push({ [path4]: true });
		for (i=0;i<modules[module].length;i++) {
			path = [courseID] + ".progress." + module + ".assessments." + modules[module][i] + ".isComplete";
			query['$or'].push( { [path]: true } );
			if (i==(modules[module].length - 1)) {
				database.getDatabase(function(err,db) {
					db.retrieve('stats', query , {} , function (error, results) {
						callback(null,results.length);
					});
				});
			}
		}
		//callback(null,1);
  	},

  	getCompleteCountDetail: function(item, courseID, modules, callback) {
  		var amountComplete = 0;
		for (i=0;i<Object.keys(modules).length+1;i++) {
			if (i==(Object.keys(modules).length )) { callback(null,0) }
			moduleid = Object.keys(modules)[i];
			try {
			 if (item.get(courseID).progress[moduleid]._isComplete == true || item.get(courseID).progress[moduleid].progress > 99 || item.get(courseID).progress[moduleid].answers._assessmentState == "Passed" || item.get(courseID).assessments.isComplete == true) {
				amountComplete++;
				continue;
			 }
			} catch(err) {
				callback(err,0);
			}
			if (i==(Object.keys(modules).length - 1)) {
				callback(null,amountComplete);
			}
		}
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
      							//console.log(err);
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
      							}
      						}
      						resolve();
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
    	var stats = {};
    	stats.moduleCompletion = {};
    	stats.completedModulesCount = {};

    	// yep
    	app.stats = this;
  		server.get('/stats/:id', function (req, res, next) {

  			var id = req.params.id;

        
        /*
         * TESTING ONLY!!!
         */
        if (id == "5b58589452fb762f90847e61") { 
          id = "581c767d4d7b7e82691e408a";
        }



  			if ('string' !== typeof id) {
  				return next(new Error('id must be a valid objectid!'));
  			}
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