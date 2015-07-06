import Ember from 'ember';
import { module, test } from 'qunit';
import startApp from 'dummy/tests/helpers/start-app';
import mockParse from 'dummy/tests/helpers/mock-parse';
import unmockParse from 'dummy/tests/helpers/unmock-parse';

var application;

module('Integration | creating objects', {
  beforeEach: function() {
    mockParse();
    application = startApp();
  },

  afterEach: function() {
    unmockParse();
    Ember.run(application, 'destroy');
  }
});

test('creating an object without relationships', function(assert) {
  assert.ok(true);
});
