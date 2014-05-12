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
  updatedAt: DS.attr('date'),

  logout: function(){
    var adapter = this.get('store').adapterFor(this.constructor);
  },

  requestPasswordReset: function(afterReset){
    var adapter = this.get('store').adapterFor(this.constructor);
    var user = { email: this.get('email') };
    adapter.ajax(adapter.buildURL("requestPasswordReset"), "POST", {data:user}).then(
      function(data){ afterReset(data); },
      function(data){ afterReset(data.responseJSON); }
    );
  }

});

EmberParseAdapter.ParseUser.reopenClass({

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
