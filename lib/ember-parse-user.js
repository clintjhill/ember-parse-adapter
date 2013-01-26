/**
 * An implementation of the User object provided from Parse.
 * @type {ParseModel}
 */
var ParseUser = DS.ParseUser = ParseModel.extend({

  username: DS.attr('string'),
  email: DS.attr('string'),
  password: DS.attr('string'),
  sessionToken: DS.attr('string'),

  /**
   * Implementation of the signup process from Parse.
   * See: https://parse.com/docs/rest#users-signup
   * @param  {Object} attrs optional hash of User username and password
   */
  signup: function(attrs){
    var username = (attrs && attrs.username) || this.get("username"),
      password = (attrs && attrs.password) || this.get("password"),
      store = this.store,
      adapter = this.store.adapter,
      data,
      record = this;

    if(!username && !password){
      throw 'Hey - you cannot signup without all this stuff man!';
    }

    this.set('username', username);
    this.set('password', password);

    // make this model conform to states
    this.send('willCommit');

    data = adapter.get('serializer').serialize(this);

    adapter.request("POST", ParseUser.toString(), data, {
      url: "users",
      success: function(result){
        Ember.run(adapter, function(){
          // dump the password
          delete data.password;
          $.extend(data, result);
          adapter.didCreateRecord(store, record.constructor, record, adapter.makeRootObject(record.constructor, data));
        });
      },
      error: function(result){
        // TODO: Errors to handle
        // {"code":202,"error":"username clintjhill already taken"}
        // {"code":203,"error":"the email address clint.hill@goaaa.com has already been taken"}
      }
    });

  },

  /**
   * Implementation of the login process from Parse.
   * See: https://parse.com/docs/rest#users-login
   * @param  {Object} attrs hash of User username and password
   */
  login: function(attrs){
    var username = (attrs && attrs.username) || this.get("username"),
      password = (attrs && attrs.password) || this.get("password"),
      store = this.store,
      adapter = this.store.adapter,
      data,
      record = this;

    if(!username && !password){
      throw 'Hey - you cannot login without all this stuff man!';
    }

    this.set('username', username);
    this.set('password', password);

    // make this model conform to states
    this.send('willCommit');

    data = adapter.get('serializer').serialize(this);

    adapter.request("GET", ParseUser.toString(), data, {
      url: "login",
      success: function(result){
        Ember.run(adapter, function(){
          // dump the password
          delete data.password;
          $.extend(data, result);
          adapter.didCreateRecord(store, record.constructor, record, adapter.makeRootObject(record.constructor, data));
        });
      },
      error: function(result){
        // TODO: Errors to handle
        // {"code":202,"error":"username clintjhill already taken"}
        // {"code":203,"error":"the email address clint.hill@goaaa.com has already been taken"}
      }
    });
  },

  /**
   * Implementation of the current user status. Needs better work
   * @return {Boolean} whether the user is the one associated to the session token
   */
  isCurrent: function(){
    // TODO: Just because we have a session token doesn't mean we're current right?
    var sessionToken = this.get('sessionToken');
    return sessionToken !== null && sessionToken !== undefined && sessionToken !== '';
  }.property('sessionToken')

});