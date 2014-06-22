EmberParseAdapter.GeoPoint = Ember.Object.extend({
  latitude: Ember.computed(function(){ return this._latitude; }).readOnly(),
  longitude: Ember.computed(function(){ return this._longitude; }).readOnly(),

  init: function(latitude, longitude) {
    this._latitude = latitude;
    this._longitude = longitude;
  }

});
