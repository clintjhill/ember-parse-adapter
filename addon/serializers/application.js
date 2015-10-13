import Ember from 'ember';
import DS from 'ember-data';

export default DS.RESTSerializer.extend({
  
  // this will be removed in 2.0
  isNewSerializerAPI: true,

  primaryKey: 'objectId',

  normalizeArrayResponse: function( store, primaryType, payload ) {
    var namespacedPayload = {};
    namespacedPayload[ Ember.String.pluralize( primaryType.modelName ) ] = payload.results;
    
    return this._super( store, primaryType, namespacedPayload );
  },

  normalizeSingleResponse: function( store, primaryType, payload, recordId ) {
    var namespacedPayload = {};
    namespacedPayload[ primaryType.modelName ] = payload; // this.normalize(primaryType, payload);

    return this._super( store, primaryType, namespacedPayload, recordId );
  },

  modelNameFromPayloadKey: function( key ) {
    return Ember.String.dasherize( Ember.String.singularize( key ) );
  },

  /**
  * Because Parse only returns the updatedAt/createdAt values on updates
  * we have to intercept it here to assure that the adapter knows which
  * record ID we are dealing with (using the primaryKey).
  */
  normalizeResponse: function( store, primaryModelClass, payload, id, requestType ) {
    if( id !== null && ( 'updateRecord' === requestType || 'deleteRecord' === requestType ) ) {
      payload[ this.get( 'primaryKey' ) ] = id;
    }

    return this._super( store, primaryModelClass, payload, id, requestType );
  },

  /**
  * Extracts count from the payload so that you can get the total number
  * of records in Parse if you're using skip and limit.
  */
  extractMeta: function( store, type, payload ) {
    if ( payload && payload.count ) {
      delete payload.count;
      return { count: payload.count };
    }
  },

  /**
  * Special handling for the Date objects inside the properties of
  * Parse responses.
  */
  normalizeAttributes: function( type, hash ) {
    type.eachAttribute( function( key, meta ) {
      if ( 'date' === meta.type && 'object' === Ember.typeOf( hash[key] ) && hash[key].iso ) {
        hash[key] = hash[key].iso; //new Date(hash[key].iso).toISOString();
      }
    });

    this._super( type, hash );
  },
  
  extractRelationship: function(relationshipModelName, relationshipHash) {
    if (Ember.isNone(relationshipHash)) { return null; }
    /*
      When `relationshipHash` is an object it usually means that the relationship
      is polymorphic. It could however also be embedded resources that the
      EmbeddedRecordsMixin has be able to process.
    */
    if (Ember.typeOf(relationshipHash) === 'object') {
      if (relationshipHash.__type && relationshipHash.__type === 'Pointer') {
        relationshipHash.id = relationshipHash.objectId;
        relationshipHash.type = relationshipModelName;
        delete relationshipHash.objectId;
        delete relationshipHash.__type;
        delete relationshipHash.className;
      }
      return relationshipHash;
    }
    
    // https://github.com/emberjs/data/blob/v2.0.0/packages/ember-data/lib/system/coerce-id.js
    var coerceId = relationshipHash == null || relationshipHash === '' ? null : relationshipHash+'';
    
    return { id: coerceId, type: relationshipModelName };
  },
  
  extractRelationships: function(modelClass, resourceHash) {    
    let relationships = {};

    modelClass.eachRelationship(function(key, relationshipMeta) {
      let relationship = null;
      let relationshipKey = this.keyForRelationship(key, relationshipMeta.kind, 'deserialize');
      
      if (resourceHash.hasOwnProperty(relationshipKey)) {
        let data = null;
        let relationshipHash = resourceHash[relationshipKey];
        
        if (relationshipMeta.kind === 'belongsTo') {
          data = this.extractRelationship(relationshipMeta.type, relationshipHash);
        } 
        else if (relationshipHash && relationshipMeta.kind === 'hasMany') {
          // Parse returns the array in relationshipHash.objects
          data = Ember.A(relationshipHash.objects).map(function(item) {
            return this.extractRelationship(relationshipMeta.type, item);
          }, this);
        }
        relationship = { data };
      }

      let linkKey = this.keyForLink(key, relationshipMeta.kind);
      
      if (resourceHash.links && resourceHash.links.hasOwnProperty(linkKey)) {
        let related = resourceHash.links[linkKey];
        relationship = relationship || {};
        relationship.links = { related };
      }

      if (relationship) {
        relationships[key] = relationship;
      }
    }, this);

    return relationships;
  },

  serializeIntoHash: function( hash, typeClass, snapshot, options ) {
    Ember.merge( hash, this.serialize( snapshot, options ) );
  },

  serializeAttribute: function( snapshot, json, key, attribute ) {
    // These are Parse reserved properties and we won't send them.
    if ( 'createdAt' === key ||
         'updatedAt' === key ||
         'emailVerified' === key ||
         'sessionToken' === key
    ) {
      delete json[key];

    } else {
      this._super( snapshot, json, key, attribute );
    }
  },

  serializeBelongsTo: function(snapshot, json, relationship) {
    var key         = relationship.key,
        belongsToId = snapshot.belongsTo(key, { id: true });
    
    if (belongsToId) {
      json[key] = {
        '__type'    : 'Pointer',
        'className' : this.parseClassName(relationship.type),
        'objectId'  : belongsToId
      };
    }
  },

  parseClassName: function(key) {
    if ('parseUser' === key || 'parse-user' === key) {
      return '_User';
    } else {
      return Ember.String.capitalize(Ember.String.camelize(key));
    }
  },

  serializeHasMany: function( snapshot, json, relationship ) {
    var key   = relationship.key,
      hasMany = snapshot.hasMany( key ),
      options = relationship.options,
      _this   = this;

    if ( hasMany && hasMany.get( 'length' ) > 0 ) {
      json[key] = { 'objects': [] };

      // an array is not a relationship, right?
      
      /*if ( options.relation ) {
        json[key].__op = 'AddRelation';
      }

      if ( options.array ) {
        json[key].__op = 'AddUnique';
      }*/
      
      json[key].__op = 'AddRelation';

      hasMany.forEach( function( child ) {
        json[key].objects.push({
          '__type'    : 'Pointer',
          'className' : _this.parseClassName(child.type.modelName),
          'objectId'  : child.id
        });
      });

      if ( hasMany._deletedItems && hasMany._deletedItems.length ) {
        if ( options.relation ) {
          var addOperation    = json[key],
            deleteOperation = { '__op': 'RemoveRelation', 'objects': [] };

          hasMany._deletedItems.forEach( function( item ) {
            deleteOperation.objects.push({
              '__type'    : 'Pointer',
              'className' : item.type,
              'objectId'  : item.id
            });
          });

          json[key] = { '__op': 'Batch', 'ops': [addOperation, deleteOperation] };
        }

        if ( options.array ) {
          json[key].deleteds = { '__op': 'Remove', 'objects': [] };

          hasMany._deletedItems.forEach( function( item ) {
            json[key].deleteds.objects.push({
              '__type'    : 'Pointer',
              'className' : item.type,
              'objectId'  : item.id
            });
          });
        }
      }

    } else {
      json[key] = null;
    }
  }

});
