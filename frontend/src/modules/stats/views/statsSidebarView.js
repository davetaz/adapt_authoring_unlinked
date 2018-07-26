// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('core/origin');
  var SidebarItemView = require('modules/sidebar/views/sidebarItemView');
  //var OriginView = require('core/views/originView');
  var Helpers = require('core/helpers');

  Handlebars.registerHelper('eachProperty', function(context, options) {
    var ret = "";
    for(var prop in context)
    {
        ret = ret + options.fn({property:prop,value:context[prop]});
    }
    return ret;
  });
  Handlebars.registerHelper("log", function(something) {
  	console.log(something);
  });

  var statsSidebarView = SidebarItemView.extend({
  	tagName: 'div',
    className: 'statsSidebarView',
    settings: {
      autoRender: false
    },
    views: [],

  	render: function() {
      var data = this.data ? this.data : false;
      var template = Handlebars.templates[this.constructor.template];

      this.$el.html(template(data));

      //_.defer(_.bind(this.postRender, this));
      return this;
    },

    getModuleData: function(module,callback) {
    	if (module=="581c76824d7b7e82691e408b") {module="5b58589452fb762f90847e63";}
    	if (module=="584928ca4d7b7e82691e4bd1") {module="5b58589452fb762f90847e64";}
    	if (module=="584928ce4d7b7e82691e4c28") {module="5b58589452fb762f90847e65";}
    	if (module=="584928f24d7b7e82691e4cf1") {module="5b58589452fb762f90847e67";}
    	if (module=="58d17f03d084d5167a04ba01") {module="5b58589452fb762f90847e69";}
    	if (module=="594a4e5ad084d5167a04ffb6") {module="5b58589452fb762f90847e6b";}
    	$.ajax({
    		url: 'api/content/contentobject/' + module,
    		type: 'GET',
    		success: function (data) {
    			//callback(null,data.displayTitle);
    			callback(null,10);
    		},
    		error: function() {
    			callback(null,null);
    		}
    	})
    },

    initialize: function(model) {
      this.model = model;
      
      var self = this;
      $.ajax({
        url: '/api/stats/' + this.model.get('courseData').get('_id'),
        type: 'GET',
        success: function (data) {
        	
        	data.modules = {};

			var promises = [];

			Object.keys(data.moduleCompletion).forEach(function(module){
			    promises.push(self.getModuleData(module,function(err,res) {
			    	data.modules[module] = res;
			    }));
			});

			Promise.all(promises).then(function(translateResults){
				self.data = data;
			    self.render();
			});
        },
        error: function() {
          Origin.Notify.alert({
            type: 'error',
            text: Origin.l10n.t('Failed to load course data')
          });
        }
      })
    }
  }, {
    template: 'statsViewSidebar'
  });

  return statsSidebarView;
});
