var get = Ember.get, set = Ember.set;

var adapter, store, serializer, App, Post, Comment;

module("Ember Data Adapter for Parse: Relationships", {
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
    });

    Comment = App.Comment = ParseModel.extend({
      content: DS.attr('string'),
      post: DS.belongsTo('Post')
    });

    Comment.reopenClass({
      parseType: 'Comment'
    });

  },
  tearDown: function(){
    adapter.destroy();
    store.destroy();
    App.destroy();
  }
});

/*
  Sanity check test - testing that we've not destroyed inherited logic
  for relationships.
*/
test("one-to-many relationship", function(){
  var post, comment;
  post = store.createRecord(Post, {title:"Testing hasMany creation."});
  comment = post.get('comments').createRecord({content: "Comment 1"});
  equal(comment.get('post'), post, "Post should match.");
  equal(post.get('comments').objectAt(0), comment, "First comment should match.");
});

/*
  Sanity check test - testing that we've not destroyed inherited logic
  for relationships.
*/
test('one-to-many relationship with loaded records', function(){
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

/*
  For the sake of getting shit done I'm going to solve this little nugget later.
  Essentially the problem is how to reconcile newly created models and their relationships
  in a single DS.Store commit.
*/
// test("one-to-many relationship with new records (multiple child to parent)", function(){
//   var post, comment, postResult, commentsResult;

//   // client-side creation of Post & Comments in hasMany relationship
//   post = store.createRecord(Post, {title:"Testing hasMany creation."});
//   comment = post.get('comments').createRecord({content: "Comment 1"});
//   // expected resultes from the Parse REST API
//   postResult = {"posts": [{objectId: "11", createdAt: (new Date), title: "Testing hasMany creation."}]};
//   commentsResult = {"comments": [{objectId: "12", createdAt: (new Date), content: "Comment 1"}]};

//   /*
//     Override the createRecords function to mock the result from Parse API
//     for the POST of new Post and Comments in hasMany relationship.
//   */
//   adapter.createRecords = function(store, type, records){
//     // mock AJAX and handle the type here
//     var promise = Ember.Deferred.create();
//     if(type.parseType === "Post"){
//       equal(records.toArray().length, 1, "Should have 1 Post.");
//       setTimeout(function(){
//         adapter.didCreateRecords(store, type, records, postResult);
//         promise.resolve();
//       }, 100);
//     } else {
//       equal(records.toArray().length, 1, "Should have 1 Comment.");
//       setTimeout(function(){
//         adapter.didCreateRecords(store, type, records, commentsResult);
//         promise.resolve();
//       }, 100);
//     }
//     return promise;
//   }

//   /*
//     Override the updateRecords function to perform assertions on the POST results.

//     Test whether the Post & Comments were created and now have IDs to use for updating
//     respective relationships.
//   */
//   adapter.updateRecords = function(store, type, records){
//     var serialized;
//     // mock AJAX and handle the type here
//     setTimeout(function(){
//       if(type.parseType === "Post"){
//         records.forEach(function(rec){
//           serialized = adapter.serialize(rec);
//           // the records should have properly set relationships
//           equal(rec.get('comments').objectAt(0).get('id'), "12", "Record should be ID 12.");
//           // serialization should also reflect properly set relationships
//           equal(serialized.comments[0].objectId, "12", "Serialized should be objectId 12.");
//         });
//       } else {
//         records.forEach(function(rec){
//           serialized = adapter.serialize(rec);
//           // the records should have properly set relationships
//           equal(rec.get('post').get('id'), "11", "Record should be ID 11.");
//           // the serialization should also reflect properly set relationships
//           equal(serialized.post, "11", "Serialized should be post 11.");
//         });
//       }
//     },200);
//   }

//   // talk to me Goose!
//   store.commit();

// });
