var get = Ember.get, set = Ember.set;

var adapter, serializer, store, ajaxUrl, ajaxType, ajaxHash;
var ParseUser;

module("Integration - Parse User", {
  setup: function(){
    ajaxUrl = undefined;
    ajaxType = undefined;
    ajaxHash = undefined;

    container = buildContainer();

    container.register("adapter:application", EmberParseAdapter.Adapter.extend({
      ajax: function(url, method, hash) {
        return new Ember.RSVP.Promise(function(res, rej){
          hash = hash || {};
          var success = hash.success;

          hash.context = adapter;

          ajaxUrl = url;
          ajaxType = method;
          ajaxHash = hash;

          hash.success = function(json) {
            Ember.run(function(){
              res(json);
            });
          };

          hash.error = function(xhr) {
            Ember.run(function(){
              rej(xhr);
            });
          };
        });
      }
    }));

    store = container.lookup("store:main");
    adapter = container.lookup("adapter:application");
    serializer = container.lookup("serializer:-parse");

    ParseUser = store.modelFor("parse-user");

  },
  teardown: function() {
    Ember.run(container, "destroy");
  }
});

test("Signup", function(){
  var promise;
  Ember.run(function(){
    promise = ParseUser.signup(store, {
      username: "clintjhill",
      password: "loveyouall",
      email: "clint@foo.com"
    });
  });
  equal(ajaxUrl, "https://api.parse.com/1/users", "The Parse API version and user path");
  equal(ajaxType, "POST");
  deepEqual(ajaxHash.data, {
    username: "clintjhill",
    password: "loveyouall",
    email: "clint@foo.com"
  }, "the hash was passed along");
  ajaxHash.success({
    "createdAt": "2011-11-07T20:58:34.448Z",
    "objectId": "g7y9tkhB7O",
    "sessionToken": "pnktnjyb996sj4p156gjtp4im"
  });
  Ember.run(function(){
    promise.then(function(user){
      ok(!get(user, "isSaving"), "user is not saving");
      ok(!get(user, "isDirty"), "user is not dirty");
      equal(get(user, "id"), "g7y9tkhB7O", "Be sure objectId is set.");
      equal(get(user, "password"), null, "Be sure that password gets dumped.");
      equal(get(user, "sessionToken"), "pnktnjyb996sj4p156gjtp4im", "Make sure session token set.");
    });
  });
});

test("Signup with Facebook", function(){
  var expirationDate = (new Date()).toISOString();
  var promise;
  Ember.run(function(){
    promise = ParseUser.signup(store, {
      authData: {
        facebook: {
          access_token: "some-fake-token",
          id: "some-id",
          expiration_date: expirationDate
        }
      }
    });
  });
  equal(ajaxUrl, "https://api.parse.com/1/users", "The Parse API version and user path");
  equal(ajaxType, "POST");
  deepEqual(ajaxHash.data, {
    authData: {
      facebook: {
        access_token: "some-fake-token",
        id: "some-id",
        expiration_date: expirationDate
      }
    }
  }, "the hash was passed along");
  ajaxHash.success({
    "authData": {},
    "createdAt": "2011-11-07T20:58:34.448Z",
    "objectId": "g7y9tkhB7O",
    "sessionToken": "pnktnjyb996sj4p156gjtp4im",
    "username": "foofoo-username"
  });
  Ember.run(function(){
    promise.then(function(user){
      ok(!get(user, "isSaving"), "user is not saving");
      ok(!get(user, "isDirty"), "user is not dirty");
      equal(get(user, "id"), "g7y9tkhB7O", "Be sure objectId is set.");
      equal(get(user, "password"), null, "Be sure that password gets dumped.");
      equal(get(user, "sessionToken"), "pnktnjyb996sj4p156gjtp4im", "Make sure session token set.");
      equal(get(user, "username"), "foofoo-username", "Make sure username set.");
    });
  });
});

test("Find", function(){
  var user;
  Ember.run(function(){
    user = store.find("parse-user", "h8mgfgL1yS");
  })
  ok(!get(user, "isLoaded"))
  equal(ajaxUrl, "https://api.parse.com/1/users/h8mgfgL1yS", "The Parse API version and user path");
  equal(ajaxType, "GET");
  ajaxHash.success({
    "createdAt": "2011-11-07T20:58:34.448Z",
    "objectId": "h8mgfgL1yS",
    "username": "clintjhill"
  });
  ok(get(user, "isLoaded"))
  ok(!get(user, "isCurrent"), "User should not be current during a find.");
});

test("Login", function(){
  var user;
  Ember.run(function(){
    promise = ParseUser.login(store, {username: "clint", password: "loveyouall"});
  });
  equal(ajaxUrl, "https://api.parse.com/1/login", "The Parse API version and user path");
  equal(ajaxType, "GET");
  deepEqual(ajaxHash.data, {
    username: "clint",
    password: "loveyouall"
  });
  ajaxHash.success({
    "username": "clint",
    "createdAt": "2011-11-07T20:58:34.448Z",
    "updatedAt": "2011-11-07T20:58:34.448Z",
    "objectId": "g7y9tkhB7O",
    "sessionToken": "pnktnjyb996sj4p156gjtp4im"
  });
  Ember.run(function(){
    promise.then(function(user){
      ok(get(user, "isLoaded"));
      equal(get(user, "password"), null, "Be sure that password gets dumped.");
    });
  })
});

pending("Password Reset Request", function(){
  store.load(User, {objectId: "aid8nalX"});
  user = store.find(User, "aid8nalX");
  // expected events
  user.on("requestingPasswordReset", function(){
    // while password reset request is being sent
    expectState("passwordResetting");
  });
  user.on("didRequestPasswordReset", function(){
    // password reset request happened
    expectState("loaded");
  });
  // reset it
  user.requestPasswordReset("clint.hill@gmail.com");
  expectType("POST");
  expectUrl("/1/requestPasswordReset", "Request password path from Parse.");
  expectState("passwordResetting");
  ajaxHash.success();
  expectState("loaded");
});

pending("Update (batch) - Session token handling", function(){
  store.loadMany(User, [
    {objectId: "xuF8hlkrg", username: "clintjhill", email: "nope@yep.com"},
    {objectId: "inol8HFer", username: "clinthill", email: "yep@nope.com", sessionToken: "ivegotasession"}
  ]);
  var allowsUpdate = store.find(User, "inol8HFer");
  var noUpdates = store.find(User, "xuF8hlkrg");

  allowsUpdate.set("password", "notHacked");
  noUpdates.set("password", "youGotHacked");

  expectState("dirty", true, allowsUpdate);
  expectState("dirty", true, noUpdates);

  store.commit();

  ajaxHash.success([
    {success: {updatedAt: (new Date()).toISOString()}},
    {error: {code: 101, error: "some message"}}
  ]);

  expectState("error", true, noUpdates);
  expectState("loaded", true, allowsUpdate);

});

module("Integration - Subclassing Parse User", {
  setup: function(){
    ajaxUrl = undefined;
    ajaxType = undefined;
    ajaxHash = undefined;

    container = buildContainer();

    container.register("adapter:application", EmberParseAdapter.Adapter.extend({
      ajax: function(url, method, hash) {
        return new Ember.RSVP.Promise(function(res, rej){
          hash = hash || {};
          var success = hash.success;

          hash.context = adapter;

          ajaxUrl = url;
          ajaxType = method;
          ajaxHash = hash;

          hash.success = function(json) {
            Ember.run(function(){
              res(json);
            });
          };

          hash.error = function(xhr) {
            Ember.run(function(){
              rej(xhr);
            });
          };
        });
      }
    }));

    container.register("model:parse-user", EmberParseAdapter.ParseUser.extend({
      nickname: DS.attr("string")
    }));

    store = container.lookup("store:main");
    adapter = container.lookup("adapter:application");
    serializer = container.lookup("serializer:-parse");

    ParseUser = store.modelFor("parse-user");

  },
  teardown: function() {
    Ember.run(container, "destroy");
  }
});

test("Login", function(){
  var user;
  Ember.run(function(){
    promise = ParseUser.login(store, {username: "clint", password: "loveyouall", nickname: "rick"});
  });
  equal(ajaxUrl, "https://api.parse.com/1/login", "The Parse API version and user path");
  equal(ajaxType, "GET");
  deepEqual(ajaxHash.data, {
    username: "clint",
    password: "loveyouall",
    nickname: "rick"
  });
  ajaxHash.success({
    "username": "clint",
    "nickname": "rick",
    "createdAt": "2011-11-07T20:58:34.448Z",
    "updatedAt": "2011-11-07T20:58:34.448Z",
    "objectId": "g7y9tkhB7O",
    "sessionToken": "pnktnjyb996sj4p156gjtp4im"
  });
  Ember.run(function(){
    promise.then(function(user){
      ok(get(user, "isLoaded"));
      equal(get(user, "password"), null, "Be sure that password gets dumped.");
      equal(get(user, "nickname"), "rick", "Additional attributes are added.");
    });
  })
});
