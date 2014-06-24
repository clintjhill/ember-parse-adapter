var transform;

module("Unit - Date transform", {
  setup: function(){
    transform = EmberParseAdapter.Transforms.Date.create();
  },
  teardown: function(){
    Ember.run(transform, "destroy");
  }
});

test("should serialize", function(){
  var date = new Date(2013,10,10);
  var origIso = date.toISOString();
  var data = transform.serialize(date);
  equal(data.iso, origIso, "iso is rendered");
  equal(data.__type, "Date", "has the proper type");
});

test("should deserialize", function(){
  var data = {
    iso: "2013-11-10T05:00:00.000Z",
    __type: "Date"
  };
  var date = transform.deserialize(data);
  ok(date instanceof Date, "is a date");
  equal(date.getTime(), 1384059600000, "timestamp is correct");
});

test("should deserialize null to null", function(){
  var file = transform.deserialize(null);
  ok(file === null, "serialziation of null is null");
});
