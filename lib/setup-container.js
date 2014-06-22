EmberParseAdapter.setupContainer = function(container){
  container.register('adapter:-parse', EmberParseAdapter.Adapter);
  container.register('serializer:-parse', EmberParseAdapter.Serializer);
  container.register('model:parse-user', EmberParseAdapter.ParseUser);
  container.register('transform:parse-geo-point', EmberParseAdapter.Transforms.GeoPoint);
  container.register('transform:parse-file', EmberParseAdapter.Transforms.File);
  container.register('transform:parse-date', EmberParseAdapter.Transforms.Date);
};
