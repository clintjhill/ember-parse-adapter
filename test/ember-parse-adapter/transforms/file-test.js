var transform;

module("Unit - File transform", {
  setup: function(){
    transform = EmberParseAdapter.Transforms.File.create();
  },
  teardown: function(){
    Ember.run(transform, 'destroy');
  }
});

test("should serialize", function(){
  var file = new EmberParseAdapter.File('car', 'http://example.com/car.png');
  var data = transform.serialize(file);
  equal(data.name, file.get('name'), 'name is preserved');
  equal(data.url, file.get('url'), 'url is preserved');
  equal(data.__type, 'File', 'has the proper type');
});

test("should deserialize", function(){
  var data = {
    name: 'Plane',
    url: 'http://example.com/plane.png',
    __type: 'File'
  };
  var file = transform.deserialize(data);
  ok(file instanceof EmberParseAdapter.File, 'is a geo point');
  equal(file.get('name'), data.name, 'name is preserved');
  equal(file.get('url'), data.url, 'url is preserved');
});

test("should deserialize null to null", function(){
  var file = transform.deserialize(null);
  ok(file === null, 'serialziation of null is null');
});
