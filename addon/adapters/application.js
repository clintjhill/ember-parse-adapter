/*
 * Some portions extracted from:
 * Parse JavaScript SDK — Version: 1.4.2
 *
 */

import Ember from 'ember';
import DS from 'ember-data';

var get = Ember.get,
    forEach = Ember.ArrayPolyfills.forEach;


export default DS.RESTAdapter.extend({
  host: 'https://api.parse.com',
  namespace: '1',
  classesPath: 'classes',
  parseClientVersion: 'js1.4.2',

  init() {
    this._super();

    this.set('installationId', this._getInstallationId());
    this.set('userId', null);
    
    this.set('headers', {
      'X-Parse-Application-Id' : get( this, 'applicationId' ),
      'X-Parse-REST-API-Key'   : get( this, 'restApiId' )
    });
  },

  _getInstallationId() {
    /*
     * Parse._getInstallationId
     */
    let lsKey = `ember-parse/${this.get('applicationId')}/installationId`;

    if (this.get('installationId')) {
      return this.get('installationId');

    } else if (localStorage.getItem(lsKey)) {
      return localStorage.getItem(lsKey);

    } else {
      let hexOctet = function() {
        return (
          Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1)
        );
      };

      let installationId = (
        hexOctet() + hexOctet() + "-" +
        hexOctet() + "-" +
        hexOctet() + "-" +
        hexOctet() + "-" +
        hexOctet() + hexOctet() + hexOctet());

      localStorage.setItem(lsKey, installationId);
      return installationId;
    }
  },

  /* ajaxOptions(url, type, options) {
    var hash = options || {};
    hash.data = hash.data || {};
    hash.url = url;
    hash.type = type;
    hash.dataType = 'json';
    hash.context = this;

    hash.contentType = 'application/json; charset=utf-8';

    // Parse auth stuff
    hash.data._ClientVersion = this.get('parseClientVersion');
    hash.data._InstallationId = this.get('installationId');

    hash.data = JSON.stringify(hash.data);

    var headers = get(this, 'headers');
    if (headers !== undefined) {
      hash.beforeSend = function (xhr) {
        forEach.call(Ember.keys(headers), function(key) {
          xhr.setRequestHeader(key, headers[key]);
        });
      };
    }

    return hash;
  }, */

  ajaxError(jqXHR, responseText, errorThrown) {
    if (jqXHR.responseJSON.error === 'invalid session token') {
      // invalid session
      var session = this.container.lookup('service:session');
      session.resetSession();
    }

    return this._super(jqXHR, responseText, errorThrown);
  },

  normalizeErrorResponse: function(status, headers, payload) {
    return [
      {
        status: `${status}`,
        title: 'The backend responded with an error',
        details: payload.error,
        code: payload.code
      }
    ];
  },

  pathForType(type) {
    if ('user' === type) {
      return 'users';

    } else if ('login' === type) {
      return type;

    } else if ('logout' === type) {
      return type;

    } else if ('requestPasswordReset' === type) {
      return type;

    } else if ('functions' === type) {
      return 'functions';

    } else {
      return this.classesPath + '/' + this.parsePathForType(type);
    }
  },

  // Using TitleStyle is recommended by Parse
  parsePathForType(type) {
    return Ember.String.capitalize(Ember.String.camelize(type));
  },

  parseClassName(key) {
    return Ember.String.capitalize(key);
  },

  /**
  * Because Parse doesn't return a full set of properties on the
  * responses to updates, we want to perform a merge of the response
  * properties onto existing data so that the record maintains
  * latest data.
  */
  createRecord(store, type, record) {
    var serializer = store.serializerFor(type.modelName),
      data = { _method: 'POST' },
      adapter = this;

    serializer.serializeIntoHash(data, type, record, { includeId: true });

    var promise = new Ember.RSVP.Promise(function(resolve, reject) {
      adapter.ajax(adapter.buildURL(type.modelName), 'POST', { data: data })
        .then(function(json) {
          var completed = Ember.merge(data, json);
          resolve(completed);
        }, function(reason) {
          var err = `Code ${reason.responseJSON.code}: ${reason.responseJSON.error}`;
          reject(new Error(err));
        });
    });

    return promise;
  },

  updateRecord(store, type, snapshot) {
    var data = { _method: 'PUT' },
        id = snapshot.id,
        serializer = store.serializerFor(type.modelName);

    serializer.serializeIntoHash(data, type, snapshot);

    // debugger;
    // snapshot.record._relationships.friends.members
    // snapshot.record._relationships.friends.canonicalMembers
    return this.ajax(this.buildURL(type.modelName, id, snapshot), 'POST', { data: data });
  },

  deleteRecord(store, type, snapshot) {
    var data = { _method: 'DELETE' },
        id = snapshot.id;

    return this.ajax(this.buildURL(type.modelName, id, snapshot), 'POST', { data: data });
  },

  findRecord(store, type, id, snapshot) {
    var data = { _method: 'GET' };
    return this.ajax(this.buildURL(type.modelName, id, snapshot), 'POST', { data: data });
  },

  findAll(store, type, sinceToken) {
    var data = { _method: 'GET' };

    if (sinceToken) {
      data.since = sinceToken;
    }

    data.where = {};

    return this.ajax(this.buildURL(type.modelName), 'POST', { data: data });
  },

  /**
  * Implementation of a hasMany that provides a Relation query for Parse
  * objects.
  */
  findHasMany(store, record, relationship) {
    var related = JSON.parse(relationship);

    var query = {
      where: {
        '$relatedTo': {
          'object': {
            '__type': 'Pointer',
            'className': this.parseClassName(record.modelName),
            'objectId': record.id
          },
          key: related.key
        }
      },
      _method: 'GET'
    };

    // the request is to the related type and not the type for the record.
    // the query is where there is a pointer to this record.
    return this.ajax(
              this.buildURL(related.className), 'POST', { data: query });
  },

  /**
  * Implementation of findQuery that automatically wraps query in a
  * JSON string.
  *
  * @example
  *     this.store.find('comment', {
  *       where: {
  *         post: {
  *             "__type":  "Pointer",
  *             "className": "Post",
  *             "objectId": post.get('id')
  *         }
  *       }
  *     });
  */
  findQuery(store, type, query) {
    query._method = 'GET';
    return this.ajax(this.buildURL(type.modelName), 'POST', { data: query });
  },
  
  sessionToken: Ember.computed( 'headers.X-Parse-Session-Token', function( key, value ) {
    if ( arguments.length < 2 ) {
      return this.get( 'headers.X-Parse-Session-Token' );
    } else {
      this.set( 'headers.X-Parse-Session-Token', value );
      return value;
    }
  }),

  shouldReloadAll() {
    return false;
  },

  shouldBackgroundReloadRecord() {
    return false;
  }
});