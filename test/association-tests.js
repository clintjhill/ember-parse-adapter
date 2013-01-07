var get = Ember.get, set = Ember.set;

var adapter, store, serializer, ajaxHash, App, Post, Comment;

module("Ember Data Adapter for Parse: Associations", {
  setup: function(){
    
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

    Comment = App.Comment = ParseModel.extend({
      content: DS.attr('string'),
      post: DS.belongsTo('Post')
    });

    Comment.reopenClass({
      parseType: 'Comment'
    })

  },
  tearDown: function(){
    adapter.destroy();
    store.destroy();
    App.destroy();
  }
});

test("one-to-many creation with all isNew", function(){
  var post, comment;
  post = store.createRecord(Post, {title:"Testing hasMany creation."});
  comment = post.get('comments').createRecord({content: "Comment 1"});
  
  equal(comment.get('post'), post, "Post should match.");
  equal(post.get('comments').objectAt(0), comment, "First comment should match.");
});

test('one-to-many testing with isLoaded', function(){
  var post, comment;
  store.load(Post, "1", {title: 'Testing hasMany loaded.'});
  store.load(Comment, "1", {content: 'Comment 1'});
  
  post = store.find(Post, "1");
  comment = store.find(Comment, "1");

  equal(post.get('comments.length'), 0, "Should have no comments.");
  ok(!comment.get('post'), "Should have no post.");

  post.get('comments').pushObject(comment);

  equal(post.get('comments.length'), 1, "Should have 1 comment.");
  equal(comment.get('post'), post, "Should have a post now.");
});