import Ember from 'ember';
import DS from 'ember-data';
import Adapter from 'ember-parse-adapter/adapters/application';
import Serializer from 'ember-parse-adapter/serializers/application';

var buildContainer = function() {
    var container = new Ember.Container();
    DS._setupContainer( container );

    container.register( 'adapter:-parse', Adapter );
    container.register( 'serializer:-parse', Serializer );

    return container;
  },
  container,
  store,
  serializer,
  Post,
  Comment;

module( 'Unit - serializer:application', {
  beforeEach: function() {
    container  = buildContainer();
    serializer = container.lookup( 'serializer:-parse' );
    store      = container.lookup( 'service:store' );

    container.register( 'model:post', DS.Model.extend({
      title    : DS.attr( 'string' ),
      comments : DS.hasMany('comment')
    }));

    container.register( 'model:comment', DS.Model.extend({
      content : DS.attr( 'string' ),
      post    : DS.belongsTo( 'post' )
    }));

    Post = store.modelFor( 'post' );
    Comment = store.modelFor( 'comment' );

    container.register( 'serializer:post', Serializer );
    container.register( 'serializer:comment', Serializer );
  },

  afterEach: function() {
    Ember.run( container, 'destroy' );
  }
});

test( 'Requires objectId as key', function( assert ) {
  assert.equal( Ember.get( serializer, 'primaryKey' ), 'objectId', 'Should be objectId.' );
});

test( 'A single post is extracted', function( assert ) {
  var id    = 'test',
    title = 'Test rooting',
    res   = serializer.normalizeSingleResponse( store, Post, {objectId: id, title: title}, id );

  assert.equal( res.data.id, id, 'objectId should be put on post namespace' );
  assert.equal( res.data.attributes.title, title, 'Title should be put on post namespace' );
});

test( 'Many posts are extracted', function( assert ) {
  var array = [{
      objectId: 'testA',
      title: 'Test A'
    }, {
      objectId: 'testB',
      title: 'Test B'
    }],
    res = store.serializerFor( 'post' ).normalizeArrayResponse( store, Post, { results: array } );

  assert.equal( res.data.length, 2, 'normalized array of posts' );

  assert.equal( res.data[0].id, 'testA', 'objectId should be put on post namespace' );
  assert.equal( res.data[0].attributes.title, 'Test A', 'Title should be put on post namespace' );

  assert.equal( res.data[1].id, 'testB', 'objectId should be put on post namespace' );
  assert.equal( res.data[1].attributes.title, 'Test B', 'Title should be put on post namespace' );
});

QUnit.skip( 'hasMany for serialization (Parse Pointer)', function( assert ) {
  var serialized,
    hash = {},
    relationship = { options: { embedded: false }},
    post,
    comment;

  store.load( 'post', '1', {title: 'Testing hasMany serialization.'} );
  store.load( 'comment', '1', {content: 'Comment 1'} );
  post = store.findRecord('post', '1');
  comment = store.findRecord('comment', '1');
  post.get( 'comments').pushObject( comment );
  serializer.addHasMany( hash, post, 'comments', relationship );

  assert.equal( hash.comments[0]['__type'], 'Pointer', 'Should be a Pointer __type/class.' );
  assert.equal( hash.comments[0]['className'], 'Comment', 'Should be Comment class.' );
});