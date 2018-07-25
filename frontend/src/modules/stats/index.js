// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('core/origin');
  var StatsView = require('./views/statsView');
  var StatsSidebarView = require('./views/statsSidebarView');
  var OriginView = require('core/views/originView');
  var Helpers = require('core/helpers');
  var EditorData = require('../editor/global/editorDataLoader');

  Origin.on('router:stats', EditorData.loadCourseData);

  Origin.on('router:stats', function(location, subLocation, action) {
    var id = location;
    EditorData.waitForLoad(triggerEvent);
  });

  function triggerEvent() {
    var course = Origin.editor.data.course;
    if (!course.get('_extensions')._trackingHub) {
      console.log('no tracking hub');
      noTrackingPrompt();
    } else {
      Origin.sidebar.addView(new StatsSidebarView().$el, {
        "backButtonText": "Back to courses",
        "backButtonRoute": "/#dashboard"
      });
      Origin.contentPane.setView(StatsView, { model: new Backbone.Model({ courseData: course }) });
    }
  }

  function noTrackingPrompt() {
    event && event.preventDefault();
    Origin.Notify.alert({
      type: 'error',
      text: Origin.l10n.t('No tracking hub')
    });
    Origin.router.navigateTo('dashboard');
  }

});
