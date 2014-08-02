console.log("included");
EmberParseAdapter.Transforms.ACL = DS.Transform.extend({

  deserialize: function(serialized) {
    if (!serialized) {
      return null;
    }

    return new EmberParseAdapter.ACL(serialized);
  },

  serialize: function(deserialized) {
    if (!deserialized) {
      return null;
    }
    
    var hash = {};

    Object.keys(deserialized).forEach(function(key) {
      hash[key] = deserialized.get(key);
    });

    return hash;
  }

});
