import Ember from 'ember';
import DateTransform from 'ember-parse-adapter/transforms/date';

var transform;

module( 'Unit - transforms:date', {
    setup: function() {
        transform = DateTransform.create();
    },
    teardown: function() {
        Ember.run( transform, 'destroy' );
    }
});

test( 'Serializes', function( assert ) {
    var date    = new Date( 2013, 10, 10 ),
        origIso = date.toISOString(),
        data    = transform.serialize( date );

    assert.equal( data.iso, origIso, 'iso is rendered' );
    assert.equal( data.__type, 'Date', 'has the proper type' );
});

test( 'Deserializes', function( assert ) {
    var date = transform.deserialize( '2013-11-10T05:00:00.000Z' );

    assert.ok( date instanceof Date, 'is a date' );
    assert.equal( date.getTime(), 1384059600000, 'timestamp is correct' );
});

test( 'Deserializes null to null', function( assert ) {
    var data = transform.deserialize( null );

    assert.ok( data === null, 'Serialization of null is null' );
});