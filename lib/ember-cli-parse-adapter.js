var path = require('path');
var fs   = require('fs');

function EmberCLIParseAdapter(project) {
  this.project = project;
  this.name    = 'Ember CLI Parse Adapter';
}

function unwatchedTree(dir) {
  return {
    read:    function() { return dir; },
    cleanup: function() { }
  };
}

EmberCLIParseAdapter.prototype.treeFor = function included(name) {
  var treePath = path.join('node_modules', 'ember-parse-adapter', name);

  if (fs.existsSync(treePath)) {
    return unwatchedTree(treePath);
  }
};

EmberCLIParseAdapter.prototype.included = function included(app) {
  this.app = app;

  this.app['import']({
    development: 'vendor/ember-parse-adapter/dist/ember-parse-adapter.js',
    production: 'vendor/ember-parse-adapter/dist/ember-parse-adapter.min.js'
  });
};

module.exports = EmberCLIParseAdapter;
