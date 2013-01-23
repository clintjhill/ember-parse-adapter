module.exports = function(grunt){
  'use strict';
  grunt.initConfig({

    pkg: grunt.file.readJSON('package.json'),

    jshint: {
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

    uglify: {
      dist: {
        src: 'dist/ember-parse-adapter-<%= pkg.version %>.js',
        dest: 'dist/ember-parse-adapter-<%= pkg.version %>.min.js'
      }
    },

    qunit: {
      options: {
        timeout: 1000
      },
      all: {
        options: {
          urls: ['http://localhost:8000/test/index.html']
        }
      }
    },

    connect: {
      server: {
        port: 8000,
        base: '.'
      }
    }

  });

  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-qunit');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-contrib-uglify');

  grunt.registerTask('test', ['connect', 'qunit']);
  // removed test from the default because it's current failing with out-of-memory errors.
  // TESTS pass if run in browsers.
  grunt.registerTask('default', ['jshint', 'concat', 'uglify']);

};
