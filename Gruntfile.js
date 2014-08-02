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
          'lib/ember-parse-adapter.js',
          'lib/ember-parse-adapter/serializer.js',
          'lib/ember-parse-adapter/adapter.js',
          'lib/ember-parse-adapter/parse-user.js',
          'lib/ember-parse-adapter/geo-point.js',
          'lib/ember-parse-adapter/file.js',
          'lib/ember-parse-adapter/acl.js',
          'lib/ember-parse-adapter/transforms/acl.js',
          'lib/ember-parse-adapter/transforms/geo-point.js',
          'lib/ember-parse-adapter/transforms/file.js',
          'lib/ember-parse-adapter/transforms/date.js',
          'lib/setup-container.js',
          'lib/ember.js'
        ],
        dest: 'dist/ember-parse-adapter.js'
      }
    },

    uglify: {
      dist: {
        src: 'dist/ember-parse-adapter.js',
        dest: 'dist/ember-parse-adapter.min.js'
      }
    },

    qunit: {
      options: {
        timeout: 10000
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
  grunt.registerTask('default', ['jshint', 'concat', 'uglify']);

};
