/*
 * The file transform handles Parse's custom GeoPoint format. For
 * example a Parse file might come back from the REST API
 * looking like this:
 *
 * "registeredAt": {
 *   "__type": "GeoPoint",
 *   "latitude": 45.2934237432,
 *   "longitude": -17.233242432
 * }
 *
 * This helper deserializes that structure into a special
 * EmberParseAdapter.GeoPoint object. This object should not be
 * changed, instead set a new file object to the property.
 *
 * this.store.find('model').then(function(model){
 *   model.get('someGeo'); // -> GeoPoint object
 *   model.get('someGeo.latitude'); // -> someGeo latitude
 *
 *   var geoPoint = new EmberParseAdapter.GeoPoint(lat, lon);
 *   model.set('someGeo', geoPoint);
 * });
 *
 * When saving a record, the EmberParseAdapter.GeoPoint object
 * is likewise serialized into the Parse REST API format.
 *
 * @class EmberParseAdapter.Transforms.GeoPoint
 */
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
