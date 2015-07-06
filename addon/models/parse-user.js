import Ember from 'ember';
import DS from 'ember-data';

/**
 * Parse User object implementation
 *
 * @type {DS.ParseModel}
 */
var ParseUser = DS.Model.extend({
  username      : DS.attr( 'string' ),
  password      : DS.attr( 'string' ),
  email         : DS.attr( 'string' ),
  emailVerified : DS.attr( 'boolean' ),
  sessionToken  : DS.attr( 'string' ),
  createdAt     : DS.attr( 'date' ),
  updatedAt     : DS.attr( 'date' )
});

ParseUser.reopenClass({
  requestPasswordReset: function( email ) {
    var adapter = this.get( 'store' ).adapterFor( 'parse-user' ),
        data    = { email: email, _method: 'POST' };

    return adapter.ajax( adapter.buildURL( 'requestPasswordReset' ), 'POST', { data:data } )['catch'] (
      function( response ) {
        return Ember.RSVP.reject( response.responseJSON );
      }
    );
  },

  login: function( store, data ) {
    var model      = this,
        adapter    = store.adapterFor( 'application' ),
        serializer = store.serializerFor( 'parse-user' );

    data._method = 'GET';

    if ( Ember.isEmpty( this.typeKey ) ) {
      throw new Error( 'Parse login must be called on a model fetched via store.modelFor' );
    }

    return adapter.ajax( adapter.buildURL( 'login' ), 'POST', { data: data } ).then(
      function( response ) {
        serializer.normalize( model, response );
        var record = store.push( 'parse-user', response );
        return record;
      },
      function( response ) {
        return Ember.RSVP.reject( response.responseJSON );
      }
    );
  },

  signup: function( store, data ) {
    var model      = this,
        adapter    = store.adapterFor( 'parse-user' ),
        serializer = store.serializerFor( 'parse-user' );

    data['_method'] = 'POST';

    if ( Ember.isEmpty( this.typeKey ) ) {
      throw new Error( 'Parse signup must be called on a model fetched via store.modelFor' );
    }

    return adapter.ajax( adapter.buildURL( model.modelName ), 'POST', { data: data } ).then(
      function( response ) {
        serializer.normalize( model, response );
        response.email = response.email || data.email;
        response.username = response.username || data.username;
        var record = store.push( 'parse-user', response );
        return record;
      },
      function( response ) {
        return Ember.RSVP.reject( response.responseJSON );
      }
    );
  }
});

export default ParseUser;
