/* global module, test, QUnit, start, stop */
import Ember from 'ember';
import Adapter from 'ember-parse-adapter/adapters/application';
import Serializer from 'ember-parse-adapter/serializers/application';

var buildContainer = function() {
    var container = new Ember.Container();
    DS._setupContainer(container);

    container.register('serializer:-parse', Serializer);

    return container;
  },
  get = Ember.get,
  set = Ember.set,
  adapter,
  container,
  store,
  serializer,
  ajaxUrl,
  ajaxType,
  ajaxHash,
  Post,
  Comment;

module('Unit - adapter:application', {
  beforeEach: function() {
    ajaxUrl = undefined;
    ajaxType = undefined;
    ajaxHash = undefined;

    container = buildContainer();

    container.register('adapter:application', Adapter.extend({
      ajax: function(url, method, hash) {
        return new Ember.RSVP.Promise(function(res, rej) {
          hash = hash || {};
          var success = hash.success;

          hash.context = adapter;

          ajaxUrl = url;
          ajaxType = method;
          ajaxHash = hash;

          hash.success = function(json) {
            Ember.run(function() {
              res(json);
            });
          };

          hash.error = function(xhr) {
            Ember.run(function() {
              rej(xhr);
            });
          };
        });
      }
    }));

    container.register('model:post', DS.Model.extend({
      title    : DS.attr('string'),
      comments : DS.hasMany('comment', { async: true })
    }));

    container.register('model:comment', DS.Model.extend({
      content : DS.attr('string'),
      post    : DS.belongsTo('post', { async: true })
    }));

    store = container.lookup('store:main');
    adapter = container.lookup('adapter:application');
    serializer = container.lookup('serializer:-parse');

    Post = store.modelFor('post');
    Comment = store.modelFor('comment');
  },

  afterEach: function() {
    Ember.run(container, 'destroy');
  }
});

test('find', function(assert) {
  var post = Ember.run(function() {
      return store.find('post', 'firstPost');
    }),
    isLoaded;

  assert.ok(!get(post, 'isLoaded'));
  assert.equal(ajaxUrl, 'https://api.parse.com/1/classes/Post/firstPost', 'The Parse API version and classes with Post and ID.');
  assert.equal(ajaxType, 'GET');
  assert.ok(Ember.get(ajaxHash, 'context.headers').hasOwnProperty('X-Parse-REST-API-Key'), 'has rest api header');
  assert.ok(Ember.get(ajaxHash, 'context.headers').hasOwnProperty('X-Parse-Application-Id'), 'has rest application header');

  ajaxHash.success({
    objectId : 'firstPost',
    title    : 'Testing Find'
  });

  assert.ok(get(post, 'isLoaded'));
  assert.ok(!get(post, 'isDirty'));

  isLoaded = store.recordIsLoaded('post', 'firstPost');
  assert.ok(isLoaded, 'the record is now in the store, and can be looked up by ID without another AJAX request');
});

test('find with sessionToken', function(assert) {
  var post = Ember.run(function() {
      adapter.set('sessionToken', 'some-odd-token');
      return store.find('post', 'firstPost');
    }),
    isLoaded;

  assert.ok(!get(post, 'isLoaded'));
  assert.equal(ajaxUrl, 'https://api.parse.com/1/classes/Post/firstPost', 'The Parse API version and classes with Post and ID.');
  assert.equal(ajaxType, 'GET');
  assert.equal(Ember.get(ajaxHash, 'context.headers.X-Parse-Session-Token'), 'some-odd-token', 'has session header');

  ajaxHash.success({
    objectId: 'firstPost',
    title: 'Testing Find'
  });

  assert.ok(get(post, 'isLoaded'));
  assert.ok(!get(post, 'isDirty'));

  isLoaded = store.recordIsLoaded('post', 'firstPost');
  assert.ok(isLoaded, 'the record is now in the store, and can be looked up by ID without another AJAX request');
});

test('can get a set sessionToken', function(assert) {
  var token = Ember.run(function() {
    adapter.set('sessionToken', 'some-odd-token');
    return adapter.get('sessionToken');
  });

  assert.equal(token, 'some-odd-token');
});

test('findAll', function(assert) {
  var posts,
    post,
    isLoaded;

  posts = store.find('post');

  assert.expect(ajaxUrl, '/1/classes/Post', 'The Parse API version and classes with Post.');
  assert.equal(ajaxType, 'GET');

  // Parse REST API wraps the collections in a results JSON label.
  ajaxHash.success({
    results: [
      { objectId: '1', title: 'First Post.' },
      { objectId: '2', title: 'Second Post.' }
    ]
  });


  posts.then(function(_posts) {
    posts = _posts;
  });

  Ember.run(function() {
    assert.equal(get(posts, 'length'), 2);
  });

  post = posts.objectAt(0);

  assert.ok(get(post, 'isLoaded'));
  assert.ok(!get(post, 'isDirty'));

  isLoaded = store.recordIsLoaded('post', '1');

  assert.ok(isLoaded, 'the record is now in the store, and can be looked up by ID without another Ajax request');
});

QUnit.skip('findMany via a hasMany relationship', function(assert) {
  Ember.run(function() {
    store.push('post', { id: 'one', comments: ['aa1', 'bb2', 'cc3'] });
  });

  Ember.run(function() {
    store.find('post', 'one').then(function(post) {
      return get(post, 'comments');
    }).then(function(comments) {
      var comment1,
        comment2,
        comment3;

      assert.equal(get(comments, 'length'), 3, 'there are three comments in the relationship already');

      comment1 = comments.objectAt(0);
      assert.equal(get(comment1, 'id'), 'aa1');

      comment2 = comments.objectAt(1);
      assert.equal(get(comment2, 'id'), 'bb2');

      comment3 = comments.objectAt(2);
      assert.equal(get(comment3, 'id'), 'cc3');

      comments.forEach(function(comment) {
        assert.equal(get(comment, 'isLoaded'), true, 'comment is loaded');
      });
    });
  });

  assert.expect(ajaxUrl, '/1/classes/Comment', 'requests the comment class');
  assert.equal(ajaxType, 'POST');
  assert.deepEqual(ajaxHash.data, { where: { objectId: { '$in': 'aa1,bb2,cc3' } } }, 'the hash was passed along');

  ajaxHash.success({ results: [
    { objectId: 'aa1', content: 'Comment 1' },
    { objectId: 'bb2', content: 'Comment 2' },
    { objectId: 'cc3', content: 'Comment 3' }
  ] });
});

test('Find Query with non-string where', function(assert) {
  var posts = store.find('post', { where: { title: 'First Post' } });

  assert.equal(get(posts, 'length'), 0, 'there are no posts yet as the query has not returned.');
  assert.expect(ajaxUrl, '/1/classes/Post', 'requests the post class');
  assert.equal(ajaxType, 'GET');
  assert.deepEqual(ajaxHash.data, { where: JSON.stringify({ title: 'First Post' }) }, 'where clause is passed as stringified data');

  ajaxHash.success({ results: [
    { objectId: 'bad1', title: 'First Post' },
    { objectId: 'bad2', title: 'First Post' }
  ] });
});

test('Find Query with where as string', function(assert) {
  var posts = store.find('post', { where: "{title: 'First Post'}" });

  assert.equal(get(posts, 'length'), 0, 'there are no posts yet as the query has not returned.');
  assert.expect(ajaxUrl, '/1/classes/Post', 'requests the post class');
  assert.equal(ajaxType, 'GET');
  assert.deepEqual(ajaxHash.data, { where: "{title: 'First Post'}" }, 'where clause is passed through as string');

  ajaxHash.success({ results: [
    { objectId: 'bad1', title: 'First Post' },
    { objectId: 'bad2', title: 'First Post' }
  ] });

  assert.equal(get(posts, 'length'), 2, 'there are 2 posts loaded');

  posts.forEach(function(post) {
    assert.equal(get(post, 'isLoaded'), true, 'the post is being loaded');
  });
});

test('Create Record', function(assert) {
  stop();

  var post,
    promise;

  Ember.run(function() {
    post = store.createRecord('post', { title: 'Testing Create' });
    assert.ok(get(post, 'isNew'), 'record is new');
    promise = post.save();
  });

  assert.ok(get(post, 'isSaving'), 'record is saving');
  assert.equal(ajaxUrl, 'https://api.parse.com/1/classes/Post', 'requests the post class');
  assert.equal(ajaxType, 'POST');

  // Passing comments as an Ember array. This is due to a bug in Ember-Data
  // expecting an Ember array for data and not a raw array:
  // https://github.com/emberjs/data/pull/1939
  assert.deepEqual(ajaxHash.data, { comments: Ember.A(), title: 'Testing Create' }, 'raw data is posted');

  ajaxHash.success({
    objectId  : 'created321',
    createdAt : (new Date()).toISOString()
  });

  Ember.run(function() {
    promise.then(function() {
      assert.ok(!get(post, 'isSaving'), 'post is not saving after save');
      assert.ok(!get(post, 'isDirty'), 'post is not dirty after save');
      start();
    });
  });
});

QUnit.skip('Create Record - bulkCommit', function(assert) {
  var posts = new Ember.Set([
    store.createRecord(Post, { title: 'Post 1' }),
    store.createRecord(Post, { title: 'Post 2' })
  ]),
  expectStates,
  expectUrl,
  expectType,
  expectData,
  expect;

  expectStates(posts, 'new');
  store.commit();

  expectStates(posts, 'saving');
  expectUrl('/1/batch');
  expectType('POST');


  //This payload should match expected schema: https://www.parse.com/docs/rest#objects-batch
  expectData({ requests: [
    {
      method: 'POST',
      path: '/1/classes/Post',
      body: { comments: [], title: 'Post 1', updatedAt: undefined, createdAt: undefined }
    },
    {
      method: 'POST',
      path: '/1/classes/Post',
      body: { comments: [], title: 'Post 2', updatedAt: undefined, createdAt: undefined }
    }
  ] });

  ajaxHash.success([
    { success: { objectId: 'post1', createdAt: (new Date()).toISOString() } },
    { success: { objectId: 'post2', createdAt: (new Date()).toISOString() } }
  ]);

  expectStates(posts, 'saving', false);
  expect(posts[0], store.find(Post, 'post1'), 'should match first post.');
  expect(posts[1], store.find(Post, 'post2'), 'should match second post.');
});

QUnit.skip('Update Record - not bulkCommit', function(assert) {
  store.load(Post, { title: 'Test Post Update', objectId: 'postUpdated' });

  // force it to use single record update
  adapter.bulkCommit = false;
  var post = store.find(Post, 'postUpdated'),
  expectState,
  expectUrl,
  expectType,
  expectData;

  expectState('loaded');
  expectState('dirty', false);
  post.set('title', 'Test Post Updated - true');
  expectState('dirty');
  store.commit();
  expectState('saving');
  expectUrl('/1/classes/Post/postUpdated');
  expectType('PUT');
  expectData({ objectId: 'postUpdated', comments: [], title: 'Test Post Updated - true', updatedAt: undefined, createdAt: undefined });
  ajaxHash.success({ objectId: 'postUpdated', updatedAt: (new Date()).toISOString() });
  expectState('saving', false);
});

QUnit.skip('Update Record - bulkCommit', function(assert) {
  store.loadMany(Post, [
    { objectId: 'post1', title: 'Post 1' },
    { objectId: 'post2', title: 'Post 2' }
  ]);

  var posts = store.findMany(Post, ['post1', 'post2']),
  expectStates,
  expectUrl,
  expectType,
  expectData,
  expect;

  expectStates(posts, 'loaded');
  posts.forEach(function(post) {
    post.set('title', post.get('title') + ' updated.');
  });
  expectStates(posts, 'dirty');
  store.commit();
  expectStates(posts, 'saving');
  expectUrl('/1/batch');
  expectType('POST');
  expectData({
    requests: [{
      method: 'PUT',
      path: '/1/classes/Post/post1',
      body: { objectId: 'post1', comments: [], title: 'Post 1 updated.', updatedAt: undefined, createdAt: undefined }
    },
    {
      method: 'PUT',
      path: '/1/classes/Post/post2',
      body: { objectId: 'post2', comments: [], title: 'Post 2 updated.', updatedAt: undefined, createdAt: undefined }
    }]
  });
  ajaxHash.success([
    { success: { objectId: 'post1', updatedAt: (new Date()).toISOString() } },
    { success: { objectId: 'post2', updatedAt: (new Date()).toISOString() } }
  ]);
  expectStates(posts, 'saving', false);
  expect(posts[0], store.find(Post, 'post1'), 'should match first post.');
  expect(posts[1], store.find(Post, 'post2'), 'should match second post.');
});

QUnit.skip('Delete Record - not bulkCommit', function(assert) {
  store.load(Post, { objectId: 'post1', title: 'Post to delete.' });
  // force single record delete
  adapter.bulkCommit = false;
  var post = store.find(Post, 'post1'),
  expectState,
  expectUrl,
  expectType;

  expectState('new', false);
  expectState('loaded');
  expectState('dirty', false);
  post.deleteRecord();
  expectState('dirty');
  expectState('deleted');
  store.commit();
  expectState('saving');
  expectUrl('/1/classes/Post/post1');
  expectType('DELETE');
  ajaxHash.success();
  expectState('deleted');
});

QUnit.skip('Delete Record - bulkCommit', function(assert) {
  store.loadMany(Post, [
    { objectId: 'post1', title: 'Post 1' },
    { objectId: 'post2', title: 'Post 2' }
  ]);
  var posts = store.findMany(Post, ['post1', 'post2']),
  expectStates,
  expectUrl,
  expectType,
  expectData;

  expectStates(posts, 'loaded');
  expectStates(posts, 'new', false);
  expectStates(posts, 'dirty', false);
  posts.forEach(function(post) {
    post.deleteRecord();
  });
  expectStates(posts, 'dirty');
  expectStates(posts, 'deleted');
  store.commit();
  expectStates(posts, 'saving');
  expectUrl('/1/batch');
  expectType('POST');
  expectData({
    requests: [{
      method: 'DELETE',
      path: '/1/classes/Post/post1',
      body: { objectId: 'post1', comments: [], title: 'Post 1', updatedAt: undefined, createdAt: undefined }
    },
    {
      method: 'DELETE',
      path: '/1/classes/Post/post2',
      body: { objectId: 'post2', comments: [], title: 'Post 2', updatedAt: undefined, createdAt: undefined }
    }]
  });
  ajaxHash.success();
  expectStates(posts, 'saving', false);
  expectStates(posts, 'dirty', false);
});
