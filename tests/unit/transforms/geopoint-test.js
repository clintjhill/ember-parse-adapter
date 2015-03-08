import Ember from 'ember';
import GeoPointTransform from 'ember-parse-adapter/transforms/geopoint';
import GeoPoint from 'ember-parse-adapter/geopoint';

var transform;

module( 'Unit - transforms:geopoint', {
    setup: function() {
        transform = GeoPointTransform.create();
    },
    teardown: function() {
        Ember.run( transform, 'destroy' );
    }
});

test( 'Serializes', function( assert ) {
    var geoPoint = GeoPoint.create({
            latitude  : 4.53,
            longitude : 3.33
        }),
        data = transform.serialize( geoPoint );

    assert.equal( data.latitude, geoPoint.get( 'latitude' ), 'latitude is preserved' );
    assert.equal( data.longitude, geoPoint.get( 'longitude' ), 'longitude is preserved' );
    assert.equal( data.__type, 'GeoPoint', 'has the proper type' );
});

test( 'Deserializes', function( assert ) {
    var data = {
            latitude  : 3.43,
            longitude : 4.2,
            __type    : 'GeoPoint'
        },
        point = transform.deserialize( data );

    assert.ok( point instanceof DS.Transform, 'is a geo point' );
    assert.equal( point.get( 'latitude' ), data.latitude, 'latitude is preserved' );
    assert.equal( point.get( 'longitude' ), data.longitude, 'longitude is preserved' );
});