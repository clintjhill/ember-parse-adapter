var overriddenHasMany = DS.hasMany;

/**
 * Override to assure Relation data types
 * are always used async.
 */
DS.hasMany = function(type, options){
  if (typeof type === 'object') {
    options = type;
    type = undefined;
  }
  // this is a bit of magic to assure async Relation
  // queries against Parse and that if no options provided
  // array is used as default.
  if(options){
    if(options.relation && !options.async){
      options.async = true;
    }
  } else {
    options = {array:true};
  }
  return overriddenHasMany(type, options);
};

/**
 * An Ember Data Adapter written to use Parse REST API
 * @type {DS.RESTAdapter}
 */
var ParseAdapter = DS.ParseAdapter = DS.RESTAdapter.extend({

  defaultSerializer: 'Parse',

  init: function(){
    this._super();
    this.set('headers', {
      "X-Parse-Application-Id": this.get('applicationId'),
      "X-Parse-REST-API-Key": this.get('restApiId')
    });
  },

  host: "https://api.parse.com",
  namespace: '1',
  classesPath: 'classes',

  /*
   * Override to allow for the inclusion of relationships.
   * Parse allows for include querystring params.
   */
  buildURL: function(type, id){
    var url = this._super(type, id);
    var model = this.container.lookupFactory("model:" + type);
    if(model){
      var includes = [];
      model.eachRelationship(function(key, relationship){
        if(relationship.kind === "hasMany" && !relationship.options.relation){
          includes.push(key);
        }
      });
      if(includes.length > 0){
        url = url + "?include=" + includes.join(",");
      }
    }
    return url;
  },

  pathForType: function(type) {
    var factory = this.container.lookupFactory('model:' + type);
    if(DS.ParseUserModel.detect(factory)){
      return "users";
    } else if(type === "login") {
      return type;
    } else if(factory.toString().indexOf("subclass") > 0) {
      // This condition added specifically for the case where modules are involved
      // and the type is not explicit. Ember App Kit in particular needs this.
      return this.classesPath + '/' + Ember.String.capitalize(type);
    } else {
      return this.classesPath + '/' + factory.parseClassName();
    }
  },

  /**
   * Because Parse doesn't return a full set of properties on the 
   * responses to updates, we want to perform a merge of the response
   * properties onto existing data so that the record maintains 
   * latest data.
   */
  createRecord: function(store, type, record) {
    var data = {};
    var serializer = store.serializerFor(type.typeKey);
    serializer.serializeIntoHash(data, type, record, { includeId: true });
    var adapter = this;
    return new Ember.RSVP.Promise(function(resolve, reject){
      adapter.ajax(adapter.buildURL(type.typeKey), "POST", { data: data }).then(
      function(json){
        var completed = Ember.merge(data, json);
        resolve(completed);
      },
      function(reason){
        reject(reason.responseJSON); 
      });
    });
  },

  /**
   * Because Parse doesn't return a full set of properties on the 
   * responses to updates, we want to perform a merge of the response
   * properties onto existing data so that the record maintains 
   * latest data.
   */
  updateRecord: function(store, type, record) {
    var data = {};
    var serializer = store.serializerFor(type.typeKey);
    serializer.serializeIntoHash(data, type, record);
    var id = record.get('id');
    var adapter = this;
    return new Ember.RSVP.Promise(function(resolve, reject) {
      adapter.ajax(adapter.buildURL(type.typeKey, id), "PUT", { data: data }).then(function(json){
        // This is the essential bit - merge response data onto existing data.
        var completed = Ember.merge(data, json);
        resolve(completed);
      }, function(reason){
        reject(reason.responseJSON);
      });
    });
  },

  /**
   * Implementation of a hasMany that provides a Relation query for Parse 
   * objects.
   */
  findHasMany: function(store, record, relatedInfo){
    var query = {
      where: {
        "$relatedTo": {
          "object": {
            "__type": "Pointer",
            "className": Ember.String.capitalize(record.parseClassName()),
            "objectId": record.get('id')
          },
          key: relatedInfo.key
        }
      }
    };
    // the request is to the related type and not the type for the record.
    // the query is where there is a pointer to this record.
    return this.ajax(this.buildURL(relatedInfo.type.typeKey), "GET", { data: query });
  }
}); 

/**
 * Setup the Parse Adapter in the container.
 */
Ember.onLoad('Ember.Application', function(Application) {
  Application.initializer({
    name: "parseAdapter",
    initialize: function(container, application) {
      application.register('adapter:_parse', DS.ParseAdapter);
    }
  });
});
