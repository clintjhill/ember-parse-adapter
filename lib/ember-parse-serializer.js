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
