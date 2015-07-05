import Ember from 'ember';

export default Ember.Service.extend({
  user: null,
  userId: null,
  sessionToken: null,
  sessionStoreKey: 'ember-parse:session',

  init() {
    Ember.Logger.debug('DEBUG: Parse session service: init()');

    var key = this.get('sessionStoreKey'),
        store = this.container.lookup('service:store'),
        model = store.modelFor('user'),
        adapter = store.adapterFor('application'),
        serializer = store.serializerFor('user');

    this.sessionStore.get(key).then((sessionData) => {
      if (sessionData && sessionData.userId &&
          sessionData.sessionToken && sessionData._response) {

        this.setProperties({
          userId: sessionData.userId,
          sessionToken: sessionData.sessionToken
        });

        // Create a user instance and push to store
        serializer.normalize(model, sessionData._response);
        var record = store.push('user', sessionData._response);
        this.user = record;

        // Set adapter properties
        delete sessionData._response;
        adapter.setProperties(sessionData);
      }
    });
  },

  isAuthenticated: Ember.computed('userId', 'sessionToken', function() {
    if (this.get('userId') || this.get('sessionToken')) {
      return true;
    } else {
      return false;
    }
  }),

  authenticate(username, password) {
    var key = this.get('sessionStoreKey'),
        store = this.container.lookup('service:store'),
        model = store.modelFor('user'),
        adapter = store.adapterFor('application'),
        serializer = store.serializerFor('user');

    var data = {
      _method: 'GET',
      username: username,
      password: password
    };

    return adapter.ajax(adapter.buildURL('login'), 'POST', { data: data })
      .then((response) => {
        var sessionData = {
          userId: response.objectId,
          sessionToken: response.sessionToken,
          _response: response
        };

        this.setProperties(sessionData);
        this.sessionStore.save(key, sessionData);

        // Set adapter properties
        delete sessionData._response;
        adapter.setProperties(sessionData);

        serializer.normalize(model, response);
        var record = store.push('user', response);
        this.user = record;

        return record;
      });
  },

  invalidate() {
    if (this.get('isAuthenticated')) {
      var store = this.container.lookup('service:store'),
          adapter = store.adapterFor('application');

      // Call logout on Parse
      return adapter.ajax(adapter.buildURL('logout'), 'POST')
        .then(() => {
          return this.resetSession();
        });
    } else {
      return Ember.RSVP.resolve();
    }
  },

  resetSession() {
    var key = this.get('sessionStoreKey'),
        store = this.container.lookup('service:store'),
        adapter = store.adapterFor('application');

    // Remove user from store
    store.find('user', this.get('userId')).then((user) => {
      user.unloadRecord();
    });

    var sessionData = {
      userId: null,
      sessionToken: null
    };

    this.setProperties(sessionData);
    adapter.setProperties(sessionData);

    return this.sessionStore.destroy(key);
  },

  signup(userData) {
    var store = this.container.lookup('service:store'),
        model = store.modelFor('user'),
        adapter = store.adapterFor('user'),
        serializer = store.serializerFor('user');

    return adapter.ajax(adapter.buildURL(model.modelName), 'POST', { data: userData })
      .then(function(response) {
          serializer.normalize(model, response);
          response.email = response.email || userData.email;
          response.username = response.username || userData.username;

          return store.push('user', response);
        });
  },

  requestPasswordReset(email) {
    var store = this.container.lookup('service:store'),
        adapter = store.adapterFor('application'),
        data = {
          _method: 'POST',
          email: email
        };

    return adapter.ajax(adapter.buildURL('requestPasswordReset'), 'POST', { data: data });
  },

  sessionStore: {
    save(key, data) {
      return new Ember.RSVP.Promise(function(resolve) {
        resolve(localStorage.setItem(key, JSON.stringify(data)));
      });
    },

    get(key) {
      return new Ember.RSVP.Promise(function(resolve) {
        resolve(JSON.parse(localStorage.getItem(key)));
      });
    },

    destroy(key) {
      return new Ember.RSVP.Promise(function(resolve) {
        resolve(localStorage.removeItem(key));
      });
    }
  }
});
