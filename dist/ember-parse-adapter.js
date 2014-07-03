// A namespace for the parse adatper
//
var EmberParseAdapter = {};
EmberParseAdapter.Transforms = {};

/*
  Serializer to assure proper Parse-to-Ember encodings
*/
EmberParseAdapter.Serializer = DS.RESTSerializer.extend({

  primaryKey: "objectId",

  extractArray: function(store, primaryType, payload){
    var namespacedPayload = {};
    namespacedPayload[Ember.String.pluralize(primaryType.typeKey)] = payload.results;
    return this._super(store, primaryType, namespacedPayload);
  },

  extractSingle: function(store, primaryType, payload, recordId){
    var namespacedPayload = {};
    namespacedPayload[primaryType.typeKey] = payload; // this.normalize(primaryType, payload);
    return this._super(store, primaryType, namespacedPayload, recordId);
  },

  typeForRoot: function(key) {
    return Ember.String.dasherize(Ember.String.singularize(key));
  },

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
   * Extracts count from the payload so that you can get the total number
   * of records in Parse if you're using skip and limit.
   */
  extractMeta: function(store, type, payload) {
    if (payload && payload.count) {
      store.metaForType(type, {count: payload.count});
      delete payload.count;
    }
  },

  /**
   * Special handling for the Date objects inside the properties of
   * Parse responses.
   */
  normalizeAttributes: function(type, hash){
    type.eachAttribute(function(key, meta){
      if(meta.type === "date" && Ember.typeOf(hash[key]) === "object" && hash[key].iso){
        hash[key] = hash[key].iso; //new Date(hash[key].iso).toISOString();
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

  serializeIntoHash: function(hash, type, record, options){
    Ember.merge(hash, this.serialize(record, options));
  },

  serializeAttribute: function(record, json, key, attribute) {
    // These are Parse reserved properties and we won't send them.
    if( key === 'createdAt' ||
        key === 'updatedAt' ||
        key === 'emailVerified' ||
        key === 'sessionToken' ){
      delete json[key];
    } else {
      this._super(record, json, key, attribute);
    }
  },

  serializeBelongsTo: function(record, json, relationship){
    var key = relationship.key;
    var belongsTo = record.get(key);
    if(belongsTo){
      // TODO: Perhaps this is working around a bug in Ember-Data? Why should
      // promises be returned here.
      if (belongsTo instanceof DS.PromiseObject) {
        if (!belongsTo.get('isFulfilled')) {
          throw new Error("belongsTo values *must* be fulfilled before attempting to serialize them");
        }
        belongsTo = belongsTo.get('content');
      }

      json[key] = {
        "__type": "Pointer",
        "className": this.parseClassName(belongsTo.constructor.typeKey),
        "objectId": belongsTo.get('id')
      };
    }
  },

  parseClassName: function(key) {
    if (key === "parseUser") {
      return "_User";
    } else {
      return Ember.String.capitalize(Ember.String.camelize(key));
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
 * An Ember Data Adapter written to use Parse REST API
 * @type {DS.RESTAdapter}
 */
EmberParseAdapter.Adapter = DS.RESTAdapter.extend({

  defaultSerializer: '-parse',

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
    if ("parseUser" === type) {
      return "users";
    } else if ("login" === type) {
      return "login";
    } else {
      return this.classesPath + '/' + this.parsePathForType(type);
    }
  },

  // Using TitleStyle is recommended by Parse
  // TODO: test
  parsePathForType: function(type) {
    return Ember.String.capitalize(Ember.String.camelize(type));
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

  parseClassName: function(key) {
    return Ember.String.capitalize(key);
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
            "className": this.parseClassName(record.typeKey),
            "objectId": record.get('id')
          },
          key: relatedInfo.key
        }
      }
    };
    // the request is to the related type and not the type for the record.
    // the query is where there is a pointer to this record.
    return this.ajax(this.buildURL(relatedInfo.type.typeKey), "GET", { data: query });
  },

  /**
   * Implementation of findQuery that automatically wraps query in a
   * JSON string.
   *
   * @example
   *     this.store.find('comment', {
   *       where: {
   *         post: {
   *             "__type":  "Pointer",
   *             "className": "Post",
   *             "objectId": post.get('id')
   *         }
   *       }
   *     });
   */
  findQuery: function (store, type, query) {
    if (query.where && Ember.typeOf(query.where) !== 'string') {
      query.where = JSON.stringify(query.where);
    }

    // Pass to _super()
    return this._super(store, type, query);
  },

  sessionToken: Ember.computed('headers.X-Parse-Session-Token', function(key, value){
    if (arguments.length < 2) {
      return this.get('headers.X-Parse-Session-Token');
    } else {
      this.set('headers.X-Parse-Session-Token', value);
      return value;
    }
  })
});

/**
 * Parse User object implementation
 * @type {DS.ParseModel}
 */
EmberParseAdapter.ParseUser = DS.Model.extend({
  username: DS.attr('string'),
  password: DS.attr('string'),
  email: DS.attr('string'),
  emailVerified: DS.attr('boolean'),
  sessionToken: DS.attr('string'),

  createdAt: DS.attr('date'),
  updatedAt: DS.attr('date')

});

EmberParseAdapter.ParseUser.reopenClass({

  requestPasswordReset: function(email){
    var adapter = this.get('store').adapterFor(this);
    var data = { email: email };
    return adapter.ajax(adapter.buildURL("requestPasswordReset"), "POST", {data:data})['catch'](
      function(response){
        return Ember.RSVP.reject(response.responseJSON);
      }
    );
  },

  login: function(store, data){
    if(Ember.isEmpty(this.typeKey)){
      throw new Error('Parse login must be called on a model fetched via store.modelFor');
    }
    var model = this;
    var adapter = store.adapterFor(model);
    var serializer = store.serializerFor(model);
    return adapter.ajax(adapter.buildURL("login"), "GET", {data: data}).then(
      function(response){
        serializer.normalize(model, response);
        var record = store.push(model, response);
        return record;
      },
      function(response){
        return Ember.RSVP.reject(response.responseJSON);
      }
    );
  },

  signup: function(store, data){
    if(Ember.isEmpty(this.typeKey)){
      throw new Error('Parse signup must be called on a model fetched via store.modelFor');
    }
    var model = this;
    var adapter = store.adapterFor(model);
    var serializer = store.serializerFor(model);
    return adapter.ajax(adapter.buildURL(model.typeKey), "POST", {data: data}).then(
      function(response){
        serializer.normalize(model, response);
        response.email = response.email || data.email;
        response.username = response.username || data.username;
        var record = store.push(model, response);
        return record;
      },
      function(response){
        return Ember.RSVP.reject(response.responseJSON);
      }
    );
  }
});

EmberParseAdapter.GeoPoint = Ember.Object.extend({
  latitude: Ember.computed(function(){ return this._latitude; }).readOnly(),
  longitude: Ember.computed(function(){ return this._longitude; }).readOnly(),

  init: function(latitude, longitude) {
    this._latitude = latitude;
    this._longitude = longitude;
  }

});

EmberParseAdapter.File = Ember.Object.extend({
  name: Ember.computed(function(){ return this._name; }).readOnly(),
  url: Ember.computed(function(){ return this._url; }).readOnly(),

  init: function(name, url) {
    this._name = name;
    this._url = url;
  }

});

/*
 * The file transform handles Parse's custom GeoPoint format. For
 * example a Parse file might come back from the REST API
 * looking like this:
 *
 * "registeredAt": {
 *   "__type": "GeoPoint",
 *   "latitude": 45.2934237432,
 *   "longitude": -17.233242432
 * }
 *
 * This helper deserializes that structure into a special
 * EmberParseAdapter.GeoPoint object. This object should not be
 * changed, instead set a new file object to the property.
 *
 * this.store.find('model').then(function(model){
 *   model.get('someGeo'); // -> GeoPoint object
 *   model.get('someGeo.latitude'); // -> someGeo latitude
 *
 *   var geoPoint = new EmberParseAdapter.GeoPoint(lat, lon);
 *   model.set('someGeo', geoPoint);
 * });
 *
 * When saving a record, the EmberParseAdapter.GeoPoint object
 * is likewise serialized into the Parse REST API format.
 *
 * @class EmberParseAdapter.Transforms.GeoPoint
 */
EmberParseAdapter.Transforms.GeoPoint = DS.Transform.extend({

  deserialize: function(serialized) {
    if (!serialized) {
      return null;
    }
    return new EmberParseAdapter.GeoPoint(serialized.latitude, serialized.longitude);
  },

  serialize: function(deserialized) {
    if (!deserialized) {
      return null;
    }
    return {
      __type: 'GeoPoint',
      latitude: deserialized.get('latitude'),
      longitude: deserialized.get('longitude')
    };
  }

});

/*
 * The file transform handles Parse's custom data format. For
 * example a Parse file might come back from the REST API
 * looking like this:
 *
 * "registeredAt": {
 *   "__type": "File",
 *   "name": "foo.jpg",
 *   "url": "http://some.s3.url.com/foo.jpg"
 * }
 *
 * This helper deserializes that structure into a special
 * EmberParseAdapter.File object. This object should not be
 * changed, instead set a new file object to the property.
 *
 * this.store.find('model').then(function(model){
 *   model.get('someFile'); // -> File object
 *   model.get('someFile.url'); // -> someFile URL
 *
 *   var file = new EmberParseAdapter.File('foo.jpg', url);
 *   model.set('someFile', file);
 * });
 *
 * When saving a record, the EmberParseAdapter.File object
 * is likewise serialized into the Parse REST API format.
 *
 * @class EmberParseAdapter.Transforms.File
 */
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

/*
 * The date transform handles Parse's custom data format. For
 * example a Parse date might come back from the REST API
 * looking like this:
 *
 * "registeredAt": {
 *   "__type": "Date",
 *   "iso": "2014-06-05T12:43:50.716Z"
 * }
 *
 * This helper deserializes that structure into a normal
 * JavaScript date object. In also performs the inverse:
 * converting a date object back into Parse's custom format.
 *
 * @class EmberParseAdapter.Transforms.Data
 */
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

EmberParseAdapter.setupContainer = function(container){
  container.register('adapter:-parse', EmberParseAdapter.Adapter);
  container.register('serializer:-parse', EmberParseAdapter.Serializer);
  container.register('model:parse-user', EmberParseAdapter.ParseUser);
  container.register('transform:parse-geo-point', EmberParseAdapter.Transforms.GeoPoint);
  container.register('transform:parse-file', EmberParseAdapter.Transforms.File);
  container.register('transform:parse-date', EmberParseAdapter.Transforms.Date);
};

/**
 * Setup the Parse Adapter in an app.
 */
Ember.onLoad("Ember.Application", function(Application) {

  Application.initializer({
    after: "ember-data",
    name: "parse-adapter",
    initialize: function(container, application) {
      EmberParseAdapter.setupContainer(container);
    }
  });

});
