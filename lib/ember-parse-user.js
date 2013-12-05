var ParseUserModel = DS.ParseUserModel = ParseModel.extend({
  username: DS.attr('string'),
  password: DS.attr('string'),
  email: DS.attr('string'),
  emailVerified: DS.attr('boolean'),
  sessionToken: DS.attr('string'),

  isCurrent: Ember.computed.bool('currentUser'),
  
  _persist: function(data){
    var instance = this;
    var adapter = this.get('store').get('defaultAdapter');
    var headers = adapter.get('headers');
    if(data){
      data.id = data.objectId;
      instance.setProperties(data);
      instance.transitionTo('isLoaded');
      headers["X-Parse-Session-Token"] = data.sessionToken;
      adapter.set('headers', headers);
    }
    if(typeof(localStorage) !== undefined){
      if(!data){
        this.set('currentUser', false);
        localStorage.removeItem("ember_parse_user");    
      } else {
        this.set('currentUser', true);
        var local = { session: data.sessionToken, userId: data.objectId };
        localStorage.setItem("ember_parse_user", JSON.stringify(local));  
      }
    } else {
      //TODO: Do we want to support cookies ...
    }
  },

  signUp: function(afterSignUp){
    var instance = this;
    var adapter = this.get('store').get('defaultAdapter');
    var newUser = {
      username: this.get('username'),
      password: this.get('password'),
      email: this.get('email')
    };
    adapter.ajax(adapter.buildURL(this.constructor.typeKey), "POST", {data: newUser}).then(
      function(data){
        instance._persist(data);
      },
      function(data){
        instance._persist(null);
      }
    ).then(afterSignUp);
  },

  login: function(afterLogin){
    var instance = this;
    var adapter = this.get('store').get('defaultAdapter');
    var user = {
      username: this.get('username'),
      password: this.get('password')
    };
    adapter.ajax(adapter.buildURL("login"), "GET", {data: user}).then(
      function(data){
        instance._persist(data);
      },
      function(data){
        instance._persist(null);
      }
    ).then(afterLogin);
  }, 

  requestPasswordReset: function(){
    var adapter = this.get('store').get('defaultAdapter');
    var user = { email: this.get('email') };
    adapter.ajax(adapter.buildURL("requestPasswordReset"), "POST", {data:user});
  }

});
