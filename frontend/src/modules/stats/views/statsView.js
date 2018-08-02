// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require){
  var Origin = require('core/origin');
  var OriginView = require('core/views/originView');
  var Helpers = require('core/helpers');
  var DataTables = require('modules/stats/libraries/datatables');

  Handlebars.registerHelper("log", function(something) {
    console.log(something);
  });

  var StatsView = OriginView.extend({
    render: function() {
      var data = this.data ? this.data : false;
      var template = Handlebars.templates[this.constructor.template];

      this.$el.html(template(data));

      _.defer(_.bind(this.postRender, this));
      return this;
    },

    postRender: function() {
      //Fix the ordering to take into account the number of contentObjects
      $('#userProfiles').DataTable({
        "order": [[ 8, "desc" ]],
        "pageLength": 25,
        "dom": 'Bfrtip',
        "buttons": [
            'copy', 'csv', 'excel', 'print'
        ]
      } );
    },

    getPages: function(courseID,callback) {
      $.ajax({
          url: '/api/content/contentObject/?_courseId=' + courseID,
          type: 'GET',
          success: function (data) {
            callback(null,data);
          },
          error: function() {
            callback(null,"failed");
          }
      })
    },

    getProfiles: function(courseID,callback) {
      $.ajax({
          url: '/api/stats/' + courseID + '/userProfiles',
          type: 'GET',
          success: function (data) {
            callback(null,data);
          },
          error: function() {
            callback(null,null);
          }
      })
    },

    initialize: function() {
      OriginView.prototype.initialize.apply(this, arguments);
      Origin.trigger('location:title:update', { title: "Course statistics: " + this.model.get('courseData').get('title') });
      
      var self = this;

      var courseID = this.model.get('courseData').get('_id'); 
      var data = {};

      var promises = [];
      promises.push(new Promise ((resolve) => {
        self.getPages(courseID, function(err,res) {
          data.contentObjects = res;
          resolve();
        })
      }))
      
      promises.push(new Promise ((resolve) => {
        self.getProfiles(courseID, function(err,res) {
            data.profiles = res;
            resolve();
        })
      }))

      Promise.all(promises).then(function() {
        self.data = data;
        self.render();
      })

    }

  }, {
    template: 'statsView'
  });

  return StatsView;
});
