import Ember from 'ember';
import { test, moduleForComponent } from 'ember-qunit';
import startApp from '../../helpers/start-app';

var App;

module( 'Unit - initializer:initialize', {
    beforeEach: function() {
        App = startApp();
    },

    afterEach: function() {
        Ember.run( App, App.destroy );
    }
});

test( 'Adapter is registered on container', function( assert ) {
    assert.equal( typeof App.__container__.lookup( 'adapter:-parse' ), 'object' );
    assert.equal( App.__container__._options['adapter:-parse'].instantiate, undefined );
});

test( 'Adapter has header values set to expected values', function( assert ) {
    assert.equal( App.__container__.lookup( 'adapter:-parse' ).headers['X-Parse-Application-Id'], 'Hf7dgrv4WPBcJYUsLgDMZCwKxf3hdbAc1nnSsVza' );
    assert.equal( App.__container__.lookup( 'adapter:-parse' ).headers['X-Parse-REST-API-Key'], 'BH0IoMxroXSVU3GTMQTVaM4BXjvdX7lKtFujgvzO' );
});

test( 'Serializer is registered on container', function( assert ) {
    assert.equal( typeof App.__container__.lookup( 'serializer:-parse' ), 'object' );
    assert.equal( App.__container__._options['serializer:-parse'].instantiate, undefined );
});

test( 'Parse Date transform is registered on container', function( assert ) {
    assert.equal( typeof App.__container__.lookup( 'transform:parse-date' ), 'object' );
    assert.equal( App.__container__._options['transform:parse-date'].instantiate, undefined );
});

test( 'Parse File transform is registered on container', function( assert ) {
    assert.equal( typeof App.__container__.lookup( 'transform:parse-file' ), 'object' );
    assert.equal( App.__container__._options['transform:parse-file'].instantiate, undefined );
});

test( 'Parse GeoPoint transform is registered on container', function( assert ) {
    assert.equal( typeof App.__container__.lookup( 'transform:parse-geo-point' ), 'object' );
    assert.equal( App.__container__._options['transform:parse-geo-point'].instantiate, undefined );
});

test( 'Parse User model is registered on container', function( assert ) {
    assert.equal( typeof App.__container__._options['model:parse-user'], 'object' );
    assert.equal( App.__container__._options['model:parse-user'].instantiate, undefined );
});