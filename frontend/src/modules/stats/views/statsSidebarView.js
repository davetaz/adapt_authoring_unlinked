// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('core/origin');
  var SidebarItemView = require('modules/sidebar/views/sidebarItemView');

  Handlebars.registerHelper('eachProperty', function(context, options) {
    var ret = "";
    for(var prop in context)
    {
        ret = ret + options.fn({property:prop,value:context[prop]});
    }
    return ret;
  });

  var statsSidebarView = SidebarItemView.extend({
  	tagName: 'div',
    className: 'statsSidebarView',
    settings: {
      autoRender: true
    },
    views: [],

  	render: function() {
      var data = this.data ? this.data : false;
      var template = Handlebars.templates[this.constructor.template];

      this.$el.html(template(data));

      //_.defer(_.bind(this.postRender, this));
      return this;
    },

    getModuleData: function(courseID,callback) {
    	$.ajax({
      		url: '/api/content/contentobject?_courseId=' + courseID,
      		type: 'GET',
      		success: function (contentObjects) {
      			callback(null,contentObjects);
      		},
      		error:function() {
	      		callback(null,null);	  	
          	}
        });
    },

    getStats: function(courseID,callback) {
    	$.ajax({
	        url: '/api/stats/' + courseID,
	        type: 'GET',
	        success: function (data) {
	        	callback(null,data);
	        },
	        error: function() {
	          callback(null,null);
	        }
	    })
    },

    initialize: function(model) {
      SidebarItemView.prototype.initialize.apply(this, arguments);
      this.model = model;
      
      var self = this;

      var data = {};
      
      var promises = [];
      var courseID = this.model.get('courseData').get('_id');      
      promises.push(new Promise ((resolve) => {
      	self.getModuleData(courseID, function(err,res) {
      		data.moduleData = res;
      		resolve();
      	})
      }))

      promises.push(new Promise ((resolve) => {
      		self.getStats(courseID, function(err,res) {
      			data.moduleCompletion = res.moduleCompletion;
      			data.completedModulesCount = res.completedModulesCount;
      			resolve();
      		})
      }));


	  Promise.all(promises).then(function() {
	  	self.data = data;
		  self.render();
	  });
	  }
   }, {
    	template: 'statsViewSidebar'
   });
  return statsSidebarView;
});
