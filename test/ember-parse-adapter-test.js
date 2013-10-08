var get = Ember.get, set = Ember.set;

var App, adapter, store, serializer, ajaxUrl, ajaxType, ajaxHash;
var Post, post, posts;
var Comment, comment, comments;

module("Ember Data Adapter for Parse: Adapter", {
  setup: function() {
    ajaxUrl = undefined;
    ajaxType = undefined;
    ajaxHash = undefined;

    App = Ember.Namespace.create();

    adapter = ParseAdapter.create({
      ajax: function(type, url, hash) {
        return new Ember.RSVP.Promise(function(res, rej){
          hash = hash || {};
          var success = hash.success;

          hash.context = adapter;

          ajaxUrl = url;
          ajaxType = type;
          ajaxHash = hash;

          hash.success = function(json) {
            res(json);
            //Ember.run(function(){
            //  resolve(json);
            //});
          };

          hash.error = function(xhr) {
            Ember.run(function(){
              rej(xhr);
            });
          };
        });        
      }
    });

    serializer = get(adapter, 'serializer');

    store = DS.Store.create({
      adapter: adapter
    });

    Post = App.Post = ParseModel.extend({
      title: DS.attr('string'),
      comments: DS.hasMany('Comment')
    });

    Comment = App.Comment = ParseModel.extend({
      content: DS.attr('string'),
      post: DS.belongsTo('Post')
    });

  },

  teardown: function() {
    Ember.run(function(){
      if(post){
        post.destroy();
        post = null;
      }
      adapter.destroy();
      store.destroy();
    });
  }
});

test("Find", function(){
  post = store.find(Post, 1);
  expectState('loaded', false);
  expectUrl("/1/classes/Post/1", "The Parse API version and classes with Post and ID.");
  expectType("GET");
  ajaxHash.success({objectId: 'firstPost', title: 'Testing Find'});
  expectState('loaded');
  expectState('dirty', false);
  equal(post, store.find(Post, 1), "the record is now in the store, and can be looked up by ID without another AJAX request");
});

test("Find All", function(){
  posts = store.find(Post);
  expectUrl("/1/classes/Post", "The Parse API version and classes with Post.");
  expectType("GET");
  // Parse REST API wraps the collections in a results JSON label.
  ajaxHash.success({results: [{objectId: '1', title: 'First Post.'}, {objectId: '2', title: 'Second Post.'}]});
  post = posts.objectAt(0);
  expectState('loaded');
  expectState('dirty', false);
  equal(post, store.find(Post, 1), "the record is now in the store, and can be looked up by ID without another Ajax request");
});

test("Find Many", function(){
  store.load(Post, {objectId: 1, comments: ['aa1', 'bb2', 'cc3']});
  post = store.find(Post, 1);
  comments = get(post, 'comments');
  equal(get(comments, 'length'), 3, "there are three comments in the relationship already");
  comments.forEach(function(comment){
    equal(get(comment, 'isLoaded'), false, "the comment is being loaded");
  });
  expectUrl("/1/classes/Comment");
  expectType("POST");
  expectData({where: {objectId: {"$in": "aa1,bb2,cc3"}}});
  ajaxHash.success({
    results: [
      {objectId: 'aa1', content: 'Comment 1'},
      {objectId: 'bb2', content: 'Comment 2'},
      {objectId: 'cc3', content: 'Comment 3'}
    ]
  });
  var comment1 = comments.objectAt(0);
  equal(get(comment1, 'id'), 'aa1');
  var comment2 = comments.objectAt(1);
  equal(get(comment2, 'id'), 'bb2');
  var comment3 = comments.objectAt(2);
  equal(get(comment3, 'id'), 'cc3');
  comments.forEach(function(comment){
    equal(get(comment, 'isLoaded'), true, "comment is loaded");
  });
});

test("Find Query", function(){
  posts = store.find(Post, {title: 'First Post'});
  equal(get(posts, 'length'), 0, "there are no posts yet as the query has not returned.");
  expectUrl("/1/classes/Post");
  expectType("POST");
  expectData({where: {title: 'First Post'}});
  ajaxHash.success({
    results: [
      { objectId: 'bad1', title: 'First Post'},
      { objectId: 'bad2', title: 'First Post'}
    ]
  });

  equal(get(posts, 'length'), 2, "there are 2 posts loaded");
  posts.forEach(function(post){
    equal(get(post, 'isLoaded'), true, "the post is being loaded");
  });
});

test("Create Record - not bulkCommit", function(){
  post = store.createRecord(Post, {title: 'Testing Create'});
  // force it to use single record create
  adapter.bulkCommit = false;
  expectState('new');
  store.commit();
  expectState('saving');
  expectUrl("/1/classes/Post");
  expectType("POST");
  expectData({comments: [], title: 'Testing Create', updatedAt: undefined, createdAt: undefined});
  ajaxHash.success({objectId: 'created321', createdAt: (new Date()).toISOString()});
  expectState('saving', false);
  expectState('dirty', false);
  //equal(post, store.find(Post, 'created321'), "should find Post in store after create");
});

test("Create Record - bulkCommit", function(){
  posts = new Ember.Set([
    store.createRecord(Post, {title: 'Post 1'}),
    store.createRecord(Post, {title: 'Post 2'})
  ]);
  expectStates(posts, 'new');
  store.commit();
  expectStates(posts, 'saving');
  expectUrl("/1/batch");
  expectType("POST");
  /*
    This payload should match expected schema: https://www.parse.com/docs/rest#objects-batch
   */
  expectData({
    requests: [
      {
        method: "POST",
        path: "/1/classes/Post",
        body: {comments: [], title: 'Post 1', updatedAt: undefined, createdAt: undefined}
      },
      {
        method: "POST",
        path: "/1/classes/Post",
        body: {comments: [], title: 'Post 2', updatedAt: undefined, createdAt: undefined}
      }
    ]
  });
  ajaxHash.success([
    {success: {objectId: 'post1', createdAt: (new Date()).toISOString()}},
    {success: {objectId: 'post2', createdAt: (new Date()).toISOString()}}
  ]);
  expectStates(posts, 'saving', false);
  expect(posts[0], store.find(Post, 'post1'), "should match first post.");
  expect(posts[1], store.find(Post, 'post2'), "should match second post.");
});

test("Update Record - not bulkCommit", function(){
  store.load(Post, {title: 'Test Post Update', objectId: 'postUpdated'});
  // force it to use single record update
  adapter.bulkCommit = false;
  post = store.find(Post, 'postUpdated');
  expectState('loaded');
  expectState('dirty', false);
  post.set('title', 'Test Post Updated - true');
  expectState('dirty');
  store.commit();
  expectState('saving');
  expectUrl("/1/classes/Post/postUpdated");
  expectType("PUT");
  expectData({objectId: 'postUpdated', comments: [], title: 'Test Post Updated - true', updatedAt: undefined, createdAt: undefined});
  ajaxHash.success({objectId: 'postUpdated', updatedAt: (new Date()).toISOString()});
  expectState('saving', false);
});

test("Update Record - bulkCommit", function(){
  store.loadMany(Post, [
    {objectId: 'post1', title: 'Post 1'},
    {objectId: 'post2', title: 'Post 2'}
  ]);
  posts = store.findMany(Post, ['post1', 'post2']);
  expectStates(posts, 'loaded');
  posts.forEach(function(post){
    post.set('title', post.get('title') + ' updated.');
  });
  expectStates(posts, 'dirty');
  store.commit();
  expectStates(posts, 'saving');
  expectUrl("/1/batch");
  expectType("POST");
  expectData({
    requests: [
      {
        method: "PUT",
        path: "/1/classes/Post/post1",
        body: {objectId: 'post1', comments: [], title: 'Post 1 updated.', updatedAt: undefined, createdAt: undefined}
      },
      {
        method: "PUT",
        path: "/1/classes/Post/post2",
        body: {objectId: 'post2', comments: [], title: 'Post 2 updated.', updatedAt: undefined, createdAt: undefined}
      }
    ]
  });
  ajaxHash.success([
    {success: {objectId: 'post1', updatedAt: (new Date()).toISOString()}},
    {success: {objectId: 'post2', updatedAt: (new Date()).toISOString()}}
  ]);
  expectStates(posts, 'saving', false);
  expect(posts[0], store.find(Post, 'post1'), "should match first post.");
  expect(posts[1], store.find(Post, 'post2'), "should match second post.");
});

test("Delete Record - not bulkCommit", function(){
  store.load(Post, {objectId: 'post1', title: 'Post to delete.'});
  // force single record delete
  adapter.bulkCommit = false;
  post = store.find(Post, 'post1');
  expectState('new', false);
  expectState('loaded');
  expectState('dirty', false);
  post.deleteRecord();
  expectState('dirty');
  expectState('deleted');
  store.commit();
  expectState('saving');
  expectUrl("/1/classes/Post/post1");
  expectType("DELETE");
  ajaxHash.success();
  expectState('deleted');
});

test("Delete Record - bulkCommit", function(){
  store.loadMany(Post, [
    {objectId: 'post1', title: 'Post 1'},
    {objectId: 'post2', title: 'Post 2'}
  ]);
  posts = store.findMany(Post, ['post1', 'post2']);
  expectStates(posts, 'loaded');
  expectStates(posts, 'new', false);
  expectStates(posts, 'dirty', false);
  posts.forEach(function(post){
    post.deleteRecord();
  });
  expectStates(posts, 'dirty');
  expectStates(posts, 'deleted');
  store.commit();
  expectStates(posts, 'saving');
  expectUrl("/1/batch");
  expectType('POST');
  expectData({
    requests: [
      {
        method: "DELETE",
        path: "/1/classes/Post/post1",
        body: {objectId: 'post1', comments: [], title: 'Post 1', updatedAt: undefined, createdAt: undefined}
      },
      {
        method: "DELETE",
        path: "/1/classes/Post/post2",
        body: {objectId: 'post2', comments: [], title: 'Post 2', updatedAt: undefined, createdAt: undefined}
      }
    ]
  });
  ajaxHash.success();
  expectStates(posts, 'saving', false);
  expectStates(posts, 'dirty', false);
});

test("Date Serialization", function(){
  var date = new Date(946684800000);
  var serialzedDate = serializer.serializeValue(date, 'date');
  equal(serialzedDate.iso, '2000-01-01T00:00:00.000Z', 'The ISO value is correct')
  equal(serialzedDate['__type'], 'Date', 'The type is correct')
});
