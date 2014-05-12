var get = Ember.get, set = Ember.set;

var adapter, store, serializer, ajaxUrl, ajaxType, ajaxHash;
var Post, Comment;

module("Integration - Adapter", {
  setup: function() {
    ajaxUrl = undefined;
    ajaxType = undefined;
    ajaxHash = undefined;

    container = buildContainer();

    container.register('adapter:application', EmberParseAdapter.Adapter.extend({
      ajax: function(url, method, hash) {
        return new Ember.RSVP.Promise(function(res, rej){
          hash = hash || {};
          var success = hash.success;

          hash.context = adapter;

          ajaxUrl = url;
          ajaxType = method;
          ajaxHash = hash;

          hash.success = function(json) {
            Ember.run(function(){
              res(json);
            });
          };

          hash.error = function(xhr) {
            Ember.run(function(){
              rej(xhr);
            });
          };
        });
      }
    }));

    container.register('model:post', DS.Model.extend({
      title: DS.attr('string'),
      comments: DS.hasMany('comment', {async: true})
    }));

    container.register('model:comment', DS.Model.extend({
      content: DS.attr('string'),
      post: DS.belongsTo('post', {async: true})
    }));

    store = container.lookup('store:main');
    adapter = container.lookup('adapter:application');
    serializer = container.lookup('serializer:-parse');

    Post = store.modelFor('post');
    Comment = store.modelFor('comment');
  },

  teardown: function() {
    Ember.run(container, 'destroy');
  }
});

test("find", function(){
  post = Ember.run(function(){ return store.find('post', 'firstPost'); });
  ok(!get(post, 'isLoaded'));
  equal(ajaxUrl, "https://api.parse.com/1/classes/Post/firstPost", "The Parse API version and classes with Post and ID.");
  equal(ajaxType, "GET");
  ok(
    Ember.get(ajaxHash, 'context.headers').hasOwnProperty('X-Parse-REST-API-Key'),
    'has rest api header' );
  ok(
    Ember.get(ajaxHash, 'context.headers').hasOwnProperty('X-Parse-Application-Id'),
    'has rest application header' );
  ajaxHash.success({objectId: 'firstPost', title: 'Testing Find'});
  ok(get(post, 'isLoaded'));
  ok(!get(post, 'isDirty'));
  var isLoaded = store.recordIsLoaded('post', 'firstPost');
  ok(isLoaded, "the record is now in the store, and can be looked up by ID without another AJAX request");
});

test("find with sessionToken", function(){
  post = Ember.run(function(){
    adapter.set('sessionToken', 'some-odd-token');
    return store.find('post', 'firstPost');
  });
  ok(!get(post, 'isLoaded'));
  equal(ajaxUrl, "https://api.parse.com/1/classes/Post/firstPost", "The Parse API version and classes with Post and ID.");
  equal(ajaxType, "GET");
  equal(
    Ember.get(ajaxHash, 'context.headers.X-Parse-Session-Token'), 'some-odd-token',
    'has session header' );
  ajaxHash.success({objectId: 'firstPost', title: 'Testing Find'});
  ok(get(post, 'isLoaded'));
  ok(!get(post, 'isDirty'));
  var isLoaded = store.recordIsLoaded('post', 'firstPost');
  ok(isLoaded, "the record is now in the store, and can be looked up by ID without another AJAX request");
});

test("findAll", function(){
  posts = store.find('post');
  expect(ajaxUrl, "/1/classes/Post", "The Parse API version and classes with Post.");
  equal(ajaxType, "GET");
  // Parse REST API wraps the collections in a results JSON label.
  ajaxHash.success({results: [
    {objectId: '1', title: 'First Post.'},
    {objectId: '2', title: 'Second Post.'}
  ]});
  posts.then(function(_posts){
    posts = _posts;
  });
  equal(get(posts, 'length'), 2);
  post = posts.objectAt(0);
  ok(get(post, 'isLoaded'));
  ok(!get(post, 'isDirty'));
  var isLoaded = store.recordIsLoaded('post', '1');
  ok(isLoaded, "the record is now in the store, and can be looked up by ID without another Ajax request");
});


pending("findMany via a hasMany relationship", function(){
  Ember.run(function(){
    store.push('post', {id: 'one', comments: ['aa1', 'bb2', 'cc3']});
  });
  Ember.run(function(){
    store.find('post', 'one').then(function(post){
      return get(post, 'comments');
    }).then(function(comments){
      equal(get(comments, 'length'), 3, "there are three comments in the relationship already");
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
  });
  expect(ajaxUrl, "/1/classes/Comment", "requests the comment class");
  equal(ajaxType, "POST");
  deepEqual(ajaxHash.data, {where: {objectId: {"$in": "aa1,bb2,cc3"}}}, "the hash was passed along");
  ajaxHash.success({
    results: [
      {objectId: 'aa1', content: 'Comment 1'},
      {objectId: 'bb2', content: 'Comment 2'},
      {objectId: 'cc3', content: 'Comment 3'}
    ]
  });
});

test("Find Query", function(){
  posts = store.find('post', {where: JSON.stringify({title: 'First Post'})});
  equal(get(posts, 'length'), 0, "there are no posts yet as the query has not returned.");
  expect(ajaxUrl, "/1/classes/Post", "requests the post class");
  equal(ajaxType, "GET");
  deepEqual(ajaxHash.data, {where: JSON.stringify({title: 'First Post'})}, "where clause is passed as data");
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

test("Create Record", function(){
  stop();
  var post, promise;
  Ember.run(function(){
    post = store.createRecord('post', {title: 'Testing Create'});
    ok(get(post, 'isNew'), "record is new");
    promise = post.save()
  });
  ok(get(post, 'isSaving'), "record is saving");
  equal(ajaxUrl, "https://api.parse.com/1/classes/Post", "requests the post class");
  equal(ajaxType, "POST");
  // Passing comments as an Ember array. This is due to a bug in Ember-Data
  // expecting an Ember array for data and not a raw array:
  //
  // https://github.com/emberjs/data/pull/1939
  //
  deepEqual(ajaxHash.data, {comments: Ember.A(), title: 'Testing Create'}, "raw data is posted");
  ajaxHash.success({objectId: 'created321', createdAt: (new Date()).toISOString()});
  Ember.run(function(){
    promise.then(function(){
      ok(!get(post, 'isSaving'), 'post is not saving after save');
      ok(!get(post, 'isDirty'), 'post is not dirty after save');
      start();
    });
  });
});

pending("testing", function(){

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

});
