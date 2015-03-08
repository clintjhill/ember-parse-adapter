import Ember from 'ember';
import DS from 'ember-data';

export default DS.RESTAdapter.extend({

    defaultSerializer: '-parse',

    init: function(){
        this._super();

        this.set( 'headers', {
            'X-Parse-Application-Id' : Ember.get( this, 'applicationId' ),
            'X-Parse-REST-API-Key'   : Ember.get( this, 'restApiId' )
        });
    },

    host: 'https://api.parse.com',

    namespace: '1',

    classesPath: 'classes',

    pathForType: function( type ) {
        if ( 'parseUser' === type ) {
            return 'users';
        } else if ( 'login' === type ) {
            return 'login';
        } else {
            return this.classesPath + '/' + this.parsePathForType( type );
        }
    },

    // Using TitleStyle is recommended by Parse
    // @TODO: test
    parsePathForType: function( type ) {
        return Ember.String.capitalize( Ember.String.camelize( type ) );
    },

    /**
    * Because Parse doesn't return a full set of properties on the
    * responses to updates, we want to perform a merge of the response
    * properties onto existing data so that the record maintains
    * latest data.
    */
    createRecord: function( store, type, record ) {
        var serializer = store.serializerFor( type.typeKey ),
            data       = {},
            adapter    = this;

        serializer.serializeIntoHash( data, type, record, { includeId: true } );

        return new Ember.RSVP.Promise( function( resolve, reject ) {
            adapter.ajax( adapter.buildURL( type.typeKey ), 'POST', { data: data } ).then(
                function( json ) {
                    var completed = Ember.merge( data, json );
                    resolve( completed );
                },
                function( reason ) {
                    reject( reason.responseJSON );
                  }
            );
        });
    },

    /**
    * Because Parse doesn't return a full set of properties on the
    * responses to updates, we want to perform a merge of the response
    * properties onto existing data so that the record maintains
    * latest data.
    */
    updateRecord: function(store, type, record) {
        var serializer  = store.serializerFor( type.typeKey ),
            id          = record.get( 'id' ),
            sendDeletes = false,
            deleteds    = {},
            data        = {},
            adapter     = this;

        serializer.serializeIntoHash(data, type, record);

        type.eachRelationship(function( key ) {
            if ( data[key] && data[key].deleteds ) {
                deleteds[key] = data[key].deleteds;
                delete data[key].deleteds;
                sendDeletes = true;
            }
        });

        return new Ember.RSVP.Promise( function( resolve, reject ) {
            if ( sendDeletes ) {
                adapter.ajax( adapter.buildURL( type.typeKey, id ), 'PUT', { data: deleteds } ).then(
                    function() {
                        adapter.ajax( adapter.buildURL( type.typeKey, id ), 'PUT', { data: data } ).then(
                            function( updates ) {
                                // This is the essential bit - merge response data onto existing data.
                                resolve( Ember.merge( data, updates ) );
                            },
                            function( reason ) {
                                reject( 'Failed to save parent in relation: ' + reason.response.JSON );
                            }
                        );
                    },
                    function( reason ) {
                        reject( reason.responseJSON );
                    }
                );

            } else {
                adapter.ajax( adapter.buildURL( type.typeKey, id ), 'PUT', { data: data } ).then(
                    function( json ) {
                        // This is the essential bit - merge response data onto existing data.
                        resolve( Ember.merge( data, json ) );
                    },
                    function( reason ) {
                        reject( reason.responseJSON );
                    }
                );
            }
        });
    },

    parseClassName: function (key ) {
        return Ember.String.capitalize( key );
    },

    /**
    * Implementation of a hasMany that provides a Relation query for Parse
    * objects.
    */
    findHasMany: function( store, record, relatedInfo ) {
        var query = {
                where: {
                    '$relatedTo': {
                        'object': {
                            '__type'    : 'Pointer',
                            'className' : this.parseClassName( record.typeKey ),
                            'objectId'  : record.get( 'id' )
                        },
                        key: relatedInfo.key
                    }
                }
        };

        // the request is to the related type and not the type for the record.
        // the query is where there is a pointer to this record.
        return this.ajax( this.buildURL( relatedInfo.type.typeKey ), 'GET', { data: query } );
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
    findQuery: function ( store, type, query ) {
        if ( query.where && 'string' !== Ember.typeOf( query.where ) ) {
            query.where = JSON.stringify( query.where );
        }

        // Pass to _super()
        return this._super( store, type, query );
    },

    sessionToken: Ember.computed( 'headers.X-Parse-Session-Token', function( key, value ) {
        if ( arguments.length < 2 ) {
          return this.get( 'headers.X-Parse-Session-Token' );
        } else {
          this.set( 'headers.X-Parse-Session-Token', value );
          return value;
        }
    })
});
