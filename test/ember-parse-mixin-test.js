module('Ember Data Adapter for Parse: Mixin');

test('Mixin data attributes', function(){
  var Test = DS.Model.extend(ParseMixin, {});
  ok(Test.metaForProperty('createdAt'), "Has createdAt property.");
  equal(Test.metaForProperty('createdAt').type, "date", "createdAt should be date type.");
  ok(Test.metaForProperty('updatedAt'), "Has updatedAt property.");
  equal(Test.metaForProperty('updatedAt').type, "date", "createdAt should be date type.");
});
