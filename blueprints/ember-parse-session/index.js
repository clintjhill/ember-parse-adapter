module.exports = {
  name: 'ember-parse-session',
  description: 'Generates needed files to access the Parse Session service on routes, controllers and components. It also generates a user model.',

  // Allows the generator to not require an entity name
  normalizeEntityName: function(entityName) {
    return entityName;
  }
};
