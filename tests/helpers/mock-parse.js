/* globals Timecop */
import ENV from 'dummy/config/environment';
import Pretender from 'pretender';

var server, adapter, originalHost;

function setupParse(application) {

  // TODO: Once Pretender supports URLs instead of paths:
  // TODO: 1. Remove the host reconfiguration
  // TODO: 2. Change the Pretender routes to be full URLs
  // TODO: 3. Use test-helpers.js instead of beforeEach to setup and teardown
  //          MockParse
  adapter = application.__container__.lookup('adapter:application');
  originalHost = adapter.get('host');
  adapter.set('host', '');

  server = new Pretender(function(){
    this.get('/unauthorized', function (req) {
      return [401, {'Content-Type': 'application/json'}, {error: "unauthorized"}];
    });

    this.post('/1/classes/Simple', function(req) {
      return [201, {
        "Content-Type": "application/json",
        "Location": "https://api.parse.com/1/classes/Simple/1"
      }, {
        "createdAt": "2012-12-12T12:12:12.000Z",
        "objectId": "1"
      }];
    });
  });

  server.prepareBody = function(body){
    return body ? JSON.stringify(body) : '{"error": "not found"}';
  };

  return server;
}

function teardownParse() {
  adapter.set('host', originalHost);
  server.shutdown();
}

function hasAuthHeaders(req) {
  var headers = req.requestHeaders;
  return headers &&
         headers['X-Parse-Application-Id'] &&
         headers['X-Parse-Application-Id'] === ENV.APP.applicationId &&
         headers['X-Parse-REST-API-Key'] &&
         headers['X-Parse-REST-API-Key'] === ENV.APP.restApiId;
}

/*
 * Monkey patch Pretender to allow a "global" handler that returns 401 if the
 * headers are incorrect.
 * TODO: Implement and use middleware for Pretender
 */
var _handlerForOriginal = Pretender.prototype._handlerFor;
Pretender.prototype._handlerFor = function(verb, path, request){
  if( ! hasAuthHeaders(request) ) {
    return _handlerForOriginal('GET', '/unauthorized', request);
  }
  return _handlerForOriginal.apply(this, arguments);
};

export default {
  setup: setupParse,
  teardown: teardownParse
};
