// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require){
  var Origin = require('core/origin');
  var OriginView = require('core/views/originView');
  var Helpers = require('core/helpers');

  var StatsView = OriginView.extend({
    tagName: 'div',
    className: 'courseStats',
    settings: {
      autoRender: false
    },
    views: [],

    initialize: function() {
      OriginView.prototype.initialize.apply(this, arguments);
      Origin.trigger('location:title:update', { title: "Course statistics: " + this.model.get('courseData').get('title') });
      console.log(this.model.get('courseData'));
      //this.render();
      //this.initData();
    }

  }, {
    template: 'statsView'
  });

  return StatsView;
});
