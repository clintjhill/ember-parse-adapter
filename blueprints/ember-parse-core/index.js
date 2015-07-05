module.exports = {
  name: 'ember-parse-core',
  description: 'Generates an adapter and serializer to use Parse.',

  // Allows the generator to not require an entity name
  normalizeEntityName: function(entityName) {
    return entityName;
  }
};
