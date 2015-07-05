/* jshint node: true */

module.exports = function(environment) {
  var ENV = {
    modulePrefix: 'dummy',
    environment: environment,
    baseURL: '/',
    locationType: 'auto',
    EmberENV: {
      // RAISE_ON_DEPRECATION: true,
      // LOG_STACKTRACE_ON_DEPRECATION: true,
      FEATURES: {
        // Here you can enable experimental features on an ember canary build
        // e.g. 'with-controller': true
      }
    },

    APP: {
      // Here you can pass flags/options to your application instance
      // when it is created
    }
  };

  ENV['ember-parse'] = {
    PARSE_APPLICATION_ID: 'CIYQmnUpXGDKJiGsySpST80UT0Q6CkPaTdBJlD5T',
    PARSE_JAVASCRIPT_KEY: 'hMcPUKC7NDDGtUQyGMqmgnU0IVK3R65NlADbWcMJ',
    session: {
      authenticationRoute: 'index'
    }
  };

  ENV.contentSecurityPolicy = {
    'default-src': "'none'",
    'script-src': "'self'",
    'font-src': "'self' https://cdnjs.cloudflare.com",
    'connect-src': "'self' https://api.parse.com",
    'img-src': "'self'",
    'style-src': "'self' 'unsafe-inline' https://cdnjs.cloudflare.com",
    'media-src': "'self'"
  };

  if (environment === 'development') {
    // ENV.APP.LOG_RESOLVER = true;
    // ENV.APP.LOG_ACTIVE_GENERATION = true;
    // ENV.APP.LOG_TRANSITIONS = true;
    // ENV.APP.LOG_TRANSITIONS_INTERNAL = true;
    // ENV.APP.LOG_VIEW_LOOKUPS = true;
  }

  if (environment === 'test') {
    // Testem prefers this...
    ENV.baseURL = '/';
    ENV.locationType = 'none';

    // keep test console output quieter
    ENV.APP.LOG_ACTIVE_GENERATION = false;
    ENV.APP.LOG_VIEW_LOOKUPS = false;

    ENV.APP.rootElement = '#ember-testing';
  }

  if (environment === 'production') {
    ENV.baseURL = '/ember-parse';
  }

  return ENV;
};
