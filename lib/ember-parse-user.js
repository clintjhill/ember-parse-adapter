/**
 * Parse User object implementation
 * @type {DS.ParseModel}
 */
var ParseUserModel = DS.ParseUserModel = ParseModel.extend({
  username: DS.attr('string'),
  password: DS.attr('string'),
  email: DS.attr('string'),
  emailVerified: DS.attr('boolean'),
  sessionToken: DS.attr('string'),
  currentUser: DS.attr('boolean'),

  isCurrent: Ember.computed.bool('currentUser'),
  
  logout: function(){
    var adapter = this.get('store').adapterFor(this.constructor);
    this.set("currentUser", false);
    this._setCurrent(adapter, null);
  },

  requestPasswordReset: function(afterReset){
    var adapter = this.get('store').adapterFor(this.constructor);
    var user = { email: this.get('email') };
    adapter.ajax(adapter.buildURL("requestPasswordReset"), "POST", {data:user}).then(
      function(data){ afterReset(data); },
      function(data){ afterReset(data.responseJSON); }
    );
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
        headers["X-Parse-Session-Token"] = this.get('sessionToken') || emberParseUser.session;
        adapter.set('headers', headers);
      }
    }
    return this._super();
  },

  _setCurrent: function(adapter, data){
    ParseUserModel._setCurrent(adapter, data);
  }
});

ParseUserModel.reopenClass({

  _setCurrent: function(adapter, data){
    var headers = adapter.get('headers');
    if(data){
      headers["X-Parse-Session-Token"] = data.sessionToken;
      if(typeof(localStorage) !== 'undefined'){
        var local = { session: data.sessionToken, userId: data.id };
        localStorage.setItem("ember_parse_user", JSON.stringify(local));  
      }
    } else {
      delete headers["X-Parse-Session-Token"];
      if(typeof(localStorage) !== 'undefined'){
        localStorage.removeItem("ember_parse_user");
      }
    }
    adapter.set('headers', headers);
  },

  login: function(username, password){
    if(Ember.isEmpty(this.typeKey)){
      this.typeKey = this.parseClassName().toLowerCase();
    }
    var model = this;
    var store = ParseUserModel.store;
    var adapter = store.adapterFor(model);
    var serializer = store.serializerFor(model.typeKey);
    var user = { username: username, password: password };
    return new Ember.RSVP.Promise(function(resolve, reject){
      adapter.ajax(adapter.buildURL("login"), "GET", {data: user}).then(
        function(data){
          serializer.normalize(model, data);
          data.currentUser = true;
          var record = store.push(model.typeKey, data);
          ParseUserModel._setCurrent(adapter, data);
          resolve(record);
        },
        function(data){
          ParseUserModel._setCurrent(adapter, null);
          reject(data.responseJSON); 
        }
      );
    });
  },

  signup: function(username, password, email){
    if(Ember.isEmpty(this.typeKey)){
      this.typeKey = this.parseClassName().toLowerCase();
    }
    var model = this;
    var store = ParseUserModel.store;
    var adapter = store.adapterFor(model);
    var serializer = store.serializerFor(model.typeKey);
    var newUser = { username: username, password: password, email: email };
    return new Ember.RSVP.Promise(function(resolve, reject){
      adapter.ajax(adapter.buildURL(model.typeKey), "POST", {data: newUser}).then(
        function(data){
          serializer.normalize(model, data);
          data.currentUser = true;
          data.email = email;
          data.username = username;
          var record = store.push(model.typeKey, data);
          ParseUserModel._setCurrent(adapter, data);
          resolve(record);
        },
        function(data){
          ParseUserModel._setCurrent(adapter, null);
          reject(data.responseJSON); 
        }
      );
    });
  }
});

ParseUserModel.reopenClass({
  parseClassName: function(){
    return "_User";
  }
});

Ember.onLoad("Ember.Application", function(Application){
  Application.initializer({
    name: "parseUserStore",
    initialize: function(container, application){
      var store = container.lookup("store:main");
      DS.ParseUserModel.store = store;
    }
  });
});
