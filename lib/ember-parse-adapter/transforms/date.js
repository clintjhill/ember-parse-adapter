EmberParseAdapter.Transforms.Date = DS.Transform.extend({

  deserialize: function(serialized) {
    if (!serialized) {
      return null;
    }
    return new Date(serialized.iso);
  },

  serialize: function(deserialized) {
    if (!deserialized) {
      return null;
    }
    return {
      __type: 'Date',
      iso: deserialized.toISOString()
    };
  }

});
