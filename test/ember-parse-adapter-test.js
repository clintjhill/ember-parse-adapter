var get = Ember.get, set = Ember.set;

var App, adapter, store, serializer;

module("Ember Data Adapter for Parse: Adapter", {
  setup: function() {
  
    App = Ember.Namespace.create({
      toString: function() { return "App"; }
    });
    
    adapter = ParseAdapter.create();

    serializer = get(adapter, 'serializer');

    store = DS.Store.create({
      revision: 11,
      adapter: adapter
    });

    Post = App.Post = ParseModel.extend({
      title: DS.attr('string'),
      comments: DS.hasMany('Comment')
    });

    Post.reopenClass({
      parseType: 'Post'
    })

    CommentModel = App.CommentModel = ParseModel.extend({
      content: DS.attr('string'),
      post: DS.belongsTo('Post')
    });

  },

  teardown: function() {
    adapter.destroy();
    store.destroy();
    App.destroy();
  }
});

test("Getting type name from models", function(){
  var postName = adapter.getTypeName(Post);
  equal(postName, "Post", "Should be Post.");
  var commentName = adapter.getTypeName(CommentModel);
  equal(commentName, "CommentModel", "Should be Comment.");
});

test("Rooting a serialization", function(){
  var data = {title: "Test rooting."};
  var rooted = adapter.makeRootObject(Post, data);
  ok(rooted.post, "Should have post root.");
  rooted = adapter.makeRootObject(CommentModel, data);
  ok(rooted.comment_model, "Should have comment_model root.");
});

test("Making batch payload", function(){
  var post = store.createRecord(Post, {title:"Testing creation."});
  var batched = adapter.makeBatchFor("PUT", [post]);
  equal(batched.requests[0].method, "PUT", "Method should be put.");
  equal(batched.requests[0].path, "/1/classes/Post", "Path should be /1/classes/Post.");
  equal(batched.requests[0].body.title, "Testing creation.", "Body should have serialized data.");
});