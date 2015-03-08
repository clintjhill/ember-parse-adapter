import Ember from 'ember';
import DS from 'ember-data';
import Adapter from 'ember-parse-adapter/adapters/application';
import Serializer from 'ember-parse-adapter/serializers/application';
import ParseUserImport from 'ember-parse-adapter/models/parse-user';

var buildContainer = function() {
        var container = new Ember.Container();
        DS._setupContainer( container );

        container.register( 'adapter:-parse', Adapter );
        container.register( 'serializer:-parse', Serializer );
        container.register( 'model:parse-user', ParseUserImport.extend({
            nickname: DS.attr( 'string' )
        }));

        return container;
    },
    get = Ember.get,
    set = Ember.set,
    container,
    adapter,
    serializer,
    store,
    ajaxUrl,
    ajaxType,
    ajaxHash,
    ParseUser;

module( 'Unit - model:parse-user', {
    beforeEach: function() {
        ajaxUrl = undefined;
        ajaxType = undefined;
        ajaxHash = undefined;

        container = buildContainer();

        container.register( 'adapter:application', Adapter.extend({
            ajax: function( url, method, hash ) {
                return new Ember.RSVP.Promise( function( res, rej ) {
                    hash = hash || {};
                    var success = hash.success;

                    hash.context = adapter;

                    ajaxUrl = url;
                    ajaxType = method;
                    ajaxHash = hash;

                    hash.success = function( json ) {
                        Ember.run( function() {
                            res(json);
                        });
                    };

                    hash.error = function( xhr ) {
                        Ember.run( function() {
                            rej(xhr);
                        });
                    };
                });
            }
        }));

        store = container.lookup( 'store:main' );
        adapter = container.lookup( 'adapter:application' );
        serializer = container.lookup( 'serializer:-parse' );

        ParseUser = store.modelFor( 'parse-user' );
    },

    afterEach: function() {
        Ember.run( container, 'destroy' );
    }
});

test( 'Signup', function( assert ) {
    var promise;

    Ember.run( function() {
        promise = ParseUser.signup( store, {
            username : 'clintjhill',
            password : 'loveyouall',
            email    : 'clint@foo.com'
        });
    });

    assert.equal( ajaxUrl, 'https://api.parse.com/1/users', 'The Parse API version and user path' );
    assert.equal( ajaxType, 'POST' );
    assert.deepEqual( ajaxHash.data, {
        username : 'clintjhill',
        password : 'loveyouall',
        email    : 'clint@foo.com'
    }, 'the hash was passed along' );

    ajaxHash.success({
        'createdAt'    : '2011-11-07T20:58:34.448Z',
        'objectId'     : 'g7y9tkhB7O',
        'sessionToken' : 'pnktnjyb996sj4p156gjtp4im'
    });

    Ember.run( function() {
        promise.then( function( user ) {
            assert.ok( !get( user, 'isSaving'), 'user is not saving' );
            assert.ok( !get( user, 'isDirty'), 'user is not dirty' );
            assert.equal( get( user, 'id'), 'g7y9tkhB7O', 'Be sure objectId is set.' );
            assert.equal( get( user, 'password'), null, 'Be sure that password gets dumped.' );
            assert.equal( get( user, 'sessionToken'), 'pnktnjyb996sj4p156gjtp4im', 'Make sure session token set.' );
        });
    });
});

test( 'Signup with Facebook', function( assert ) {
    var expirationDate = ( new Date() ).toISOString(),
        promise;

    Ember.run( function() {
        promise = ParseUser.signup( store, {
            authData: {
                facebook: {
                    access_token    : 'some-fake-token',
                    id              : 'some-id',
                    expiration_date : expirationDate
                }
            }
        });
    });

    assert.equal( ajaxUrl, 'https://api.parse.com/1/users', 'The Parse API version and user path' );
    assert.equal( ajaxType, 'POST' );
    assert.deepEqual( ajaxHash.data, {
        authData: {
            facebook: {
                access_token    : 'some-fake-token',
                id              : 'some-id',
                expiration_date : expirationDate
            }
        }
    }, 'the hash was passed along' );

    ajaxHash.success({
        'authData'     : {},
        'createdAt'    : '2011-11-07T20:58:34.448Z',
        'objectId'     : 'g7y9tkhB7O',
        'sessionToken' : 'pnktnjyb996sj4p156gjtp4im',
        'username'     : 'foofoo-username'
    });

    Ember.run( function() {
        promise.then( function( user ) {
            assert.ok( !get( user, 'isSaving' ), 'user is not saving' );
            assert.ok( !get( user, 'isDirty' ), 'user is not dirty' );
            assert.equal( get( user, 'id' ), 'g7y9tkhB7O', 'Be sure objectId is set.' );
            assert.equal( get( user, 'password' ), null, 'Be sure that password gets dumped.' );
            assert.equal( get( user, 'sessionToken' ), 'pnktnjyb996sj4p156gjtp4im', 'Make sure session token set.' );
            assert.equal( get( user, 'username' ), 'foofoo-username', 'Make sure username set.' );
        });
    });
});

test( 'Find', function( assert ) {
    var user;

    Ember.run( function() {
        user = store.find( 'parse-user', 'h8mgfgL1yS' );
    });

    assert.ok( !get( user, 'isLoaded' ) );
    assert.equal( ajaxUrl, 'https://api.parse.com/1/users/h8mgfgL1yS', 'The Parse API version and user path' );
    assert.equal( ajaxType, 'GET' );

    ajaxHash.success({
        'createdAt' : '2011-11-07T20:58:34.448Z',
        'objectId'  : 'h8mgfgL1yS',
        'username'  : 'clintjhill'
    });

    assert.ok( get( user, 'isLoaded') );
    assert.ok( !get( user, 'isCurrent' ), 'User should not be current during a find.' );
});

test( 'Login', function( assert ) {
    var user,
        promise;

    Ember.run( function() {
        promise = ParseUser.login( store, {username: 'clint', password: 'loveyouall'} );
    });

    assert.equal( ajaxUrl, 'https://api.parse.com/1/login', 'The Parse API version and user path' );
    assert.equal( ajaxType, 'GET');
    assert.deepEqual(ajaxHash.data, {
        username : 'clint',
        password : 'loveyouall'
    });

    ajaxHash.success({
        'username'     : 'clint',
        'createdAt'    : '2011-11-07T20:58:34.448Z',
        'updatedAt'    : '2011-11-07T20:58:34.448Z',
        'objectId'     : 'g7y9tkhB7O',
        'sessionToken' : 'pnktnjyb996sj4p156gjtp4im'
    });

    Ember.run( function() {
        promise.then( function( user ) {
            assert.ok( get( user, 'isLoaded' ) );
            assert.equal( get( user, 'password' ), null, 'Be sure that password gets dumped.' );
        });
    });
});

QUnit.skip( 'Password Reset Request', function( assert ) {
    var User,
    user,
    expectState,
    expectType,
    expectUrl;

    store.load( User, {objectId: 'aid8nalX'} );

    user = store.find( User, 'aid8nalX' );

    // expected events
    user.on( 'requestingPasswordReset', function() {
        // while password reset request is being sent
        expectState( 'passwordResetting' );
    });

    user.on( 'didRequestPasswordReset', function() {
        // password reset request happened
        expectState( 'loaded' );
    });

    // reset it
    user.requestPasswordReset( 'clint.hill@gmail.com' );

    expectType( 'POST' );
    expectUrl( '/1/requestPasswordReset', 'Request password path from Parse.' );
    expectState( 'passwordResetting' );
    ajaxHash.success();
    expectState( 'loaded' );
});

QUnit.skip( 'Update (batch) - Session token handling', function( assert ) {
    var allowsUpdate,
        noUpdates,
        User,
        expectState;

    store.loadMany( User, [
        {objectId: 'xuF8hlkrg', username: 'clintjhill', email: 'nope@yep.com'},
        {objectId: 'inol8HFer', username: 'clinthill', email: 'yep@nope.com', sessionToken: 'ivegotasession'}
    ]);

    allowsUpdate = store.find( User, 'inol8HFer' );
    noUpdates = store.find( User, 'xuF8hlkrg' );

    allowsUpdate.set( 'password', 'notHacked' );
    noUpdates.set( 'password', 'youGotHacked' );

    expectState( 'dirty', true, allowsUpdate );
    expectState( 'dirty', true, noUpdates );

    store.commit();

    ajaxHash.success([
        {success: {updatedAt: (new Date()).toISOString()}},
        {error: {code: 101, error: 'some message'}}
    ]);

    expectState( 'error', true, noUpdates );
    expectState( 'loaded', true, allowsUpdate );
});

test( 'Subclassing Parse User', function( assert ) {
    var user,
        promise;

    Ember.run( function() {
        promise = ParseUser.login( store, {username: 'clint', password: 'loveyouall', nickname: 'rick'} );
    });

    assert.deepEqual( ajaxHash.data, {
        username: 'clint',
        password: 'loveyouall',
        nickname: 'rick'
    });

    ajaxHash.success({
        'username': 'clint',
        'nickname': 'rick',
        'createdAt': '2011-11-07T20:58:34.448Z',
        'updatedAt': '2011-11-07T20:58:34.448Z',
        'objectId': 'g7y9tkhB7O',
        'sessionToken': 'pnktnjyb996sj4p156gjtp4im'
    });

    Ember.run( function() {
        promise.then( function( user ) {
          assert.ok( get( user, 'isLoaded' ) );
          assert.equal( get( user, 'nickname' ), 'rick', 'Additional attributes are added.' );
        });
    });
});