EmberParseAdapter.Transforms.GeoPoint = DS.Transform.extend({

  deserialize: function(serialized) {
    if (!serialized) {
      return null;
    }
    return new EmberParseAdapter.GeoPoint(serialized.latitude, serialized.longitude);
  },

  serialize: function(deserialized) {
    if (!deserialized) {
      return null;
    }
    return {
      __type: 'GeoPoint',
      latitude: deserialized.get('latitude'),
      longitude: deserialized.get('longitude')
    };
  }

});
