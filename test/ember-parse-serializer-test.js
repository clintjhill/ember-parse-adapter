var get = Ember.get, set = Ember.set;

var App, adapter, store, serializer;

module("Ember Data Adapter for Parse: Serializer", {
  setup: function() {

    App = Ember.Namespace.create();

    adapter = ParseAdapter.create();

    serializer = get(adapter, 'serializer');

    store = DS.Store.create({
      adapter: adapter
    });

    Post = App.Post = ParseModel.extend({
      title: DS.attr('string'),
      comments: DS.hasMany('Comment')
    });

    Post.reopenClass({
      parseType: 'Post'
    });

    Comment = App.Comment = ParseModel.extend({
      content: DS.attr('string'),
      post: DS.belongsTo('Post')
    });

    Comment.reopenClass({
      parseType: 'Comment'
    });

  },

  teardown: function() {
    Ember.run(function(){
      adapter.destroy();
      store.destroy();
      App.destroy();
    });
  }
});

test("Parse requires objectId as key", function(){
  equal(serializer.primaryKey(), "objectId", "Should be objectId.");
});

test("Getting type name from models", function(){
  // test that normal type inspection works
  var postName = serializer.getTypeName(Post);
  equal(postName, "Post", "Should be Post.");
  // test that our parseType inspection works
  var commentName = serializer.getTypeName(Comment);
  equal(commentName, "Comment", "Should be Comment.");
});

test("Rooting a serialization", function(){
  var data = {title: "Test rooting."};
  var rooted = serializer.serializeRootObject(Post, data);
  ok(rooted.post, "Should have post root.");
  rooted = serializer.serializeRootObject(Comment, data);
  ok(rooted.comment, "Should have comment_model root.");
  var posts = [{title: "Test array rooting"}, {title: "Test 2 array rooting"}];
  rooted = serializer.serializeRootObject(Post, posts);
  ok(rooted.posts, "Should have pluralized root.");
  ok(Ember.isArray(rooted.posts),"Should be arrary.");
});

test("Making batch payload", function(){
  var post = store.createRecord(Post, {title:"Testing creation."});
  var batched = serializer.serializeBatchFor("PUT", [post]);
  equal(batched.requests[0].method, "PUT", "Method should be put.");
  equal(batched.requests[0].path, "/1/classes/Post", "Path should be /1/classes/Post.");
  equal(batched.requests[0].body.title, "Testing creation.", "Body should have serialized data.");
});

test("hasMany for serialization (Parse Pointer)", function(){
  var serialized, hash = {}, relationship = { options: { embedded: false }}, post, comment;
  store.load(Post, "1", {title: 'Testing hasMany serialization.'});
  store.load(Comment, "1", {content: 'Comment 1'});
  post = store.find(Post, "1");
  comment = store.find(Comment, "1");
  post.get('comments').pushObject(comment);
  serializer.addHasMany(hash, post, "comments", relationship);
  equal(hash.comments[0]["__type"], "Pointer", "Should be a Pointer __type/class.");
  equal(hash.comments[0]["className"], "Comment", "Should be Comment class.");
});
