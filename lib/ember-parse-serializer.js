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
