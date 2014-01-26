/**
 * Implentation of DS.ManyArray that facilitates the tracking
 * of deleted records, so that we can send proper "Remove" values
 * to the Parse REST API.
 */
var ParseManyArray = DS.ParseManyArray = DS.ManyArray.extend({
  init: function(){
    this._super.apply(this, arguments);
    this._deletedItems = new Ember.Set();
  },

  /**
   * Override to push an entry of the deleted
   * record into the set that keeps track of them.
   */
  removeRecord: function(record){
    var deleted = {
      id: record.get('id'),
      type: record.parseClassName()
    };
    this._deletedItems.add(deleted);
    this._super(record);
  }
});

/**
 * Re-opening this to force the ParseManyArray to be used when
 * creating hasMany collections.
 */
DS.RecordArrayManager.reopen({
  createManyArray: function(type, records) {
    var manyArray = DS.ParseManyArray.create({
      type: type,
      content: records,
      store: this.store
    });

    Ember.EnumerableUtils.forEach(records, function(record) {
      var arrays = this.recordArraysForRecord(record);
      arrays.add(manyArray);
    }, this);

    return manyArray;
  }
});

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
    var deleteds = {};
    var sendDeletes = false;
    var serializer = store.serializerFor(type.typeKey);
    serializer.serializeIntoHash(data, type, record);
    var id = record.get('id');
    var adapter = this;

    type.eachRelationship(function(key, relationship){
      if(data[key] && data[key].deleteds){
        deleteds[key] = data[key].deleteds; 
        delete data[key].deleteds;
        sendDeletes = true;
      }
    });

    return new Ember.RSVP.Promise(function(resolve, reject) {
      if(sendDeletes){
          adapter.ajax(adapter.buildURL(type.typeKey, id), "PUT", {data: deleteds}).then(
            function(json){
              adapter.ajax(adapter.buildURL(type.typeKey, id), "PUT", { data: data }).then(
                function(updates){
                  // This is the essential bit - merge response data onto existing data.
                  var completed = Ember.merge(data, updates);
                  resolve(completed);
                }, 
                function(reason){
                  reject("Failed to save parent in relation: " + reason.response.JSON);  
                }
              );
            }, 
            function(reason){
              reject(reason.responseJSON);  
            }
          );
      } else {
        adapter.ajax(adapter.buildURL(type.typeKey, id), "PUT", { data: data }).then(function(json){
          // This is the essential bit - merge response data onto existing data.
          var completed = Ember.merge(data, json);
          resolve(completed);
        }, function(reason){
          reject(reason.responseJSON);
        });
      }
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
    if(id !== null && (requestType === "updateRecord" || requestType === "deleteRecord")){
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
        hash[key] = new Date(hash[key].iso);
      } else if(meta.type === "date" && Ember.typeOf(hash[key]) === "string"){
        hash[key] = new Date(hash[key]);
      }
    });
    this._super(type, hash);
  },

  /**
   * Special handling of the Parse relation types. In certain 
   * conditions there is a secondary query to retrieve the "many"
   * side of the "hasMany".
   */
  normalizeRelationships: function(type, hash){
    var store = this.get('store'); 
    var serializer = this;

    type.eachRelationship(function(key, relationship) {

      var options = relationship.options;

      // Handle the belongsTo relationships
      if(hash[key] && relationship.kind === 'belongsTo'){
        hash[key] = hash[key].objectId;
      }

      // Handle the hasMany relationships
      if(hash[key] && relationship.kind === 'hasMany'){ 

        // If this is a Relation hasMany then we need to supply 
        // the links property so the adapter can async call the 
        // relationship.
        // The adapter findHasMany has been overridden to make use of this.
        if(options.relation){
          hash.links = {};
          hash.links[key] = {type: relationship.type, key: key};
        }

        if(options.array){
          // Parse will return [null] for empty relationships
          if(hash[key].length && hash[key]){
            hash[key].forEach(function(item, index, items){
              // When items are pointers we just need the id
              // This occurs when request was made without the include query param.
              if(item.__type === "Pointer"){
                items[index] = item.objectId;
              } else {
                // When items are objects we need to clean them and add them to the store.
                // This occurs when request was made with the include query param.
                delete item.__type;
                delete item.className;
                item.id = item.objectId;
                delete item.objectId;
                item.type = relationship.type;
                serializer.normalizeAttributes(relationship.type, item);
                serializer.normalizeRelationships(relationship.type, item);
                store.push(relationship.type, item);
              }
            });
          }
        }
       
      }
    }, this);
    
    this._super(type, hash);
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
    } else if(key === 'currentUser'){ // This is our own reserved property and we won't send it.
      delete json[key];
    } else if(attribute.type === "date" && key !== 'createdAt' && key !== 'updatedAt'){
      json[key] = { 
        "__type": "Date", 
        iso: record.get(key).toISOString()
      };
    } else {
      this._super(record, json, key, attribute);
    }
  },

  serializeBelongsTo: function(record, json, relationship){
    var key = relationship.key;
    var belongsTo = record.get(key);
    if(belongsTo){
      json[key] = {
        "__type": "Pointer", 
        "className": belongsTo.parseClassName(), 
        "objectId": belongsTo.get('id') 
      };
    }
  },

  serializeHasMany: function(record, json, relationship){
    var key = relationship.key;
    var hasMany = record.get(key);
    var options = relationship.options;
    if(hasMany && hasMany.get('length') > 0){
      
      json[key] = { "objects": [] };

      if(options.relation){
        json[key].__op = "AddRelation";
      }

      if(options.array){
        json[key].__op = "AddUnique";
      }

      hasMany.forEach(function(child){
        json[key].objects.push({ 
          "__type": "Pointer", 
          "className": child.parseClassName(), 
          "objectId": child.get('id') 
        });
      });

      if(hasMany._deletedItems && hasMany._deletedItems.length){
        if(options.relation){
          var addOperation = json[key];
          var deleteOperation = { "__op": "RemoveRelation", "objects": [] };
          hasMany._deletedItems.forEach(function(item){
            deleteOperation.objects.push({
              "__type": "Pointer",
              "className": item.type,
              "objectId": item.id
            });
          });
          json[key] = { "__op": "Batch", "ops": [addOperation, deleteOperation] };
        }
        if(options.array){
          json[key].deleteds = { "__op": "Remove", "objects": [] };
          hasMany._deletedItems.forEach(function(item){
            json[key].deleteds.objects.push({
              "__type": "Pointer", 
              "className": item.type, 
              "objectId": item.id 
            });
          });
        }
      }
    } else {
      json[key] = [];
    }
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
    return this._super();
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
          serializer.normalize(model, data);
          data.currentUser = true;
          var record = store.push(model.typeKey, data);
          ParseUserModel._setCurrent(adapter, data);
          resolve(record);
        },
        function(data){
          ParseUserModel._setCurrent(adapter, null);
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
          serializer.normalize(model, data);
          data.currentUser = true;
          data.email = email;
          data.username = username;
          var record = store.push(model.typeKey, data);
          ParseUserModel._setCurrent(adapter, data);
          resolve(record);
        },
        function(data){
          ParseUserModel._setCurrent(adapter, null);
          reject(data.responseJSON); 
        }
      );
    });
  }
});

ParseUserModel.reopenClass({
  parseClassName: function(){
    return "_User";
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
