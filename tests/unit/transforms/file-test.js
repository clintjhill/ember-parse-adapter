import Ember from 'ember';
import FileTransform from 'ember-parse-adapter/transforms/file';
import File from 'ember-parse-adapter/file';

var transform;

module( 'Unit - transforms:file', {
    setup: function() {
        transform = FileTransform.create();
    },
    teardown: function() {
        Ember.run( transform, 'destroy' );
    }
});

test( 'Serializes', function( assert ) {
    var file = File.create({
            name : 'car',
            url  : 'http://example.com/car.png'
        }),
        data = transform.serialize( file );

    assert.equal( data.name, file.get( 'name' ), 'name is preserved' );
    assert.equal( data.url, file.get( 'url' ), 'url is preserved' );
    assert.equal( data.__type, 'File', 'has the proper type' );
});

test( 'Deserializes', function( assert ) {
    var data = {
        name   : 'Plane',
        url    : 'http://example.com/plane.png',
        __type : 'File'
    },
    file = transform.deserialize( data );

    assert.ok( file instanceof DS.Transform, 'is a DS.Transform' );
    assert.equal( file.get( 'name' ), data.name, 'name is preserved' );
    assert.equal( file.get( 'url' ), data.url, 'url is preserved' );
});

test( 'Deserializes null to null', function( assert ) {
    var file = transform.deserialize( null );
    assert.ok( file === null, 'Deserialization of null is null' );
});