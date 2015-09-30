import Ember from 'ember';
import DS from 'ember-data';

/****************************************************************************
/* PROPERTIES
/***************************************************************************/

/**
 * Parse User
 * @type {DS.ParseModel}
 */
var ParseUser = DS.Model.extend({
  username      : DS.attr('string'),
  password      : DS.attr('string'),
  email         : DS.attr('string'),
  emailVerified : DS.attr('boolean'),
  sessionToken  : DS.attr('string'),
  createdAt     : DS.attr('date'),
  updatedAt     : DS.attr('date')
});

/****************************************************************************
/* ACTIONS
/***************************************************************************/

ParseUser.reopenClass({
  requestPasswordReset: function(email) {
    var adapter = this.get('store').adapterFor('parse-user'),
        data    = {email: email};

    return adapter.ajax(adapter.buildURL('requestPasswordReset'), 'POST', {data:data} )['catch'] (
      function(response) {
        return Ember.RSVP.reject(response.responseJSON);
      }
    );
  },

  login: function(store, data) {
    var model      = this,
        adapter    = store.adapterFor('parse-user'),
        serializer = store.serializerFor('parse-user');

    if (Ember.isEmpty(this.modelName)) {
      throw new Error('Parse login must be called on a model fetched via store.modelFor');
    }

    return adapter.ajax(adapter.buildURL('login'), 'GET', {data: data}).then(
      function(response) {
        var serialized = serializer.normalize(model, response),
            record = store.push(serialized);
        return record;
      },
      function(response) {
        return Ember.RSVP.reject( response.responseJSON );
      }
    );
  },

  signup: function(store, data) {
    var model      = this,
        adapter    = store.adapterFor('parse-user'),
        serializer = store.serializerFor('parse-user');

    if (Ember.isEmpty(this.modelName)) {
      throw new Error('Parse signup must be called on a model fetched via store.modelFor');
    }

    return adapter.ajax(adapter.buildURL(model.modelName), 'POST', {data: data}).then(
      function(response) {

        //var serialized = serializer.normalize( model, response ),
        //    record = store.push( serialized );

        var serialized = serializer.normalize(model, response);
        Ember.merge(serialized.data.attributes, data);
        var record = store.push(serialized);

        return record;
      },
      function(response) {
        console.log(response);
        return Ember.RSVP.reject( response.responseJSON );
      }
    );
  }
});

export default ParseUser;
