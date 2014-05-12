EmberParseAdapter.Transforms.File = DS.Transform.extend({

  deserialize: function(serialized) {
    if (!serialized) {
      return null;
    }
    return new EmberParseAdapter.File(serialized.name, serialized.url);
  },

  serialize: function(deserialized) {
    if (!deserialized) {
      return null;
    }
    return {
      __type: 'File',
      name: deserialized.get('name'),
      url: deserialized.get('url')
    };
  }

});
