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

  pathForType: function(type) {
    var factory = this.container.lookupFactory('model:' + type);
    if(DS.ParseUserModel.detect(factory)){
      return "users";
    } else if(type === "login") {
      return type;
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
        reject(reason);
      });
    });
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

/*
  Serializer to assure proper Parse-to-Ember encodings
*/
var ParseSerializer = DS.ParseSerializer = DS.RESTSerializer.extend({

  primaryKey: "objectId",

  /**
   * Because Parse only returns the updatedAt/createdAt values on updates
   * we have to intercept it here to assure that the adapter knows which 
   * record ID we are dealing with (using the primaryKey).
   */
  extract: function(store, type, payload, id, requestType){
    if(id !== null && requestType === "updateRecord"){
      payload[this.get('primaryKey')] = id;
    }
    return this._super(store, type, payload, id, requestType);
  },

  /**
   * Special handling for the Date objects inside the properties of
   * Parse responses.
   */
  normalizeAttributes: function(type, hash){
    type.eachAttribute(function(key, meta){
      if(meta.type === "date" && Ember.typeOf(hash[key]) === "object"){
        hash[key] = hash[key].iso;
      } else if(meta.type === "date" && Ember.typeOf(hash[key]) === "string"){
        hash[key] = new Date(hash[key]).toISOString();
      }
    });
    this._super(type, hash);
  },

  normalizeRelationships: function(type, hash){
    this._super(type, hash);
    type.eachRelationship(function(key, relationship) {
      if(hash[key] && relationship.kind === 'belongsTo'){
        hash[key] = hash[key].objectId;
      }
      if(relationship.kind === 'hasMany'){ 
        var query = {
          where: {
            "$relatedTo": {
              "object": {
                "__type": "Pointer",
                "className": Ember.String.capitalize(type.parseClassName()),
                "objectId": hash.id
              },
              key: key
            }
          }
        };
        hash[key] = this.get('store').findQuery(Ember.String.singularize(key), query); 
      }
    }, this);
  },

  normalizePayload: function(type, payload){
    var result = {};
    if(payload.results){
      result[type.typeKey] = payload.results;
    } else {
      result[type.typeKey] = payload;
    }
    return result;
  },

  serializeIntoHash: function(hash, type, record, options){
    Ember.merge(hash, this.serialize(record, options));
  },

  serializeAttribute: function(record, json, key, attribute) {
    // These are Parse reserved properties and we won't send them.
    if(key === 'createdAt' || key === 'updatedAt' || key === 'emailVerified' || key === 'sessionToken'){
      delete json[key];
    } else if(attribute.type === "date" && key !== 'createdAt' && key !== 'updatedAt'){
      json[key] = { 
        "__type": "Date", 
        iso: record.get(key) 
      };
    } else {
      this._super(record, json, key, attribute);
    }
  },

  serializeBelongsTo: function(record, json, relationship){
    var key = relationship.key;
    var belongsTo = record.get(key);
    if(belongsTo){
      var className = belongsTo.parseClassName();
      json[key] = {
        "__type": "Pointer", 
        "className": className, 
        "objectId": belongsTo.get('id') 
      };
    }
  },

  serializeHasMany: function(record, json, relationship){
    //TODO: Need to assure relations is handled.
  }

});

/**
 * Setup the Parse Serializer to be available as default for Parse Adapter.
 */
Ember.onLoad('Ember.Application', function(Application) {
  Application.initializer({
    name: "parseSerializer",
    initialize: function(container, application) {
      application.register('serializer:_parse', DS.ParseSerializer);
    }
  });
});

/**
 * Model to setup default Parse attributes like create/update date
 * fields.
 * @type {DS.Model}
 */
var ParseModel = DS.ParseModel = DS.Model.extend({
  createdAt: DS.attr('date'),
  updatedAt: DS.attr('date'),

  parseClassName: function(){
    return this.constructor.parseClassName();
  }

});

ParseModel.reopenClass({
  parseClassName: function(){
    var type = this.toString();
    return type.split(".").pop();
  }
});


/**
 * Parse User object implementation
 * @type {DS.ParseModel}
 */
var ParseUserModel = DS.ParseUserModel = ParseModel.extend({
  username: DS.attr('string'),
  password: DS.attr('string'),
  email: DS.attr('string'),
  emailVerified: DS.attr('boolean'),
  sessionToken: DS.attr('string'),
  currentUser: DS.attr('boolean'),

  isCurrent: Ember.computed.bool('currentUser'),
  
  logout: function(){
    var adapter = this.get('store').adapterFor(this.constructor);
    this.set("currentUser", false);
    this._setCurrent(adapter, null);
  },

  requestPasswordReset: function(afterReset){
    var adapter = this.get('store').adapterFor(this.constructor);
    var user = { email: this.get('email') };
    adapter.ajax(adapter.buildURL("requestPasswordReset"), "POST", {data:user}).then(
      function(data){ afterReset(data); },
      function(data){ afterReset(data.responseJSON); }
    );
  },

  /**
   * Overriding the save functionality to assure that if the user object
   * is the 'current' user, then supply the session token header to allow
   * data to be saved.
   */
  save: function(){
    if(typeof(localStorage) !== undefined){
      var emberParseUser = JSON.parse(localStorage.getItem("ember_parse_user"));
      var id = this.get('id');
      var adapter = this.get('store').adapterFor(this.constructor);
      var headers = adapter.get('headers');
      if(id === emberParseUser.userId){
        headers["X-Parse-Session-Token"] = this.get('sessionToken') || emberParseUser.session;
        adapter.set('headers', headers);
      }
    }
    this._super();
  },

  _setCurrent: function(adapter, data){
    ParseUserModel._setCurrent(adapter, data);
  }
});

ParseUserModel.reopenClass({

  _setCurrent: function(adapter, data){
    var headers = adapter.get('headers');
    if(data){
      headers["X-Parse-Session-Token"] = data.sessionToken;
      if(typeof(localStorage) !== 'undefined'){
        var local = { session: data.sessionToken, userId: data.id };
        localStorage.setItem("ember_parse_user", JSON.stringify(local));  
      }
    } else {
      delete headers["X-Parse-Session-Token"];
      if(typeof(localStorage) !== 'undefined'){
        localStorage.removeItem("ember_parse_user");
      }
    }
    adapter.set('headers', headers);
  },

  login: function(username, password){
    if(Ember.isEmpty(this.typeKey)){
      this.typeKey = this.parseClassName().toLowerCase();
    }
    var model = this;
    var store = ParseUserModel.store;
    var adapter = store.adapterFor(model);
    var serializer = store.serializerFor(model.typeKey);
    var user = { username: username, password: password };
    return new Ember.RSVP.Promise(function(resolve, reject){
      adapter.ajax(adapter.buildURL("login"), "GET", {data: user}).then(
        function(data){
          serializer.normalizeId(data);
          data.currentUser = true;
          store.push(model.typeKey, data);
          ParseUserModel._setCurrent(adapter, data);
          resolve(store.find(model.typeKey, data.id));
        },
        function(data){
          ParseUserModel._persist(adapter, null);
          reject(data.responseJSON); 
        }
      );
    });
  },

  signup: function(username, password, email){
    if(Ember.isEmpty(this.typeKey)){
      this.typeKey = this.parseClassName().toLowerCase();
    }
    var model = this;
    var store = ParseUserModel.store;
    var adapter = store.adapterFor(model);
    var serializer = store.serializerFor(model.typeKey);
    var newUser = { username: username, password: password, email: email };
    return new Ember.RSVP.Promise(function(resolve, reject){
      adapter.ajax(adapter.buildURL(model.typeKey), "POST", {data: newUser}).then(
        function(data){
          serializer.normalizeId(data);
          data.currentUser = true;
          data.email = email;
          data.username = username;
          store.push(model.typeKey, data);
          ParseUserModel._setCurrent(adapter, data);
          resolve(store.find(model.typeKey, data.id));
        },
        function(data){
          ParseUserModel._persist(adapter, null);
          reject(data.responseJSON); 
        }
      );
    });
  }
});

Ember.onLoad("Ember.Application", function(Application){
  Application.initializer({
    name: "parseUserStore",
    initialize: function(container, application){
      var store = container.lookup("store:main");
      DS.ParseUserModel.store = store;
    }
  });
});
