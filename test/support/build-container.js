function buildContainer() {
  var container = new Ember.Container();
  DS._setupContainer(container);
  EmberParseAdapter.setupContainer(container);
  return container;
}
