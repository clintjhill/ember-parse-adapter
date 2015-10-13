window.deprecationWorkflow = window.deprecationWorkflow || {};
window.deprecationWorkflow.config = {
  workflow: [
    { handler: "silence", matchMessage: "Using `Ember.HTMLBars.makeBoundHelper` is deprecated. Please refactor to using `Ember.Helper` or `Ember.Helper.helper`." },
    { handler: "silence", matchMessage: "Using Ember.HTMLBars._registerHelper is deprecated. Helpers (even dashless ones) are automatically resolved." }/*,
    { handler: "silence", matchMessage: "A container should only be created for an already instantiated registry. For backward compatibility, an isolated registry will be instantiated just for this container." },
    { handler: "silence", matchMessage: "register should be called on the registry instead of the container" },
    { handler: "silence", matchMessage: "injection should be called on the registry instead of the container" },
    { handler: "silence", matchMessage: "optionsForType should be called on the registry instead of the container" },
    { handler: "silence", matchMessage: "has should be called on the registry instead of the container" },
    { handler: "silence", matchMessage: "You tried to look up 'store:main', but this has been deprecated in favor of 'service:store'." },
    { handler: "silence", matchMessage: "Your custom serializer uses the old version of the Serializer API, with `extract` hooks. Please upgrade your serializers to the new Serializer API using `normalizeResponse` hooks instead." },
    { handler: "silence", matchMessage: "Usage of `typeKey` has been deprecated and will be removed in Ember Data 2.0. It has been replaced by `modelName` on the model class." },
    { handler: "silence", matchMessage: "DS.Model#isDirty has been deprecated please use hasDirtyAttributes instead" },
    { handler: "silence", matchMessage: "Using store.find(type) has been deprecated. Use store.findAll(type) to retrieve all records for a given type." },
    { handler: "silence", matchMessage: "The default behavior of shouldReloadAll will change in Ember Data 2.0 to always return false when there is at least one \"post\" record in the store. If you would like to preserve the current behavior please override shouldReloadAll in your adapter:application and return true." },
    { handler: "silence", matchMessage: "Calling store.find() with a query object is deprecated. Use store.query() instead." },
    { handler: "silence", matchMessage: "RestAdapter#findQuery has been deprecated and renamed to `query`." },
    { handler: "silence", matchMessage: "BuildURLMixin#urlForFindQuery has been deprecated and renamed to `urlForQuery`." },
    { handler: "silence", matchMessage: "store.push(type, data) has been deprecated. Please provide a JSON-API document object as the first and only argument to store.push." },
    { handler: "silence", matchMessage: "Passing classes to store methods has been removed. Please pass a dasherized string instead of undefined" },
    { handler: "silence", matchMessage: "You are currently using the default DS.RESTAdapter adapter. For Ember 2.0 the default adapter will be DS.JSONAPIAdapter. If you would like to continue using DS.RESTAdapter please create an application adapter that extends DS.RESTAdapter." }*/
  ]
};