// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('core/origin');
  var SidebarItemView = require('modules/sidebar/views/sidebarItemView');

  var statsSidebarView = SidebarItemView.extend({
    // If adding 'events', extend from the base view
  }, {
    template: 'statsViewSidebar'
  });

  return statsSidebarView;
});
