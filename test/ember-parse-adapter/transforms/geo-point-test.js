var transform;

module("Unit - GeoPoint transform", {
  setup: function(){
    transform = EmberParseAdapter.Transforms.GeoPoint.create();
  },
  teardown: function(){
    Ember.run(transform, 'destroy');
  }
});

test("should serialize", function(){
  var geoPoint = new EmberParseAdapter.GeoPoint(4.53, 3,33);
  var data = transform.serialize(geoPoint);
  equal(data.latitude, geoPoint.get('latitude'), 'latitude is preserved');
  equal(data.longitude, geoPoint.get('longitude'), 'longitude is preserved');
  equal(data.__type, 'GeoPoint', 'has the proper type');
});

test("should deserialize", function(){
  var data = {
    latitude: 3.43,
    longitude: 4.2,
    __type: 'GeoPoint'
  };
  var point = transform.deserialize(data);
  ok(point instanceof EmberParseAdapter.GeoPoint, 'is a geo point');
  equal(point.get('latitude'), data.latitude, 'latitude is preserved');
  equal(point.get('longitude'), data.longitude, 'longitude is preserved');
});
