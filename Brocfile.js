/* jshint node: true */
/* global require, module */

var EmberAddon = require('ember-cli/lib/broccoli/ember-addon');

var app = new EmberAddon();

app.import(app.bowerDirectory + '/sinon/index.js', {
  type: 'test'
});

app.import('vendor/sinon/shim.js', {
  type: 'test',
  exports: {
    'sinon': [
      'default'
    ]
  }
});

module.exports = app.toTree();
