module('Ember Data Adapter for Parse: Mixin');

var TestMixinApp = Ember.Application.create({
  rootElement: '#mixinTest',
  store: DS.Store.create({
    revision: 10,
    adapter: DS.FixtureAdapter.create({
      serializer: ParseJSONSerializer
    })
  })
});

TestMixinApp.mixedIn = DS.Model.extend(ParseMixin, {
  name: DS.attr('string')
});

test('Mixin Id mapping', function(){

  var created = TestMixinApp.mixedIn.createRecord({name: 'Create Test'});
  created.store.commit();

  ok(created.get('id'), 'Assure that an Id is created');

});
