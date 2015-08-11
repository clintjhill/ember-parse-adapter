import Ember from 'ember';
import DS from 'ember-data';

export default DS.RESTSerializer.extend({

  primaryKey: 'objectId',

  extractArray: function( store, primaryType, payload ) {
    var namespacedPayload = {};
    namespacedPayload[ Ember.String.pluralize( primaryType.typeKey ) ] = payload.results;

    return this._super( store, primaryType, namespacedPayload );
  },

  extractSingle: function( store, primaryType, payload, recordId ) {
    var namespacedPayload = {};
    namespacedPayload[ primaryType.typeKey ] = payload; // this.normalize(primaryType, payload);

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
  extract: function( store, type, payload, id, requestType ) {
    if( id !== null && ( 'updateRecord' === requestType || 'deleteRecord' === requestType ) ) {
      payload[ this.get( 'primaryKey' ) ] = id;
    }

    return this._super( store, type, payload, id, requestType );
  },

  /**
  * Extracts count from the payload so that you can get the total number
  * of records in Parse if you're using skip and limit.
  */
  extractMeta: function( store, type, payload ) {
    if ( payload && payload.count ) {
      store.setMetadataFor( type, { count: payload.count } );
      delete payload.count;
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

  /**
  * Special handling of the Parse relation types. In certain
  * conditions there is a secondary query to retrieve the "many"
  * side of the "hasMany".
  */
  normalizeRelationships: function( type, hash ) {
    var store      = this.get('store'),
      serializer = this;

    type.eachRelationship( function( key, relationship ) {

      var options = relationship.options;

      // Handle the belongsTo relationships
      if ( hash[key] && 'belongsTo' === relationship.kind ) {
        hash[key] = hash[key].objectId;
      }

      // Handle the hasMany relationships
      if ( hash[key] && 'hasMany' === relationship.kind ) {

        // If this is a Relation hasMany then we need to supply
        // the links property so the adapter can async call the
        // relationship.
        // The adapter findHasMany has been overridden to make use of this.
        //if(options.relation) {
          // hash[key] contains the response of Parse.com: eg {__type: Relation, className: MyParseClassName}
          // this is an object that make ember-data fail, as it expects nothing or an array ids that represent the records
          hash[key] = [];

          // ember-data expects the link to be a string
          // The adapter findHasMany will parse it
          if (!hash.links) {
            hash.links = {};
          }

          hash.links[key] = JSON.stringify({typeKey: relationship.type.typeKey, key: key});
        //}

        if ( options.array ) {
          // Parse will return [null] for empty relationships
          if ( hash[key].length && hash[key] ) {
            hash[key].forEach( function( item, index, items ) {
              // When items are pointers we just need the id
              // This occurs when request was made without the include query param.
              if ( 'Pointer' === item.__type ) {
                items[index] = item.objectId;

              } else {
                // When items are objects we need to clean them and add them to the store.
                // This occurs when request was made with the include query param.
                delete item.__type;
                delete item.className;
                item.id = item.objectId;
                delete item.objectId;
                item.type = relationship.type;
                serializer.normalizeAttributes( relationship.type, item );
                serializer.normalizeRelationships( relationship.type, item );
                store.push( relationship.type, item );
              }
            });
          }
        }
      }
    }, this );

    this._super( type, hash );
  },

  serializeIntoHash: function( hash, type, snapshot, options ) {
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
    if ('parseUser' === key) {
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
          'className' : _this.parseClassName(child.type.typeKey),
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
