EmberParseAdapter.File = Ember.Object.extend({
  name: Ember.computed(function(){ return this._name; }).readOnly(),
  url: Ember.computed(function(){ return this._url; }).readOnly(),

  init: function(name, url) {
    this._name = name;
    this._url = url;
  }

});
