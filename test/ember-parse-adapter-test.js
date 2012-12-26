module('Ember Data Adapter for Parse: Adapter');

var TestAdapterApp = Ember.Application.create({
  rootElement: '#adapterTest',
  store: DS.Store.create({
    revision: 10,
    adapter: ParseAdapter
  })
});

test('Adapter Initialization', function(){
  ok(TestAdapterApp.store.adapter, 'Adapter exists');
});
