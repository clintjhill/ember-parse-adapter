var get = Ember.get, set = Ember.set;

var App, adapter, serializer, store, ajaxUrl, ajaxType, ajaxHash;
var User, user;

module("Ember Data Adapter for Parse: User", {
  setup: function(){

    ajaxUrl = undefined;
    ajaxType = undefined;
    ajaxHash = undefined;

    App = Ember.Namespace.create();

    adapter = ParseAdapter.create({
      ajax: function(type, url, hash) {
        var success = hash.success, self = this;

        ajaxUrl = url;
        ajaxType = type;
        ajaxHash = hash;

        if (success) {
          hash.success = function(json) {
            success.call(self, json);
          };
        }
      }
    });

    serializer = get(adapter, 'serializer');

    store = DS.Store.create({
      adapter: adapter
    });

    User = App.User = ParseUser.extend({
      name: DS.attr('string')
    });

  },
  teardown: function(){
    if(user){
      user.destroy();
      user = null;
    }
    adapter.destroy();
    store.destroy();
    App.destroy();
  }
});


test("Signup", function(){
  user = store.createRecord(User, {name: 'Clint'});
  expectState('dirty');
  expectState('new');
  user.signup({username: 'clintjhill', password: 'loveyouall'});
  expectState('saving');
  expectUrl("/1/users");
  expectType("POST");
  expectData({
    username: 'clintjhill',
    password: 'loveyouall',
    name: 'Clint',
    sessionToken: null,
    email: null,
    createdAt: undefined,
    updatedAt: undefined
  });
  ajaxHash.success({
    "createdAt": "2011-11-07T20:58:34.448Z",
    "objectId": "g7y9tkhB7O",
    "sessionToken": "pnktnjyb996sj4p156gjtp4im"
  });
  expectState('saving', false);
  expectState('dirty', false);
  equal(user.get('id'), 'g7y9tkhB7O', "Be sure objectId is set.");
  equal(user.get('password'), null, "Be sure that password gets dumped.");
  equal(user.get('sessionToken'), 'pnktnjyb996sj4p156gjtp4im', "Make sure session token set.");
  ok(user.get('isCurrent'), "Be sure user is current user.");
});

test("Find", function(){
  user = store.find(User, 'h8mgfgL1yS');
  expectState('loaded', false);
  expectUrl("/1/users/h8mgfgL1yS");
  expectType('GET');
  ajaxHash.success({
    "createdAt": "2011-11-07T20:58:34.448Z",
    "objectId": "h8mgfgL1yS",
    "username": "clintjhill"
  });
  expectState('loaded');
  equal(user.get('isCurrent'), false, "User should not be current during a find.");
});

test("Login", function(){
  user = store.createRecord(User);
  user.login({username: 'clint', password: 'loveyouall'});
  expectUserState('dirty');
  expectUserState('new');
  expectUrl("/1/login?username=clint&password=loveyouall");
  expectType("GET");
  ajaxHash.success({
    "username": "clint",
    "createdAt": "2011-11-07T20:58:34.448Z",
    "updatedAt": "2011-11-07T20:58:34.448Z",
    "objectId": "g7y9tkhB7O",
    "sessionToken": "pnktnjyb996sj4p156gjtp4im"
  });
  expectState('loaded');
  ok(user.get('isCurrent'), "Should be current user after login.");
  equal(user.get('password'), null, "Be sure that password gets dumped.");
});

test("Password Reset Request", function(){
  store.load(User, {objectId: 'aid8nalX'});
  user = store.find(User, 'aid8nalX');
  // expected events
  user.on('requestingPasswordReset', function(){
    // while password reset request is being sent
    expectState('passwordResetting');
  });
  user.on('didRequestPasswordReset', function(){
    // password reset request happened
    expectState('loaded');
  });
  // reset it
  user.requestPasswordReset('clint.hill@gmail.com');
  expectType("POST");
  expectUrl("/1/requestPasswordReset", "Request password path from Parse.");
  expectState('passwordResetting');
  ajaxHash.success();
  expectState('loaded');
});

test("Update (batch) - Session token handling", function(){
  store.loadMany(User, [
    {objectId: 'xuF8hlkrg', username: 'clintjhill', email: 'nope@yep.com'},
    {objectId: 'inol8HFer', username: 'clinthill', email: 'yep@nope.com', sessionToken: 'ivegotasession'}
  ]);
  var allowsUpdate = store.find(User, 'inol8HFer');
  var noUpdates = store.find(User, 'xuF8hlkrg');

  allowsUpdate.set('password', 'notHacked');
  noUpdates.set('password', 'youGotHacked');

  expectState('dirty', true, allowsUpdate);
  expectState('dirty', true, noUpdates);

  store.commit();

  ajaxHash.success([
    {success: {updatedAt: (new Date()).toISOString()}},
    {error: {code: 101, error: 'some message'}}
  ]);

  expectState('error', true, noUpdates);
  expectState('loaded', true, allowsUpdate);

});
