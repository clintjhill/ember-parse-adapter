var get = Ember.get,
    set = Ember.set;

var container, store, serializer, Post, Comment;

module("Unit - Serializer", {
  setup: function() {
    container = buildContainer();
    serializer = container.lookup('serializer:-parse');
    store = container.lookup('store:main');

    container.register('model:post', DS.Model.extend({
      title: DS.attr('string')
    }));
    Post = store.modelFor('post');
  },

  teardown: function() {
    Ember.run(container, 'destroy');
  }
});

test("requires objectId as key", function(){
  equal(get(serializer, "primaryKey"), "objectId", "Should be objectId.");
});

test("a single post is extracted", function(){
  var id = 'test',
      title = 'Test rooting';
  var res = serializer.extractSingle(store, Post, {objectId: id, title: title}, id);
  equal(res.id, id, 'objectId should be put on post namespace');
  equal(res.title, title, 'Title should be put on post namespace');
});

module("Integration - Serializer", {
  setup: function() {
    container = buildContainer();

    container.register('model:post', DS.Model.extend({
      title: DS.attr('string'),
      comments: DS.hasMany('comment')
    }));

    container.register('model:comment', DS.Model.extend({
      content: DS.attr('string'),
      post: DS.belongsTo('post')
    }));

    container.register('serializer:post', EmberParseAdapter.Serializer);
    container.register('serializer:comment', EmberParseAdapter.Serializer);

    store = container.lookup('store:main')
    Post    = store.modelFor('post');
    Comment = store.modelFor('comment');
  },

  teardown: function() {
    Ember.run(container, 'destroy');
  }
});

test("many posts are extracted", function(){
  var array = [{
    objectId: 'testA',
    title: 'Test A'
  }, {
    objectId: 'testB',
    title: 'Test B'
  }];

  var res = store.serializerFor(Post).extractArray(store, Post, { results: array });

  equal(res.length, 2, 'normalized array of posts');

  equal(res[0].id, 'testA', 'objectId should be put on post namespace');
  equal(res[0].title, 'Test A', 'Title should be put on post namespace');

  equal(res[1].id, 'testB', 'objectId should be put on post namespace');
  equal(res[1].title, 'Test B', 'Title should be put on post namespace');
});

pending("hasMany for serialization (Parse Pointer)", function(){
  var serialized,
      hash = {},
      relationship = { options: { embedded: false }},
      post,
      comment;
  store.load(Post, "1", {title: 'Testing hasMany serialization.'});
  store.load(Comment, "1", {content: 'Comment 1'});
  post = store.find(Post, "1");
  comment = store.find(Comment, "1");
  post.get('comments').pushObject(comment);
  serializer.addHasMany(hash, post, "comments", relationship);
  equal(hash.comments[0]["__type"], "Pointer", "Should be a Pointer __type/class.");
  equal(hash.comments[0]["className"], "Comment", "Should be Comment class.");
});
