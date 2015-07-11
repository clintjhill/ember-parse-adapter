import Ember from 'ember';
import { module, test } from 'qunit';
import startApp from 'dummy/tests/helpers/start-app';
import MockParse from '../helpers/mock-parse';

var application, container;

module('Integration | creating objects', {
  beforeEach: function() {
    application = startApp();
    MockParse.setup(application);
    // TODO: figure out the correct way to access the store (unless this is the correct way)
    this.store = application.__container__.lookup('store:main');
  },

  afterEach: function() {
    MockParse.teardown(application);
    Ember.run(application, 'destroy');
  }
});

test('creating an object without relationships', function(assert) {
  var done = assert.async();

  Ember.run(()=> {
    var subject = this.store.createRecord('simple', {name: "Simple"});
    subject.save().then(()=> {

      assert.equal("2012-12-12T12:12:12.000Z", subject.get('createdAt').toISOString());
      assert.equal("Simple", subject.get('name'));
      assert.equal(1, subject.id);

      done();
    });
  });
});
