/* jshint node: true */

module.exports = function(environment) {
  var ENV = {
    modulePrefix: 'dummy',
    environment: environment,
    baseURL: '/',
    locationType: 'auto',
    EmberENV: {
      FEATURES: {
        // Here you can enable experimental features on an ember canary build
        // e.g. 'with-controller': true
      }
    },

    APP: {
      // Here you can pass flags/options to your application instance
      // when it is created
      applicationId: 'Hf7dgrv4WPBcJYUsLgDMZCwKxf3hdbAc1nnSsVza',
      restApiId: 'BH0IoMxroXSVU3GTMQTVaM4BXjvdX7lKtFujgvzO'
    }
  };
  
  ENV.contentSecurityPolicy = {
    'default-src': "'none'",
    'script-src': "'self' http://cdnjs.cloudflare.com",
    'font-src': "'self' http://cdnjs.cloudflare.com",
    'connect-src': "'self' https://api.mixpanel.com http://custom-api.local",
    'img-src': "'self'",
    'style-src': "'self' 'unsafe-inline' http://cdnjs.cloudflare.com",
    'media-src': "'self'"
  }

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

  }

  return ENV;
};
