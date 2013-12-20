var ParseUserModel = DS.ParseUserModel = ParseModel.extend({
  username: DS.attr('string'),
  password: DS.attr('string'),
  email: DS.attr('string'),
  emailVerified: DS.attr('boolean'),
  sessionToken: DS.attr('string'),

  isCurrent: Ember.computed.bool('currentUser'),
  
  _persist: function(data){
    var instance = this;
    var adapter = this.get('store').adapterFor(this.constructor);
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
    }
  },

  /**
   * Sign up functionality. The afterSignUp callback will be called
   * with a data object that either has the sign up details
   * (session token, username, objectId) or the error details.
   * Error details are the same as the Parse REST API error details.
   */
  signUp: function(afterSignUp){
    var instance = this;
    var adapter = this.get('store').adapterFor(this.constructor);
    var newUser = {
      username: this.get('username'),
      password: this.get('password'),
      email: this.get('email')
    };
    adapter.ajax(adapter.buildURL(this.constructor.typeKey), "POST", {data: newUser}).then(
      function(data){
        instance._persist(data);
        afterSignUp(data);
      },
      function(data){
        instance._persist(null);
        afterSignUp(data);
      }
    );
  },

  /**
   * Login functionality. The afterLogin callback will be called
   * with a data object that either has the login details
   * (session token, username, objectId) or the error details.
   * Error details are the same as the Parse REST API error details.
   */
  login: function(afterLogin){
    var instance = this;
    var adapter = this.get('store').adapterFor(this.constructor);
    var user = {
      username: this.get('username'),
      password: this.get('password')
    };
    adapter.ajax(adapter.buildURL("login"), "GET", {data: user}).then(
      function(data){
        instance._persist(data);
        afterLogin(data);
      },
      function(data){
        instance._persist(null);
        afterLogin(data);
      }
    );
  }, 

  logout: function(){
    this._persist(null);
  },

  requestPasswordReset: function(){
    var adapter = this.get('store').adapterFor(this.constructor);
    var user = { email: this.get('email') };
    adapter.ajax(adapter.buildURL("requestPasswordReset"), "POST", {data:user});
  },

  /**
   * Overriding the save functionality to assure that if the user object
   * is the 'current' user, then supply the session token header to allow
   * data to be saved.
   */
  save: function(){
    if(typeof(localStorage) !== undefined){
      var emberParseUser = JSON.parse(localStorage.getItem("ember_parse_user"));
      var id = this.get('id');
      var adapter = this.get('store').adapterFor(this.constructor);
      var headers = adapter.get('headers');
      if(id === emberParseUser.userId){
        //TODO: Is there a more reliable way to grab session?
        headers["X-Parse-Session-Token"] = this.get('sessionToken') || emberParseUser.session;
        adapter.set('headers', headers);
      }
    }
    this._super();
  }
});
