// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require){
  var Origin = require('core/origin');
  var OriginView = require('core/views/originView');
  var Helpers = require('core/helpers');

  Handlebars.registerHelper('eachProperty', function(context, options) {
    var ret = "";
    for(var prop in context)
    {
        ret = ret + options.fn({property:prop,value:context[prop]});
    }
    return ret;
  });

  var StatsView = OriginView.extend({
    tagName: 'div',
    className: 'courseStats',
    settings: {
      autoRender: false
    },
    views: [],

    render: function() {
      var data = this.data ? this.data : false;
      var template = Handlebars.templates[this.constructor.template];
      console.log(data);

      this.$el.html(template(data));

      //_.defer(_.bind(this.postRender, this));
      return this;
    },

    initialize: function() {
      OriginView.prototype.initialize.apply(this, arguments);
      Origin.trigger('location:title:update', { title: "Course statistics: " + this.model.get('courseData').get('title') });
      
      console.log(this.model.get('courseData'));
      var self = this;
      $.ajax({
        url: '/api/stats/' + this.model.get('courseData').get('_id'),
        type: 'GET',
        success: function (data) {
          self.data = data;
          self.render();
        },
        error: function() {
          Origin.Notify.alert({
            type: 'error',
            text: Origin.l10n.t('Failed to load course data')
          });
        }
      })

      //this.render();
      //this.initData();
    }

  }, {
    template: 'statsView'
  });

  return StatsView;
});
