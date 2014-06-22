/**
 * Setup the Parse Adapter in an app.
 */
Ember.onLoad("Ember.Application", function(Application) {

  Application.initializer({
    after: "ember-data",
    name: "parse-adapter",
    initialize: function(container, application) {
      EmberParseAdapter.setupContainer(container);
    }
  });

});
