module.exports = function(grunt){

  grunt.initConfig({
    
    pkg: '<json:package.json>',

    lint: {
      all: ['lib/**/*.js']
    },

    concat: {
      dist: {
        src: [
          'lib/ember-parse-connector.js',
          'lib/ember-parse-serializer.js',
          'lib/ember-parse-adapter.js', 
          'lib/ember-parse-mixin.js',
          'lib/ember-parse-model.js'],
        dest: 'dist/ember-parse-adapter-<%= pkg.version %>.js'
      }
    },

    min: {
      dist: {
        src: 'dist/ember-parse-adapter-<%= pkg.version %>.js',
        dest: 'dist/ember-parse-adapter-<%= pkg.version %>.min.js'
      }
    },

    qunit: {
      all: ['test/index.html']
    }

  });
  
  grunt.registerTask('test', 'qunit');

  grunt.registerTask('default', 'lint test concat min');

};
